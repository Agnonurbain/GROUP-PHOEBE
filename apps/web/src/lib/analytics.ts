const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag(...args);
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
