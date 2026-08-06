"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useT } from "@/lib/langue-context";

/** Les images et les CLÉS de leurs libellés — invariantes, donc hors composant. */
const SOURCES = [
  { src: "/images/hero-car.webp", alt: "altFlottePremium", label: "slideLocationPremium" },
  { src: "/images/hero-chauffeur.webp", alt: "altTransportChauffeur", label: "slideTransportChauffeur" },
  { src: "/images/hero-livraison.webp", alt: "altLivraison", label: "slideLivraisonExpress" },
  { src: "/images/hero-immobilier.webp", alt: "altImmobilier", label: "slideImmobilier" },
  { src: "/images/hero-voyages.webp", alt: "altVoyages", label: "slideVisasEtudes" },
  { src: "/images/hero-luxe.webp", alt: "altLuxe", label: "slideVehiculesLuxe" },
  { src: "/images/hero-textile.webp", alt: "altTextile", label: "slideTextile" },
] as const;


export function HeroSlideshow() {
  const t = useT();

  // Seuls les LIBELLÉS viennent du dictionnaire ; les sources restent au
  // niveau du module. Tout mettre dans le composant rendait `SOURCES.length`
  // instable d'un rendu à l'autre, donc dépendance des `useCallback`.
  const slides = SOURCES.map((s) => ({
    src: s.src,
    alt: t.divers[s.alt],
    label: t.divers[s.label],
  }));

  const [current, setCurrent] = useState(0);

  /**
   * Les six diapositives sont superposées dans le viewport : même marquées
   * `lazy`, le navigateur les téléchargeait toutes au premier rendu — 390 Ko
   * pour une seule image visible.
   *
   * On ne monte donc que les diapositives atteintes, plus la suivante (préchargée
   * pendant l'affichage de la courante, ce qui évite tout scintillement).
   * Premier rendu : 2 images au lieu de 6.
   */
  // Fenêtre = diapositive courante + la suivante (préchargée). Élargie dans les
  // gestionnaires, jamais dans un effet : y poser un état déclenche des rendus
  // en cascade (règle react-hooks/set-state-in-effect).
  const [chargees, setChargees] = useState(2);

  const advance = useCallback(() => {
    setCurrent((c) => (c + 1) % SOURCES.length);
    setChargees((n) => Math.min(SOURCES.length, n + 1));
  }, []);

  const aller = useCallback((i: number) => {
    setCurrent(i);
    setChargees((n) => Math.max(n, Math.min(SOURCES.length, i + 2)));
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
        // Pas encore atteinte : rien dans le DOM, donc aucun téléchargement.
        if (i >= chargees) return null;
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
              loading={i === 0 ? undefined : "lazy"}
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
            onClick={() => aller(i)}
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
