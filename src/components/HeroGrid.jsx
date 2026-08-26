import { useRef, useEffect } from 'react';

/**
 * HeroGrid — A subtle interactive vector grid canvas positioned behind the Hero section.
 * Features:
 * - Subtle wireframe grid matrix with radial vignette falloff.
 * - Dynamic elastic warp & illumination upon mouse hover.
 * - Interconnected physical distortion applying 3D tilt and translation to the text and avatar.
 */
export default function HeroGrid() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.closest('.home__hero') || canvas.parentElement;
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
      radius: 165,
    };

    // Connected distortion physics for text and background
    let warpX = 0;
    let warpY = 0;
    let targetWarpX = 0;
    let targetWarpY = 0;
    let warpVx = 0;
    let warpVy = 0;

    const CELL_SIZE = 38; // Size of each grid square in pixels
    let cols = 0;
    let rows = 0;
    let points = [];

    function setupGrid() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      if (width === 0 || height === 0) return;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      cols = Math.ceil(width / CELL_SIZE) + 2;
      rows = Math.ceil(height / CELL_SIZE) + 2;

      const offsetX = (width - (cols - 1) * CELL_SIZE) / 2;
      const offsetY = (height - (rows - 1) * CELL_SIZE) / 2;

      points = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          const bx = offsetX + c * CELL_SIZE;
          const by = offsetY + r * CELL_SIZE;
          row.push({
            baseX: bx,
            baseY: by,
            x: bx,
            y: by,
            vx: 0,
            vy: 0,
            energy: 0,
          });
        }
        points.push(row);
      }
    }

    // Expanding shockwave ripples on click
    const ripples = [];

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (
        clientX >= rect.left - 40 &&
        clientX <= rect.right + 40 &&
        clientY >= rect.top - 40 &&
        clientY <= rect.bottom + 40
      ) {
        const localX = clientX - rect.left;
        const localY = clientY - rect.top;
        mouse.targetX = localX;
        mouse.targetY = localY;
        mouse.isHovered = true;

        // Calculate interconnected warp targets (-1 to 1 normalized)
        const normX = (localX - width / 2) / (width / 2);
        const normY = (localY - height / 2) / (height / 2);
        targetWarpX = normX * 10;
        targetWarpY = normY * 8;
      } else {
        mouse.isHovered = false;
        mouse.targetX = -1000;
        mouse.targetY = -1000;
        targetWarpX = 0;
        targetWarpY = 0;
      }
    }

    function onClick(e) {
      const rect = canvas.getBoundingClientRect();
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: 0,
        maxRadius: 420,
        speed: 13,
        strength: 1.0,
      });
    }

    function onMouseLeave() {
      mouse.isHovered = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
      targetWarpX = 0;
      targetWarpY = 0;
    }

    function onTouchMove(e) {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        if (
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          const localX = touch.clientX - rect.left;
          const localY = touch.clientY - rect.top;
          mouse.targetX = localX;
          mouse.targetY = localY;
          mouse.isHovered = true;

          const normX = (localX - width / 2) / (width / 2);
          const normY = (localY - height / 2) / (height / 2);
          targetWarpX = normX * 8;
          targetWarpY = normY * 6;
        }
      }
    }

    function onTouchEnd() {
      mouse.isHovered = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
      targetWarpX = 0;
      targetWarpY = 0;
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave, { passive: true });
    window.addEventListener('click', onClick, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('resize', setupGrid);

    setupGrid();

    // Vignette mask helper with smooth continuous cosine falloff (no sharp edges)
    function getVignetteAlpha(x, y) {
      const cx = width / 2;
      const cy = height / 2;
      const nx = (x - cx) / (width * 0.52);
      const ny = (y - cy) / (height * 0.52);
      const d = Math.sqrt(nx * nx + ny * ny);
      if (d >= 1) return 0;
      return 0.5 * (1 + Math.cos(d * Math.PI));
    }

    function draw() {
      // Smooth mouse tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.18;
      mouse.y += (mouse.targetY - mouse.y) * 0.18;

      // Update shockwave ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.strength *= 0.945;
        if (r.radius > r.maxRadius || r.strength < 0.02) {
          ripples.splice(i, 1);
        }
      }

      // Smooth interconnected warp physics for text and background
      const warpSpring = 0.08;
      const warpDamp = 0.76;
      const axW = (targetWarpX - warpX) * warpSpring;
      const ayW = (targetWarpY - warpY) * warpSpring;
      warpVx = (warpVx + axW) * warpDamp;
      warpVy = (warpVy + ayW) * warpDamp;
      warpX += warpVx;
      warpY += warpVy;

      if (container) {
        const rotX = (-warpY * 0.35).toFixed(2);
        const rotY = (warpX * 0.35).toFixed(2);
        container.style.setProperty('--grid-warp-x', `${warpX.toFixed(2)}px`);
        container.style.setProperty('--grid-warp-y', `${warpY.toFixed(2)}px`);
        container.style.setProperty('--grid-rot-x', `${rotX}deg`);
        container.style.setProperty('--grid-rot-y', `${rotY}deg`);
      }

      ctx.clearRect(0, 0, width, height);

      // Faint radial black shade with smooth, gradual falloff into transparency
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.52
      );
      bgGrad.addColorStop(0, 'rgba(0, 0, 0, 0.40)');
      bgGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.22)');
      bgGrad.addColorStop(0.70, 'rgba(0, 0, 0, 0.05)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      if (points.length === 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      // Subtle background distortion aura behind the grid (pure monochrome white/silver)
      if (mouse.isHovered && mouse.x > 0 && mouse.y > 0) {
        const radialGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          mouse.radius * 1.15
        );
        radialGlow.addColorStop(0, 'rgba(255, 255, 255, 0.055)');
        radialGlow.addColorStop(0.5, 'rgba(200, 200, 200, 0.02)');
        radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radialGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius * 1.15, 0, Math.PI * 2);
        ctx.fill();
      }

      const SPRING_K = 0.085;
      const DAMPING = 0.78;
      const PUSH_FORCE = 15;

      // Update grid points with physics
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = points[r][c];

          // Elastic spring towards base position
          const ax = (p.baseX - p.x) * SPRING_K;
          const ay = (p.baseY - p.y) * SPRING_K;

          p.vx = (p.vx + ax) * DAMPING;
          p.vy = (p.vy + ay) * DAMPING;

          // Mouse interaction
          let mouseInfluence = 0;
          if (mouse.isHovered) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouse.radius && dist > 0) {
              mouseInfluence = 1 - dist / mouse.radius;
              const force = mouseInfluence * mouseInfluence * PUSH_FORCE;
              p.vx += (dx / dist) * force * 0.14;
              p.vy += (dy / dist) * force * 0.14;
            }
          }

          // Ripple shockwave interaction on grid points
          for (let k = 0; k < ripples.length; k++) {
            const rip = ripples[k];
            const dx = p.x - rip.x;
            const dy = p.y - rip.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const diff = Math.abs(dist - rip.radius);
            if (diff < 40 && dist > 0) {
              const ripInf = (1 - diff / 40) * rip.strength;
              p.vx += (dx / dist) * ripInf * 12;
              p.vy += (dy / dist) * ripInf * 12;
              mouseInfluence = Math.max(mouseInfluence, ripInf * 0.8);
            }
          }

          p.energy += (mouseInfluence - p.energy) * 0.14;

          p.x += p.vx;
          p.y += p.vy;
        }
      }

      // Draw horizontal grid lines (pure monochrome black & white)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const p1 = points[r][c];
          const p2 = points[r][c + 1];

          const midX = (p1.x + p2.x) * 0.5;
          const midY = (p1.y + p2.y) * 0.5;
          const vignette = getVignetteAlpha(midX, midY);
          if (vignette <= 0.01) continue;

          const energy = (p1.energy + p2.energy) * 0.5;

          if (energy > 0.08) {
            // Luminous pure white highlight near cursor
            const totalAlpha = Math.min(0.9, 0.11 * vignette + energy * 0.55);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${totalAlpha})`;
            ctx.lineWidth = 1.05;
            ctx.stroke();
          } else {
            // Crisp monochrome black & white vector grid line
            const bwAlpha = 0.11 * vignette;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${bwAlpha})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      // Draw vertical grid lines (pure monochrome black & white)
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols; c++) {
          const p1 = points[r][c];
          const p2 = points[r + 1][c];

          const midX = (p1.x + p2.x) * 0.5;
          const midY = (p1.y + p2.y) * 0.5;
          const vignette = getVignetteAlpha(midX, midY);
          if (vignette <= 0.01) continue;

          const energy = (p1.energy + p2.energy) * 0.5;

          if (energy > 0.08) {
            const totalAlpha = Math.min(0.9, 0.11 * vignette + energy * 0.55);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${totalAlpha})`;
            ctx.lineWidth = 1.05;
            ctx.stroke();
          } else {
            const bwAlpha = 0.11 * vignette;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${bwAlpha})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      // Draw subtle intersection nodes on hover (pure monochrome white crosshairs & dots)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = points[r][c];
          const vignette = getVignetteAlpha(p.x, p.y);
          if (vignette <= 0.02) continue;

          if (p.energy > 0.07) {
            // Crisp pure white crosshair on hover
            const crossSize = 2.5 + p.energy * 2.5;
            const alpha = Math.min(0.85, p.energy * 0.9 * vignette);

            ctx.beginPath();
            ctx.moveTo(p.x - crossSize, p.y);
            ctx.lineTo(p.x + crossSize, p.y);
            ctx.moveTo(p.x, p.y - crossSize);
            ctx.lineTo(p.x, p.y + crossSize);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Crisp white center node point
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.2 + p.energy * 1.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', setupGrid);
      if (container) {
        container.style.removeProperty('--grid-warp-x');
        container.style.removeProperty('--grid-warp-y');
        container.style.removeProperty('--grid-rot-x');
        container.style.removeProperty('--grid-rot-y');
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="home__hero-grid-canvas" aria-hidden="true" />;
}
