/**
 * Supprime tous les véhicules et agences marqués isDemo: true,
 * ainsi que les utilisateurs LOUEUR rattachés à ces agences démo.
 *
 * Usage : npm run seed:remove-demo
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Suppression du catalogue de démonstration...");

  const demoAgencies = await prisma.agency.findMany({
    where: { isDemo: true },
    select: { id: true, userId: true, name: true },
  });

  console.log(`   ${demoAgencies.length} agences démo trouvées`);

  // 1) Disponibilités liées (cascade via vehicle delete déjà OK)
  // 2) Véhicules démo
  const vehiclesDeleted = await prisma.vehicle.deleteMany({ where: { isDemo: true } });
  console.log(`   ${vehiclesDeleted.count} véhicules supprimés`);

  // 3) Agences démo (cascade depuis User)
  const agencyIds = demoAgencies.map((a) => a.id);
  const userIds = demoAgencies.map((a) => a.userId);

  if (agencyIds.length > 0) {
    await prisma.agency.deleteMany({ where: { id: { in: agencyIds } } });
    console.log(`   ${agencyIds.length} agences supprimées`);
  }

  if (userIds.length > 0) {
    const usersDeleted = await prisma.user.deleteMany({
      where: { id: { in: userIds }, role: "LOUEUR" },
    });
    console.log(`   ${usersDeleted.count} utilisateurs LOUEUR démo supprimés`);
  }

  console.log("\n✅ Catalogue démo nettoyé");
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
