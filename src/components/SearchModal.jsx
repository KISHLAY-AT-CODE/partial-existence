import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPosts } from '../posts';

/**
 * SearchModal — Emerging Black & White Vector Grid Search
 *
 * Requirements:
 * 1. Animation: Grids emerge from the main page and convert into full-page black & white vector grid
 * 2. Minimalist: No unnecessary elements, no posts listed until a query is typed
 * 3. Layout: Search bar positioned prominently in the center
 * 4. Matched Indexes: Right-angled vector arrows emerge from the search bar directly to matched blog titles
 * 5. Closeable: 'X' button on the search bar or Escape key
 */
export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [hoveredSlug, setHoveredSlug] = useState(null);
  const inputRef = useRef(null);
  const canvasRef = useRef(null);
  const resultsContainerRef = useRef(null);
  const navigate = useNavigate();

  // Load all posts
  const allPosts = useMemo(() => getAllPosts(), []);

  // Compute matched posts only when query is non-empty
  const matchedResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return allPosts
      .map((post) => {
        const titleMatch = post.title?.toLowerCase().includes(q);
        const matchedTags = Array.isArray(post.tags)
          ? post.tags.filter((t) => t.toLowerCase().includes(q))
          : [];
        const excerptMatch = post.excerpt?.toLowerCase().includes(q);
        const slugMatch = post.slug?.toLowerCase().includes(q);

        const isMatch = titleMatch || matchedTags.length > 0 || excerptMatch || slugMatch;
        if (!isMatch) return null;

        return {
          ...post,
          titleMatch,
          matchedTags,
          excerptMatch,
        };
      })
      .filter(Boolean);
  }, [allPosts, query]);

  // Lock body scroll and focus input on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setHoveredSlug(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Interactive & Emerging Black & White Vector Grid Canvas with Cursor Hover Glow
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      active: false,
    };

    const handleResize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    handleResize();

    const startTime = performance.now();

    // Floating vector lattice nodes
    const nodeCount = Math.min(40, Math.floor((width * height) / 28000));
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.6 + 1,
      });
    }

    const render = (now = performance.now()) => {
      try {
        // Smooth mouse interpolation
        mouse.x += (mouse.targetX - mouse.x) * 0.18;
        mouse.y += (mouse.targetY - mouse.y) * 0.18;

        const elapsed = Math.max(0, (now - startTime) / 1000);
        
        // Emergence sequence (0.48s total):
        const emergeProgress = Math.max(0, Math.min(1, elapsed / 0.48));
        const easeEmerge = Math.max(0, Math.min(1, 1 - Math.pow(1 - emergeProgress, 3)));

        // Lift-off scale: pops up on initial burst and settles instantly
        let liftScale = 1;
        let flareAlpha = 0;
        if (elapsed < 0.48) {
          const liftPhase = Math.max(0, Math.min(1, elapsed / 0.48));
          // Bell-curve pop: peak at ~0.15s
          const pop = Math.sin(liftPhase * Math.PI) * Math.exp(-liftPhase * 3.2);
          liftScale = 1 + Math.max(0, pop * 0.09);
          flareAlpha = Math.max(0, pop * 0.75);
        }

        // Clear with pure void black
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        // Apply 3D lift-off scale from center
        ctx.translate(width / 2, height / 2);
        ctx.scale(liftScale, liftScale);
        ctx.translate(-width / 2, -height / 2);

        const gridSize = 46;
        const cols = Math.ceil(width / gridSize) + 2;
        const rows = Math.ceil(height / gridSize) + 2;
        const hoverRadius = 220;

        // 1. BASE PASS: Draw standard crisp white vector grid lines
        const baseAlpha = Math.max(0, Math.min(0.28, 0.16 * easeEmerge + flareAlpha * 0.25));
        ctx.strokeStyle = `rgba(255, 255, 255, ${baseAlpha})`;
        ctx.lineWidth = 1 + flareAlpha * 0.5;

        ctx.beginPath();
        // Vertical lines
        for (let c = -1; c < cols; c++) {
          const x = c * gridSize;
          ctx.moveTo(x, -gridSize);
          ctx.lineTo(x, height + gridSize);
        }
        // Horizontal lines
        for (let r = -1; r < rows; r++) {
          const y = r * gridSize;
          ctx.moveTo(-gridSize, y);
          ctx.lineTo(width + gridSize, y);
        }
        ctx.stroke();

        // 2. CIRCULAR HOVER PASS: Strictly circular radial spotlight illumination around cursor
        if (mouse.active && hoverRadius > 0) {
          ctx.save();
          // Clip to a perfect circle around the mouse
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, Math.max(0, hoverRadius), 0, Math.PI * 2);
          ctx.clip();

          // Radial glow gradient for illuminated grid lines
          const radGrad = ctx.createRadialGradient(
            mouse.x,
            mouse.y,
            0,
            mouse.x,
            mouse.y,
            Math.max(0.1, hoverRadius)
          );
          radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          radGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.65)');
          radGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
          radGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

          ctx.strokeStyle = radGrad;
          ctx.lineWidth = 1.6;

          ctx.beginPath();
          // Redraw grid lines only within the circular clip region
          const startCol = Math.floor((mouse.x - hoverRadius) / gridSize);
          const endCol = Math.ceil((mouse.x + hoverRadius) / gridSize);
          for (let c = startCol; c <= endCol; c++) {
            const x = c * gridSize;
            ctx.moveTo(x, mouse.y - hoverRadius);
            ctx.lineTo(x, mouse.y + hoverRadius);
          }

          const startRow = Math.floor((mouse.y - hoverRadius) / gridSize);
          const endRow = Math.ceil((mouse.y + hoverRadius) / gridSize);
          for (let r = startRow; r <= endRow; r++) {
            const y = r * gridSize;
            ctx.moveTo(mouse.x - hoverRadius, y);
            ctx.lineTo(mouse.x + hoverRadius, y);
          }
          ctx.stroke();

          // Subtle circular aura fill
          const softAura = ctx.createRadialGradient(
            mouse.x,
            mouse.y,
            0,
            mouse.x,
            mouse.y,
            Math.max(0.1, hoverRadius)
          );
          softAura.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
          softAura.addColorStop(0.6, 'rgba(255, 255, 255, 0.015)');
          softAura.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = softAura;
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, Math.max(0, hoverRadius), 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }

        // 3. MAJOR COORDINATE CROSSHAIRS
        const majorStep = gridSize * 2;
        for (let x = 0; x < width + gridSize; x += majorStep) {
          for (let y = 0; y < height + gridSize; y += majorStep) {
            const distToMouse = Math.hypot(x - mouse.x, y - mouse.y);
            const isInsideCircle = mouse.active && distToMouse < hoverRadius;
            const crossSize = isInsideCircle ? 6 : 4;
            
            let crossAlpha = 0.28 * easeEmerge;
            if (isInsideCircle && hoverRadius > 0) {
              crossAlpha += (1 - distToMouse / hoverRadius) * 0.7;
            }

            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, crossAlpha))})`;
            ctx.lineWidth = isInsideCircle ? 1.5 : 1;
            ctx.beginPath();
            ctx.moveTo(x - crossSize, y);
            ctx.lineTo(x + crossSize, y);
            ctx.moveTo(x, y - crossSize);
            ctx.lineTo(x, y + crossSize);
            ctx.stroke();
          }
        }

        // 4. EMERGENCE FLARE RING & SHOCKWAVE
        if (emergeProgress < 1) {
          const shockRadius = Math.max(0, easeEmerge * Math.hypot(width, height) * 0.85);
          if (shockRadius > 0) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, (1 - emergeProgress) * 0.7)})`;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, shockRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // 5. CONNECTED FLOATING VECTOR NODES
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.x += n.vx;
          n.y += n.vy;

          if (n.x < 0) n.x = width;
          if (n.x > width) n.x = 0;
          if (n.y < 0) n.y = height;
          if (n.y > height) n.y = 0;

          const distToMouse = Math.hypot(n.x - mouse.x, n.y - mouse.y);
          const isInsideCircle = mouse.active && distToMouse < hoverRadius;
          const nodeAlpha = isInsideCircle ? 0.95 : 0.65 * easeEmerge;
          const nodeRadius = Math.max(0.1, isInsideCircle ? n.r * 1.35 : n.r);

          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, nodeAlpha))})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, nodeRadius, 0, Math.PI * 2);
          ctx.fill();

          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n.x - n2.x;
            const dy = n.y - n2.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 130) {
              let lineAlpha = (1 - d / 130) * 0.24 * easeEmerge;
              if (isInsideCircle) lineAlpha += 0.35;
              ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(0.9, lineAlpha))})`;
              ctx.lineWidth = isInsideCircle ? 1.2 : 0.8;
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.stroke();
            }
          }
        }

        ctx.restore();
      } catch (err) {
        console.debug('[SearchModal Canvas] Render cycle warning:', err.message);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPost = (slug) => {
    onClose();
    navigate(`/blog/${slug}`);
  };

  // Helper to highlight matching substrings
  const highlightMatch = (text, matchQuery) => {
    if (!matchQuery || !text) return text;
    const parts = text.split(new RegExp(`(${matchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === matchQuery.toLowerCase() ? (
        <mark key={i} className="vector-search__highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div
      className="vector-search"
      role="dialog"
      aria-modal="true"
      aria-label="Search Blog Posts"
      id="search-vector-overlay"
      onClick={(e) => {
        // Close if clicking outside the central wrapper
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Dynamic Black and White Vector Grid Canvas */}
      <canvas ref={canvasRef} className="vector-search__canvas" aria-hidden="true" />

      {/* Centered Main Search Shell */}
      <div className={`vector-search__stage ${hasQuery ? 'vector-search__stage--active' : ''}`}>
        
        {/* Centered Search Bar */}
        <div className="vector-search__center-bar-box">
          <div className="vector-search__bar">
            {/* White Search Vector Icon */}
            <div className="vector-search__icon-box" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              className="vector-search__input"
              placeholder="Search posts or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              id="vector-search-input"
              autoComplete="off"
              spellCheck="false"
            />

            {/* Cancel 'X' Close Button */}
            <button
              type="button"
              className="vector-search__cancel-btn"
              onClick={onClose}
              title="Close search (ESC)"
              aria-label="Close search"
              id="vector-search-cancel-btn"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Matched Results with Right-Angled Vector Branch Arrows */}
        {hasQuery && (
          <div className="vector-search__results-section" ref={resultsContainerRef}>
            {matchedResults.length > 0 ? (
              <div className="vector-search__schematic-tree">
                {/* Central Trunk Line connecting search bar down to matched elements */}
                <div className="vector-search__trunk-line" aria-hidden="true" />

                <div className="vector-search__matched-list">
                  {matchedResults.map((post, idx) => {
                    const isHovered = hoveredSlug === post.slug;
                    const indexLabel = `[${String(idx + 1).padStart(2, '0')}]`;

                    return (
                      <div
                        key={post.slug}
                        className={`vector-search__matched-item ${
                          isHovered ? 'vector-search__matched-item--hovered' : ''
                        }`}
                        onMouseEnter={() => setHoveredSlug(post.slug)}
                        onMouseLeave={() => setHoveredSlug(null)}
                      >
                        {/* Right-Angled Arrow emerging from central trunk to the matched blog title */}
                        <div className="vector-search__branch-connector" aria-hidden="true">
                          {/* Horizontal branch line */}
                          <div className="vector-search__branch-h-line" />
                          {/* Right-pointing arrow tip */}
                          <svg
                            className="vector-search__branch-arrow"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                        </div>

                        {/* Matched Blog Header Index Node */}
                        <div
                          className="vector-search__node-container"
                          onClick={() => handleSelectPost(post.slug)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectPost(post.slug);
                            }
                          }}
                          id={`matched-vector-${post.slug}`}
                        >
                          {/* Primary Title Bar */}
                          <div className="vector-search__node-header">
                            <div className="vector-search__node-meta-left">
                              <span className="vector-search__node-index">{indexLabel}</span>
                              <h3 className="vector-search__node-title">
                                {highlightMatch(post.title, query)}
                              </h3>
                            </div>
                            <span className="vector-search__node-date">{post.date}</span>
                          </div>

                          {/* Revealable Blog Tile on Hover */}
                          <div className="vector-search__blog-tile">
                            {post.excerpt && (
                              <p className="vector-search__tile-excerpt">
                                {highlightMatch(post.excerpt, query)}
                              </p>
                            )}

                            {/* Tags in Tile */}
                            {Array.isArray(post.tags) && post.tags.length > 0 && (
                              <div className="vector-search__tile-tags">
                                {post.tags.map((tag) => {
                                  const isTagMatch = tag.toLowerCase().includes(query.toLowerCase());
                                  return (
                                    <span
                                      key={tag}
                                      className={`vector-search__tile-tag ${
                                        isTagMatch ? 'vector-search__tile-tag--matched' : ''
                                      }`}
                                    >
                                      #{tag}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            <div className="vector-search__tile-footer">
                              <span className="vector-search__tile-action">
                                READ ARTICLE
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                  <polyline points="12 5 19 12 12 19" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Minimal Empty Feedback */
              <div className="vector-search__no-match">
                <span className="vector-search__no-match-code">[NO_SIGNAL]</span>
                <span className="vector-search__no-match-text">
                  No blog titles or tags matched &ldquo;<strong>{query}</strong>&rdquo;
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
