const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function gtag(...args: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (typeof window !== "undefined" && typeof w.gtag === "function") {
    w.gtag(...args);
  }
}

export function trackPageView(path: string) {
  gtag("config", GA_ID, { page_path: path });
}

export function trackEvent(action: string, params?: Record<string, unknown>) {
  gtag("event", action, params);
}

export function trackPaiementInitie(methode: string, montant: number, devise: string) {
  trackEvent("paiement_initie", { methode, montant, devise });
}

export function trackPaiementConfirme(methode: string, montant: number, devise: string) {
  trackEvent("paiement_confirme", { methode, montant, devise });
}

export function trackReservation(type: string, vehiculeId?: string) {
  trackEvent("reservation", { type, vehicule_id: vehiculeId });
}

// Standard e-commerce events
export function trackViewItem(item: {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  currency: string;
  quantity?: number;
  item_brand?: string;
  item_variant?: string;
}) {
  trackEvent("view_item", {
    items: [item],
  });
}

export function trackAddToCart(item: {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  currency: string;
  quantity: number;
  item_brand?: string;
  item_variant?: string;
}) {
  trackEvent("add_to_cart", {
    currency: item.currency,
    value: item.price * item.quantity,
    items: [item],
  });
}

export function trackRemoveFromCart(item: {
  item_id: string;
  item_name: string;
}) {
  trackEvent("remove_from_cart", {
    items: [item],
  });
}

export function trackBeginCheckout(items: Array<{
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  currency: string;
  quantity: number;
  item_brand?: string;
  item_variant?: string;
}>, value: number, currency: string) {
  trackEvent("begin_checkout", {
    currency,
    value,
    items,
  });
}

export function trackPurchase(transaction: {
  transaction_id: string;
  value: number;
  currency: string;
  items: Array<{
    item_id: string;
    item_name: string;
    item_category?: string;
    price: number;
    quantity: number;
    item_brand?: string;
    item_variant?: string;
  }>;
  payment_type?: string;
}) {
  trackEvent("purchase", {
    transaction_id: transaction.transaction_id,
    value: transaction.value,
    currency: transaction.currency,
    items: transaction.items,
    payment_type: transaction.payment_type,
  });
}