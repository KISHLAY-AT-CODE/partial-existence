/**
 * posts.js — Automated Markdown Post Indexer & Loader
 *
 * Supports both folder-based posts and direct markdown files:
 *   - Folder-based: /posts/<blog-named-folder>/<blog-name>.md (folder name becomes slug)
 *   - Direct file:  /posts/<blog-name>.md (file name becomes slug)
 * Also scans /public/posts/ and /src/posts/
 *
 * Extracts frontmatter (title, date, tags, excerpt, icon, background),
 * automatic fallback titles from `# Heading`,
 * and exposes sorted listings and single post lookups.
 */

import { siteConfig } from './site.config';

function getSlugFromPath(filePath, metaSlug) {
  if (metaSlug) return metaSlug;
  const normalized = filePath.replace(/\\/g, '/');
  // If inside a subfolder inside posts (e.g. /posts/vinyas-journey/vinyas-journey.md)
  const folderMatch = normalized.match(/(?:posts|public\/posts|src\/posts)\/([^/]+)\/(?:[^/]+)\.md$/i);
  if (folderMatch) {
    return folderMatch[1]; // returns folder name e.g. "vinyas-journey"
  }
  // Otherwise direct file (e.g. /posts/vinyas-journey.md)
  const fileMatch = normalized.match(/([^/]+)\.md$/i);
  if (fileMatch) {
    return fileMatch[1];
  }
  return 'post';
}

/**
 * Parse frontmatter and content from a raw markdown string.
 */
export function parseMarkdownPost(content, filePath = '') {
  let meta = {};
  let body = content;

  // Extract frontmatter if present
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (fmMatch) {
    body = fmMatch[2];
    const lines = fmMatch[1].split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      // Handle arrays: tags: [foo, bar]
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } else if (key === 'tags' && value.includes(',')) {
        value = value
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } else if (typeof value === 'string') {
        value = value.replace(/^["']|["']$/g, '');
      }
      meta[key] = value;
    }
  }

  // Derive slug from folder name or filename
  const slug = getSlugFromPath(filePath, meta.slug);

  // Fallback title: frontmatter -> first heading in body -> cleaned slug
  let title = meta.title;
  if (!title) {
    const headingMatch = body.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      title = headingMatch[1].replace(/<[^>]*>/g, '').trim();
    } else {
      title = slug
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  // Fallback date: frontmatter date -> today's date
  const date = meta.date ? String(meta.date) : new Date().toISOString().slice(0, 10);

  // Fallback tags:
  const tags = Array.isArray(meta.tags)
    ? meta.tags
    : typeof meta.tags === 'string'
      ? [meta.tags]
      : [];

  const basePath = import.meta.env.BASE_URL || '/';

  // Resolve icon path if provided in frontmatter (can be empty)
  let icon = meta.icon ? String(meta.icon).trim() : '';
  if (icon && !icon.startsWith('http') && !icon.startsWith('data:') && !icon.startsWith('/')) {
    icon = `${basePath}posts/${slug}/${icon.replace(/^\.\//, '')}`;
  }

  // Resolve background path if provided in frontmatter (can be empty)
  let background = meta.background ? String(meta.background).trim() : '';
  if (background && !background.startsWith('http') && !background.startsWith('data:') && !background.startsWith('/')) {
    background = `${basePath}posts/${slug}/${background.replace(/^\.\//, '')}`;
  }

  // Fallback excerpt: frontmatter excerpt -> first readable paragraph in body
  let excerpt = meta.excerpt;
  if (!excerpt) {
    const paragraphs = body
      .split(/\n\s*\n/)
      .map((p) =>
        p
          .replace(/^#+\s+.*$/gm, '') // remove headings
          .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
          .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links to text
          .replace(/[*_`~]/g, '') // formatting
          .replace(/<[^>]*>/g, '') // html tags
          .trim()
      )
      .filter((p) => p.length > 0);

    if (paragraphs.length > 0) {
      const firstP = paragraphs[0];
      excerpt = firstP.length > 180 ? firstP.slice(0, 177) + '...' : firstP;
    } else {
      excerpt = '';
    }
  }

  // Social link toggles & custom links (github & allpoetry)
  let github = null;
  if (meta.github !== undefined && meta.github !== null) {
    const ghVal = String(meta.github).trim();
    if (ghVal === 'false' || ghVal === 'none' || ghVal === 'off' || ghVal === '0') {
      github = null;
    } else if (ghVal === 'true' || ghVal === '1' || ghVal === 'on') {
      github = siteConfig?.social?.github || '';
    } else if (ghVal) {
      github = ghVal.startsWith('http://') || ghVal.startsWith('https://')
        ? ghVal
        : `https://github.com/${ghVal.replace(/^@/, '')}`;
    }
  }

  let allpoetry = null;
  if (meta.allpoetry !== undefined && meta.allpoetry !== null) {
    const apVal = String(meta.allpoetry).trim();
    if (apVal === 'false' || apVal === 'none' || apVal === 'off' || apVal === '0') {
      allpoetry = null;
    } else if (apVal === 'true' || apVal === '1' || apVal === 'on') {
      allpoetry = siteConfig?.social?.allpoetry || '';
    } else if (apVal) {
      allpoetry = apVal.startsWith('http://') || apVal.startsWith('https://')
        ? apVal
        : `https://allpoetry.com/${apVal.replace(/^@/, '')}`;
    }
  }

  return {
    slug,
    title,
    date,
    tags,
    excerpt,
    icon,
    background,
    github,
    allpoetry,
    body,
    raw: content,
    filePath,
    meta: {
      ...meta,
      title,
      date,
      tags,
      excerpt,
      icon,
      background,
      github,
      allpoetry,
      slug,
    },
  };
}


// Vite dynamic glob: scans recursively across all folders in /posts, /public/posts, and /src/posts
const markdownFiles = import.meta.glob(
  ['/posts/**/*.md', '/public/posts/**/*.md', '/src/posts/**/*.md'],
  { query: '?raw', eager: true }
);

// Map of slug -> post data

const postsMap = new Map();

for (const [path, rawContent] of Object.entries(markdownFiles)) {
  const content = typeof rawContent === 'string' ? rawContent : rawContent?.default || '';
  if (!content) continue;
  const post = parseMarkdownPost(content, path);
  if (!postsMap.has(post.slug) || path.startsWith('/posts/')) {
    postsMap.set(post.slug, post);
  }
}

/**
 * Get all indexed posts, sorted by date (newest first).
 */
export function getAllPosts() {
  return Array.from(postsMap.values()).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
}

/**
 * Get a specific post by its slug (e.g. "vinyas-journey").
 */
export function getPostBySlug(slug) {
  return postsMap.get(slug) || null;
}
