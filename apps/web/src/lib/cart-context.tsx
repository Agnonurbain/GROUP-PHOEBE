"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type CartItem = {
  vehiculeId: string;
  marque: string;
  modele: string;
  categorie: string;
  prixJournalier: number;
  tauxCaution: number;
  chauffeurDisponible: boolean;
  avecChauffeur: boolean;
  photoUrl: string | null;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "avecChauffeur">) => void;
  removeItem: (vehiculeId: string) => void;
  toggleChauffeur: (vehiculeId: string) => void;
  clearCart: () => void;
  isInCart: (vehiculeId: string) => boolean;
  count: number;
};

const STORAGE_KEY = "gp-cart";

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // quota exceeded — silent fail
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveCart(items);
  }, [items, loaded]);

  const addItem = useCallback((item: Omit<CartItem, "avecChauffeur">) => {
    setItems((prev) => {
      if (prev.some((i) => i.vehiculeId === item.vehiculeId)) return prev;
      return [...prev, { ...item, avecChauffeur: false }];
    });
  }, []);

  const removeItem = useCallback((vehiculeId: string) => {
    setItems((prev) => prev.filter((i) => i.vehiculeId !== vehiculeId));
  }, []);

  const toggleChauffeur = useCallback((vehiculeId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.vehiculeId === vehiculeId ? { ...i, avecChauffeur: !i.avecChauffeur } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback(
    (vehiculeId: string) => items.some((i) => i.vehiculeId === vehiculeId),
    [items]
  );

  return (
    <CartContext value={{
      items,
      addItem,
      removeItem,
      toggleChauffeur,
      clearCart,
      isInCart,
      count: items.length,
    }}>
      {children}
    </CartContext>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
