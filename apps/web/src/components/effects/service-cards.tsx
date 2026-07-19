"use client";
import { type ReactNode } from "react";
import { TiltCard } from "./tilt-card";
import { ScrollReveal } from "./scroll-reveal";

export function ServiceCard({
  children,
  index,
  className = "",
}: {
  children: ReactNode;
  index: number;
  className?: string;
}) {
  return (
    <ScrollReveal variant="fade-up" delay={index * 0.1} className={className}>
      <TiltCard>
        {children}
      </TiltCard>
    </ScrollReveal>
  );
}
