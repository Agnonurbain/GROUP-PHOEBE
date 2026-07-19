import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel — hidden on mobile */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-hex-pattern lg:flex">
        {/* Decorative hexagons */}
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-phoebe-green/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-phoebe-gold/5 blur-3xl" />

        {/* Floating hex shapes */}
        <div className="absolute left-[15%] top-[20%] h-16 w-16 hex-clip bg-phoebe-green/10 animate-float" />
        <div className="absolute right-[20%] top-[35%] h-10 w-10 hex-clip bg-phoebe-gold/15 animate-float [animation-delay:1s]" />
        <div className="absolute left-[25%] bottom-[25%] h-12 w-12 hex-clip bg-phoebe-green/8 animate-float [animation-delay:2s]" />
        <div className="absolute right-[15%] bottom-[15%] h-8 w-8 hex-clip bg-phoebe-gold/10 animate-float [animation-delay:0.5s]" />

        {/* Brand content */}
        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          <svg width="64" height="64" viewBox="0 0 34 34" fill="none" aria-hidden="true" className="mb-6 drop-shadow-lg">
            <rect width="34" height="34" rx="8" fill="#22282B" />
            <path d="M9 24V10h5.5c1.6 0 2.85.4 3.75 1.2.9.8 1.35 1.9 1.35 3.3 0 1.4-.45 2.5-1.35 3.3-.9.8-2.15 1.2-3.75 1.2H12.2V24H9z" fill="#39A044" />
            <circle cx="23" cy="14" r="2.5" fill="#D38C37" />
          </svg>
          <h2 className="text-3xl font-bold text-white">
            GROUP <span className="text-phoebe-green">PHOEBE</span>
          </h2>
          <p className="mt-2 text-sm font-medium tracking-[0.15em] text-phoebe-gold">
            LEADER &middot; EXCELLENCE &middot; EFFICACITE
          </p>
          <div className="mt-8 h-px w-24 bg-gradient-to-r from-transparent via-phoebe-gold/40 to-transparent" />
          <p className="mt-8 max-w-xs text-sm leading-relaxed text-white/60">
            Votre plateforme premium de location et vente de vehicules en Cote d&apos;Ivoire.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex min-h-screen flex-1 flex-col bg-white lg:w-1/2">
        {/* Mobile brand header */}
        <div className="flex items-center justify-center gap-3 border-b border-phoebe-pearl px-6 py-5 lg:hidden">
          <svg width="30" height="30" viewBox="0 0 34 34" fill="none" aria-hidden="true">
            <rect width="34" height="34" rx="8" fill="#22282B" />
            <path d="M9 24V10h5.5c1.6 0 2.85.4 3.75 1.2.9.8 1.35 1.9 1.35 3.3 0 1.4-.45 2.5-1.35 3.3-.9.8-2.15 1.2-3.75 1.2H12.2V24H9z" fill="#39A044" />
            <circle cx="23" cy="14" r="2.5" fill="#D38C37" />
          </svg>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold text-phoebe-anthracite">
              GROUP <span className="text-phoebe-green">PHOEBE</span>
            </span>
            <span className="text-[8px] font-medium tracking-[0.1em] text-phoebe-gold">
              LEADER &middot; EXCELLENCE &middot; EFFICACITE
            </span>
          </div>
        </div>

        {/* Form area */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-1.5 text-sm text-phoebe-anthracite/50 transition-colors duration-200 hover:text-phoebe-green"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Retour a l&apos;accueil
            </Link>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
