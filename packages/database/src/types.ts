export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agences: {
        Row: {
          created_at: string
          id: string
          nom: string
          ville: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nom?: string
          ville?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nom?: string
          ville?: string | null
        }
        Relationships: []
      }
      agents_immobiliers: {
        Row: {
          id: string
          user_id: string
          zone_couverture: string | null
        }
        Insert: {
          id?: string
          user_id: string
          zone_couverture?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          zone_couverture?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_immobiliers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          cible_id: string | null
          cible_table: string | null
          created_at: string
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          cible_id?: string | null
          cible_table?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          cible_id?: string | null
          cible_table?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      avis_transport: {
        Row: {
          commentaire: string | null
          created_at: string
          demande_id: string
          id: string
          note: number
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          demande_id: string
          id?: string
          note: number
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          demande_id?: string
          id?: string
          note?: number
        }
        Relationships: [
          {
            foreignKeyName: "avis_transport_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: true
            referencedRelation: "demandes_transport"
            referencedColumns: ["id"]
          },
        ]
      }
      bien_medias: {
        Row: {
          bien_id: string
          id: string
          ordre: number
          type: string
          url: string
        }
        Insert: {
          bien_id: string
          id?: string
          ordre?: number
          type: string
          url: string
        }
        Update: {
          bien_id?: string
          id?: string
          ordre?: number
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "bien_medias_bien_id_fkey"
            columns: ["bien_id"]
            isOneToOne: false
            referencedRelation: "biens"
            referencedColumns: ["id"]
          },
        ]
      }
      biens: {
        Row: {
          agent_id: string | null
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          localisation: string
          longitude: number | null
          nb_chambres: number | null
          prix: number
          statut: string
          surface_m2: number | null
          transaction: string
          type: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          localisation: string
          longitude?: number | null
          nb_chambres?: number | null
          prix: number
          statut?: string
          surface_m2?: number | null
          transaction: string
          type: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          localisation?: string
          longitude?: number | null
          nb_chambres?: number | null
          prix?: number
          statut?: string
          surface_m2?: number | null
          transaction?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "biens_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents_immobiliers"
            referencedColumns: ["id"]
          },
        ]
      }
      chauffeurs: {
        Row: {
          actif: boolean
          agence_id: string | null
          created_at: string
          id: string
          nom: string
          permis_professionnel_url: string | null
          telephone: string
        }
        Insert: {
          actif?: boolean
          agence_id?: string | null
          created_at?: string
          id?: string
          nom: string
          permis_professionnel_url?: string | null
          telephone: string
        }
        Update: {
          actif?: boolean
          agence_id?: string | null
          created_at?: string
          id?: string
          nom?: string
          permis_professionnel_url?: string | null
          telephone?: string
        }
        Relationships: [
          {
            foreignKeyName: "chauffeurs_agence_id_fkey"
            columns: ["agence_id"]
            isOneToOne: false
            referencedRelation: "agences"
            referencedColumns: ["id"]
          },
        ]
      }
      communes: {
        Row: {
          ajoutee_par_client: boolean
          created_at: string
          id: string
          nom: string
          zone_id: string
        }
        Insert: {
          ajoutee_par_client?: boolean
          created_at?: string
          id?: string
          nom: string
          zone_id: string
        }
        Update: {
          ajoutee_par_client?: boolean
          created_at?: string
          id?: string
          nom?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communes_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_tarifaires"
            referencedColumns: ["id"]
          },
        ]
      }
      conducteurs_secondaires: {
        Row: {
          created_at: string
          demande_transport_id: string
          id: string
          nom: string
          permis_conduire_url: string
          statut_verification: string
        }
        Insert: {
          created_at?: string
          demande_transport_id: string
          id?: string
          nom: string
          permis_conduire_url: string
          statut_verification?: string
        }
        Update: {
          created_at?: string
          demande_transport_id?: string
          id?: string
          nom?: string
          permis_conduire_url?: string
          statut_verification?: string
        }
        Relationships: [
          {
            foreignKeyName: "conducteurs_secondaires_demande_transport_id_fkey"
            columns: ["demande_transport_id"]
            isOneToOne: false
            referencedRelation: "demandes_transport"
            referencedColumns: ["id"]
          },
        ]
      }
      contrats_recurrents: {
        Row: {
          categorie: string
          client_id: string
          created_at: string
          date_debut: string
          date_fin: string | null
          frequence_facturation: string | null
          id: string
          montant_periodique: number | null
          statut: string
          vehicule_id: string | null
        }
        Insert: {
          categorie: string
          client_id: string
          created_at?: string
          date_debut: string
          date_fin?: string | null
          frequence_facturation?: string | null
          id?: string
          montant_periodique?: number | null
          statut?: string
          vehicule_id?: string | null
        }
        Update: {
          categorie?: string
          client_id?: string
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          frequence_facturation?: string | null
          id?: string
          montant_periodique?: number | null
          statut?: string
          vehicule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contrats_recurrents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrats_recurrents_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      demandes_immobilier: {
        Row: {
          agent_id: string | null
          bien_id: string
          client_id: string
          created_at: string
          id: string
          montant_offre: number | null
          statut: string
          type: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          bien_id: string
          client_id: string
          created_at?: string
          id?: string
          montant_offre?: number | null
          statut?: string
          type: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          bien_id?: string
          client_id?: string
          created_at?: string
          id?: string
          montant_offre?: number | null
          statut?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandes_immobilier_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents_immobiliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_immobilier_bien_id_fkey"
            columns: ["bien_id"]
            isOneToOne: false
            referencedRelation: "biens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_immobilier_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      demandes_transport: {
        Row: {
          avec_chauffeur: boolean
          carburant_depart: string | null
          carburant_retour: string | null
          categorie: string
          caution: number | null
          caution_retenue: number
          chauffeur_id: string | null
          client_id: string
          created_at: string
          destination: string | null
          devis_expire_at: string | null
          etat_lieux_depart_photos: string[] | null
          etat_lieux_retour_photos: string[] | null
          id: string
          kilometrage_depart: number | null
          kilometrage_retour: number | null
          methode_paiement: string | null
          montant: number | null
          negociation_note: string | null
          periode: string | null
          prix_negocie: number | null
          statut: string
          type: string
          updated_at: string
          vehicule_id: string | null
          ville_depart: string | null
        }
        Insert: {
          avec_chauffeur?: boolean
          carburant_depart?: string | null
          carburant_retour?: string | null
          categorie: string
          caution?: number | null
          caution_retenue?: number
          chauffeur_id?: string | null
          client_id: string
          created_at?: string
          destination?: string | null
          devis_expire_at?: string | null
          etat_lieux_depart_photos?: string[] | null
          etat_lieux_retour_photos?: string[] | null
          id?: string
          kilometrage_depart?: number | null
          kilometrage_retour?: number | null
          methode_paiement?: string | null
          montant?: number | null
          negociation_note?: string | null
          periode?: string | null
          prix_negocie?: number | null
          statut?: string
          type: string
          updated_at?: string
          vehicule_id?: string | null
          ville_depart?: string | null
        }
        Update: {
          avec_chauffeur?: boolean
          carburant_depart?: string | null
          carburant_retour?: string | null
          categorie?: string
          caution?: number | null
          caution_retenue?: number
          chauffeur_id?: string | null
          client_id?: string
          created_at?: string
          destination?: string | null
          devis_expire_at?: string | null
          etat_lieux_depart_photos?: string[] | null
          etat_lieux_retour_photos?: string[] | null
          id?: string
          kilometrage_depart?: number | null
          kilometrage_retour?: number | null
          methode_paiement?: string | null
          montant?: number | null
          negociation_note?: string | null
          periode?: string | null
          prix_negocie?: number | null
          statut?: string
          type?: string
          updated_at?: string
          vehicule_id?: string | null
          ville_depart?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demandes_transport_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_transport_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_transport_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      disponibilites_chauffeur: {
        Row: {
          chauffeur_id: string
          id: string
          periode: string | null
        }
        Insert: {
          chauffeur_id: string
          id?: string
          periode: string | null
        }
        Update: {
          chauffeur_id?: string
          id?: string
          periode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disponibilites_chauffeur_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
        ]
      }
      disponibilites_vehicule: {
        Row: {
          id: string
          periode: string | null
          type: string
          vehicule_id: string
        }
        Insert: {
          id?: string
          periode: string | null
          type?: string
          vehicule_id: string
        }
        Update: {
          id?: string
          periode?: string | null
          type?: string
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disponibilites_vehicule_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_dossier_voyage: {
        Row: {
          created_at: string
          dossier_id: string
          id: string
          statut: string
          type_document: string
          url: string
        }
        Insert: {
          created_at?: string
          dossier_id: string
          id?: string
          statut?: string
          type_document: string
          url: string
        }
        Update: {
          created_at?: string
          dossier_id?: string
          id?: string
          statut?: string
          type_document?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_dossier_voyage_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers_voyage"
            referencedColumns: ["id"]
          },
        ]
      }
      dossiers_voyage: {
        Row: {
          client_id: string
          conseiller_id: string | null
          created_at: string
          id: string
          pays_cible: string
          statut: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          conseiller_id?: string | null
          created_at?: string
          id?: string
          pays_cible: string
          statut?: string
          type: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          conseiller_id?: string | null
          created_at?: string
          id?: string
          pays_cible?: string
          statut?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_voyage_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_voyage_conseiller_id_fkey"
            columns: ["conseiller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expedition_statut_historique: {
        Row: {
          expedition_id: string
          horodatage: string
          id: string
          statut: string
        }
        Insert: {
          expedition_id: string
          horodatage?: string
          id?: string
          statut: string
        }
        Update: {
          expedition_id?: string
          horodatage?: string
          id?: string
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedition_statut_historique_expedition_id_fkey"
            columns: ["expedition_id"]
            isOneToOne: false
            referencedRelation: "expeditions"
            referencedColumns: ["id"]
          },
        ]
      }
      expeditions: {
        Row: {
          adresse_collecte: string
          adresse_livraison: string
          client_id: string
          created_at: string
          destinataire_contact: string
          destinataire_nom: string
          dimensions: string | null
          expediteur_contact: string
          expediteur_nom: string
          id: string
          livreur_id: string | null
          mode: string
          nature_colis: string | null
          numero_suivi: string
          poids_kg: number | null
          prix: number | null
          statut: string
          updated_at: string
          valeur_declaree: number | null
          zone: string
        }
        Insert: {
          adresse_collecte: string
          adresse_livraison: string
          client_id: string
          created_at?: string
          destinataire_contact: string
          destinataire_nom: string
          dimensions?: string | null
          expediteur_contact: string
          expediteur_nom: string
          id?: string
          livreur_id?: string | null
          mode: string
          nature_colis?: string | null
          numero_suivi: string
          poids_kg?: number | null
          prix?: number | null
          statut?: string
          updated_at?: string
          valeur_declaree?: number | null
          zone: string
        }
        Update: {
          adresse_collecte?: string
          adresse_livraison?: string
          client_id?: string
          created_at?: string
          destinataire_contact?: string
          destinataire_nom?: string
          dimensions?: string | null
          expediteur_contact?: string
          expediteur_nom?: string
          id?: string
          livreur_id?: string | null
          mode?: string
          nature_colis?: string | null
          numero_suivi?: string
          poids_kg?: number | null
          prix?: number | null
          statut?: string
          updated_at?: string
          valeur_declaree?: number | null
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "expeditions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expeditions_livreur_id_fkey"
            columns: ["livreur_id"]
            isOneToOne: false
            referencedRelation: "livreurs"
            referencedColumns: ["id"]
          },
        ]
      }
      favoris: {
        Row: {
          created_at: string
          id: string
          user_id: string
          vehicule_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          vehicule_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoris_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoris_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      intervalles_prix: {
        Row: {
          categorie_vehicule: string
          created_at: string
          id: string
          prix_max: number
          prix_min: number
          type: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          categorie_vehicule: string
          created_at?: string
          id?: string
          prix_max: number
          prix_min: number
          type: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          categorie_vehicule?: string
          created_at?: string
          id?: string
          prix_max?: number
          prix_min?: number
          type?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervalles_prix_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_tarifaires"
            referencedColumns: ["id"]
          },
        ]
      }
      lignes_demande: {
        Row: {
          avec_chauffeur: boolean
          caution_ligne: number | null
          chauffeur_id: string | null
          created_at: string
          demande_id: string
          id: string
          montant_ligne: number | null
          vehicule_id: string
        }
        Insert: {
          avec_chauffeur?: boolean
          caution_ligne?: number | null
          chauffeur_id?: string | null
          created_at?: string
          demande_id: string
          id?: string
          montant_ligne?: number | null
          vehicule_id: string
        }
        Update: {
          avec_chauffeur?: boolean
          caution_ligne?: number | null
          chauffeur_id?: string | null
          created_at?: string
          demande_id?: string
          id?: string
          montant_ligne?: number | null
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lignes_demande_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_demande_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes_transport"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lignes_demande_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      livreurs: {
        Row: {
          actif: boolean
          capacite_max_par_jour: number
          id: string
          user_id: string
          zone_couverture: string | null
        }
        Insert: {
          actif?: boolean
          capacite_max_par_jour?: number
          id?: string
          user_id: string
          zone_couverture?: string | null
        }
        Update: {
          actif?: boolean
          capacite_max_par_jour?: number
          id?: string
          user_id?: string
          zone_couverture?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "livreurs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_log: {
        Row: {
          canal: string
          contenu: string | null
          created_at: string
          evenement: string
          id: string
          statut_envoi: string
          user_id: string
        }
        Insert: {
          canal: string
          contenu?: string | null
          created_at?: string
          evenement: string
          id?: string
          statut_envoi?: string
          user_id: string
        }
        Update: {
          canal?: string
          contenu?: string | null
          created_at?: string
          evenement?: string
          id?: string
          statut_envoi?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements: {
        Row: {
          created_at: string
          id: string
          methode: string
          module: string
          montant: number
          reference_id: string
          reference_table: string
          statut: string
          type: string
          webhook_reference: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          methode: string
          module: string
          montant: number
          reference_id: string
          reference_table: string
          statut?: string
          type: string
          webhook_reference?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          methode?: string
          module?: string
          montant?: number
          reference_id?: string
          reference_table?: string
          statut?: string
          type?: string
          webhook_reference?: string | null
        }
        Relationships: []
      }
      propositions_prix: {
        Row: {
          champ: string
          commentaire: string | null
          created_at: string
          id: string
          operateur_id: string
          statut: string
          updated_at: string
          valeur_actuelle: number | null
          valeur_proposee: number
          vehicule_id: string
        }
        Insert: {
          champ: string
          commentaire?: string | null
          created_at?: string
          id?: string
          operateur_id: string
          statut?: string
          updated_at?: string
          valeur_actuelle?: number | null
          valeur_proposee: number
          vehicule_id: string
        }
        Update: {
          champ?: string
          commentaire?: string | null
          created_at?: string
          id?: string
          operateur_id?: string
          statut?: string
          updated_at?: string
          valeur_actuelle?: number | null
          valeur_proposee?: number
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "propositions_prix_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propositions_prix_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          agence_id: string | null
          created_at: string
          date_naissance: string | null
          email: string | null
          id: string
          motif_rejet: string | null
          nom: string
          permis_conduire_url: string | null
          piece_identite_url: string | null
          role: string
          statut_verification: string
          telephone: string | null
          updated_at: string
          verifie_par: string | null
        }
        Insert: {
          agence_id?: string | null
          created_at?: string
          date_naissance?: string | null
          email?: string | null
          id?: string
          motif_rejet?: string | null
          nom: string
          permis_conduire_url?: string | null
          piece_identite_url?: string | null
          role: string
          statut_verification?: string
          telephone?: string | null
          updated_at?: string
          verifie_par?: string | null
        }
        Update: {
          agence_id?: string | null
          created_at?: string
          date_naissance?: string | null
          email?: string | null
          id?: string
          motif_rejet?: string | null
          nom?: string
          permis_conduire_url?: string | null
          piece_identite_url?: string | null
          role?: string
          statut_verification?: string
          telephone?: string | null
          updated_at?: string
          verifie_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_agence_id_fkey"
            columns: ["agence_id"]
            isOneToOne: false
            referencedRelation: "agences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_verifie_par_fkey"
            columns: ["verifie_par"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicule_chauffeurs: {
        Row: {
          chauffeur_id: string
          id: string
          vehicule_id: string
        }
        Insert: {
          chauffeur_id: string
          id?: string
          vehicule_id: string
        }
        Update: {
          chauffeur_id?: string
          id?: string
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicule_chauffeurs_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicule_chauffeurs_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicule_photos: {
        Row: {
          id: string
          ordre: number
          url: string
          vehicule_id: string
        }
        Insert: {
          id?: string
          ordre?: number
          url: string
          vehicule_id: string
        }
        Update: {
          id?: string
          ordre?: number
          url?: string
          vehicule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicule_photos_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicules: {
        Row: {
          agence_id: string | null
          annee: number | null
          assurance_url: string | null
          boite: string | null
          camera_interieure: boolean
          carburant: string | null
          carte_grise_url: string | null
          categorie: string
          certificat_non_gage_url: string | null
          chauffeur_disponible: boolean
          climatisation: boolean
          created_at: string
          description: string | null
          etat: string
          gps: boolean
          id: string
          kilometrage: number | null
          latitude: number | null
          localisation: string | null
          longitude: number | null
          marque: string
          modele: string
          nb_places: number | null
          niveau_carburant: string | null
          prix_journalier: number | null
          prix_mensuel: number | null
          prix_vente: number | null
          statut: string
          taux_caution: number | null
          updated_at: string
        }
        Insert: {
          agence_id?: string | null
          annee?: number | null
          assurance_url?: string | null
          boite?: string | null
          camera_interieure?: boolean
          carburant?: string | null
          carte_grise_url?: string | null
          categorie: string
          certificat_non_gage_url?: string | null
          chauffeur_disponible?: boolean
          climatisation?: boolean
          created_at?: string
          description?: string | null
          etat?: string
          gps?: boolean
          id?: string
          kilometrage?: number | null
          latitude?: number | null
          localisation?: string | null
          longitude?: number | null
          marque: string
          modele: string
          nb_places?: number | null
          niveau_carburant?: string | null
          prix_journalier?: number | null
          prix_mensuel?: number | null
          prix_vente?: number | null
          statut?: string
          taux_caution?: number | null
          updated_at?: string
        }
        Update: {
          agence_id?: string | null
          annee?: number | null
          assurance_url?: string | null
          boite?: string | null
          camera_interieure?: boolean
          carburant?: string | null
          carte_grise_url?: string | null
          categorie?: string
          certificat_non_gage_url?: string | null
          chauffeur_disponible?: boolean
          climatisation?: boolean
          created_at?: string
          description?: string | null
          etat?: string
          gps?: boolean
          id?: string
          kilometrage?: number | null
          latitude?: number | null
          localisation?: string | null
          longitude?: number | null
          marque?: string
          modele?: string
          nb_places?: number | null
          niveau_carburant?: string | null
          prix_journalier?: number | null
          prix_mensuel?: number | null
          prix_vente?: number | null
          statut?: string
          taux_caution?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicules_agence_id_fkey"
            columns: ["agence_id"]
            isOneToOne: false
            referencedRelation: "agences"
            referencedColumns: ["id"]
          },
        ]
      }
      visites: {
        Row: {
          agent_id: string
          bien_id: string
          client_id: string
          created_at: string
          creneau: string
          id: string
          statut: string
        }
        Insert: {
          agent_id: string
          bien_id: string
          client_id: string
          created_at?: string
          creneau: string
          id?: string
          statut?: string
        }
        Update: {
          agent_id?: string
          bien_id?: string
          client_id?: string
          created_at?: string
          creneau?: string
          id?: string
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "visites_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents_immobiliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visites_bien_id_fkey"
            columns: ["bien_id"]
            isOneToOne: false
            referencedRelation: "biens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      zones_tarifaires: {
        Row: {
          created_at: string
          description: string | null
          id: string
          nom: string
          ordre: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          ordre?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          ordre?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expirer_demandes_sans_reponse: { Args: never; Returns: number }
      expirer_non_presentations: { Args: never; Returns: number }
      expirer_reservations_abandonnees: { Args: never; Returns: number }
      is_staff: { Args: never; Returns: boolean }
      own_role: { Args: never; Returns: string }
      own_statut_verification: { Args: never; Returns: string }
      sync_vehicule_chauffeurs: {
        Args: { p_chauffeur_ids: string[]; p_vehicule_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
