/**
 * Crée 3 comptes de test pour la démo et le développement local :
 *  - admin@rentaway.ma   / Admin2026!   (ADMIN)
 *  - loueur@rentaway.ma  / Loueur2026!  (LOUEUR + agence "RentaWay Test Agency" Casablanca, isApproved=true)
 *  - client@rentaway.ma  / Client2026!  (CLIENT)
 *
 * Idempotent : si un compte existe déjà, le mot de passe est ré-haché et l'utilisateur
 * est garanti d'être dans le bon état (role, isVerified, agence approuvée).
 *
 * Usage : npm run create:accounts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type Account = {
  email: string;
  password: string;
  role: "ADMIN" | "LOUEUR" | "CLIENT";
  firstName: string;
  lastName: string;
  phone: string;
  agency?: {
    name: string;
    city: string;
    address: string;
    registreCommerce: string;
    lat: number;
    lng: number;
  };
};

const ACCOUNTS: Account[] = [
  {
    email: "admin@rentaway.ma",
    password: "Admin2026!",
    role: "ADMIN",
    firstName: "Admin",
    lastName: "RentaWay",
    phone: "+212 600 000 001",
  },
  {
    email: "loueur@rentaway.ma",
    password: "Loueur2026!",
    role: "LOUEUR",
    firstName: "Loueur",
    lastName: "Test",
    phone: "+212 600 000 002",
    agency: {
      name: "RentaWay Test Agency",
      city: "Casablanca",
      address: "Boulevard Mohammed V",
      registreCommerce: "RC-TEST-RW-001",
      lat: 33.5731,
      lng: -7.5898,
    },
  },
  {
    email: "client@rentaway.ma",
    password: "Client2026!",
    role: "CLIENT",
    firstName: "Client",
    lastName: "Test",
    phone: "+212 600 000 003",
  },
];

async function upsertAccount(acc: Account): Promise<void> {
  const passwordHash = await bcrypt.hash(acc.password, 10);

  const existing = await prisma.user.findUnique({
    where: { email: acc.email },
    include: { agency: true },
  });

  if (existing) {
    // Mise à jour : rehasher le mot de passe + garantir le rôle
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        role: acc.role,
        firstName: acc.firstName,
        lastName: acc.lastName,
        phone: acc.phone,
        isVerified: true,
        isBlacklisted: false,
      },
    });

    if (acc.agency) {
      if (existing.agency) {
        await prisma.agency.update({
          where: { id: existing.agency.id },
          data: {
            name: acc.agency.name,
            city: acc.agency.city,
            address: acc.agency.address,
            registreCommerce: acc.agency.registreCommerce,
            lat: acc.agency.lat,
            lng: acc.agency.lng,
            isApproved: true,
          },
        });
      } else {
        await prisma.agency.create({
          data: { userId: existing.id, ...acc.agency, isApproved: true, isDemo: false },
        });
      }
    }

    console.log(`  ↻ mis à jour : ${acc.email}  (${acc.role})`);
    return;
  }

  // Création
  await prisma.user.create({
    data: {
      email: acc.email,
      passwordHash,
      role: acc.role,
      firstName: acc.firstName,
      lastName: acc.lastName,
      phone: acc.phone,
      isVerified: true,
      ...(acc.agency
        ? {
            agency: {
              create: {
                ...acc.agency,
                isApproved: true,
                isDemo: false,
              },
            },
          }
        : {}),
    },
  });

  console.log(`  + créé        : ${acc.email}  (${acc.role})`);
}

async function main() {
  console.log("👥 Création des comptes de test RentaWay\n");

  for (const acc of ACCOUNTS) {
    await upsertAccount(acc);
  }

  console.log("\n✅ Comptes prêts. Identifiants :");
  for (const acc of ACCOUNTS) {
    console.log(`   ${acc.role.padEnd(7)}  ${acc.email}  →  ${acc.password}`);
  }
  console.log("\n🔗 Login : http://localhost:3000/login");
}

main()
  .catch((e) => {
    console.error("❌ Échec :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
