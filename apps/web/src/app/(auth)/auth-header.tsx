import Image from "next/image";

export function AuthHeader() {
  return (
    <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-hex-pattern lg:flex">
      <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-phoebe-green/5 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-phoebe-gold/5 blur-3xl" />

      <div className="absolute left-[15%] top-[20%] h-16 w-16 hex-clip bg-phoebe-green/10 animate-float" />
      <div className="absolute right-[20%] top-[35%] h-10 w-10 hex-clip bg-phoebe-gold/15 animate-float [animation-delay:1s]" />
      <div className="absolute left-[25%] bottom-[25%] h-12 w-12 hex-clip bg-phoebe-green/8 animate-float [animation-delay:2s]" />
      <div className="absolute right-[15%] bottom-[15%] h-8 w-8 hex-clip bg-phoebe-gold/10 animate-float [animation-delay:0.5s]" />

      <div className="relative z-10 flex flex-col items-center px-12 text-center">
        <Image
          src="/logo.webp"
          alt="Group PHOEBE"
          width={400}
          height={160}
          className="mb-6 h-44 w-auto object-contain drop-shadow-lg"
          quality={85}
          priority
        />
        <div className="mt-4 h-px w-24 bg-gradient-to-r from-transparent via-phoebe-gold/40 to-transparent" />
        <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/60">
          Votre plateforme premium de location et vente de vehicules en Cote d&apos;Ivoire.
        </p>
      </div>
    </div>
  );
}
