"use client";
import { useRef, useCallback, type ReactNode } from "react";

export function TiltCard({
  children,
  className = "",
  maxTilt = 12,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const innerRef = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rY = (x - 0.5) * maxTilt * 2;
      const rX = (0.5 - y) * maxTilt * 2;
      if (innerRef.current) {
        innerRef.current.style.transform = `perspective(800px) rotateX(${rX}deg) rotateY(${rY}deg) scale3d(1.02,1.02,1.02)`;
        innerRef.current.style.setProperty("--mx", `${x * 100}%`);
        innerRef.current.style.setProperty("--my", `${y * 100}%`);
      }
    },
    [maxTilt]
  );

  const onLeave = useCallback(() => {
    if (innerRef.current) {
      innerRef.current.style.transform =
        "perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)";
    }
  }, []);

  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={className}
      style={{ perspective: 800 }}
    >
      <div
        ref={innerRef}
        className="relative h-full"
        style={{
          transition: "transform 0.2s ease-out",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {children}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(211,140,55,0.2) 0%, transparent 60%)",
          }}
        />
      </div>
    </div>
  );
}
