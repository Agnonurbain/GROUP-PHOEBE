"use client";
import { useRef, useEffect, type ReactNode } from "react";

export function MagneticButton({
  children,
  className = "",
  strength = 0.25,
  radius = 120,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      el.style.transform =
        dist < radius
          ? `translate(${dx * strength}px, ${dy * strength}px)`
          : "translate(0, 0)";
    };

    document.addEventListener("pointermove", handler);
    return () => document.removeEventListener("pointermove", handler);
  }, [strength, radius]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        display: "inline-block",
        transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
