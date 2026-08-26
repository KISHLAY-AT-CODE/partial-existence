import { useState, useEffect } from 'react';
import UtterancesComments from './UtterancesComments';

/**
 * PostInteractions — Like button (localStorage), Utterances GitHub comments,
 * and toggleable GitHub & AllPoetry social link widgets for blog posts.
 */
export default function PostInteractions({ slug, github, allpoetry }) {
  const likeKey = `pe_likes_${slug}`;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

  // Social cards toggle states
  const [showGithubCard, setShowGithubCard] = useState(false);
  const [showAllPoetryCard, setShowAllPoetryCard] = useState(false);
  const [githubCopied, setGithubCopied] = useState(false);
  const [allpoetryCopied, setAllpoetryCopied] = useState(false);

  // Load likes from localStorage on mount
  useEffect(() => {
    try {
      const storedLikes = localStorage.getItem(likeKey);
      if (storedLikes) {
        const parsed = JSON.parse(storedLikes);
        setLiked(parsed.liked || false);
        setLikeCount(parsed.count || 0);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [likeKey]);

  function handleLike() {
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLiked(newLiked);
    setLikeCount(newCount);
    try {
      localStorage.setItem(likeKey, JSON.stringify({ liked: newLiked, count: newCount }));
    } catch {
      // Ignore
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
          <span className="interactions__btn-label">Comments</span>
        </button>

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

      {/* Utterances GitHub Comments Section */}
      {showComments && (
        <div className="interactions__comments" id={`comments-${slug}`}>
          <h4 className="interactions__comments-title">
            Comments <span className="interactions__comments-hint">(via GitHub)</span>
          </h4>
          <UtterancesComments slug={slug} />
        </div>
      )}
    </div>
  );
}
