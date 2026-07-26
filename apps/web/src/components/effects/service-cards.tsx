"use client";
import { type ReactNode } from "react";
import { TiltCard } from "./tilt-card";
import { ScrollReveal } from "./scroll-reveal";

export function ServiceCard({
  children,
  index,
  className = "",
  maxTilt,
  tilt = true,
}: {
  children: ReactNode;
  index: number;
  className?: string;
  /** Rotation max en degrés. À baisser sur les blocs larges (lignes pleine largeur). */
  maxTilt?: number;
  /** `false` pour ne garder que l'éclat, sans inclinaison. */
  tilt?: boolean;
}) {
  return (
    <ScrollReveal variant="fade-up" delay={index * 0.1} className={className}>
      <TiltCard maxTilt={tilt ? maxTilt : 0}>{children}</TiltCard>
    </ScrollReveal>
  );
}
