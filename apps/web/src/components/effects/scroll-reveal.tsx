"use client";
import { useRef, useEffect, useState, type ReactNode, type CSSProperties } from "react";

type Variant = "fade-up" | "scale-in" | "slide-left" | "slide-right";

const hiddenStyles: Record<Variant, CSSProperties> = {
  "fade-up": { opacity: 0, transform: "translateY(50px)" },
  "scale-in": { opacity: 0, transform: "scale(0.88)" },
  "slide-left": { opacity: 0, transform: "translateX(-60px)" },
  "slide-right": { opacity: 0, transform: "translateX(60px)" },
};

const visibleStyle: CSSProperties = { opacity: 1, transform: "none" };

export function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...(inView ? visibleStyle : hiddenStyles[variant]),
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

export function StaggerContainer({
  children,
  className = "",
  staggerMs = 100,
}: {
  children: ReactNode;
  className?: string;
  staggerMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={
        {
          "--stagger-ms": `${staggerMs}ms`,
        } as CSSProperties
      }
      data-in-view={inView || undefined}
    >
      {children}
    </div>
  );
}
