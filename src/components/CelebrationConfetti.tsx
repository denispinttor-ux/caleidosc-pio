import {useEffect, useRef} from 'react';

interface CelebrationConfettiProps {
  triggerKey: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'diamond';
}

const BRAND_COLORS = ['#26328A', '#2EA5DB', '#B81D62', '#F5931E', '#7BB62D'];

export function CelebrationConfetti({triggerKey}: CelebrationConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (triggerKey === 0) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = Array.from({length: 110}, () => {
      const fromLeft = Math.random() < 0.5;
      return {
        x: fromLeft ? canvas.width * 0.25 : canvas.width * 0.75,
        y: canvas.height * 0.55,
        vx: (Math.random() - 0.5) * 14 + (fromLeft ? 3 : -3),
        vy: -(Math.random() * 11 + 6),
        size: Math.random() * 7 + 5,
        color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.22,
        opacity: 1,
        shape: Math.random() > 0.35 ? 'diamond' : 'rect',
      };
    });

    let frameId = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeCount = 0;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28;
        p.vx *= 0.985;
        p.rotation += p.rotationSpeed;
        if (elapsed > 1400) {
          p.opacity = Math.max(0, p.opacity - 0.025);
        }

        if (p.opacity > 0 && p.y < canvas.height + 40) {
          activeCount += 1;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          if (p.shape === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(0, -p.size);
            ctx.lineTo(p.size * 0.65, 0);
            ctx.lineTo(0, p.size);
            ctx.lineTo(-p.size * 0.65, 0);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
          }
          ctx.restore();
        }
      }

      if (activeCount > 0 && elapsed < 3600) {
        frameId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [triggerKey]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
