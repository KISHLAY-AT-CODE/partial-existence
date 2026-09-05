import { useState, useRef, useEffect } from 'react';
import { siteConfig } from '../site.config';

/**
 * InteractiveHeroText — Ultra-tactile character & word-level physics engine.
 * Provides interactive text bulging, 3D lift, radial deflection, luminous glowing aura,
 * and shockwave ripple propagation that seamlessly connects with the vector grid.
 */
export default function InteractiveHeroText({ titlePrefix, titleAccent, subtitle, avatarSrc, author }) {
  const containerRef = useRef(null);
  const avatarRef = useRef(null);
  const avatarTilesRef = useRef([]);
  const titleLettersRef = useRef([]);
  const subtitleWordsRef = useRef([]);

  const [isLogoRevealed, setIsLogoRevealed] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  const githubUrl = siteConfig.social?.github || 'https://github.com/KISHLAY-AT-CODE';
  const linkedinUrl = siteConfig.social?.linkedin || 'https://www.linkedin.com';
  const youtubeUrl = siteConfig.social?.youtube || 'https://www.youtube.com';

  // Break title into letters
  const prefixLetters = (titlePrefix || '').split('');
  const accentLetters = (titleAccent || '').split('');

  // Break subtitle into words
  const words = (subtitle || '').split(' ');

  // Close satellite circles when clicking outside
  useEffect(() => {
    function handleDocClick(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setIsLogoRevealed(false);
      }
    }
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId;

    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      isActive: false,
    };

    // Physics state tracking per element
    const letterItems = [];
    const subtitleItems = [];
    const avatarTileItems = [];

    // Expanding shockwave ripples on click
    const ripples = [];

    function updatePositions() {
      letterItems.length = 0;
      subtitleItems.length = 0;
      avatarTileItems.length = 0;

      titleLettersRef.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        letterItems.push({
          el,
          baseCenterX: rect.left + rect.width / 2,
          baseCenterY: rect.top + rect.height / 2,
          isAccent: el.dataset.accent === 'true',
          isSpace: el.dataset.space === 'true',
          scale: 1,
          tx: 0,
          ty: 0,
          rot: 0,
          glow: 0,
        });
      });

      subtitleWordsRef.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        subtitleItems.push({
          el,
          baseCenterX: rect.left + rect.width / 2,
          baseCenterY: rect.top + rect.height / 2,
          scale: 1,
          tx: 0,
          ty: 0,
          rot: 0,
          glow: 0,
        });
      });

      avatarTilesRef.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        avatarTileItems.push({
          el,
          baseCenterX: rect.left + rect.width / 2,
          baseCenterY: rect.top + rect.height / 2,
          lift: 0,
          tx: 0,
          ty: 0,
          scale: 1,
          rotX: 0,
          rotY: 0,
        });
      });
    }

    function onMouseMove(e) {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isActive = true;
    }

    function onMouseLeave() {
      mouse.isActive = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    }

    function onClick(e) {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 420,
        speed: 13,
        strength: 1.0,
      });
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave, { passive: true });
    window.addEventListener('click', onClick, { passive: true });
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, { passive: true });

    // Initial position measurement
    const timer = setTimeout(updatePositions, 60);

    const TITLE_RADIUS = 160;
    const SUBTITLE_RADIUS = 120;
    const AVATAR_LIFT_RADIUS = 190;

    function loop() {
      // Smooth cursor interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.22;
      mouse.y += (mouse.targetY - mouse.y) * 0.22;

      // Update shockwave ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.strength *= 0.945;
        if (r.radius > r.maxRadius || r.strength < 0.015) {
          ripples.splice(i, 1);
        }
      }

      // 1. Letters Reactive Bulge & Illumination
      for (let i = 0; i < letterItems.length; i++) {
        const item = letterItems[i];
        let targetScale = 1;
        let targetTx = 0;
        let targetTy = 0;
        let targetRot = 0;
        let targetGlow = 0;

        if (mouse.isActive) {
          const dx = item.baseCenterX - mouse.x;
          const dy = item.baseCenterY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < TITLE_RADIUS && dist > 0) {
            const influence = Math.pow(1 - dist / TITLE_RADIUS, 1.6);
            targetScale = 1 + influence * 0.28;
            targetTx = -(dx / dist) * influence * 12;
            targetTy = -(dy / dist) * influence * 10;
            targetRot = (dx / TITLE_RADIUS) * influence * 12;
            targetGlow = influence;
          }
        }

        // Ripple shockwave impact
        for (let j = 0; j < ripples.length; j++) {
          const r = ripples[j];
          const rdx = item.baseCenterX - r.x;
          const rdy = item.baseCenterY - r.y;
          const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
          const ringDist = Math.abs(rdist - r.radius);
          if (ringDist < 50) {
            const rippleInfluence = (1 - ringDist / 50) * r.strength;
            targetScale = Math.max(targetScale, 1 + rippleInfluence * 0.35);
            targetGlow = Math.max(targetGlow, rippleInfluence);
            if (rdist > 0) {
              targetTx += (rdx / rdist) * rippleInfluence * 14;
              targetTy += (rdy / rdist) * rippleInfluence * 14;
            }
          }
        }

        item.scale += (targetScale - item.scale) * 0.2;
        item.tx += (targetTx - item.tx) * 0.2;
        item.ty += (targetTy - item.ty) * 0.2;
        item.rot += (targetRot - item.rot) * 0.2;
        item.glow += (targetGlow - item.glow) * 0.2;

        if (Math.abs(item.scale - 1) > 0.005 || Math.abs(item.tx) > 0.1 || Math.abs(item.ty) > 0.1) {
          item.el.style.transform = `translate3d(${item.tx.toFixed(2)}px, ${item.ty.toFixed(2)}px, 0) scale(${item.scale.toFixed(3)}) rotate(${item.rot.toFixed(2)}deg)`;
          if (item.glow > 0.05) {
            if (item.isAccent) {
              item.el.style.filter = `drop-shadow(0 0 ${(10 + item.glow * 14).toFixed(1)}px rgba(168, 85, 247, ${(0.45 + item.glow * 0.4).toFixed(2)})) drop-shadow(0 0 ${(20 + item.glow * 14).toFixed(1)}px rgba(239, 68, 68, 0.3))`;
            } else {
              item.el.style.color = '#ffffff';
              item.el.style.textShadow = `0 0 ${(10 + item.glow * 14).toFixed(1)}px rgba(180, 245, 100, ${(0.45 + item.glow * 0.4).toFixed(2)}), 0 2px 8px rgba(0, 0, 0, 0.8)`;
            }
          } else {
            if (item.isAccent) {
              item.el.style.filter = '';
            } else {
              item.el.style.color = '';
              item.el.style.textShadow = '';
            }
          }
        } else {
          item.el.style.transform = '';
          if (item.isAccent) {
            item.el.style.filter = '';
          } else {
            item.el.style.color = '';
            item.el.style.textShadow = '';
          }
        }
      }

      // 2. Subtitle Words Subtle Flow
      for (let i = 0; i < subtitleItems.length; i++) {
        const item = subtitleItems[i];
        let targetScale = 1;
        let targetTx = 0;
        let targetTy = 0;
        let targetRot = 0;
        let targetGlow = 0;

        if (mouse.isActive) {
          const dx = item.baseCenterX - mouse.x;
          const dy = item.baseCenterY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < SUBTITLE_RADIUS && dist > 0) {
            const influence = Math.pow(1 - dist / SUBTITLE_RADIUS, 1.4);
            targetScale = 1 + influence * 0.14;
            targetTx = -(dx / dist) * influence * 8;
            targetTy = -(dy / dist) * influence * 6;
            targetRot = (dx / SUBTITLE_RADIUS) * influence * 6;
            targetGlow = influence;
          }
        }

        // Ripple impact
        for (let j = 0; j < ripples.length; j++) {
          const r = ripples[j];
          const rdx = item.baseCenterX - r.x;
          const rdy = item.baseCenterY - r.y;
          const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
          const ringDist = Math.abs(rdist - r.radius);
          if (ringDist < 45) {
            const rippleInfluence = (1 - ringDist / 45) * r.strength;
            targetScale = Math.max(targetScale, 1 + rippleInfluence * 0.2);
            targetGlow = Math.max(targetGlow, rippleInfluence);
          }
        }

        item.scale += (targetScale - item.scale) * 0.18;
        item.tx += (targetTx - item.tx) * 0.18;
        item.ty += (targetTy - item.ty) * 0.18;
        item.rot += (targetRot - item.rot) * 0.18;
        item.glow += (targetGlow - item.glow) * 0.18;

        if (Math.abs(item.scale - 1) > 0.005 || Math.abs(item.tx) > 0.1 || Math.abs(item.ty) > 0.1) {
          item.el.style.transform = `translate3d(${item.tx.toFixed(2)}px, ${item.ty.toFixed(2)}px, 0) scale(${item.scale.toFixed(3)}) rotate(${item.rot.toFixed(2)}deg)`;
          if (item.glow > 0.05) {
            item.el.style.color = '#ffffff';
            item.el.style.textShadow = `0 0 ${(8 + item.glow * 10).toFixed(1)}px rgba(180, 245, 100, ${(0.35 + item.glow * 0.35).toFixed(2)})`;
          } else {
            item.el.style.color = '';
            item.el.style.textShadow = '';
          }
        } else {
          item.el.style.transform = '';
          item.el.style.color = '';
          item.el.style.textShadow = '';
        }
      }

      // 3. Exact 38px Grid Squares Reactive Lift-Off
      if (avatarTileItems.length > 0) {
        for (let i = 0; i < avatarTileItems.length; i++) {
          const tile = avatarTileItems[i];
          let targetLift = 0;
          let targetTx = 0;
          let targetTy = 0;
          let targetRotX = 0;
          let targetRotY = 0;
          let targetScale = 1;

          if (mouse.isActive) {
            const dx = tile.baseCenterX - mouse.x;
            const dy = tile.baseCenterY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < AVATAR_LIFT_RADIUS && dist > 0) {
              const influence = Math.pow(1 - dist / AVATAR_LIFT_RADIUS, 1.6);
              targetLift = influence * 38; // Up to 38px lift-off
              targetScale = 1 + influence * 0.06;
              targetTx = -(dx / dist) * influence * 6;
              targetTy = -(dy / dist) * influence * 6;
              targetRotX = (dy / AVATAR_LIFT_RADIUS) * influence * 16;
              targetRotY = -(dx / AVATAR_LIFT_RADIUS) * influence * 16;
            }
          }

          // Ripple shockwave impact
          for (let j = 0; j < ripples.length; j++) {
            const r = ripples[j];
            const rdx = tile.baseCenterX - r.x;
            const rdy = tile.baseCenterY - r.y;
            const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
            const ringDist = Math.abs(rdist - r.radius);
            if (ringDist < 55) {
              const rippleLift = (1 - ringDist / 55) * r.strength * 30;
              if (rippleLift > targetLift) targetLift = rippleLift;
            }
          }

          tile.lift += (targetLift - tile.lift) * 0.16;
          tile.scale += (targetScale - tile.scale) * 0.16;
          tile.tx += (targetTx - tile.tx) * 0.16;
          tile.ty += (targetTy - tile.ty) * 0.16;
          tile.rotX += (targetRotX - tile.rotX) * 0.16;
          tile.rotY += (targetRotY - tile.rotY) * 0.16;

          const hasTransform = tile.lift > 0.08 || Math.abs(tile.tx) > 0.1 || Math.abs(tile.ty) > 0.1;
          if (hasTransform) {
            tile.el.style.transform = `translate3d(${tile.tx.toFixed(2)}px, ${tile.ty.toFixed(2)}px, ${tile.lift.toFixed(1)}px) scale(${tile.scale.toFixed(3)}) rotateX(${tile.rotX.toFixed(2)}deg) rotateY(${tile.rotY.toFixed(2)}deg)`;
            tile.el.style.zIndex = Math.round(tile.lift * 10);
            tile.el.style.boxShadow = `0 ${(tile.lift * 0.35).toFixed(1)}px ${(tile.lift * 0.75).toFixed(1)}px rgba(0, 0, 0, ${(0.35 + (tile.lift / 38) * 0.4).toFixed(2)}), 0 0 ${(tile.lift * 0.4).toFixed(1)}px rgba(160, 240, 90, ${(0.15 + (tile.lift / 38) * 0.3).toFixed(2)})`;
          } else {
            tile.el.style.transform = '';
            tile.el.style.zIndex = '';
            tile.el.style.boxShadow = '';
          }
        }
      }

      animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('click', onClick);
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
  }, [titlePrefix, titleAccent, subtitle]);

  let letterIndex = 0;
  let wordIndex = 0;

  // Exact 38px grid cells matching HeroGrid.jsx (4 cols x 4 rows = 152px)
  const GRID_SIZE = 4;
  const CELL_SIZE = 38;

  return (
    <div ref={containerRef} className="interactive-hero-wrapper">
      {avatarSrc && (
        <div
          ref={avatarRef}
          className={`home__hero-avatar-wrapper hero-logo-container ${
            isLogoRevealed ? 'hero-logo-container--revealed' : ''
          } ${isLogoHovered ? 'hero-logo-container--hovered' : ''}`}
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            setIsLogoRevealed((prev) => !prev);
          }}
        >
          {/* Background Soft Atmospheric Glow on Hover */}
          <div className="hero-logo-glow" aria-hidden="true" />

          {/* Left Satellite Circle: LinkedIn */}
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hero-logo-satellite hero-logo-satellite--left"
            title="LinkedIn Profile"
            aria-label="Visit LinkedIn Profile"
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="hero-logo-satellite__icon"
            >
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>

          {/* Right Satellite Circle: YouTube */}
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hero-logo-satellite hero-logo-satellite--right"
            title="YouTube Channel"
            aria-label="Visit YouTube Channel"
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="hero-logo-satellite__icon"
            >
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
            </svg>
          </a>

          {/* Unified Solid Logo Container */}
          <div
            className="hero-logo-grid"
            role="button"
            tabIndex={0}
            aria-label={author || 'Interactive Logo'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsLogoRevealed((prev) => !prev);
              }
            }}
          >
            <img
              src={avatarSrc}
              alt={author || 'Interactive Logo'}
              className="hero-logo-img"
              draggable="false"
            />
          </div>

          {/* Hover Overlay: Animated clicking cursor indicator floating above logo */}
          <div className="hero-logo-hover-overlay" aria-hidden={!isLogoHovered}>
            <div className="hero-logo-cursor-anim">
              <div className="hero-logo-cursor-pulse" />
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="#ffffff"
                stroke="#000000"
                strokeWidth="1.2"
                className="hero-logo-cursor-hand"
              >
                <path d="M9 3a2 2 0 0 1 2 2v6.5a.5.5 0 0 0 1 0V7a2 2 0 0 1 4 0v4.5a.5.5 0 0 0 1 0V9a2 2 0 0 1 4 0v6.5c0 4.14-3.36 7.5-7.5 7.5H13c-2.48 0-4.73-1.2-6.1-3.2L3.6 14.5a1.75 1.75 0 0 1 2.8-2.1L9 14.5V5a2 2 0 0 1 0-2z" />
              </svg>
            </div>
          </div>
        </div>
      )}
      <div className="home__hero-content">
        <h2 className="home__hero-title">
          {prefixLetters.map((char, i) => {
            const idx = letterIndex++;
            return (
              <span
                key={`p-${i}`}
                ref={(el) => (titleLettersRef.current[idx] = el)}
                className="interactive-char"
                data-space={char === ' ' ? 'true' : 'false'}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
          <span className="home__hero-accent">
            {accentLetters.map((char, i) => {
              const idx = letterIndex++;
              return (
                <span
                  key={`a-${i}`}
                  ref={(el) => (titleLettersRef.current[idx] = el)}
                  className="interactive-char interactive-char--accent"
                  data-accent="true"
                >
                  {char}
                </span>
              );
            })}
          </span>
        </h2>
        <p className="home__hero-subtitle">
          {words.map((word, i) => {
            const idx = wordIndex++;
            return (
              <span
                key={`w-${i}`}
                ref={(el) => (subtitleWordsRef.current[idx] = el)}
                className="interactive-word"
              >
                {word}
                {i < words.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
