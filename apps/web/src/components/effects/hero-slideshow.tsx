"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const slides = [
  { src: "/images/hero-car.jpg", alt: "Flotte premium — Porsche Panamera" },
  { src: "/images/hero-chauffeur.jpg", alt: "Transport avec chauffeur — Rolls Royce" },
  { src: "/images/hero-livraison.jpg", alt: "Service de livraison de colis" },
  { src: "/images/hero-immobilier.jpg", alt: "Projets immobiliers premium" },
  { src: "/images/hero-voyages.jpg", alt: "Assistance voyages internationaux" },
  { src: "/images/hero-luxe.jpg", alt: "Véhicules de luxe" },
];

export function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const advance = useCallback(() => {
    setDirection((d) => -d);
    setCurrent((c) => (c + 1) % slides.length);
  }, []);

  useEffect(() => {
    const id = setInterval(advance, 6000);
    return () => clearInterval(id);
  }, [advance]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {slides.map((slide, i) => {
        const isActive = i === current;
        const dir = i % 2 === 0 ? 1 : -1;
        return (
          <div
            key={slide.src}
            className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
            style={{ opacity: isActive ? 1 : 0, zIndex: isActive ? 1 : 0 }}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="100vw"
              quality={80}
              priority={i === 0}
              className="object-cover"
              style={{
                animation: isActive
                  ? `ken-burns-${dir > 0 ? "in" : "out"} 8s ease-in-out forwards`
                  : "none",
              }}
            />
          </div>
        );
      })}
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
    </div>
  );
}
