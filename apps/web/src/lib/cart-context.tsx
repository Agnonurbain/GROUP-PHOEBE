"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export type CartItem = {
  groupKey: string;
  marque: string;
  modele: string;
  categorie: string;
  prixJournalier: number;
  cautionBaseFcfa: number;
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
  loaded: boolean;
};

const STORAGE_KEY = "gp-cart";
const CART_VERSION = 3;

const CartContext = createContext<CartContextValue | null>(null);

type StoredCart = { v: number; items: CartItem[] };

function loadLocal(): CartItem[] {
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

function saveLocal(items: CartItem[]) {
  try {
    const data: StoredCart = { v: CART_VERSION, items };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded
  }
}

async function saveServer(items: CartItem[]) {
  try {
    const { loadServerCart, saveServerCart, clearServerCart } = await import("@/app/actions/cart");
    if (items.length === 0) {
      await clearServerCart();
    } else {
      const fd = new FormData();
      fd.set("items", JSON.stringify(items));
      await saveServerCart({}, fd);
    }
  } catch {
    // offline or not authenticated
  }
}

async function loadServer(): Promise<CartItem[] | null> {
  try {
    const { loadServerCart } = await import("@/app/actions/cart");
    return await loadServerCart();
  } catch {
    return null;
  }
}

function mergeCarts(local: CartItem[], server: CartItem[]): CartItem[] {
  if (server.length === 0) return local;
  if (local.length === 0) return server;

  const map = new Map<string, CartItem>();
  for (const item of [...server, ...local]) {
    const existing = map.get(item.groupKey);
    if (existing) {
      map.set(item.groupKey, {
        ...item,
        quantite: Math.min(item.quantite, item.maxDisponible),
      });
    } else {
      map.set(item.groupKey, item);
    }
  }
  return Array.from(map.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const local = loadLocal();

      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const isAuthed = !!sessionData?.session?.user;

      if (isAuthed) {
        const server = await loadServer();
        if (server !== null) {
          const merged = mergeCarts(local, server);
          if (!cancelled) {
            setItems(merged);
            saveLocal(merged);
            saveServer(merged);
          }
          return;
        }
      }

      if (!cancelled) {
        setItems(local);
      }
    }

    init().finally(() => {
      if (!cancelled) setLoaded(true);
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loaded) saveLocal(items);
  }, [items, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => saveServer(items), 500);
    return () => clearTimeout(timer);
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
      loaded,
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
