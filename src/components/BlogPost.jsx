import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import PostInteractions from './PostInteractions';
import { getPostBySlug } from '../posts';
import { recordPageView } from '../api';

import { hasViewedPostCookie, markPostViewedCookie } from '../cookies';

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

  // Record unique pageview when visitor views the post
  useEffect(() => {
    if (slug && !hasViewedPostCookie(slug)) {
      recordPageView(slug);
      markPostViewedCookie(slug);
    }
  }, [slug]);

  // Dynamic custom background support (reverts to default when unmounting)
  useEffect(() => {
    const basePath = import.meta.env.BASE_URL || '/';
    if (meta.background) {
      let bgUrl = meta.background;
      if (!bgUrl.startsWith('http://') && !bgUrl.startsWith('https://') && !bgUrl.startsWith('data:')) {
        if (bgUrl.startsWith('/')) {
          bgUrl = `${basePath}${bgUrl.slice(1)}`;
        } else {
          bgUrl = `${basePath}posts/${slug}/${bgUrl.replace(/^\.\//, '')}`;
        }
      }
      document.documentElement.style.setProperty('--bg-image', `url("${bgUrl}")`);
    } else {
      document.documentElement.style.setProperty('--bg-image', `url("${basePath}mushishi-bg.jpg")`);
    }
    return () => {
      document.documentElement.style.setProperty('--bg-image', `url("${basePath}mushishi-bg.jpg")`);
    };
  }, [meta.background, slug]);

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
    ADD_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'iframe', 'span', 'br',
      'div', 'p', 'blockquote', 'em', 'strong',
      'details', 'summary', 'svg', 'path', 'g', 'circle', 'rect', 'line', 'polygon', 'polyline'
    ],
    ADD_ATTR: [
      'id', 'src', 'alt', 'title', 'width', 'height', 'loading', 'style',
      'class', 'className', 'viewBox', 'fill', 'stroke', 'stroke-width',
      'stroke-linecap', 'stroke-linejoin', 'xmlns', 'target', 'rel', 'd',
      'allow', 'allowfullscreen', 'frameborder', 'referrerpolicy'
    ],
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

      <header
        className="blog-post__header"
        style={meta.theme ? { '--post-theme': meta.theme } : undefined}
      >
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
          <div className="blog-post__bg-icon" aria-hidden="true">
            <img src={meta.icon} alt="" className="blog-post__bg-icon-img" />
          </div>
        )}
      </header>

      {/* Rendered markdown — sanitized via DOMPurify */}
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      {/* Like, Comment & Social (GitHub / AllPoetry) interactions */}
      <PostInteractions
        slug={slug}
        github={post.github}
        allpoetry={post.allpoetry}
      />
    </article>
  );
}

