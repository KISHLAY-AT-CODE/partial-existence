import PostCard from '../components/PostCard';
import HeroGrid from '../components/HeroGrid';
import InteractiveHeroText from '../components/InteractiveHeroText';
import { getAllPosts } from '../posts';
import { siteConfig } from '../site.config';

/**
 * Home page — About / Hero section with avatar + automated listing of all blog posts.
 */
export default function Home() {
  const posts = getAllPosts();
  const basePath = import.meta.env.BASE_URL || '/';
  const avatarSrc = siteConfig.hero.avatar
    ? (siteConfig.hero.avatar.startsWith('http') || siteConfig.hero.avatar.startsWith('/')
        ? siteConfig.hero.avatar
        : `${basePath}${siteConfig.hero.avatar}`)
    : null;

  return (
    <div className="fade-in" id="home-page">
      <section className="home__hero" id="about-section">
        <HeroGrid />
        <InteractiveHeroText
          titlePrefix={siteConfig.hero.titlePrefix}
          titleAccent={siteConfig.hero.titleAccent}
          subtitle={siteConfig.hero.subtitle}
          avatarSrc={avatarSrc}
          author={siteConfig.author}
        />
      </section>

      <hr className="home__divider" />

      <section>
        <h3 className="home__section-title">{siteConfig.hero.sectionTitle}</h3>
        <div className="post-list">
          {posts.map((post) => (
            <PostCard
              key={post.slug}
              slug={post.slug}
              title={post.title}
              date={post.date}
              tags={post.tags}
              excerpt={post.excerpt}
              icon={post.icon}
            />
          ))}
          {posts.length === 0 && (
            <p className="loading">No posts found. Drop a .md file into public/posts/!</p>
          )}
        </div>
      </section>
    </div>
  );
}
