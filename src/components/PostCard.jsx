import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * PostCard — Blog post preview card with parallax scroll dynamics.
 * Icon renders as a blurred background on the right side of the card.
 */
export default function PostCard({ slug, title, date, tags, excerpt, icon, theme, index = 0 }) {
  const cardRef = useRef(null);
  const [parallaxY, setParallaxY] = useState(0);

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!cardRef.current) return;
          const rect = cardRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          const centerDist = rect.top + rect.height / 2 - windowHeight / 2;
          const speed = index % 2 === 0 ? 0.045 : 0.028;
          setParallaxY(centerDist * speed);

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [index]);

  return (
    <Link
      ref={cardRef}
      to={`/blog/${slug}`}
      className="post-card"
      id={`post-card-${slug}`}
      style={{
        transform: `translate3d(0, ${parallaxY.toFixed(1)}px, 0)`,
        ...(theme ? { '--post-theme': theme } : {}),
      }}
    >
      {/* Icon as blurred background on the right side */}
      {icon && (
        <div className="post-card__bg-icon" aria-hidden="true">
          <img src={icon} alt="" className="post-card__bg-icon-img" loading="lazy" />
        </div>
      )}

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
    </Link>
  );
}
