import { useState, useEffect } from 'react';
import { getLikes, toggleLike, getComments, postComment, deleteComment, getPageViews, recordPageView } from '../api';
import { getSavedAuthorName, saveAuthorName, hasViewedPostCookie, markPostViewedCookie } from '../cookies';
import { useAuth } from '../context/AuthContext';
import { siteConfig } from '../site.config';

/**
 * PostInteractions — Like button, comment section, view counter (deduplicated by device),
 * and toggleable GitHub & AllPoetry social link widgets for blog posts.
 */
export default function PostInteractions({ slug, github, allpoetry }) {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const likeKey = `pe_likes_${slug}`;
  const commentKey = `pe_comments_${slug}`;
  const viewKey = `pe_views_${slug}`;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState(() => getSavedAuthorName());
  const [authorEmail, setAuthorEmail] = useState(() => {
    try {
      return localStorage.getItem('pe_author_email') || '';
    } catch {
      return '';
    }
  });
  const [subscribeUpdates, setSubscribeUpdates] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warningData, setWarningData] = useState(null);

  // Track comments authored by this user locally
  const [myCommentIds, setMyCommentIds] = useState(() => {
    try {
      const saved = localStorage.getItem('pe_my_comments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Social cards toggle states
  const [showGithubCard, setShowGithubCard] = useState(false);
  const [showAllPoetryCard, setShowAllPoetryCard] = useState(false);
  const [githubCopied, setGithubCopied] = useState(false);
  const [allpoetryCopied, setAllpoetryCopied] = useState(false);

  // Load from localStorage & sync with SaaS backend on mount
  useEffect(() => {
    let isMounted = true;

    // 1. Instant local load
    try {
      const storedLikes = localStorage.getItem(likeKey);
      if (storedLikes) {
        const parsed = JSON.parse(storedLikes);
        setLiked(parsed.liked || false);
        setLikeCount(parsed.count || 0);
      }

      const storedViews = localStorage.getItem(viewKey);
      if (storedViews) {
        setViewCount(Number(storedViews) || 0);
      }

      const storedComments = localStorage.getItem(commentKey);
      if (storedComments) {
        setComments(JSON.parse(storedComments));
      }

      const savedName = getSavedAuthorName();
      if (savedName) {
        setAuthorName(savedName);
      }
    } catch {
      // Ignore localStorage errors
    }

    // 2. Background cloud sync + Unique Device View Count Deduplication
    async function syncCloud() {
      try {
        // Only record pageview once per device; otherwise fetch view count
        const isViewed = hasViewedPostCookie(slug);
        const viewPromise = isViewed ? getPageViews(slug) : recordPageView(slug);

        const [likesRes, commentsRes, viewsRes] = await Promise.all([
          getLikes(slug),
          getComments(slug),
          viewPromise,
        ]);

        if (!isMounted) return;

        if (!isViewed && viewsRes) {
          markPostViewedCookie(slug);
        }

        if (likesRes && typeof likesRes.likes === 'number') {
          setLikeCount(likesRes.likes);
          if (typeof likesRes.liked === 'boolean') {
            setLiked(likesRes.liked);
          }
          try {
            const existing = JSON.parse(localStorage.getItem(likeKey) || '{}');
            localStorage.setItem(
              likeKey,
              JSON.stringify({
                ...existing,
                count: likesRes.likes,
                liked: typeof likesRes.liked === 'boolean' ? likesRes.liked : Boolean(existing.liked),
              })
            );
          } catch {
            // Ignore
          }
        }

        if (viewsRes && typeof viewsRes.views === 'number') {
          setViewCount(viewsRes.views);
          try {
            localStorage.setItem(viewKey, String(viewsRes.views));
          } catch {
            // Ignore
          }
        }

        if (commentsRes && Array.isArray(commentsRes.comments)) {
          setComments(commentsRes.comments);
          try {
            localStorage.setItem(commentKey, JSON.stringify(commentsRes.comments));
          } catch {
            // Ignore
          }
        }
      } catch {
        // Fallback silently to local state
      }
    }

    syncCloud();

    return () => {
      isMounted = false;
    };
  }, [slug, likeKey, commentKey, viewKey]);

  async function handleLike() {
    const nextLiked = !liked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLiked(nextLiked);
    setLikeCount(nextCount);

    try {
      localStorage.setItem(likeKey, JSON.stringify({ liked: nextLiked, count: nextCount }));
    } catch {
      // Ignore
    }

    // Sync to backend
    try {
      const res = await toggleLike(slug, nextLiked);
      if (res && typeof res.likes === 'number') {
        setLikeCount(res.likes);
        if (typeof res.liked === 'boolean') {
          setLiked(res.liked);
        }
        try {
          localStorage.setItem(
            likeKey,
            JSON.stringify({
              liked: typeof res.liked === 'boolean' ? res.liked : nextLiked,
              count: res.likes,
            })
          );
        } catch {
          // Ignore
        }
      }
    } catch {
      // Keep optimistic local count
    }
  }

  async function handleSubmitComment(e) {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const trimmed = commentText.trim();
    if (!trimmed) return;

    const authorDisplayName = user?.name || 'Anonymous';

    setSubmitting(true);
    setWarningData(null);

    // Sync to backend — 3-Stage Profanity detection runs quietly in backend
    try {
      const res = await postComment(
        slug,
        authorDisplayName,
        trimmed,
        user?.email || null,
        subscribeUpdates
      );

      if (res && res.success === false) {
        // Profanity or validation failed: do NOT post, keep text in input, show warning
        setWarningData({
          title: res.title || 'Content Policy & Account Warning',
          message: res.warning || res.message || res.error || 'Failed to post comment',
          accountNotice: res.accountNotice || null,
          isProfanity: Boolean(res.isProfanity),
        });
      } else if (res && res.comment) {
        // Successful submission (either approved or pending background verification)
        setWarningData(null);
        setCommentText('');
        const serverComment = {
          ...res.comment,
          isPending: res.comment.status === 'pending' || res.isPending,
        };
        setComments((prev) => [serverComment, ...prev]);

        // Record ownership locally
        setMyCommentIds((prev) => {
          const next = [...prev, serverComment.id];
          try {
            localStorage.setItem('pe_my_comments', JSON.stringify(next));
          } catch {
            // Ignore
          }
          return next;
        });

        try {
          const stored = localStorage.getItem(commentKey);
          const currentList = stored ? JSON.parse(stored) : comments;
          localStorage.setItem(commentKey, JSON.stringify([serverComment, ...currentList]));
        } catch {
          // Ignore
        }
      }
    } catch (err) {
      console.error('[Comment submission error]:', err);
      setWarningData({
        title: 'Submission Error',
        message: err.message || 'An unexpected error occurred while posting your comment.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId) {
    const isLocalOwner = myCommentIds.includes(commentId);
    const isUserOwner = user && comments.some((c) => c.id === commentId && c.userId === user.id);

    if (!isLocalOwner && !isUserOwner) {
      return;
    }

    const previousComments = [...comments];
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);

    try {
      localStorage.setItem(commentKey, JSON.stringify(updated));
    } catch {
      // Ignore
    }

    // Sync deletion to backend
    try {
      const res = await deleteComment(commentId);
      if (res && res.success === false) {
        // Rollback if unauthorized on server
        setComments(previousComments);
        console.error('[Delete comment error]:', res.error);
      } else {
        setMyCommentIds((prev) => {
          const next = prev.filter((id) => id !== commentId);
          try {
            localStorage.setItem('pe_my_comments', JSON.stringify(next));
          } catch {
            // Ignore
          }
          return next;
        });
      }
    } catch {
      // Retain local deletion
    }
  }

  async function handleCopy(url, type) {
    if (!url) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (type === 'github') {
        setGithubCopied(true);
        setTimeout(() => setGithubCopied(false), 2200);
      } else if (type === 'allpoetry') {
        setAllpoetryCopied(true);
        setTimeout(() => setAllpoetryCopied(false), 2200);
      }
    } catch {
      // Clipboard fallback error handling
    }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="interactions" id={`interactions-${slug}`}>
      {/* Primary Actions Bar */}
      <div className="interactions__actions">
        {/* Like Button */}
        <button
          className={`interactions__btn interactions__like-btn ${liked ? 'interactions__like-btn--liked' : ''}`}
          onClick={handleLike}
          aria-label={liked ? 'Unlike this post' : 'Like this post'}
          id={`like-btn-${slug}`}
        >
          <span className="interactions__like-icon">{liked ? '♥' : '♡'}</span>
          <span className="interactions__like-count">{likeCount}</span>
        </button>

        {/* Comments Toggle */}
        <button
          className={`interactions__btn interactions__comment-toggle ${showComments ? 'interactions__btn--active' : ''}`}
          onClick={() => {
            setShowComments(!showComments);
          }}
          aria-label="Toggle comments"
          aria-expanded={showComments}
          id={`comment-toggle-${slug}`}
        >
          <span className="interactions__comment-icon">💬</span>
          <span className="interactions__comment-count">{comments.length}</span>
        </button>

        {/* Unique Views Counter (Device-Deduplicated) */}
        <div
          className="interactions__btn interactions__view-counter"
          aria-label={`${viewCount} unique views`}
          title={`${viewCount} unique views (prevented redundant refresh views)`}
          id={`view-count-${slug}`}
        >
          <svg
            className="interactions__btn-svg interactions__view-svg"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="interactions__view-count">{viewCount}</span>
        </div>

        {/* GitHub Toggle Button (shown if post has github link) */}
        {github && (
          <button
            className={`interactions__btn interactions__social-btn interactions__github-btn ${showGithubCard ? 'interactions__github-btn--active' : ''}`}
            onClick={() => {
              setShowGithubCard(!showGithubCard);
            }}
            aria-label="Toggle GitHub repository details"
            aria-expanded={showGithubCard}
            title="GitHub Repository"
            id={`github-toggle-${slug}`}
          >
            <svg
              className="interactions__btn-svg"
              viewBox="0 0 16 16"
              width="15"
              height="15"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span className="interactions__btn-label">GitHub</span>
          </button>
        )}

        {/* AllPoetry Toggle Button (shown if post has allpoetry link) */}
        {allpoetry && (
          <button
            className={`interactions__btn interactions__social-btn interactions__allpoetry-btn ${showAllPoetryCard ? 'interactions__allpoetry-btn--active' : ''}`}
            onClick={() => {
              setShowAllPoetryCard(!showAllPoetryCard);
            }}
            aria-label="Toggle AllPoetry profile details"
            aria-expanded={showAllPoetryCard}
            title="AllPoetry Profile / Poems"
            id={`allpoetry-toggle-${slug}`}
          >
            <svg
              className="interactions__btn-svg"
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
              <line x1="16" y1="8" x2="2" y2="22" />
              <line x1="17.5" y1="15" x2="9" y2="15" />
            </svg>
            <span className="interactions__btn-label">AllPoetry</span>
          </button>
        )}
      </div>

      {/* GitHub Expandable Preview Card */}
      {showGithubCard && github && (
        <div className="interactions__drawer interactions__drawer--github" id={`github-card-${slug}`}>
          <div className="interactions__drawer-header">
            <div className="interactions__drawer-title-group">
              <svg
                className="interactions__drawer-icon interactions__drawer-icon--github"
                viewBox="0 0 16 16"
                width="20"
                height="20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <div>
                <h4 className="interactions__drawer-heading">GitHub Repository</h4>
                <p className="interactions__drawer-sub">Explore source code, stars & discussions</p>
              </div>
            </div>
            <button
              className="interactions__drawer-close"
              onClick={() => setShowGithubCard(false)}
              aria-label="Close GitHub preview"
            >
              ×
            </button>
          </div>

          <div className="interactions__drawer-body">
            <code className="interactions__drawer-url" title={github}>
              {github}
            </code>

            <div className="interactions__drawer-actions">
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="interactions__drawer-link interactions__drawer-link--github"
                id={`github-link-${slug}`}
              >
                <span>View on GitHub</span>
                <span className="interactions__drawer-arrow">↗</span>
              </a>

              <button
                type="button"
                className={`interactions__drawer-copy ${githubCopied ? 'interactions__drawer-copy--copied' : ''}`}
                onClick={() => handleCopy(github, 'github')}
                id={`github-copy-${slug}`}
              >
                {githubCopied ? '✓ Copied URL' : '📋 Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AllPoetry Expandable Preview Card */}
      {showAllPoetryCard && allpoetry && (
        <div className="interactions__drawer interactions__drawer--allpoetry" id={`allpoetry-card-${slug}`}>
          <div className="interactions__drawer-header">
            <div className="interactions__drawer-title-group">
              <svg
                className="interactions__drawer-icon interactions__drawer-icon--allpoetry"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                <line x1="16" y1="8" x2="2" y2="22" />
                <line x1="17.5" y1="15" x2="9" y2="15" />
              </svg>
              <div>
                <h4 className="interactions__drawer-heading">AllPoetry</h4>
                <p className="interactions__drawer-sub">Read original poems, stanzas & verses</p>
              </div>
            </div>
            <button
              className="interactions__drawer-close"
              onClick={() => setShowAllPoetryCard(false)}
              aria-label="Close AllPoetry preview"
            >
              ×
            </button>
          </div>

          <div className="interactions__drawer-body">
            <code className="interactions__drawer-url" title={allpoetry}>
              {allpoetry}
            </code>

            <div className="interactions__drawer-actions">
              <a
                href={allpoetry}
                target="_blank"
                rel="noopener noreferrer"
                className="interactions__drawer-link interactions__drawer-link--allpoetry"
                id={`allpoetry-link-${slug}`}
              >
                <span>Read on AllPoetry</span>
                <span className="interactions__drawer-arrow">↗</span>
              </a>

              <button
                type="button"
                className={`interactions__drawer-copy ${allpoetryCopied ? 'interactions__drawer-copy--copied' : ''}`}
                onClick={() => handleCopy(allpoetry, 'allpoetry')}
                id={`allpoetry-copy-${slug}`}
              >
                {allpoetryCopied ? '✓ Copied URL' : '📋 Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="interactions__comments" id={`comments-${slug}`}>
          <h4 className="interactions__comments-title">
            Comments ({comments.length})
          </h4>

          {/* Warning Banner (Profanity & Account Block Notice from Backend) */}
          {warningData && (
            <div className="interactions__warning-banner" role="alert" id={`comment-warning-${slug}`}>
              <div className="interactions__warning-header">
                <div className="interactions__warning-title-wrap">
                  <span className="interactions__warning-icon" aria-hidden="true">⚠️</span>
                  <strong className="interactions__warning-title">{warningData.title}</strong>
                </div>
                <button
                  type="button"
                  className="interactions__warning-close"
                  onClick={() => setWarningData(null)}
                  aria-label="Dismiss warning banner"
                >
                  ×
                </button>
              </div>
              <p className="interactions__warning-body">{warningData.message}</p>
              {warningData.accountNotice && (
                <div className="interactions__warning-footer">
                  <span className="interactions__warning-shield">🛡️</span>
                  <span>{warningData.accountNotice}</span>
                </div>
              )}
            </div>
          )}

          {/* Comment Form / Sign In Prompt */}
          {!siteConfig.apiUrl ? (
            <form className="interactions__form" onSubmit={handleSubmitComment}>
              <textarea
                className="interactions__input interactions__input--text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={1000}
                rows={3}
                id={`comment-text-${slug}`}
                disabled={submitting}
              />
              <button
                type="submit"
                className="interactions__submit"
                disabled={!commentText.trim() || submitting}
                id={`comment-submit-${slug}`}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          ) : !isAuthenticated ? (
            <div className="interactions__signin-required-banner" id={`comment-signin-prompt-${slug}`}>
              <div className="interactions__signin-icon">🔐</div>
              <div className="interactions__signin-content">
                <h5 className="interactions__signin-title">Sign in to join the discussion</h5>
                <p className="interactions__signin-desc">
                  To maintain thoughtful and respectful conversations, an authenticated account is required to comment.
                </p>
                <div className="interactions__signin-actions">
                  <button
                    type="button"
                    className="interactions__signin-btn"
                    onClick={() => openAuthModal('login')}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className="interactions__register-btn"
                    onClick={() => openAuthModal('register')}
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form className="interactions__form" onSubmit={handleSubmitComment}>
              <div className="interactions__auth-banner">
                <span className="interactions__auth-avatar">
                  {(user?.name || 'U')[0].toUpperCase()}
                </span>
                <div className="interactions__auth-info">
                  <span className="interactions__auth-name">
                    Commenting as <strong>{user?.name}</strong>
                  </span>
                </div>
              </div>

              <textarea
                className="interactions__input interactions__input--text"
                placeholder={`Share your reflections, ${user?.name}...`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={1000}
                rows={3}
                id={`comment-text-${slug}`}
                disabled={submitting}
              />

              {/* Email Subscription Opt-in */}
              <label className="interactions__subscribe-toggle" htmlFor={`comment-subscribe-${slug}`}>
                <input
                  type="checkbox"
                  id={`comment-subscribe-${slug}`}
                  className="interactions__checkbox"
                  checked={subscribeUpdates}
                  onChange={(e) => setSubscribeUpdates(e.target.checked)}
                  disabled={submitting}
                />
                <span className="interactions__checkbox-custom" />
                <span className="interactions__subscribe-text">
                  Notify me of new blog updates via email
                </span>
              </label>

              <button
                type="submit"
                className="interactions__submit"
                disabled={!commentText.trim() || submitting}
                id={`comment-submit-${slug}`}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          )}

          {/* Comment List */}
          {comments.length > 0 && (
            <div className="interactions__comment-list">
              {comments.map((comment) => {
                const isLocalOwner = myCommentIds.includes(comment.id);
                const isUserOwner = user && comment.userId === user.id;
                const canDelete = isLocalOwner || isUserOwner;
                const isPending = comment.status === 'pending' || comment.isPending;

                return (
                  <div key={comment.id} className="interactions__comment" id={`comment-${comment.id}`}>
                    <div className="interactions__comment-header">
                      <div className="interactions__comment-user-info">
                        <span className="interactions__comment-avatar" aria-hidden="true">
                          {(comment.author || 'A')[0].toUpperCase()}
                        </span>
                        <span className="interactions__comment-author">
                          {comment.author}
                          {canDelete && <span className="interactions__comment-you">You</span>}
                          {comment.subscribeUpdates && (
                            <span className="interactions__comment-badge" title="Subscribed to blog updates">
                              ✉ Subscribed
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="interactions__comment-meta">
                        <span className="interactions__comment-date">{formatDate(comment.date)}</span>
                        {canDelete && (
                          <button
                            className="interactions__comment-delete"
                            onClick={() => handleDeleteComment(comment.id)}
                            aria-label="Delete your comment"
                            title="Delete your comment"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="interactions__comment-text">{comment.text}</p>
                    {isPending && (
                      <div className="interactions__comment-pending-note">
                        <em>This comment might be visible to others in some time.</em>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {comments.length === 0 && (
            <p className="interactions__no-comments">
              No comments yet. Be the first to share your thoughts.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
