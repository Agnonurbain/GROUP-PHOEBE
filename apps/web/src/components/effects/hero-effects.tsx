"use client";
import { type ReactNode } from "react";
import { SparkleHero } from "./sparkle-hero";
import { GoldTrail } from "./gold-trail";

export function HeroEffects({ children }: { children: ReactNode }) {
  return (
    <SparkleHero>
      <GoldTrail>{children}</GoldTrail>
    </SparkleHero>
  );
}
