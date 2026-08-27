import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PostCard from '../components/PostCard';
import HeroGrid from '../components/HeroGrid';
import InteractiveHeroText from '../components/InteractiveHeroText';
import { getAllPosts } from '../posts';
import { siteConfig } from '../site.config';

/**
 * Home page — Trapezoid blog-reveal button with hide/pop animation
 * between viewport bottom and top. Activates on scroll or click.
 */
export default function Home() {
  const [isRevealed, setIsRevealed] = useState(false);
  // 'idle' | 'hiding' | 'appearing'
  const [animPhase, setAnimPhase] = useState('idle');
  const [atTop, setAtTop] = useState(false);
  const postsSectionRef = useRef(null);
  const heroRef = useRef(null);
  const animating = useRef(false);
  const revealedRef = useRef(false);

  const posts = getAllPosts();
  const basePath = import.meta.env.BASE_URL || '/';
  const avatarSrc = siteConfig.hero.avatar
    ? (siteConfig.hero.avatar.startsWith('http') || siteConfig.hero.avatar.startsWith('/')
        ? siteConfig.hero.avatar
        : `${basePath}${siteConfig.hero.avatar}`)
    : null;

  const triggerReveal = useCallback((shouldReveal) => {
    if (animating.current) return;
    if (revealedRef.current === shouldReveal) return;
    animating.current = true;

    setAnimPhase('hiding');

    setTimeout(() => {
      setAtTop(shouldReveal);
      setIsRevealed(shouldReveal);
      revealedRef.current = shouldReveal;
      setAnimPhase('appearing');

      setTimeout(() => {
        setAnimPhase('idle');
        animating.current = false;
      }, 350);
    }, 300);
  }, []);

  const handleToggleReveal = useCallback(() => {
    const nextRevealed = !revealedRef.current;
    triggerReveal(nextRevealed);

    if (nextRevealed) {
      setTimeout(() => {
        if (postsSectionRef.current) {
          postsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [triggerReveal]);

  // Scroll-based activation: reveal when scrolled past hero, collapse when back at top
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const heroEl = heroRef.current;
        if (!heroEl) { ticking = false; return; }

        const heroBottom = heroEl.getBoundingClientRect().bottom;
        const scrollY = window.scrollY;

        // Reveal when hero scrolls above viewport
        if (heroBottom < 80 && !revealedRef.current) {
          triggerReveal(true);
        }
        // Collapse when scrolled back near the top
        else if (scrollY < 60 && revealedRef.current) {
          triggerReveal(false);
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [triggerReveal]);

  const wrapperClass = [
    'home__sticky-btn-wrapper',
    atTop ? 'home__sticky-btn-wrapper--top' : '',
    animPhase === 'hiding' ? 'home__sticky-btn-wrapper--hide' : '',
    animPhase === 'appearing' ? 'home__sticky-btn-wrapper--appear' : '',
  ].filter(Boolean).join(' ');

  const stickyButton = createPortal(
    <div className={wrapperClass}>
      <button
        type="button"
        className="home__sticky-btn"
        onClick={handleToggleReveal}
        aria-expanded={isRevealed}
        aria-label={isRevealed ? 'Collapse blog posts' : 'Reveal blog posts'}
        title={isRevealed ? 'Hide blogs' : 'Explore blog posts'}
      >
        <svg
          className="home__sticky-btn-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {atTop ? (
            <path d="M6 9l6 6 6-6" />
          ) : (
            <path d="M18 15l-6-6-6 6" />
          )}
        </svg>
        <span className="home__sticky-btn-label">BLOGS</span>
      </button>
    </div>,
    document.body
  );

  return (
    <div className="fade-in" id="home-page">
      {stickyButton}

      <section ref={heroRef} className="home__hero" id="about-section">
        <HeroGrid />
        <InteractiveHeroText
          titlePrefix={siteConfig.hero.titlePrefix}
          titleAccent={siteConfig.hero.titleAccent}
          subtitle={siteConfig.hero.subtitle}
          avatarSrc={avatarSrc}
          author={siteConfig.author}
        />
      </section>

      {/* Blog List in Parallax Scrollable Pattern */}
      <section
        ref={postsSectionRef}
        id="blog-posts-section"
        className={`home__posts-section ${isRevealed ? 'home__posts-section--revealed' : 'home__posts-section--hidden'}`}
      >
        <hr className="home__divider" />

        <div className="home__posts-header">
          <h3 className="home__section-title">{siteConfig.hero.sectionTitle}</h3>
        </div>

        <div className="post-list-scroll-wrapper">
          <div className="post-list post-list--scrollable">
            {posts.map((post, idx) => (
              <PostCard
                key={post.slug}
                index={idx}
                slug={post.slug}
                title={post.title}
                date={post.date}
                tags={post.tags}
                excerpt={post.excerpt}
                icon={post.icon}
                theme={post.theme}
              />
            ))}
            {posts.length === 0 && (
              <p className="loading">No posts found. Drop a .md file into public/posts/!</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
