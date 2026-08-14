import { useRef, useEffect } from 'react';
import { theme } from '../theme';

/**
 * StarField — A canvas-based animated starfield background.
 * "Stars that twinkle in a starry bay, acting as silent, glowing, luminous friends."
 * Performance-optimized with requestAnimationFrame and device pixel ratio awareness.
 */
export default function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let animationId;
    let stars = [];

    const STAR_COUNT = 50;
    const MAX_RADIUS = 1.0;

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
      initStars();
    }

    function initStars() {
      stars = [];
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * MAX_RADIUS + 0.3,
          baseAlpha: Math.random() * 0.35 + 0.1,
          alpha: 0,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.003 + 0.001,
          // Some stars are amber-tinted, most are cool silver
          // More green-tinted particles to blend with the forest
          isWarm: Math.random() > 0.7,
        });
      }
    }

    function draw(time) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const star of stars) {
        const twinkle = Math.sin(time * star.speed + star.phase);
        star.alpha = star.baseAlpha + twinkle * 0.2;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

        if (star.isWarm) {
          ctx.fillStyle = `rgba(160, 210, 80, ${Math.max(0, star.alpha)})`;
        } else {
          ctx.fillStyle = `rgba(176, 184, 200, ${Math.max(0, star.alpha)})`;
        }
        ctx.fill();

        // Subtle glow for brighter stars
        if (star.radius > 1 && star.alpha > 0.3) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
          const glowAlpha = (star.alpha - 0.3) * 0.1;
          if (star.isWarm) {
            ctx.fillStyle = `rgba(160, 210, 80, ${Math.max(0, glowAlpha)})`;
          } else {
            ctx.fillStyle = `rgba(176, 184, 200, ${Math.max(0, glowAlpha)})`;
          }
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    resize();
    animationId = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield-canvas" aria-hidden="true" />;
}
