"use client";
import { useRef, useEffect, useState } from "react";

export function AnimatedCounter({
  target,
  duration = 2000,
  prefix = "",
  suffix = "",
  className = "",
}: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const val = Math.round(target * ease(progress));
      const formatted = val
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      setDisplay(`${prefix}${formatted}${suffix}`);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration, prefix, suffix]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {display}
    </span>
  );
}
