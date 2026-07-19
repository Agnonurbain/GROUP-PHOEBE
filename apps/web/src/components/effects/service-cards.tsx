"use client";
import { type ReactNode } from "react";
import { TiltCard } from "./tilt-card";
import { ScrollReveal } from "./scroll-reveal";

export function ServiceCard({
  children,
  index,
}: {
  children: ReactNode;
  index: number;
}) {
  return (
    <ScrollReveal variant="fade-up" delay={index * 0.1}>
      <TiltCard>
        {children}
      </TiltCard>
    </ScrollReveal>
  );
}
