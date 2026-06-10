# RentaWay Maroc 🚗

Plateforme de location de véhicules au Maroc — voitures, motos, bateaux et jet-skis. Modèle intermédiaire (Airbnb-like) mettant en relation agences de location et clients.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Base de données | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (credentials + Google OAuth) |
| Paiement | Stripe (test) + structure CMI |
| Fichiers | Cloudinary |
| Cartographie | Google Maps API |
| Notifications | Nodemailer (email) + Twilio (SMS, stub) |
| État global | Zustand |
| Déploiement | Docker + docker-compose |

---

## Prérequis

- Node.js 20+
- PostgreSQL 16+
- Comptes : Stripe (test), Cloudinary, Google Cloud (Maps + OAuth)

---

## Installation locale

### 1. Cloner et configurer les variables d'environnement

```bash
cp .env.example .env
# Remplir toutes les variables dans .env
```

### 2. Backend

```bash
cd backend
npm install

# Générer le client Prisma et créer la base
npx prisma generate
npx prisma db push

# Lancer en développement
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install

# Lancer en développement
npm run dev
```

Frontend : http://localhost:3000  
Backend API : http://localhost:4000

---

## Lancement avec Docker

```bash
# Copier et remplir le .env
cp .env.example .env

# Démarrer tous les services
docker-compose up -d

# Initialiser la base (première fois)
docker-compose exec backend npx prisma db push
```

---

## Structure du projet

```
/
├── frontend/               # Next.js 14 App Router
│   ├── app/
│   │   ├── (public)/       # Pages publiques (home, search, vehicle)
│   │   ├── (auth)/         # Login, Register
│   │   ├── booking/        # Tunnel de réservation + paiement
│   │   ├── dashboard/
│   │   │   ├── client/     # Dashboard client
│   │   │   ├── agency/     # Dashboard loueur
│   │   │   └── admin/      # Dashboard administrateur
│   │   └── api/            # Routes NextAuth
│   ├── components/
│   │   ├── ui/             # Button, Input, Card, Badge, Modal, StarRating
│   │   ├── layout/         # Navbar, Footer
│   │   ├── home/           # Sections de la homepage
│   │   ├── vehicle/        # VehicleCard, VehicleMap, VehicleDetail
│   │   ├── booking/        # BookingForm
│   │   └── search/         # SearchResults, SearchFilters
│   ├── lib/                # api.ts, auth.ts
│   ├── store/              # Zustand stores
│   └── types/              # TypeScript types
│
├── backend/                # Express API
│   ├── src/
│   │   ├── routes/         # auth, vehicles, reservations, payments...
│   │   ├── middleware/     # auth, upload, error
│   │   ├── services/       # cloudinary, email, pdf, sms, socket
│   │   └── lib/            # prisma client
│   └── prisma/
│       └── schema.prisma   # Schéma complet
│
└── docker-compose.yml
```

---

## Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| **CLIENT** | Recherche, réservation, paiement, messagerie, avis |
| **LOUEUR** | Gestion parc, réservations, calendrier, stats, messagerie |
| **ADMIN** | Validation agences, modération, litiges, KPIs, export CSV |

---

## Politique d'annulation

| Délai avant départ | Remboursement |
|-------------------|---------------|
| > 48h | 100% |
| 24 – 48h | 50% |
| < 24h | 0% |

---

## Commission plateforme

**15%** déduit automatiquement sur chaque réservation complétée.

---

## Variables d'environnement requises

Voir [.env.example](.env.example) pour la liste complète et documentée.

---

## Comptes de test

Après `npx prisma db seed` :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@moroccorentals.ma | Admin1234! | ADMIN |
| agence@test.ma | Agency1234! | LOUEUR |
| client@test.ma | Client1234! | CLIENT |
