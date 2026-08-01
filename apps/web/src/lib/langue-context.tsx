"use client";

import { createContext, useContext } from "react";
import { fr, dictionnaire, type Dictionnaire } from "@/lib/i18n";

interface LangueContextType {
  langue: string;
  t: Dictionnaire;
}

const LangueContext = createContext<LangueContextType>({ langue: "fr", t: fr });

export function LangueProvider({
  children,
  langue,
}: {
  children: React.ReactNode;
  langue: string;
}) {
  // Le dictionnaire est résolu ici plutôt que passé en prop : il est calculé au
  // rendu serveur du provider, donc jamais sérialisé deux fois, et un composant
  // client n'a rien à câbler pour y accéder.
  return (
    <LangueContext.Provider value={{ langue, t: dictionnaire(langue) }}>
      {children}
    </LangueContext.Provider>
  );
}

export function useLangue() {
  return useContext(LangueContext);
}

/** Raccourci client : `const t = useT()`. */
export function useT(): Dictionnaire {
  return useContext(LangueContext).t;
}
