import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const hash = (pwd: string) => bcrypt.hash(pwd, 12);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@moroccorentals.ma" },
    update: {},
    create: {
      email: "admin@moroccorentals.ma",
      passwordHash: await hash("Admin1234!"),
      role: "ADMIN",
      firstName: "Admin",
      lastName: "Morocco",
      isVerified: true,
    },
  });

  // Agency user
  const agencyUser = await prisma.user.upsert({
    where: { email: "agence@test.ma" },
    update: {},
    create: {
      email: "agence@test.ma",
      passwordHash: await hash("Agency1234!"),
      role: "LOUEUR",
      firstName: "Hassan",
      lastName: "Bennani",
      phone: "+212661234567",
      isVerified: true,
      agency: {
        create: {
          name: "Auto Prestige Casablanca",
          registreCommerce: "RC123456",
          address: "45 Boulevard Mohammed V",
          city: "Casablanca",
          lat: 33.5731,
          lng: -7.5898,
          description: "Agence de location premium depuis 2010. Flotte de véhicules récents et bien entretenus.",
          isApproved: true,
          rating: 4.5,
          reviewCount: 28,
        },
      },
    },
    include: { agency: true },
  });

  // Client
  const client = await prisma.user.upsert({
    where: { email: "client@test.ma" },
    update: {},
    create: {
      email: "client@test.ma",
      passwordHash: await hash("Client1234!"),
      role: "CLIENT",
      firstName: "Youssef",
      lastName: "Alaoui",
      phone: "+212612345678",
      isVerified: true,
    },
  });

  const agency = agencyUser.agency!;

  // Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { id: "seed-vehicle-1" },
      update: {},
      create: {
        id: "seed-vehicle-1",
        agencyId: agency.id,
        category: "VOITURE",
        title: "Toyota Corolla 2022 — Automatique",
        description: "Véhicule confortable et économique, parfait pour les déplacements en ville et sur autoroute. Kilométrage illimité, assurance tous risques incluse.",
        images: [
          "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80",
        ],
        pricePerDay: 350,
        caution: 5000,
        city: "Casablanca",
        lat: 33.5731,
        lng: -7.5898,
        requiredLicense: "B",
        rating: 4.6,
        reviewCount: 12,
        specs: {
          marque: "Toyota", modele: "Corolla", annee: 2022,
          boite: "automatique", carburant: "Essence",
          climatisation: true, places: 5, gps: true, kilometrage: 45000,
        },
      },
    }),

    prisma.vehicle.upsert({
      where: { id: "seed-vehicle-2" },
      update: {},
      create: {
        id: "seed-vehicle-2",
        agencyId: agency.id,
        category: "VOITURE",
        title: "Dacia Duster 4x4 — Marrakech",
        description: "SUV robuste idéal pour les aventures dans l'Atlas et les pistes du désert. Traction 4x4, climatisation, GPS.",
        images: [
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
        ],
        pricePerDay: 450,
        caution: 6000,
        city: "Marrakech",
        lat: 31.6295,
        lng: -7.9811,
        requiredLicense: "B",
        rating: 4.8,
        reviewCount: 24,
        specs: {
          marque: "Dacia", modele: "Duster", annee: 2023,
          boite: "manuelle", carburant: "Diesel",
          climatisation: true, places: 5, gps: true,
        },
      },
    }),

    prisma.vehicle.upsert({
      where: { id: "seed-vehicle-3" },
      update: {},
      create: {
        id: "seed-vehicle-3",
        agencyId: agency.id,
        category: "MOTO",
        title: "Honda CB500F — Trail Agadir",
        description: "Moto trail polyvalente, parfaite pour explorer les routes côtières d'Agadir et ses environs.",
        images: [
          "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80",
        ],
        pricePerDay: 200,
        caution: 3000,
        city: "Agadir",
        lat: 30.4278,
        lng: -9.5981,
        requiredLicense: "A",
        rating: 4.4,
        reviewCount: 7,
        specs: {
          marque: "Honda", modele: "CB500F", cylindree: 500,
          typeMoto: "trail", casque: true,
        },
      },
    }),

    prisma.vehicle.upsert({
      where: { id: "seed-vehicle-4" },
      update: {},
      create: {
        id: "seed-vehicle-4",
        agencyId: agency.id,
        category: "JETSKI",
        title: "Yamaha WaveRunner FX — Tanger",
        description: "Jet-ski puissant pour sensations fortes sur la côte méditerranéenne de Tanger. Gilet de sauvetage et briefing sécurité inclus.",
        images: [
          "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
        ],
        pricePerDay: 800,
        pricePerHour: 150,
        caution: 4000,
        city: "Tanger",
        lat: 35.7595,
        lng: -5.8340,
        requiredLicense: "Permis bateau",
        rating: 4.9,
        reviewCount: 15,
        specs: {
          marque: "Yamaha", puissance: 250, capacitePersonnes: 3,
          ageMinimum: 18,
          equipements: ["Gilet de sauvetage", "Combinaison néoprène"],
          zoneNavigation: "Côte méditerranéenne de Tanger",
        },
      },
    }),
  ]);

  console.log(`✅ Created ${vehicles.length} vehicles`);
  console.log(`✅ Admin: admin@moroccorentals.ma`);
  console.log(`✅ Agency: agence@test.ma`);
  console.log(`✅ Client: client@test.ma`);
  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
