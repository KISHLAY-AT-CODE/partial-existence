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

    // Smooth dynamic void boundaries
    let currentLeftVoid = -1000;
    let currentRightVoid = 10000;

    function render() {
      // Smooth mouse easing
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;

      ctx.clearRect(0, 0, width, height);

      // Dynamically locate boundaries of the complete Partial Existence branding + Search button row
      const canvasRect = canvas.getBoundingClientRect();
      const brandRowEl = canvas.parentElement?.querySelector('.header__brand-row');
      const partialSlotEl = canvas.parentElement?.querySelector('.header__partial-slot');
      const searchBtnEl = canvas.parentElement?.querySelector('.header__search-btn');

      let targetLeftVoid = width / 2 - 190;
      let targetRightVoid = width / 2 + 190;

      if (canvasRect.width > 0) {
        if (brandRowEl) {
          const bRect = brandRowEl.getBoundingClientRect();
          if (bRect.width > 0) {
            targetLeftVoid = bRect.left - canvasRect.left - 24; // Clear void on left of Partial
            targetRightVoid = bRect.right - canvasRect.left + 24; // Clear void past search button
          }
        } else {
          if (partialSlotEl) {
            const pRect = partialSlotEl.getBoundingClientRect();
            if (pRect.width > 0) {
              targetLeftVoid = pRect.left - canvasRect.left - 24;
            }
          }
          if (searchBtnEl) {
            const sRect = searchBtnEl.getBoundingClientRect();
            if (sRect.width > 0) {
              targetRightVoid = sRect.right - canvasRect.left + 24;
            }
          }
        }
      }

      if (currentLeftVoid === -1000) {
        currentLeftVoid = targetLeftVoid;
        currentRightVoid = targetRightVoid;
      } else {
        currentLeftVoid += (targetLeftVoid - currentLeftVoid) * 0.18;
        currentRightVoid += (targetRightVoid - currentRightVoid) * 0.18;
      }

      const leftVoidEdge = currentLeftVoid;
      const rightVoidEdge = currentRightVoid;

      // Square grid matching HeroGrid (38px x 38px)
      const CELL_SIZE = 38;
      const fadeTransitionWidth = 32; // Crisp, subtle transition into void

      ctx.lineWidth = 1;

      // Helper function to calculate clean opacity for any X position
      function getXAlpha(x) {
        // 1. Completely clear in void (covering active Partial, Existence, and Search Button)
        if (x > leftVoidEdge && x < rightVoidEdge) {
          return 0;
        }

        // 2. Smooth fade toward void edges
        let centerFade = 1;
        if (x <= leftVoidEdge) {
          centerFade = Math.max(0, Math.min(1, (leftVoidEdge - x) / fadeTransitionWidth));
        } else if (x >= rightVoidEdge) {
          centerFade = Math.max(0, Math.min(1, (x - rightVoidEdge) / fadeTransitionWidth));
        }

        // 3. Smooth fade-in from screen outer left & right edges
        const distFromScreenEdge = Math.min(x, width - x);
        const edgeFade = Math.max(0, Math.min(1, distFromScreenEdge / 60));

        return centerFade * edgeFade * 0.32;
      }

      // 1. Draw Straight Vertical Grid Lines (showing grid where Partial is not present)
      const numCols = Math.ceil(width / CELL_SIZE) + 2;
      const startX = (width % CELL_SIZE) / 2;

      for (let c = -1; c <= numCols; c++) {
        const x = startX + c * CELL_SIZE;

        // Skip lines that fall inside the clear void zone
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

      // Left wing horizontal gradient (fades in from left edge, extends right up to leftVoidEdge)
      if (leftVoidEdge > 0) {
        const leftGrad = ctx.createLinearGradient(0, 0, leftVoidEdge, 0);
        leftGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        leftGrad.addColorStop(0.12, 'rgba(255, 255, 255, 0.28)');
        leftGrad.addColorStop(0.88, 'rgba(255, 255, 255, 0.28)');
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

      // Right wing horizontal gradient (starts after rightVoidEdge past search button)
      if (rightVoidEdge < width) {
        const rightGrad = ctx.createLinearGradient(rightVoidEdge, 0, width, 0);
        rightGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        rightGrad.addColorStop(0.14, 'rgba(255, 255, 255, 0.28)');
        rightGrad.addColorStop(0.88, 'rgba(255, 255, 255, 0.28)');
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
