import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-phoebe-pearl px-4 py-12">
      <Link href="/" className="mb-8 text-2xl font-bold text-phoebe-anthracite">
        GROUP <span className="text-phoebe-green">PHOEBE</span>
      </Link>
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
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
