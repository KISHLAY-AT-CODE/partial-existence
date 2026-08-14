import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import PostInteractions from './PostInteractions';
import { getPostBySlug } from '../posts';

/**
 * BlogPost — Full blog post renderer.
 * Automatically resolves markdown from indexed posts in /public/posts/<slug>/...,
 * resolves relative images to the post's asset folder,
 * dynamically sets custom page background if specified in frontmatter,
 * sanitizes HTML output with DOMPurify, and renders with prose styling.
 */
export default function BlogPost({ slug }) {
  const post = useMemo(() => getPostBySlug(slug), [slug]);

  const meta = post?.meta || {};
  const body = post?.body || '';

  // Dynamic custom background support (reverts to default when unmounting)
  useEffect(() => {
    if (meta.background) {
      document.documentElement.style.setProperty('--bg-image', `url("${meta.background}")`);
    }
    return () => {
      document.documentElement.style.removeProperty('--bg-image');
    };
  }, [meta.background]);

  if (!post) {
    return (
      <div className="blog-post fade-in">
        <Link to="/" className="blog-post__back" id="back-link">
          &larr; Back to blog
        </Link>
        <p className="loading">Post not found: {slug}</p>
      </div>
    );
  }

  // Custom marked renderer to resolve relative image paths to the post's folder
  const renderer = new marked.Renderer();
  renderer.image = ({ href, title, text }) => {
    let src = href;
    const basePath = import.meta.env.BASE_URL || '/';
    // If relative path, resolve to this post's folder in public/posts/<slug>/
    if (
      src &&
      !src.startsWith('http://') &&
      !src.startsWith('https://') &&
      !src.startsWith('data:') &&
      !src.startsWith('/')
    ) {
      src = `${basePath}posts/${slug}/${src.replace(/^\.\//, '')}`;
    }
    const titleAttr = title ? ` title="${title}"` : '';
    const altAttr = text ? ` alt="${text}"` : '';
    return `<img src="${src}"${altAttr}${titleAttr} loading="lazy" />`;
  };

  marked.setOptions({
    breaks: false,
    gfm: true,
    renderer,
  });

  const rawHtml = marked.parse(body);
  const safeHtml = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'iframe', 'span'],
    ADD_ATTR: ['id', 'src', 'alt', 'title', 'width', 'height', 'loading', 'style'],
  });

  const formattedDate = meta.date
    ? new Date(meta.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const tags = Array.isArray(meta.tags) ? meta.tags : [];

  return (
    <article className="blog-post" id={`post-${slug}`}>
      <Link to="/" className="blog-post__back" id="back-link">
        &larr; Back to blog
      </Link>

      <header className="blog-post__header">
        <div className="blog-post__header-content">
          {formattedDate && (
            <time className="blog-post__date" dateTime={meta.date}>
              {formattedDate}
            </time>
          )}
          <h1 className="blog-post__title">{meta.title || slug}</h1>
          {tags.length > 0 && (
            <div className="blog-post__tags">
              {tags.map((tag) => (
                <span key={tag} className="blog-post__tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {meta.icon && (
          <div className="blog-post__icon-container" aria-hidden="true">
            <img src={meta.icon} alt="" className="blog-post__icon" />
          </div>
        )}
      </header>

      {/* Rendered markdown — sanitized via DOMPurify */}
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      {/* Like & Comment interactions */}
      <PostInteractions slug={slug} />
    </article>
  );
}
