# Contraintes par statut d'authentification

> Ce fichier recense, pour chaque service de GROUP PHOEBE, ce qu'un client peut faire selon qu'il est connecté (auth) ou non.

---

## 🚗 TRANSPORT

| Action | Non connecté | Connecté |
|---|---|---|
| Parcourir le catalogue | ✅ Oui (filtres, pagination) | ✅ Oui |
| Voir fiche véhicule | ✅ Oui (photos, prix, tarifs zone) | ✅ Oui |
| Ajouter au panier | ✅ Oui (localStorage) | ✅ Oui (+ sync serveur) |
| Voir le panier | ✅ Oui | ✅ Oui |
| Accéder page paiement | ✅ Oui (voit le formulaire) | ✅ Oui |
| **Finaliser réservation** | ❌ Bloqué | ✅ Requis + vérification identité |
| **Checkout panier** | ❌ Bloqué | ✅ Requis + vérification identité |
| Favoris | ❌ | ✅ |

## 📦 LIVRAISON

| Action | Non connecté | Connecté |
|---|---|---|
| Page d'info livraison | ✅ Oui | ✅ Oui |
| Suivre un colis (`/suivi`) | ✅ Oui (par numéro de suivi) | ✅ Oui |
| **Commander** (`/livraison/commander`) | ❌ Redirigé vers connexion | ✅ |
| Voir historique livraisons | ❌ | ✅ (via `/compte/reservations`) |

## 🏠 IMMOBILIER

| Action | Non connecté | Connecté |
|---|---|---|
| Parcourir catalogue biens | ✅ Oui (filtres, photos, prix) | ✅ Oui |
| Voir détail d'un bien | ✅ Oui (caractéristiques complètes) | ✅ Oui |
| **Envoyer demande** (info/visite/offre) | ❌ UI désactivée → "Connectez-vous" | ✅ |

## 🌍 ASSISTANCE VOYAGES

| Action | Non connecté | Connecté |
|---|---|---|
| Page d'info assistance | ✅ Oui | ✅ Oui |
| Voir pays et prestations | ✅ Oui (prix, détails) | ✅ Oui |
| **Soumettre un dossier** | ❌ Bloqué | ✅ |

## 👤 COMPTE / PROFIL

| Action | Non connecté | Connecté |
|---|---|---|
| Profil (`/compte/profil`) | ❌ Affiche "Connectez-vous" | ✅ |
| Favoris (`/compte/favoris`) | ❌ Retourne page vide | ✅ |
| Réservations (`/compte/reservations`) | ❌ Affiche "Connectez-vous" | ✅ (tous services) |
| Vérification identité | ❌ | ✅ |

## 🛒 PANIER & PAIEMENT

| Action | Non connecté | Connecté |
|---|---|---|
| Ajouter/voir/modifier panier | ✅ Via localStorage | ✅ Via localStorage + sync BDD |
| Merge localStorage → serveur | N/A | ✅ Auto à la connexion |
| **Payer** | ❌ Bloqué | ✅ Requis + vérification identité |

---

## Points de blocage (logique)

Toutes les **Server Actions** (`app/actions/`) vérifient `supabase.auth.getClaims()`. Si `!user`, elles retournent une erreur du type `"Vous devez être connecté."`.

Les pages côté serveur qui nécessitent une session :
- **Redirigent** vers `/connexion?redirect=...` (`livraison/commander`)
- **Affichent un message** sans bloquer la navigation (`compte/profil`, `compte/reservations`, `immobilier/[id]`)

**Vérification identité** requise en plus de la connexion pour :
- Finaliser réservation transport (`statut_verification === "verifie"`)
- Checkout panier transport
