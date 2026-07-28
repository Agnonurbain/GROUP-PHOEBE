"use client";
import { useRef, useEffect, type ReactNode } from "react";

const GOLD = "201, 168, 76";

export function GoldTrail({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d")!;
    let points: { x: number; y: number; life: number }[] = [];
    let animId: number;

    const resize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    resize();

    const handler = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      points.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        life: 1,
      });
      if (points.length > 120) points.shift();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (points.length < 2) { animId = requestAnimationFrame(draw); return; }

      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        p.life -= 0.012;
        if (p.life <= 0) continue;
      }
      points = points.filter((p) => p.life > 0);
      if (points.length < 2) { animId = requestAnimationFrame(draw); return; }

      // Glow pass (wide, blurry)
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        const prev = points[i - 1];
        const life = p.life;

        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(${GOLD}, ${life * 0.15})`;
        ctx.lineWidth = life * 14;
        ctx.shadowBlur = 40;
        ctx.shadowColor = `rgba(${GOLD}, ${life * 0.25})`;
        ctx.stroke();
      }

      // Core pass (thin, bright)
      ctx.shadowBlur = 0;
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        const prev = points[i - 1];
        const life = p.life;

        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(${GOLD}, ${life * 0.7})`;
        ctx.lineWidth = life * 2.5;
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    container.addEventListener("pointermove", handler);
    window.addEventListener("resize", resize);
    return () => {
      container.removeEventListener("pointermove", handler);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {children}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-[5]"
      />
    </div>
  );
}
