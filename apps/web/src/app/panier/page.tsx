import { Header } from "@/components/header";
import { BackLink } from "@/components/back-link";
import { ScrollReveal } from "@/components/effects";
import { PanierContent } from "./panier-content";

export const metadata = { title: "Mon panier" };

export default function PanierPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <BackLink href="/catalogue" label="Catalogue" />
        <ScrollReveal variant="fade-up">
          <div className="mb-8 mt-3 flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
              Mon panier
            </h1>
            <span className="h-6 w-px bg-phoebe-gold/30" />
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-phoebe-gold/70">
              Premium
            </span>
          </div>
        </ScrollReveal>
        <PanierContent />
      </main>
    </>
  );
}
