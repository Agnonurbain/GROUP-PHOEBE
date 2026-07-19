"use client";
import { useRef, useEffect, type ReactNode } from "react";

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
      if (points.length > 60) points.shift();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        const prev = points[i - 1];
        p.life -= 0.018;
        if (p.life <= 0) continue;

        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(212, 175, 55, ${p.life * 0.5})`;
        ctx.lineWidth = p.life * 3;
        ctx.lineCap = "round";
        ctx.shadowBlur = 12;
        ctx.shadowColor = `rgba(212, 175, 55, ${p.life * 0.3})`;
        ctx.stroke();
      }
      points = points.filter((p) => p.life > 0);
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
