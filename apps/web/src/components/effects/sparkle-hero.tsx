"use client";
import { useRef, useEffect, type ReactNode } from "react";

const GOLDS = ["#d4af37", "#f5d442", "#c5a028", "#e6c84d", "#fff8dc"];

export function SparkleHero({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d")!;
    let particles: {
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      life: number;
      decay: number;
      color: string;
    }[] = [];
    let animId: number | null = null;

    const resize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    resize();

    const spawn = (x: number, y: number) => {
      for (let i = 0; i < 3; i++) {
        particles.push({
          x,
          y,
          size: Math.random() * 3.5 + 1.5,
          vx: (Math.random() - 0.5) * 2.5,
          vy: (Math.random() - 0.5) * 2.5 - 1,
          life: 1,
          decay: Math.random() * 0.02 + 0.012,
          color: GOLDS[Math.floor(Math.random() * GOLDS.length)],
        });
      }
      if (particles.length > 100) particles = particles.slice(-100);
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter((p) => p.life > 0);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.size *= 0.985;

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;

        ctx.beginPath();
        const spikes = 4;
        for (let i = 0; i < spikes * 2; i++) {
          const angle = (i * Math.PI) / spikes;
          const r = i % 2 === 0 ? p.size : p.size * 0.4;
          const sx = p.x + Math.cos(angle) * r;
          const sy = p.y + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      animId =
        particles.length > 0 ? requestAnimationFrame(animate) : null;
    };

    const handler = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      spawn(e.clientX - rect.left, e.clientY - rect.top);
      if (!animId) animate();
    };

    container.addEventListener("pointermove", handler);
    window.addEventListener("resize", resize);
    return () => {
      container.removeEventListener("pointermove", handler);
      window.removeEventListener("resize", resize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {children}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10"
      />
    </div>
  );
}
