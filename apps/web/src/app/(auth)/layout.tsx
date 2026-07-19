import Link from "next/link";
import Image from "next/image";

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
          <Image
            src="/logo.png"
            alt="Group PHOEBE"
            width={320}
            height={128}
            className="mb-6 h-36 w-auto object-contain drop-shadow-lg"
            priority
          />
          <div className="mt-4 h-px w-24 bg-gradient-to-r from-transparent via-phoebe-gold/40 to-transparent" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/60">
            Votre plateforme premium de location et vente de vehicules en Cote d&apos;Ivoire.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex min-h-screen flex-1 flex-col bg-white lg:w-1/2">
        {/* Mobile brand header */}
        <div className="flex items-center justify-center border-b border-phoebe-pearl px-6 py-4 lg:hidden">
          <Image
            src="/logo.png"
            alt="Group PHOEBE"
            width={200}
            height={80}
            className="h-16 w-auto object-contain"
            priority
          />
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
