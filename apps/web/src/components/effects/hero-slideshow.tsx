"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const slides = [
  { src: "/images/hero-car.webp", alt: "Flotte premium — Porsche Panamera", label: "Location de véhicules premium" },
  { src: "/images/hero-chauffeur.webp", alt: "Transport avec chauffeur — Rolls Royce", label: "Transport avec chauffeur" },
  { src: "/images/hero-livraison.webp", alt: "Service de livraison de colis", label: "Livraison de colis express" },
  { src: "/images/hero-immobilier.webp", alt: "Projets immobiliers premium", label: "Immobilier — achat, vente, location" },
  { src: "/images/hero-voyages.webp", alt: "Assistance migration, visa et étude", label: "Visas, études & voyages" },
  { src: "/images/hero-luxe.webp", alt: "Véhicules de luxe", label: "Véhicules de luxe" },
];

export function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  const advance = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, []);

  // Redémarre le minuteur après une sélection manuelle (dépendance sur current)
  useEffect(() => {
    const id = setInterval(advance, 6000);
    return () => clearInterval(id);
  }, [advance, current]);

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
              className="object-cover brightness-[0.6]"
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
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/70 via-black/50 to-black/75" />
      {/* Vignette centrale : assombrit derrière le logo, la phrase et les boutons */}
      <div className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_55%_60%_at_center,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.25)_55%,transparent_100%)]" />

      {/* Légende du service affiché */}
      <div className="absolute bottom-8 left-6 z-[3] hidden sm:block">
        <p
          key={current}
          className="animate-fade-in flex items-center gap-2.5 text-sm font-medium text-white/90"
        >
          <span aria-hidden="true" className="h-px w-8 bg-accent-gold" />
          {slides[current].label}
        </p>
      </div>

      {/* Points de navigation */}
      <div className="absolute bottom-8 right-6 z-[3] flex items-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Afficher : ${slide.label}`}
            aria-current={i === current}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 bg-accent-gold"
                : "w-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
