import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-gradient-to-b from-phoebe-pearl to-white px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
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
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-phoebe-pearl bg-white p-8 shadow-lg shadow-phoebe-anthracite/5">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-phoebe-anthracite/60 transition-colors hover:text-phoebe-green"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Retour
        </Link>
        {children}
      </div>
    </div>
  );
}
