import type { Metadata } from "next"
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Wallet,
  ClipboardList,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowUp,
  CircleAlert,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin-ui/card";
import { Button } from "@/components/admin-ui/button";
import { KpiCard } from "./_components/kpi-card";
import { RevenueAreaChart } from "./_components/revenue-area-chart";
import { ActiviteBarChart } from "./_components/activite-bar-chart";
import { TablesSection } from "./_components/tables-section";
import type { LigneDemande } from "./_components/columns-demandes";
import type { LigneClient } from "./_components/columns-clients";
import { serieParJour, evolution } from "./_lib/series";

export const metadata: Metadata = {
  title: "Tableau de bord — Administration",
  description: "Indicateurs, activité et données récentes du back-office GROUP PHOEBE.",
};

const PERIODE_LABELS: Record<number, string> = { 7: "7 jours", 30: "30 jours", 90: "90 jours" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();
  if (profile?.role !== "proprietaire") redirect("/admin/demandes");

  const { periode: rawPeriode } = await searchParams;
  const periodeJours = rawPeriode === "7" ? 7 : rawPeriode === "90" ? 90 : 30;
  const periodeLabel = PERIODE_LABELS[periodeJours];

  const now = new Date();
  const ilXj = new Date(now.getTime() - periodeJours * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalDemandes30j },
    { count: acceptees30j },
    { count: terminees30j },
    { count: totalClients },
    { count: clientsVerifies },
    { data: demandes30j },
    { count: enAttenteCount },
    { data: demandesCA },
    { data: demandesPeriode },
    { count: propositionsEnAttente },
    { count: remboursementsEnAttente },
    { data: dernieresDemandes },
    { data: derniersClients },
  ] = await Promise.all([
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .gte("created_at", ilXj),
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("statut", "acceptee")
      .gte("created_at", ilXj),
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("statut", "terminee")
      .gte("created_at", ilXj),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "client"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "client")
      .eq("statut_verification", "verifie"),
    supabase
      .from("demandes_transport")
      .select("created_at, updated_at, statut, vehicule_id")
      .in("statut", ["acceptee", "terminee"])
      .gte("created_at", ilXj),
    supabase
      .from("demandes_transport")
      .select("id", { count: "exact", head: true })
      .eq("statut", "en_attente_validation"),
    // `created_at` en plus du montant : sans lui, pas de série temporelle du CA.
    supabase
      .from("demandes_transport")
      .select("created_at, montant")
      .in("statut", ["acceptee", "terminee"])
      .gte("created_at", ilXj),
    // Toutes les demandes de la période — le graphique d'activité compte aussi
    // celles qui n'ont pas abouti.
    supabase
      .from("demandes_transport")
      .select("created_at")
      .gte("created_at", ilXj),
    supabase
      .from("propositions_prix")
      .select("id", { count: "exact", head: true })
      .eq("statut", "en_attente"),
    supabase
      .from("paiements")
      .select("id", { count: "exact", head: true })
      .eq("statut", "remboursement_requis"),
    supabase
      .from("demandes_transport")
      .select("id, created_at, statut, montant, client_id, vehicule_id")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("users")
      .select("id, created_at, nom, telephone, statut_verification")
      .eq("role", "client")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const caBrut = (demandesCA ?? []).reduce((sum, d) => sum + (Number(d.montant) || 0), 0);
  const alertEnAttente = enAttenteCount ?? 0;

  const total = totalDemandes30j ?? 0;
  const convertis = (acceptees30j ?? 0) + (terminees30j ?? 0);
  const tauxConversion = total > 0 ? Math.round((convertis / total) * 100) : 0;
  const tauxVerification =
    (totalClients ?? 0) > 0
      ? Math.round(((clientsVerifies ?? 0) / (totalClients ?? 1)) * 100)
      : 0;

  let delaiMoyenH = 0;
  if (demandes30j && demandes30j.length > 0) {
    const delais = demandes30j.map(
      (d) => (new Date(d.updated_at).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60)
    );
    delaiMoyenH = Math.round((delais.reduce((a, b) => a + b, 0) / delais.length) * 10) / 10;
  }

  // Séries des graphiques (module pur, testé).
  const serieCa = serieParJour(demandesCA, periodeJours, (d) => Number(d.montant) || 0, now);
  const serieActivite = serieParJour(demandesPeriode, periodeJours, undefined, now);
  const evolCa = evolution(serieCa);
  const evolActivite = evolution(serieActivite);

  // Top véhicules (conservé du tableau de bord précédent).
  const vehiculeCounts: Record<string, number> = {};
  for (const d of demandes30j ?? []) {
    if (d.vehicule_id) vehiculeCounts[d.vehicule_id] = (vehiculeCounts[d.vehicule_id] ?? 0) + 1;
  }
  const topVehiculeIds = Object.entries(vehiculeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Résolution des libellés client/véhicule pour la table (deux requêtes plutôt
  // qu'une jointure : même approche que les autres écrans admin).
  const clientIds = [...new Set((dernieresDemandes ?? []).map((d) => d.client_id).filter(Boolean))];
  const vehiculeIds = [
    ...new Set([
      ...(dernieresDemandes ?? []).map((d) => d.vehicule_id).filter(Boolean),
      ...topVehiculeIds.map(([id]) => id),
    ]),
  ];

  const [{ data: usersTable }, { data: vehiculesTable }] = await Promise.all([
    clientIds.length
      ? supabase.from("users").select("id, nom").in("id", clientIds as string[])
      : Promise.resolve({ data: [] as { id: string; nom: string }[] }),
    vehiculeIds.length
      ? supabase.from("vehicules").select("id, marque, modele").in("id", vehiculeIds as string[])
      : Promise.resolve({ data: [] as { id: string; marque: string; modele: string }[] }),
  ]);

  const nomParClient = new Map((usersTable ?? []).map((u) => [u.id, u.nom]));
  const labelParVehicule = new Map(
    (vehiculesTable ?? []).map((v) => [v.id, `${v.marque} ${v.modele}`])
  );

  const topVehicules = topVehiculeIds.map(([id, count]) => ({
    id,
    label: labelParVehicule.get(id) ?? "—",
    count,
  }));

  const lignesDemandes: LigneDemande[] = (dernieresDemandes ?? []).map((d) => ({
    id: d.id,
    created_at: d.created_at,
    statut: d.statut,
    montant: d.montant == null ? null : Number(d.montant),
    client: nomParClient.get(d.client_id) ?? "—",
    vehicule: d.vehicule_id ? labelParVehicule.get(d.vehicule_id) ?? "—" : "—",
  }));

  const lignesClients: LigneClient[] = (derniersClients ?? []).map((c) => ({
    id: c.id,
    created_at: c.created_at,
    nom: c.nom ?? "—",
    telephone: c.telephone ?? null,
    statut_verification: c.statut_verification,
  }));

  const alertes = [
    alertEnAttente > 0 && {
      cle: "demandes",
      icone: AlertTriangle,
      texte: `${alertEnAttente} demande${alertEnAttente > 1 ? "s" : ""} en attente de validation`,
      href: "/admin/demandes",
      classe: "border-phoebe-gold/30 bg-phoebe-gold/5 text-phoebe-gold-dark",
    },
    (propositionsEnAttente ?? 0) > 0 && {
      cle: "propositions",
      icone: ArrowUp,
      texte: `${propositionsEnAttente} proposition${(propositionsEnAttente ?? 0) > 1 ? "s" : ""} de prix à valider`,
      href: "/admin/propositions",
      classe: "border-phoebe-green/30 bg-phoebe-green/5 text-phoebe-green-deep",
    },
    (remboursementsEnAttente ?? 0) > 0 && {
      cle: "remboursements",
      icone: CircleAlert,
      texte: `${remboursementsEnAttente} remboursement${(remboursementsEnAttente ?? 0) > 1 ? "s" : ""} en attente`,
      href: "/admin/remboursements",
      classe: "border-error/20 bg-error/5 text-error",
    },
  ].filter(Boolean) as {
    cle: string;
    icone: typeof AlertTriangle;
    texte: string;
    href: string;
    classe: string;
  }[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            Activité transport sur {periodeLabel}
          </p>
        </div>
        <div className="flex gap-1.5">
          {[7, 30, 90].map((p) => (
            <Button
              key={p}
              size="sm"
              variant={periodeJours === p ? "default" : "outline"}
              render={<Link href={`/admin?periode=${p}`} />}
            >
              {PERIODE_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {alertes.length > 0 && (
        <div className="space-y-2">
          {alertes.map((a) => (
            <div
              key={a.cle}
              className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5 ${a.classe}`}
            >
              <a.icone className="size-4 shrink-0" aria-hidden="true" />
              <p className="text-sm font-medium">{a.texte}</p>
              <Link href={a.href} className="ml-auto text-xs font-semibold hover:underline">
                Voir
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Chiffre d'affaires"
          valeur={caBrut.toLocaleString("fr-FR")}
          unite="FCFA"
          icon={Wallet}
          evolution={evolCa}
          aide={`sur ${periodeLabel}`}
        />
        <KpiCard
          label="Demandes"
          valeur={total}
          icon={ClipboardList}
          evolution={evolActivite}
          aide={`sur ${periodeLabel}`}
        />
        <KpiCard
          label="Taux de conversion"
          valeur={tauxConversion}
          unite="%"
          icon={TrendingUp}
          aide="acceptées ou terminées"
        />
        <KpiCard
          label="Délai moyen"
          valeur={delaiMoyenH}
          unite="h"
          icon={Clock}
          hausseEstBonne={false}
          aide="création → 1re action"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueAreaChart data={serieCa} total={caBrut} periodeLabel={periodeLabel} />
        <ActiviteBarChart data={serieActivite} total={total} periodeLabel={periodeLabel} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top véhicules</CardTitle>
            <CardDescription>Les plus demandés sur {periodeLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            {topVehicules.length > 0 ? (
              <ul className="divide-y divide-border">
                {topVehicules.map((v, i) => (
                  <li key={v.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-5 text-sm font-semibold tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-foreground">{v.label}</span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {v.count} demande{v.count > 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune demande aboutie sur la période.
              </p>
            )}
          </CardContent>
        </Card>

        <KpiCard
          label="Vérification d'identité"
          valeur={tauxVerification}
          unite="%"
          icon={ShieldCheck}
          aide={`${clientsVerifies ?? 0} / ${totalClients ?? 0} clients`}
        />
      </div>

      <TablesSection demandes={lignesDemandes} clients={lignesClients} />
    </div>
  );
}
