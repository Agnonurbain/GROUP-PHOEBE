'use client'

export default function DesignSystem() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans p-20">
      <h1 className="text-5xl font-bold text-[#F5F5F5] mb-16">GROUP PHOEBE — Design System</h1>

      {/* Typography */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-[#C9A84C] mb-8">Typography — Inter</h2>
        <div className="space-y-4">
          <p className="text-5xl font-bold text-[#F5F5F5]">H1 — Inter Bold 48px — Leader Excellence Brilliant</p>
          <p className="text-3xl font-semibold text-[#F5F5F5]">H2 — Inter SemiBold 36px — Notre Flotte de Véhicules</p>
          <p className="text-2xl font-semibold text-[#F5F5F5]">H3 — Inter SemiBold 24px — Toyota Prado V6</p>
          <p className="text-base text-[#8A8A8A]">Body — Inter Regular 16px — Découvrez nos véhicules d&apos;exception.</p>
          <p className="text-xs font-medium text-[#4A4A4A]">Caption — Inter Medium 12px — Métadonnées et labels</p>
        </div>
      </section>
    </div>
  )
}
