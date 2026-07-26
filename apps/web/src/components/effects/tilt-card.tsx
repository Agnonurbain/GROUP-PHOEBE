"use client";
import { useRef, useCallback, type ReactNode } from "react";

/* Le tilt accompagne le curseur, il ne bascule pas la carte : maxTilt 12 donnait
   ±24° de rotation, beaucoup trop sur une ligne pleine largeur. L'éclat suit le
   pointeur — il dépendait de `group-hover` sans qu'aucun ancêtre ne porte la
   classe `group`, il ne s'affichait donc jamais. */

export function TiltCard({
  children,
  className = "",
  maxTilt = 4,
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  /** Rotation maximale en degrés sur chaque axe. */
  maxTilt?: number;
  glow?: boolean;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Tactile et stylet : pas de tilt (aucun survol réel, et ça parasite le scroll).
      if (e.pointerType !== "mouse") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      if (innerRef.current) {
        const rY = (x - 0.5) * maxTilt * 2;
        const rX = (0.5 - y) * maxTilt * 2;
        innerRef.current.style.transform = `perspective(1200px) rotateX(${rX}deg) rotateY(${rY}deg) scale3d(1.005,1.005,1.005)`;
      }
      // L'éclat suit le pointeur même quand le tilt est nul.
      if (glowRef.current) {
        glowRef.current.style.setProperty("--mx", `${x * 100}%`);
        glowRef.current.style.setProperty("--my", `${y * 100}%`);
        glowRef.current.style.opacity = "1";
      }
    },
    [maxTilt]
  );

  const onLeave = useCallback(() => {
    if (innerRef.current) {
      innerRef.current.style.transform =
        "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    }
    if (glowRef.current) glowRef.current.style.opacity = "0";
  }, []);

  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`relative ${className}`}
      style={{ perspective: 1200 }}
    >
      <div
        ref={innerRef}
        className="relative h-full"
        style={{
          // Retour plus lent que l'aller : le mouvement se pose au lieu de claquer.
          transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {children}
        {glow && (
          <div
            ref={glowRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 motion-reduce:hidden"
            style={{
              background:
                "radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgba(201,168,76,0.16) 0%, rgba(201,168,76,0.06) 35%, transparent 70%)",
            }}
          />
        )}
      </div>
    </div>
  );
}
