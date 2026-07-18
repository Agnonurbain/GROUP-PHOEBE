"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type CartItem = {
  groupKey: string;
  marque: string;
  modele: string;
  categorie: string;
  prixJournalier: number;
  tauxCaution: number;
  chauffeurDisponible: boolean;
  avecChauffeur: boolean;
  quantite: number;
  maxDisponible: number;
  photoUrl: string | null;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "avecChauffeur">) => void;
  removeItem: (groupKey: string) => void;
  updateQuantity: (groupKey: string, qty: number) => void;
  toggleChauffeur: (groupKey: string) => void;
  clearCart: () => void;
  isInCart: (groupKey: string) => boolean;
  getQuantity: (groupKey: string) => number;
  count: number;
};

const STORAGE_KEY = "gp-cart";
const CART_VERSION = 2;

const CartContext = createContext<CartContextValue | null>(null);

type StoredCart = { v: number; items: CartItem[] };

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed && parsed.v === CART_VERSION && Array.isArray(parsed.items)) {
      return parsed.items;
    }
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    const data: StoredCart = { v: CART_VERSION, items };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded
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
      const existing = prev.find((i) => i.groupKey === item.groupKey);
      if (existing) {
        const newQty = Math.min(existing.quantite + item.quantite, item.maxDisponible);
        return prev.map((i) =>
          i.groupKey === item.groupKey ? { ...i, quantite: newQty, maxDisponible: item.maxDisponible } : i
        );
      }
      return [...prev, { ...item, avecChauffeur: false }];
    });
  }, []);

  const removeItem = useCallback((groupKey: string) => {
    setItems((prev) => prev.filter((i) => i.groupKey !== groupKey));
  }, []);

  const updateQuantity = useCallback((groupKey: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.groupKey === groupKey
          ? { ...i, quantite: Math.max(1, Math.min(qty, i.maxDisponible)) }
          : i
      )
    );
  }, []);

  const toggleChauffeur = useCallback((groupKey: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.groupKey === groupKey ? { ...i, avecChauffeur: !i.avecChauffeur } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback(
    (groupKey: string) => items.some((i) => i.groupKey === groupKey),
    [items]
  );

  const getQuantity = useCallback(
    (groupKey: string) => items.find((i) => i.groupKey === groupKey)?.quantite ?? 0,
    [items]
  );

  const count = items.reduce((s, i) => s + i.quantite, 0);

  return (
    <CartContext value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      toggleChauffeur,
      clearCart,
      isInCart,
      getQuantity,
      count,
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
