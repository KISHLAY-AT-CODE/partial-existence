import { useRef, useEffect } from 'react';

/**
 * InteractiveHeroText — Ultra-tactile character & word-level physics engine.
 * Provides interactive text bulging, 3D lift, radial deflection, luminous glowing aura,
 * and shockwave ripple propagation that seamlessly connects with the vector grid.
 */
export default function InteractiveHeroText({ titlePrefix, titleAccent, subtitle, avatarSrc, author }) {
  const containerRef = useRef(null);
  const avatarRef = useRef(null);
  const titleLettersRef = useRef([]);
  const subtitleWordsRef = useRef([]);

  // Break title into letters
  const prefixLetters = (titlePrefix || '').split('');
  const accentLetters = (titleAccent || '').split('');

  // Break subtitle into words
  const words = (subtitle || '').split(' ');

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
    const titleItems = [];
    const subtitleItems = [];
    let avatarItem = null;

    // Expanding shockwave ripples on click
    const ripples = [];

    function updatePositions() {
      titleItems.length = 0;
      subtitleItems.length = 0;

      titleLettersRef.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        titleItems.push({
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

      if (avatarRef.current) {
        const rect = avatarRef.current.getBoundingClientRect();
        avatarItem = {
          el: avatarRef.current,
          baseCenterX: rect.left + rect.width / 2,
          baseCenterY: rect.top + rect.height / 2,
          scale: 1,
          tx: 0,
          ty: 0,
          rotX: 0,
          rotY: 0,
          glow: 0,
        };
      }
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
    const AVATAR_RADIUS = 170;

    function loop() {
      // Smooth cursor interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.22;
      mouse.y += (mouse.targetY - mouse.y) * 0.22;

      // Update shockwave ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.strength *= 0.945;
        if (r.radius > r.maxRadius || r.strength < 0.02) {
          ripples.splice(i, 1);
        }
      }

      // 1. Title Character Interactivity (Bulge, 3D lift, Deflection, Radiant Glow)
      for (let i = 0; i < titleItems.length; i++) {
        const item = titleItems[i];
        if (item.isSpace) continue;

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
            const influence = Math.pow(1 - dist / TITLE_RADIUS, 1.7);
            targetScale = 1 + influence * 0.45; // Dynamic Character Bulge
            targetTx = (dx / dist) * influence * 18; // Vector grid deflection
            targetTy = -influence * 16 + (dy / dist) * influence * 12; // 3D Lift
            targetRot = (dx / TITLE_RADIUS) * influence * 16;
            targetGlow = influence;
          }
        }

        // Apply ripples to title characters
        for (let r = 0; r < ripples.length; r++) {
          const rip = ripples[r];
          const dx = item.baseCenterX - rip.x;
          const dy = item.baseCenterY - rip.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const diff = Math.abs(dist - rip.radius);
          if (diff < 45) {
            const ripInf = (1 - diff / 45) * rip.strength;
            targetScale += ripInf * 0.4;
            targetTy -= ripInf * 15;
            targetGlow = Math.max(targetGlow, ripInf);
          }
        }

        // Spring physics easing
        item.scale += (targetScale - item.scale) * 0.18;
        item.tx += (targetTx - item.tx) * 0.18;
        item.ty += (targetTy - item.ty) * 0.18;
        item.rot += (targetRot - item.rot) * 0.18;
        item.glow += (targetGlow - item.glow) * 0.18;

        if (item.el) {
          if (Math.abs(item.scale - 1) > 0.001 || Math.abs(item.tx) > 0.1 || Math.abs(item.ty) > 0.1) {
            item.el.style.transform = `translate3d(${item.tx.toFixed(2)}px, ${item.ty.toFixed(2)}px, 0) scale(${item.scale.toFixed(3)}) rotate(${item.rot.toFixed(2)}deg)`;
            if (item.glow > 0.04) {
              if (item.isAccent) {
                item.el.style.filter = `drop-shadow(0 0 ${(8 + item.glow * 8).toFixed(1)}px rgba(140, 235, 75, ${(0.45 + item.glow * 0.2).toFixed(2)})) drop-shadow(0 0 ${(16 + item.glow * 10).toFixed(1)}px rgba(75, 210, 85, 0.3))`;
              } else {
                item.el.style.textShadow = `0 0 ${(item.glow * 8).toFixed(1)}px rgba(135, 230, 75, 0.4), 0 0 ${(item.glow * 16).toFixed(1)}px rgba(80, 200, 85, 0.2), 0 2px 8px rgba(0, 0, 0, 0.95)`;
                item.el.style.color = `rgb(${Math.round(238 + item.glow * 17)}, 255, ${Math.round(242 + item.glow * 13)})`;
              }
            } else {
              if (item.isAccent) {
                item.el.style.filter = '';
              } else {
                item.el.style.textShadow = '';
                item.el.style.color = '';
              }
            }
          } else {
            item.el.style.transform = '';
            if (!item.isAccent) {
              item.el.style.textShadow = '';
              item.el.style.color = '';
            }
          }
        }
      }

      // 2. Subtitle Word Interactivity (Bulge, Wave displacement, Dim Forest Green Shimmer)
      for (let i = 0; i < subtitleItems.length; i++) {
        const item = subtitleItems[i];
        let targetScale = 1;
        let targetTx = 0;
        let targetTy = 0;
        let targetGlow = 0;

        if (mouse.isActive) {
          const dx = item.baseCenterX - mouse.x;
          const dy = item.baseCenterY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < SUBTITLE_RADIUS && dist > 0) {
            const influence = Math.pow(1 - dist / SUBTITLE_RADIUS, 1.6);
            targetScale = 1 + influence * 0.28; // Word bulge
            targetTx = (dx / dist) * influence * 12; // Grid displacement
            targetTy = -influence * 10 + (dy / dist) * influence * 8;
            targetGlow = influence;
          }
        }

        // Apply ripples to subtitle words
        for (let r = 0; r < ripples.length; r++) {
          const rip = ripples[r];
          const dx = item.baseCenterX - rip.x;
          const dy = item.baseCenterY - rip.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const diff = Math.abs(dist - rip.radius);
          if (diff < 40) {
            const ripInf = (1 - diff / 40) * rip.strength;
            targetScale += ripInf * 0.22;
            targetTy -= ripInf * 10;
            targetGlow = Math.max(targetGlow, ripInf);
          }
        }

        item.scale += (targetScale - item.scale) * 0.18;
        item.tx += (targetTx - item.tx) * 0.18;
        item.ty += (targetTy - item.ty) * 0.18;
        item.glow += (targetGlow - item.glow) * 0.18;

        if (item.el) {
          if (Math.abs(item.scale - 1) > 0.001 || Math.abs(item.tx) > 0.1 || Math.abs(item.ty) > 0.1) {
            item.el.style.transform = `translate3d(${item.tx.toFixed(2)}px, ${item.ty.toFixed(2)}px, 0) scale(${item.scale.toFixed(3)})`;
            if (item.glow > 0.04) {
              item.el.style.color = `rgba(235, 255, 240, ${(0.92 + item.glow * 0.08).toFixed(2)})`;
              item.el.style.textShadow = `0 0 ${(item.glow * 6).toFixed(1)}px rgba(130, 225, 75, 0.35), 0 1px 4px rgba(0, 0, 0, 0.9), 0 0 2px rgba(0, 0, 0, 0.95)`;
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
      }

      // 3. Avatar Reactive Bulge & 3D Tilt with Dim Emerald Green Glow
      if (avatarItem && avatarItem.el) {
        let targetScale = 1;
        let targetTx = 0;
        let targetTy = 0;
        let targetRotX = 0;
        let targetRotY = 0;
        let targetGlow = 0;

        if (mouse.isActive) {
          const dx = avatarItem.baseCenterX - mouse.x;
          const dy = avatarItem.baseCenterY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < AVATAR_RADIUS && dist > 0) {
            const influence = 1 - dist / AVATAR_RADIUS;
            targetScale = 1 + influence * 0.22; // Bulge
            targetTx = -(dx / dist) * influence * 14;
            targetTy = -(dy / dist) * influence * 14;
            targetRotX = (dy / AVATAR_RADIUS) * influence * 18;
            targetRotY = -(dx / AVATAR_RADIUS) * influence * 18;
            targetGlow = influence;
          }
        }

        avatarItem.scale += (targetScale - avatarItem.scale) * 0.15;
        avatarItem.tx += (targetTx - avatarItem.tx) * 0.15;
        avatarItem.ty += (targetTy - avatarItem.ty) * 0.15;
        avatarItem.rotX += (targetRotX - avatarItem.rotX) * 0.15;
        avatarItem.rotY += (targetRotY - avatarItem.rotY) * 0.15;
        avatarItem.glow += (targetGlow - avatarItem.glow) * 0.15;

        avatarItem.el.style.transform = `translate3d(${avatarItem.tx.toFixed(2)}px, ${avatarItem.ty.toFixed(2)}px, 0) scale(${avatarItem.scale.toFixed(3)}) rotateX(${avatarItem.rotX.toFixed(2)}deg) rotateY(${avatarItem.rotY.toFixed(2)}deg)`;
        if (avatarItem.glow > 0.04) {
          avatarItem.el.style.boxShadow = `0 0 ${(18 + avatarItem.glow * 20).toFixed(1)}px rgba(130, 225, 75, ${(0.28 + avatarItem.glow * 0.22).toFixed(2)}), 0 8px 36px rgba(0, 0, 0, 0.55)`;
        } else {
          avatarItem.el.style.boxShadow = '';
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

  return (
    <div ref={containerRef} className="interactive-hero-wrapper">
      {avatarSrc && (
        <div ref={avatarRef} className="home__hero-avatar-wrapper">
          <img src={avatarSrc} alt={author || 'Avatar'} className="home__hero-avatar" />
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
