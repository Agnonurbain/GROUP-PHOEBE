import "./auth.css";
import Link from "next/link";
import Image from "next/image";
import { AuthHeader } from "./auth-header"
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      {/* `data-auth` délimite la zone où les jetons clairs hérités sont
          inversés en thème sombre, sans toucher au reste du site (voir
          auth.css). */}
      <div className="flex min-h-screen" data-auth>
        <AuthHeader />
        <div className="relative flex min-h-screen flex-1 flex-col bg-white lg:w-1/2">
          <div className="absolute right-4 top-4 z-10">
            <ThemeToggle />
          </div>

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
                className="mb-8 inline-flex items-center gap-1.5 text-sm text-phoebe-anthracite/70 transition-colors duration-200 hover:text-phoebe-green"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Retour à l&apos;accueil
              </Link>
              {children}
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
