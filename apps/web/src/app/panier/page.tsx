import { Header } from "@/components/header";
import { BackLink } from "@/components/back-link";
import { PanierContent } from "./panier-content";

export const metadata = { title: "Mon panier" };

export default function PanierPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <BackLink href="/catalogue" label="Catalogue" />
        <h1 className="mb-6 mt-2 text-2xl font-bold text-phoebe-anthracite">
          Mon panier
        </h1>
        <PanierContent />
      </main>
    </>
  );
}
