"use client";
import { useRef, useCallback, useState } from "react";
import Image from "next/image";

export function ParallaxImage({
  src,
  alt,
  width,
  height,
  className = "",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ transform: "scale(1)", filter: "brightness(1)" });

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `scale(1.08) translate(${x * -15}px, ${y * -15}px)`,
      filter: `brightness(${1 + Math.abs(x) * 0.1})`,
    });
  }, []);

  const onLeave = useCallback(() => {
    setStyle({ transform: "scale(1)", filter: "brightness(1)" });
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`group relative cursor-pointer overflow-hidden ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-full w-full object-cover"
        style={{
          ...style,
          transition: "transform 0.4s ease-out, filter 0.4s ease-out",
          willChange: "transform",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}
