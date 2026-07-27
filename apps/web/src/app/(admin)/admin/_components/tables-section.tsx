"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin-ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin-ui/tabs"
import { DataTable } from "./data-table"
import { colonnesDemandes, type LigneDemande } from "./columns-demandes"
import { colonnesClients, type LigneClient } from "./columns-clients"

export function TablesSection({
  demandes,
  clients,
}: {
  demandes: LigneDemande[]
  clients: LigneClient[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Données récentes</CardTitle>
        <CardDescription>
          Les 50 derniers enregistrements. Triez, filtrez, ou ouvrez la fiche complète.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="demandes">
          <TabsList className="mb-4">
            <TabsTrigger value="demandes">Demandes ({demandes.length})</TabsTrigger>
            <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="demandes">
            <DataTable
              columns={colonnesDemandes}
              data={demandes}
              placeholderRecherche="Rechercher un client, un véhicule…"
              messageVide="Aucune demande sur la période."
            />
          </TabsContent>

          <TabsContent value="clients">
            <DataTable
              columns={colonnesClients}
              data={clients}
              placeholderRecherche="Rechercher un client…"
              messageVide="Aucun client enregistré."
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
