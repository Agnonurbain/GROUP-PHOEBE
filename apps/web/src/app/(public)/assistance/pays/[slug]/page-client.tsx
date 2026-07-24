"use client"

import { useParams } from "next/navigation"
import { useActionState, useCallback, useMemo, useRef, useEffect, useState } from "react"
import { Badge, Button } from "@/components/ui"
import { BackLink } from "@/components/public/back-link"
import { CheckIcon } from "@/components/icons"
import { creerDossierVoyage, type AssistanceState } from "@/app/actions/assistance"

const countryData: Record<string, { name: string; flag: string; visa: string; delay: string; price: string; success: string }> = {
  italie: { name: "Italie", flag: "🇮🇹", visa: "Visa étudiant", delay: "30 jours", price: "150 000 FCFA", success: "92%" },
  chine: { name: "Chine", flag: "🇨🇳", visa: "Visa étudiant", delay: "45 jours", price: "150 000 FCFA", success: "88%" },
  grece: { name: "Grèce", flag: "🇬🇷", visa: "Visa tourisme", delay: "20 jours", price: "85 000 FCFA", success: "90%" },
  pologne: { name: "Pologne", flag: "🇵🇱", visa: "Visa tourisme", delay: "25 jours", price: "75 000 FCFA", success: "87%" },
  portugal: { name: "Portugal", flag: "🇵🇹", visa: "Visa tourisme", delay: "25 jours", price: "95 000 FCFA", success: "89%" },
  schengen: { name: "Schengen", flag: "🇪🇺", visa: "Visa tourisme", delay: "30 jours", price: "120 000 FCFA", success: "85%" },
}

function downloadChecklist(data: { name: string; visa: string; delay: string }) {
  const checklist = [
    "DOCUMENTS REQUIS POUR " + data.name.toUpperCase(),
    "",
    "☐ Passeport valide (6 mois après retour)",
    "☐ Photos d'identité (format passeport, fond blanc)",
    "☐ Attestation d'inscription / lettre d'admission",
    "☐ Justificatifs de ressources financières (3 derniers relevés)",
    "☐ Assurance médicale voyage",
    "☐ Lettre de motivation / projet d'études",
    "☐ Acte de naissance (copie intégrale ou extrait)",
    "☐ Casier judiciaire (bulletin n°3)",
    "☐ Réservation d'hébergement (hôtel / attestation logement)",
    "☐ Billets d'avion aller-retour (réservation)",
    "",
    "Type de visa : " + data.visa,
    "Délai estimé : " + data.delay,
    "",
    "GROUP PHOEBE — Assistance Voyages & Études",
  ].join("\n")
  const blob = new Blob([checklist], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `checklist-${data.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ /g, "-")}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function StepCard({ num, title, desc, index }: { num: string; title: string; desc: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold: 0.2 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`flex gap-4 transition-all duration-700 ${
        inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-all duration-500 ${
          inView ? "bg-accent-blue shadow-lg shadow-accent-blue/30 scale-100" : "bg-accent-blue/50 scale-90"
        }`}
      >
        {num}
      </div>
      <div>
        <h3 className="text-base font-semibold text-public-text">{title}</h3>
        <p className="text-sm text-public-text-muted">{desc}</p>
      </div>
    </div>
  )
}

export default function CountryDetail() {
  const params = useParams()
  const slug = params.slug as string
  const [state, formAction, pending] = useActionState<AssistanceState, FormData>(creerDossierVoyage, {})

  const data = useMemo(
    () => countryData[slug] || { name: slug, flag: "🌍", visa: "Visa", delay: "30 jours", price: "150 000 FCFA", success: "85%" },
    [slug],
  )

  const type = data.visa.toLowerCase().includes("étudiant") ? "etudes" : "tourisme_visa"

  const offers = [
    { name: "Service seul", price: "150 000 FCFA", features: ["Dossier complet", "Suivi standard", "Checklist PDF"], recommended: false },
    { name: "Service + Accompagnement", price: "175 000 FCFA", features: ["Dossier complet", "Suivi prioritaire", "Accompagnement personnel", "Préparation entretien"], recommended: true },
    { name: "Service + Rendez-vous Express", price: "200 000 FCFA", features: ["Dossier complet", "Rendez-vous express", "Accompagnement VIP", "Traduction documents"], recommended: false },
  ]

  const downloadCb = useCallback(() => downloadChecklist(data), [data])

  return (
    <>
      <nav className="flex items-center gap-3 px-6 pt-6 text-sm text-public-text-faint">
        <BackLink href="/assistance" label="Retour à l'assistance" />
        <span aria-hidden="true">·</span>
        <span>Accueil &gt; Assistance &gt; {data.name}</span>
      </nav>

      {state?.error && (
        <div className="mx-6 mt-4 rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-5 py-3 text-sm text-[#EF4444]">
          {state.error}
        </div>
      )}

      {/* Hero */}
      <section className="relative mx-6 mt-6 flex min-h-[280px] flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl text-center md:min-h-[320px]">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/40 via-accent-blue/20 to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.3),transparent_60%)]" />
        <div className="relative z-10 flex flex-col items-center gap-4 px-6">
          <span className="text-6xl md:text-7xl">{data.flag}</span>
          <h1 className="text-4xl font-bold text-white md:text-5xl">Étudier en {data.name}</h1>
          <p className="text-base text-white/80 md:text-lg">{data.visa} — Délai estimé : {data.delay}</p>
        </div>
      </section>

      <div className="grid gap-12 px-6 py-10 lg:grid-cols-5">
        <div className="lg:col-span-3">

          <div className="mt-8 grid grid-cols-4 gap-4">
            {[
              { label: "Délai", value: data.delay, color: "text-accent-blue" },
              { label: "Prix", value: data.price, color: "text-accent-gold" },
              { label: "Type", value: data.visa, color: "text-accent-blue" },
              { label: "Taux", value: `${data.success} succès`, color: "text-accent-green" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-public-border bg-public-bg-card p-4 text-center">
                <p className="text-sm text-[#6B7280]">{s.label}</p>
                <p className={`mt-1 text-sm font-bold md:text-base ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <h2 className="text-3xl font-semibold text-public-text">Documents requis</h2>
            <div className="mt-6 space-y-3">
              {["Passeport valide", "Photos d'identité", "Attestation d'inscription", "Justificatifs financiers", "Assurance médicale", "Lettre de motivation"].map((doc) => (
                <div key={doc} className="flex items-center gap-3 text-sm text-public-text">
                  <CheckIcon size={16} className="text-accent-blue" />
                  {doc}
                </div>
              ))}
            </div>
            <Button variant="text-link" className="mt-4 text-accent-blue" onClick={downloadCb}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger la checklist
            </Button>
          </div>

          <div className="mt-12">
            <h2 className="text-3xl font-semibold text-public-text">Processus</h2>
            <div className="mt-6 space-y-6">
              {[
                { num: "1", title: "Remplir le formulaire", desc: "Soumettez votre demande en ligne avec les documents requis." },
                { num: "2", title: "Rendez-vous à l'ambassade", desc: "Présentez-vous à l'ambassade pour l'entretien." },
                { num: "3", title: "Suivi du dossier", desc: "Nous assurons le suivi de votre dossier auprès des autorités." },
                { num: "4", title: "Obtention du visa", desc: "Récupérez votre visa et préparez votre départ !" },
              ].map((s, i) => (
                <StepCard key={s.num} num={s.num} title={s.title} desc={s.desc} index={i} />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-3xl font-semibold text-public-text">Nos offres</h2>
          <div className="mt-6 space-y-4">
            {offers.map((offer) => (
              <div key={offer.name} className={`relative rounded-2xl border p-6 transition-all ${offer.recommended ? "border-accent-gold bg-accent-gold/5" : "border-public-border bg-public-bg-card"}`}>
                {offer.recommended && (
                  <Badge variant="gold" className="absolute -top-2.5 right-4">Recommandé</Badge>
                )}
                <h3 className="text-base font-semibold text-public-text">{offer.name}</h3>
                <p className="mt-1 text-3xl font-bold text-accent-blue">{offer.price}</p>
                <ul className="mt-4 space-y-2">
                  {offer.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-public-text-muted">
                      <CheckIcon size={14} className="text-accent-green" />
                      {f}
                    </li>
                  ))}
                </ul>
                <form action={formAction}>
                  <input type="hidden" name="pays" value={data.name} />
                  <input type="hidden" name="type" value={type} />
                  <input type="hidden" name="offre" value={offer.name} />
                  <input type="hidden" name="methode_paiement" value="cinetpay" />
                  {offer.recommended ? (
                    <Button type="submit" variant="blue" size="sm" disabled={pending} className="mt-4 w-full">
                      {pending ? "Traitement..." : "Choisir cette offre"}
                    </Button>
                  ) : (
                    <Button type="submit" variant="default" size="sm" disabled={pending} className="mt-4 w-full border border-accent-blue text-accent-blue hover:bg-accent-blue/10">
                      {pending ? "Traitement..." : "Choisir cette offre"}
                    </Button>
                  )}
                </form>
              </div>
            ))}
          </div>
          <form action={formAction}>
            <input type="hidden" name="pays" value={data.name} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="offre" value="Service + Accompagnement" />
            <input type="hidden" name="methode_paiement" value="cinetpay" />
            <Button type="submit" variant="default" disabled={pending} className="mt-6 w-full bg-accent-blue text-white hover:bg-accent-blue-hover">
              {pending ? "Traitement..." : "Démarrer mon dossier"}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
