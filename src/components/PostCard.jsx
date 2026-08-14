import { Link } from 'react-router-dom';

/**
 * PostCard — Preview card for a blog post on the home listing.
 * Includes a right-side container for the post icon/thumbnail if specified in frontmatter.
 */
export default function PostCard({ slug, title, date, tags, excerpt, icon }) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link to={`/blog/${slug}`} className="post-card" id={`post-card-${slug}`}>
      <div className="post-card__content">
        <time className="post-card__date" dateTime={date}>
          {formattedDate}
        </time>
        <h2 className="post-card__title">{title}</h2>
        {excerpt && <p className="post-card__excerpt">{excerpt}</p>}
        {tags && tags.length > 0 && (
          <div className="post-card__tags">
            {tags.map((tag) => (
              <span key={tag} className="post-card__tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {icon && (
        <div className="post-card__icon-container" aria-hidden="true">
          <img
            src={icon}
            alt=""
            className="post-card__icon"
            loading="lazy"
          />
        </div>
      )}
    </Link>
  );
}
