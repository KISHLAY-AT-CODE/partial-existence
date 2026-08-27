import { useRef, useEffect } from 'react';

/**
 * HeaderGrid — White grid lines spanning the entire width of the header from very left to very right.
 * As lines approach the center behind "Partial Existence", they bend gracefully outward/around
 * and fade into a subtle dark void.
 */
export default function HeaderGrid() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      isHovered: false,
    };

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      if (width === 0 || height === 0) return;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        mouse.targetX = e.clientX - rect.left;
        mouse.targetY = e.clientY - rect.top;
        mouse.isHovered = true;
      } else {
        mouse.isHovered = false;
        mouse.targetX = -1000;
        mouse.targetY = -1000;
      }
    }

    function onMouseLeave() {
      mouse.isHovered = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave);

    resize();

    function render() {
      // Smooth mouse easing
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;

      ctx.clearRect(0, 0, width, height);

      // Dynamically locate the center of the branding title
      const brandEl = canvas.parentElement?.querySelector('.header__brand');
      let centerX = width / 2;

      if (brandEl) {
        const canvasRect = canvas.getBoundingClientRect();
        const brandRect = brandEl.getBoundingClientRect();
        if (brandRect.width > 0) {
          centerX = brandRect.left + brandRect.width / 2 - canvasRect.left;
        }
      }

      // Square grid matching HeroGrid (38px x 38px)
      const CELL_SIZE = 38;

      // Clear center zone around Partial Existence (no grid lines in middle)
      const voidHalfWidth = Math.min(220, width * 0.28); // Width of completely clear zone from center
      const fadeTransitionWidth = 90; // Distance over which lines smoothly fade in/out

      const leftVoidEdge = centerX - voidHalfWidth;
      const rightVoidEdge = centerX + voidHalfWidth;

      ctx.lineWidth = 1;

      // Helper function to calculate clean opacity for any X position
      function getXAlpha(x) {
        // 1. Completely clear in middle
        if (x > leftVoidEdge && x < rightVoidEdge) {
          return 0;
        }

        // 2. Smooth fade toward center void
        let centerFade = 1;
        if (x <= leftVoidEdge) {
          centerFade = Math.max(0, Math.min(1, (leftVoidEdge - x) / fadeTransitionWidth));
        } else if (x >= rightVoidEdge) {
          centerFade = Math.max(0, Math.min(1, (x - rightVoidEdge) / fadeTransitionWidth));
        }

        // 3. Smooth fade-in from screen outer left & right edges
        const distFromScreenEdge = Math.min(x, width - x);
        const edgeFade = Math.max(0, Math.min(1, distFromScreenEdge / 120));

        return centerFade * edgeFade * 0.32;
      }

      // 1. Draw Straight Vertical Grid Lines on the sides
      const numCols = Math.ceil(width / CELL_SIZE) + 2;
      const startX = (width % CELL_SIZE) / 2;

      for (let c = -1; c <= numCols; c++) {
        const x = startX + c * CELL_SIZE;

        // Skip lines that fall inside the clear middle zone
        if (x >= leftVoidEdge && x <= rightVoidEdge) continue;

        let alpha = getXAlpha(x);
        if (alpha <= 0.005) continue;

        // Mouse glow interaction
        if (mouse.isHovered) {
          const mdx = Math.abs(x - mouse.x);
          if (mdx < 70) {
            alpha = Math.min(0.75, alpha + (1 - mdx / 70) * 0.35);
          }
        }

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.stroke();
      }

      // 2. Draw Straight Horizontal Grid Lines on left and right wings
      const numRows = Math.ceil(height / CELL_SIZE) + 2;
      const startY = (height % CELL_SIZE) / 2;

      // Left wing horizontal gradient (fades in from left edge, fades out at left void edge)
      if (leftVoidEdge > 0) {
        const leftGrad = ctx.createLinearGradient(0, 0, leftVoidEdge, 0);
        leftGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        leftGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.28)');
        leftGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.28)');
        leftGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        for (let r = -1; r <= numRows; r++) {
          const y = startY + r * CELL_SIZE;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(leftVoidEdge, y);
          ctx.strokeStyle = leftGrad;
          ctx.stroke();
        }
      }

      // Right wing horizontal gradient (fades in from right void edge, fades out at right edge)
      if (rightVoidEdge < width) {
        const rightGrad = ctx.createLinearGradient(rightVoidEdge, 0, width, 0);
        rightGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        rightGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.28)');
        rightGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.28)');
        rightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        for (let r = -1; r <= numRows; r++) {
          const y = startY + r * CELL_SIZE;
          ctx.beginPath();
          ctx.moveTo(rightVoidEdge, y);
          ctx.lineTo(width, y);
          ctx.strokeStyle = rightGrad;
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(render);
    }

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div className="header__grid-wrapper" aria-hidden="true">
      <canvas ref={canvasRef} className="header__grid-canvas" />
    </div>
  );
}
