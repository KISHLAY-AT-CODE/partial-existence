import { useState, useEffect } from 'react';

/**
 * PostInteractions — Like button and comment section for blog posts.
 * Uses localStorage for persistence (client-side only, per-browser).
 */
export default function PostInteractions({ slug }) {
  const likeKey = `pe_likes_${slug}`;
  const commentKey = `pe_comments_${slug}`;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [showComments, setShowComments] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedLikes = localStorage.getItem(likeKey);
      if (storedLikes) {
        const parsed = JSON.parse(storedLikes);
        setLiked(parsed.liked || false);
        setLikeCount(parsed.count || 0);
      }

      const storedComments = localStorage.getItem(commentKey);
      if (storedComments) {
        setComments(JSON.parse(storedComments));
      }

      const savedName = localStorage.getItem('pe_author_name');
      if (savedName) {
        setAuthorName(savedName);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [likeKey, commentKey]);

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

  function handleSubmitComment(e) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    const name = authorName.trim() || 'Anonymous';
    const newComment = {
      id: Date.now().toString(),
      author: name,
      text: trimmed,
      date: new Date().toISOString(),
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    setCommentText('');

    try {
      localStorage.setItem(commentKey, JSON.stringify(updated));
      if (authorName.trim()) {
        localStorage.setItem('pe_author_name', authorName.trim());
      }
    } catch {
      // Ignore
    }
  }

  function handleDeleteComment(commentId) {
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    try {
      localStorage.setItem(commentKey, JSON.stringify(updated));
    } catch {
      // Ignore
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
      {/* Like Section */}
      <div className="interactions__actions">
        <button
          className={`interactions__like-btn ${liked ? 'interactions__like-btn--liked' : ''}`}
          onClick={handleLike}
          aria-label={liked ? 'Unlike this post' : 'Like this post'}
          id={`like-btn-${slug}`}
        >
          <span className="interactions__like-icon">{liked ? '♥' : '♡'}</span>
          <span className="interactions__like-count">{likeCount}</span>
        </button>

        <button
          className="interactions__comment-toggle"
          onClick={() => setShowComments(!showComments)}
          aria-label="Toggle comments"
          id={`comment-toggle-${slug}`}
        >
          <span className="interactions__comment-icon">💬</span>
          <span className="interactions__comment-count">{comments.length}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="interactions__comments" id={`comments-${slug}`}>
          <h4 className="interactions__comments-title">
            Comments ({comments.length})
          </h4>

          {/* Comment Form */}
          <form className="interactions__form" onSubmit={handleSubmitComment}>
            <input
              type="text"
              className="interactions__input interactions__input--name"
              placeholder="Your name (optional)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={50}
              id={`comment-name-${slug}`}
            />
            <textarea
              className="interactions__input interactions__input--text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={1000}
              rows={3}
              id={`comment-text-${slug}`}
            />
            <button
              type="submit"
              className="interactions__submit"
              disabled={!commentText.trim()}
              id={`comment-submit-${slug}`}
            >
              Post Comment
            </button>
          </form>

          {/* Comment List */}
          {comments.length > 0 && (
            <div className="interactions__comment-list">
              {comments.map((comment) => (
                <div key={comment.id} className="interactions__comment" id={`comment-${comment.id}`}>
                  <div className="interactions__comment-header">
                    <span className="interactions__comment-author">{comment.author}</span>
                    <span className="interactions__comment-date">{formatDate(comment.date)}</span>
                    <button
                      className="interactions__comment-delete"
                      onClick={() => handleDeleteComment(comment.id)}
                      aria-label="Delete comment"
                      title="Delete comment"
                    >
                      ×
                    </button>
                  </div>
                  <p className="interactions__comment-text">{comment.text}</p>
                </div>
              ))}
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
