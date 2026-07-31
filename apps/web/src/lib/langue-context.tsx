"use client";

import { createContext, useContext } from "react";

interface LangueContextType {
  langue: string;
}

const LangueContext = createContext<LangueContextType>({ langue: "fr" });

export function LangueProvider({
  children,
  langue,
}: {
  children: React.ReactNode;
  langue: string;
}) {
  return (
    <LangueContext.Provider value={{ langue }}>
      {children}
    </LangueContext.Provider>
  );
}

export function useLangue() {
  return useContext(LangueContext);
}
