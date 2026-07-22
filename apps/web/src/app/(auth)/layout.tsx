import Link from "next/link";
import Image from "next/image";
import { AuthHeader } from "./auth-header"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AuthHeader />
      <div className="flex min-h-screen flex-1 flex-col bg-white lg:w-1/2">
        <div className="flex items-center justify-center border-b border-phoebe-pearl px-6 py-4 lg:hidden">
          <Image
            src="/logo.webp"
            alt="Group PHOEBE"
            width={240}
            height={96}
            className="h-20 w-auto object-contain"
            quality={85}
            priority
          />
        </div>
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
