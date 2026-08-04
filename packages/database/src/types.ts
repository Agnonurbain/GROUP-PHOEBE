export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      articles: {
        Row: {
          auteur: string | null
          categorie_id: string | null
          contenu: string
          created_at: string
          date_publication: string | null
          id: string
          image_couverture: string | null
          meta_description: string | null
          meta_title: string | null
          publie: boolean
          resume: string | null
          slug: string
          titre: string
          updated_at: string
        }
        Insert: {
          auteur?: string | null
          categorie_id?: string | null
          contenu: string
          created_at?: string
          date_publication?: string | null
          id?: string
          image_couverture?: string | null
          meta_description?: string | null
          meta_title?: string | null
          publie?: boolean
          resume?: string | null
          slug: string
          titre: string
          updated_at?: string
        }
        Update: {
          auteur?: string | null
          categorie_id?: string | null
          contenu?: string
          created_at?: string
          date_publication?: string | null
          id?: string
          image_couverture?: string | null
          meta_description?: string | null
          meta_title?: string | null
          publie?: boolean
          resume?: string | null
          slug?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories_article"
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
      avis: {
        Row: {
          client_id: string
          commentaire: string | null
          created_at: string
          id: string
          modere_at: string | null
          modere_par: string | null
          note: number
          reference_id: string
          reference_table: string
          reponse_admin: string | null
          statut: string
          titre: string | null
        }
        Insert: {
          client_id: string
          commentaire?: string | null
          created_at?: string
          id?: string
          modere_at?: string | null
          modere_par?: string | null
          note: number
          reference_id: string
          reference_table: string
          reponse_admin?: string | null
          statut?: string
          titre?: string | null
        }
        Update: {
          client_id?: string
          commentaire?: string | null
          created_at?: string
          id?: string
          modere_at?: string | null
          modere_par?: string | null
          note?: number
          reference_id?: string
          reference_table?: string
          reponse_admin?: string | null
          statut?: string
          titre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avis_modere_par_fkey"
            columns: ["modere_par"]
            isOneToOne: false
            referencedRelation: "users"
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
      categories_article: {
        Row: {
          created_at: string
          description: string | null
          id: string
          nom: string
          ordre: number
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          ordre?: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          ordre?: number
          slug?: string
        }
        Relationships: []
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
      coefficients_mode_livraison: {
        Row: {
          coefficient: number
          mode: string
          updated_at: string
        }
        Insert: {
          coefficient: number
          mode: string
          updated_at?: string
        }
        Update: {
          coefficient?: number
          mode?: string
          updated_at?: string
        }
        Relationships: []
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
          chauffeur_id: string | null
          client_id: string
          created_at: string
          date_debut: string
          date_fin: string | null
          frequence_facturation: string | null
          heure_debut: string | null
          heure_fin: string | null
          id: string
          jour_facturation: number
          jours_semaine: number[]
          montant_periodique: number | null
          statut: string
          updated_at: string
          vehicule_id: string | null
        }
        Insert: {
          categorie: string
          chauffeur_id?: string | null
          client_id: string
          created_at?: string
          date_debut: string
          date_fin?: string | null
          frequence_facturation?: string | null
          heure_debut?: string | null
          heure_fin?: string | null
          id?: string
          jour_facturation?: number
          jours_semaine?: number[]
          montant_periodique?: number | null
          statut?: string
          updated_at?: string
          vehicule_id?: string | null
        }
        Update: {
          categorie?: string
          chauffeur_id?: string | null
          client_id?: string
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          frequence_facturation?: string | null
          heure_debut?: string | null
          heure_fin?: string | null
          id?: string
          jour_facturation?: number
          jours_semaine?: number[]
          montant_periodique?: number | null
          statut?: string
          updated_at?: string
          vehicule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contrats_recurrents_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
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
      demandes_billet: {
        Row: {
          certificat_fievre_jaune: boolean
          certificat_fievre_jaune_url: string | null
          certificat_fievre_jaune_valide: boolean | null
          classe: string
          client_id: string
          conseiller_id: string | null
          created_at: string
          date_depart: string
          date_retour: string | null
          depart: string
          destination: string
          devis_valable_jusqu_a: string | null
          frais_service: number | null
          id: string
          message: string | null
          mineur_autorisation_parentale: boolean
          mineur_autorisation_url: string | null
          mineur_autorisation_verifie: boolean | null
          montant_propose: number | null
          nb_adultes: number
          nb_bebes: number
          nb_enfants: number
          passeport_expiration: string
          passeport_fichier: string | null
          passeport_nom: string
          passeport_numero: string
          statut: string
          type_trajet: string
          updated_at: string
        }
        Insert: {
          certificat_fievre_jaune?: boolean
          certificat_fievre_jaune_url?: string | null
          certificat_fievre_jaune_valide?: boolean | null
          classe?: string
          client_id: string
          conseiller_id?: string | null
          created_at?: string
          date_depart: string
          date_retour?: string | null
          depart: string
          destination: string
          devis_valable_jusqu_a?: string | null
          frais_service?: number | null
          id?: string
          message?: string | null
          mineur_autorisation_parentale?: boolean
          mineur_autorisation_url?: string | null
          mineur_autorisation_verifie?: boolean | null
          montant_propose?: number | null
          nb_adultes?: number
          nb_bebes?: number
          nb_enfants?: number
          passeport_expiration: string
          passeport_fichier?: string | null
          passeport_nom: string
          passeport_numero: string
          statut?: string
          type_trajet: string
          updated_at?: string
        }
        Update: {
          certificat_fievre_jaune?: boolean
          certificat_fievre_jaune_url?: string | null
          certificat_fievre_jaune_valide?: boolean | null
          classe?: string
          client_id?: string
          conseiller_id?: string | null
          created_at?: string
          date_depart?: string
          date_retour?: string | null
          depart?: string
          destination?: string
          devis_valable_jusqu_a?: string | null
          frais_service?: number | null
          id?: string
          message?: string | null
          mineur_autorisation_parentale?: boolean
          mineur_autorisation_url?: string | null
          mineur_autorisation_verifie?: boolean | null
          montant_propose?: number | null
          nb_adultes?: number
          nb_bebes?: number
          nb_enfants?: number
          passeport_expiration?: string
          passeport_fichier?: string | null
          passeport_nom?: string
          passeport_numero?: string
          statut?: string
          type_trajet?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandes_billet_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_billet_conseiller_id_fkey"
            columns: ["conseiller_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          date_souhaitee: string | null
          id: string
          location_debut: string | null
          location_duree_mois: number | null
          message: string | null
          montant_commission: number | null
          montant_contre_offre: number | null
          montant_convenu: number | null
          montant_offre: number | null
          statut: string
          taux_commission: number | null
          type: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          bien_id: string
          client_id: string
          created_at?: string
          date_souhaitee?: string | null
          id?: string
          location_debut?: string | null
          location_duree_mois?: number | null
          message?: string | null
          montant_commission?: number | null
          montant_contre_offre?: number | null
          montant_convenu?: number | null
          montant_offre?: number | null
          statut?: string
          taux_commission?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          bien_id?: string
          client_id?: string
          created_at?: string
          date_souhaitee?: string | null
          id?: string
          location_debut?: string | null
          location_duree_mois?: number | null
          message?: string | null
          montant_commission?: number | null
          montant_contre_offre?: number | null
          montant_convenu?: number | null
          montant_offre?: number | null
          statut?: string
          taux_commission?: number | null
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
          accepte_cgv: boolean
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
          periode: unknown
          prix_negocie: number | null
          statut: string
          type: string
          updated_at: string
          vehicule_id: string | null
          ville_depart: string | null
        }
        Insert: {
          accepte_cgv?: boolean
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
          periode?: unknown
          prix_negocie?: number | null
          statut?: string
          type: string
          updated_at?: string
          vehicule_id?: string | null
          ville_depart?: string | null
        }
        Update: {
          accepte_cgv?: boolean
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
          periode?: unknown
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
          periode: unknown
        }
        Insert: {
          chauffeur_id: string
          id?: string
          periode: unknown
        }
        Update: {
          chauffeur_id?: string
          id?: string
          periode?: unknown
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
          periode: unknown
          type: string
          vehicule_id: string
        }
        Insert: {
          id?: string
          periode: unknown
          type?: string
          vehicule_id: string
        }
        Update: {
          id?: string
          periode?: unknown
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
          commentaire: string | null
          created_at: string
          dossier_id: string
          id: string
          statut: string
          type_document: string
          updated_at: string
          url: string
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          dossier_id: string
          id?: string
          statut?: string
          type_document: string
          updated_at?: string
          url: string
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          dossier_id?: string
          id?: string
          statut?: string
          type_document?: string
          updated_at?: string
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
          montant_estime: number | null
          pays_cible: string
          prestation: string | null
          statut: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          conseiller_id?: string | null
          created_at?: string
          id?: string
          montant_estime?: number | null
          pays_cible: string
          prestation?: string | null
          statut?: string
          type: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          conseiller_id?: string | null
          created_at?: string
          id?: string
          montant_estime?: number | null
          pays_cible?: string
          prestation?: string | null
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
      echeances_contrat: {
        Row: {
          contrat_id: string
          created_at: string
          id: string
          montant: number
          paiement_id: string | null
          periode_debut: string
          periode_fin: string
          statut: string
          updated_at: string
        }
        Insert: {
          contrat_id: string
          created_at?: string
          id?: string
          montant: number
          paiement_id?: string | null
          periode_debut: string
          periode_fin: string
          statut?: string
          updated_at?: string
        }
        Update: {
          contrat_id?: string
          created_at?: string
          id?: string
          montant?: number
          paiement_id?: string | null
          periode_debut?: string
          periode_fin?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echeances_contrat_contrat_id_fkey"
            columns: ["contrat_id"]
            isOneToOne: false
            referencedRelation: "contrats_recurrents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echeances_contrat_paiement_id_fkey"
            columns: ["paiement_id"]
            isOneToOne: false
            referencedRelation: "paiements"
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
          commune_collecte: string | null
          commune_livraison: string | null
          created_at: string
          date_souhaitee: string | null
          destinataire_contact: string
          destinataire_nom: string
          dimensions: string | null
          echec_motif: string | null
          expediteur_contact: string
          expediteur_nom: string
          id: string
          indemnisation_montant: number | null
          livree_at: string | null
          livreur_id: string | null
          mode: string
          moyen: string | null
          nature_colis: string | null
          numero_suivi: string
          paiement_encaisse_at: string | null
          paiement_encaisse_par: string | null
          photos: string[]
          poids_kg: number | null
          preuve_chemin: string | null
          preuve_latitude: number | null
          preuve_longitude: number | null
          prix: number | null
          recu_par: string | null
          statut: string
          updated_at: string
          valeur_declaree: number | null
          zone: string
        }
        Insert: {
          adresse_collecte: string
          adresse_livraison: string
          client_id: string
          commune_collecte?: string | null
          commune_livraison?: string | null
          created_at?: string
          date_souhaitee?: string | null
          destinataire_contact: string
          destinataire_nom: string
          dimensions?: string | null
          echec_motif?: string | null
          expediteur_contact: string
          expediteur_nom: string
          id?: string
          indemnisation_montant?: number | null
          livree_at?: string | null
          livreur_id?: string | null
          mode: string
          moyen?: string | null
          nature_colis?: string | null
          numero_suivi: string
          paiement_encaisse_at?: string | null
          paiement_encaisse_par?: string | null
          photos?: string[]
          poids_kg?: number | null
          preuve_chemin?: string | null
          preuve_latitude?: number | null
          preuve_longitude?: number | null
          prix?: number | null
          recu_par?: string | null
          statut?: string
          updated_at?: string
          valeur_declaree?: number | null
          zone: string
        }
        Update: {
          adresse_collecte?: string
          adresse_livraison?: string
          client_id?: string
          commune_collecte?: string | null
          commune_livraison?: string | null
          created_at?: string
          date_souhaitee?: string | null
          destinataire_contact?: string
          destinataire_nom?: string
          dimensions?: string | null
          echec_motif?: string | null
          expediteur_contact?: string
          expediteur_nom?: string
          id?: string
          indemnisation_montant?: number | null
          livree_at?: string | null
          livreur_id?: string | null
          mode?: string
          moyen?: string | null
          nature_colis?: string | null
          numero_suivi?: string
          paiement_encaisse_at?: string | null
          paiement_encaisse_par?: string | null
          photos?: string[]
          poids_kg?: number | null
          preuve_chemin?: string | null
          preuve_latitude?: number | null
          preuve_longitude?: number | null
          prix?: number | null
          recu_par?: string | null
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
          {
            foreignKeyName: "expeditions_moyen_fkey"
            columns: ["moyen"]
            isOneToOne: false
            referencedRelation: "moyens_livraison"
            referencedColumns: ["cle"]
          },
          {
            foreignKeyName: "expeditions_paiement_encaisse_par_fkey"
            columns: ["paiement_encaisse_par"]
            isOneToOne: false
            referencedRelation: "livreurs"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          annulee: boolean
          client_id: string
          created_at: string
          devise: string
          id: string
          montant_ht: number
          montant_ttc: number
          numero: string
          paiement_id: string
          pdf_chemin: string | null
          reference_id: string
          reference_table: string
          taux_tva: number
        }
        Insert: {
          annulee?: boolean
          client_id: string
          created_at?: string
          devise?: string
          id?: string
          montant_ht: number
          montant_ttc: number
          numero: string
          paiement_id: string
          pdf_chemin?: string | null
          reference_id: string
          reference_table: string
          taux_tva?: number
        }
        Update: {
          annulee?: boolean
          client_id?: string
          created_at?: string
          devise?: string
          id?: string
          montant_ht?: number
          montant_ttc?: number
          numero?: string
          paiement_id?: string
          pdf_chemin?: string | null
          reference_id?: string
          reference_table?: string
          taux_tva?: number
        }
        Relationships: [
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_paiement_id_fkey"
            columns: ["paiement_id"]
            isOneToOne: false
            referencedRelation: "paiements"
            referencedColumns: ["id"]
          },
        ]
      }
      favoris: {
        Row: {
          bien_id: string | null
          created_at: string
          id: string
          user_id: string
          vehicule_id: string | null
        }
        Insert: {
          bien_id?: string | null
          created_at?: string
          id?: string
          user_id: string
          vehicule_id?: string | null
        }
        Update: {
          bien_id?: string | null
          created_at?: string
          id?: string
          user_id?: string
          vehicule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favoris_bien_id_fkey"
            columns: ["bien_id"]
            isOneToOne: false
            referencedRelation: "biens"
            referencedColumns: ["id"]
          },
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
      fermetures_agence: {
        Row: {
          created_at: string
          jour: string
          motif: string | null
        }
        Insert: {
          created_at?: string
          jour: string
          motif?: string | null
        }
        Update: {
          created_at?: string
          jour?: string
          motif?: string | null
        }
        Relationships: []
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
      langues: {
        Row: {
          actif: boolean
          code: string
          created_at: string
          defaut: boolean
          drapeau: string | null
          nom: string
          ordre: number
        }
        Insert: {
          actif?: boolean
          code: string
          created_at?: string
          defaut?: boolean
          drapeau?: string | null
          nom: string
          ordre?: number
        }
        Update: {
          actif?: boolean
          code?: string
          created_at?: string
          defaut?: boolean
          drapeau?: string | null
          nom?: string
          ordre?: number
        }
        Relationships: []
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
          charge_max_simultanee: number
          id: string
          user_id: string
          zone_couverture: string | null
        }
        Insert: {
          actif?: boolean
          charge_max_simultanee?: number
          id?: string
          user_id: string
          zone_couverture?: string | null
        }
        Update: {
          actif?: boolean
          charge_max_simultanee?: number
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
      messages_dossier: {
        Row: {
          auteur_id: string
          auteur_role: string
          created_at: string
          dossier_id: string
          id: string
          message: string
        }
        Insert: {
          auteur_id: string
          auteur_role: string
          created_at?: string
          dossier_id: string
          id?: string
          message: string
        }
        Update: {
          auteur_id?: string
          auteur_role?: string
          created_at?: string
          dossier_id?: string
          id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_dossier_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_dossier_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers_voyage"
            referencedColumns: ["id"]
          },
        ]
      }
      moyens_livraison: {
        Row: {
          actif: boolean
          charge_max_kg: number
          cle: string
          famille: string
          label: string
          ordre: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          charge_max_kg: number
          cle: string
          famille: string
          label: string
          ordre: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          charge_max_kg?: number
          cle?: string
          famille?: string
          label?: string
          ordre?: number
          updated_at?: string
        }
        Relationships: []
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
      pages_legales: {
        Row: {
          chapeau: string
          publie: boolean
          sections: Json
          slug: string
          titre: string
          updated_at: string
          updated_par: string | null
        }
        Insert: {
          chapeau?: string
          publie?: boolean
          sections?: Json
          slug: string
          titre: string
          updated_at?: string
          updated_par?: string | null
        }
        Update: {
          chapeau?: string
          publie?: boolean
          sections?: Json
          slug?: string
          titre?: string
          updated_at?: string
          updated_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_legales_updated_par_fkey"
            columns: ["updated_par"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements: {
        Row: {
          commande_id: string | null
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
          commande_id?: string | null
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
          commande_id?: string | null
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
      paniers: {
        Row: {
          client_id: string
          created_at: string
          items: Json
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          items?: Json
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          items?: Json
          updated_at?: string
        }
        Relationships: []
      }
      parametres_avis: {
        Row: {
          created_at: string
          delai_apres_terme_jours: number
          id: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          delai_apres_terme_jours?: number
          id?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          delai_apres_terme_jours?: number
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      parametres_billet: {
        Row: {
          delai_reponse_heures: number
          frais_service: number
          id: number
          max_voyageurs: number
          mois_validite_passeport: number
          updated_at: string
          validite_devis_heures: number
        }
        Insert: {
          delai_reponse_heures?: number
          frais_service?: number
          id?: number
          max_voyageurs?: number
          mois_validite_passeport?: number
          updated_at?: string
          validite_devis_heures?: number
        }
        Update: {
          delai_reponse_heures?: number
          frais_service?: number
          id?: number
          max_voyageurs?: number
          mois_validite_passeport?: number
          updated_at?: string
          validite_devis_heures?: number
        }
        Relationships: []
      }
      parametres_contact: {
        Row: {
          adresse: string | null
          email: string | null
          facebook: string | null
          horaires: string | null
          id: boolean
          instagram: string | null
          linkedin: string | null
          telephone: string | null
          tiktok: string | null
          updated_at: string
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          adresse?: string | null
          email?: string | null
          facebook?: string | null
          horaires?: string | null
          id?: boolean
          instagram?: string | null
          linkedin?: string | null
          telephone?: string | null
          tiktok?: string | null
          updated_at?: string
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          adresse?: string | null
          email?: string | null
          facebook?: string | null
          horaires?: string | null
          id?: boolean
          instagram?: string | null
          linkedin?: string | null
          telephone?: string | null
          tiktok?: string | null
          updated_at?: string
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      parametres_facturation: {
        Row: {
          created_at: string
          email_cc: string | null
          id: boolean
          numero_suivant: number
          prefixe_facture: string
          taux_tva: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_cc?: string | null
          id?: boolean
          numero_suivant?: number
          prefixe_facture?: string
          taux_tva?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_cc?: string | null
          id?: boolean
          numero_suivant?: number
          prefixe_facture?: string
          taux_tva?: number
          updated_at?: string
        }
        Relationships: []
      }
      parametres_immobilier: {
        Row: {
          frais_visite: number
          id: number
          max_offres_client: number
          taux_commission: number
          taux_max_reduction: number
          updated_at: string
        }
        Insert: {
          frais_visite?: number
          id?: number
          max_offres_client?: number
          taux_commission?: number
          taux_max_reduction?: number
          updated_at?: string
        }
        Update: {
          frais_visite?: number
          id?: number
          max_offres_client?: number
          taux_commission?: number
          taux_max_reduction?: number
          updated_at?: string
        }
        Relationships: []
      }
      parametres_livraison: {
        Row: {
          id: boolean
          indemnisation_active: boolean
          indemnisation_conditions: string
          indemnisation_plafond: number
          indemnisation_taux: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          indemnisation_active?: boolean
          indemnisation_conditions?: string
          indemnisation_plafond?: number
          indemnisation_taux?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          indemnisation_active?: boolean
          indemnisation_conditions?: string
          indemnisation_plafond?: number
          indemnisation_taux?: number
          updated_at?: string
        }
        Relationships: []
      }
      parametres_ouverture: {
        Row: {
          heure_fermeture: string
          heure_ouverture: string
          id: boolean
          jours_ouvres: number[]
          updated_at: string
        }
        Insert: {
          heure_fermeture?: string
          heure_ouverture?: string
          id?: boolean
          jours_ouvres?: number[]
          updated_at?: string
        }
        Update: {
          heure_fermeture?: string
          heure_ouverture?: string
          id?: boolean
          jours_ouvres?: number[]
          updated_at?: string
        }
        Relationships: []
      }
      parametres_rendez_vous: {
        Row: {
          capacite_par_creneau: number
          delai_min_heures: number
          duree_minutes: number
          horizon_jours: number
          id: boolean
          updated_at: string
        }
        Insert: {
          capacite_par_creneau?: number
          delai_min_heures?: number
          duree_minutes?: number
          horizon_jours?: number
          id?: boolean
          updated_at?: string
        }
        Update: {
          capacite_par_creneau?: number
          delai_min_heures?: number
          duree_minutes?: number
          horizon_jours?: number
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      parametres_transport: {
        Row: {
          delai_negociation_heures: number
          delai_negociation_ouvre: boolean
          delai_non_presentation_heures: number
          delai_non_presentation_ouvre: boolean
          delai_sans_reponse_heures: number
          delai_sans_reponse_ouvre: boolean
          id: boolean
          updated_at: string
        }
        Insert: {
          delai_negociation_heures?: number
          delai_negociation_ouvre?: boolean
          delai_non_presentation_heures?: number
          delai_non_presentation_ouvre?: boolean
          delai_sans_reponse_heures?: number
          delai_sans_reponse_ouvre?: boolean
          id?: boolean
          updated_at?: string
        }
        Update: {
          delai_negociation_heures?: number
          delai_negociation_ouvre?: boolean
          delai_non_presentation_heures?: number
          delai_non_presentation_ouvre?: boolean
          delai_sans_reponse_heures?: number
          delai_sans_reponse_ouvre?: boolean
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      passagers_billet: {
        Row: {
          created_at: string
          date_naissance: string | null
          demande_id: string
          id: string
          nom: string
          passeport_expiration: string
          passeport_fichier: string | null
          passeport_numero: string
          type: string | null
        }
        Insert: {
          created_at?: string
          date_naissance?: string | null
          demande_id: string
          id?: string
          nom: string
          passeport_expiration: string
          passeport_fichier?: string | null
          passeport_numero: string
          type?: string | null
        }
        Update: {
          created_at?: string
          date_naissance?: string | null
          demande_id?: string
          id?: string
          nom?: string
          passeport_expiration?: string
          passeport_fichier?: string | null
          passeport_numero?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passagers_billet_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes_billet"
            referencedColumns: ["id"]
          },
        ]
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
      propositions_zones_tarifaires: {
        Row: {
          champ: string
          commentaire: string | null
          created_at: string
          id: string
          operateur_id: string
          statut: string
          updated_at: string
          valeur_actuelle: string | null
          valeur_proposee: string
          zone_id: string
        }
        Insert: {
          champ: string
          commentaire?: string | null
          created_at?: string
          id?: string
          operateur_id: string
          statut?: string
          updated_at?: string
          valeur_actuelle?: string | null
          valeur_proposee: string
          zone_id: string
        }
        Update: {
          champ?: string
          commentaire?: string | null
          created_at?: string
          id?: string
          operateur_id?: string
          statut?: string
          updated_at?: string
          valeur_actuelle?: string | null
          valeur_proposee?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "propositions_zones_tarifaires_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propositions_zones_tarifaires_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_tarifaires"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription?: Json
          user_id?: string
        }
        Relationships: []
      }
      rendez_vous_dossier: {
        Row: {
          client_id: string
          created_at: string
          debut: string
          dossier_id: string
          fin: string
          id: string
          statut: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          debut: string
          dossier_id: string
          fin: string
          id?: string
          statut?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          debut?: string
          dossier_id?: string
          fin?: string
          id?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rendez_vous_dossier_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendez_vous_dossier_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers_voyage"
            referencedColumns: ["id"]
          },
        ]
      }
      tarifs_assistance: {
        Row: {
          id: string
          pays_slug: string
          prestation_key: string
          prix: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          pays_slug: string
          prestation_key: string
          prix?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          pays_slug?: string
          prestation_key?: string
          prix?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tarifs_livraison_moyen: {
        Row: {
          moyen: string
          prix: number
          updated_at: string
          zone: string
        }
        Insert: {
          moyen: string
          prix: number
          updated_at?: string
          zone: string
        }
        Update: {
          moyen?: string
          prix?: number
          updated_at?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarifs_livraison_moyen_moyen_fkey"
            columns: ["moyen"]
            isOneToOne: false
            referencedRelation: "moyens_livraison"
            referencedColumns: ["cle"]
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
          caution_base_fcfa: number | null
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
          caution_base_fcfa?: number | null
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
          caution_base_fcfa?: number | null
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
      webhook_idempotency: {
        Row: {
          idempotency_key: string
          processed_at: string
        }
        Insert: {
          idempotency_key: string
          processed_at?: string
        }
        Update: {
          idempotency_key?: string
          processed_at?: string
        }
        Relationships: []
      }
      zones_tarifaires: {
        Row: {
          caution_multiplicateur: number
          chauffeur_statut: string
          coefficient_majoration: number
          created_at: string
          description: string | null
          geojson: Json | null
          id: string
          km_inclus_par_jour: number
          nom: string
          ordre: number
          supplement_km_fcfa: number
          tarif_chauffeur_journalier: number
        }
        Insert: {
          caution_multiplicateur?: number
          chauffeur_statut?: string
          coefficient_majoration?: number
          created_at?: string
          description?: string | null
          geojson?: Json | null
          id?: string
          km_inclus_par_jour?: number
          nom: string
          ordre?: number
          supplement_km_fcfa?: number
          tarif_chauffeur_journalier?: number
        }
        Update: {
          caution_multiplicateur?: number
          chauffeur_statut?: string
          coefficient_majoration?: number
          created_at?: string
          description?: string | null
          geojson?: Json | null
          id?: string
          km_inclus_par_jour?: number
          nom?: string
          ordre?: number
          supplement_km_fcfa?: number
          tarif_chauffeur_journalier?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      avis_refus_motif: {
        Args: { p_reference_id: string; p_reference_table: string }
        Returns: string
      }
      expirer_demandes_sans_reponse: { Args: never; Returns: number }
      expirer_non_presentations: { Args: never; Returns: number }
      expirer_reservations_abandonnees: { Args: never; Returns: number }
      is_proprietaire: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      own_livreur_id: { Args: never; Returns: string }
      own_role: { Args: never; Returns: string }
      own_statut_verification: { Args: never; Returns: string }
      owns_paiement: { Args: { ref_id: string }; Returns: boolean }
      prochain_numero_facture: { Args: never; Returns: string }
      stored_role: { Args: { target: string }; Returns: string }
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

