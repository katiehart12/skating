import bcrypt from "bcryptjs";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { UserRole } from "../src/generated/prisma/enums";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

async function main() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("Missing DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD in .env");
  }

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        role: UserRole.ADMIN,
        passwordHash,
        adminProfile: {
          create: {},
        },
      },
    });
    console.log(`Seeded admin: ${user.email}`);
  } else {
    console.log(`Admin already exists: ${existingAdmin.email}`);
  }

  // Minimal defaults so the UI has something to work with immediately.
  const existingRinkMap = await prisma.rinkMap.findFirst({ where: { name: "Default Rink" } });
  const rinkMap = existingRinkMap ?? (await prisma.rinkMap.create({ data: { name: "Default Rink", imageUrl: "/rink.png" } }));

  // Create two sample ice locations if they don't exist.
  const locations = [
    { name: "North", xPercent: 0, yPercent: 0, wPercent: 50, hPercent: 50 },
    { name: "South", xPercent: 50, yPercent: 50, wPercent: 50, hPercent: 50 },
  ];

  for (const loc of locations) {
    const existing = await prisma.iceLocation.findFirst({
      where: { rinkMapId: rinkMap.id, name: loc.name },
    });
    if (!existing) {
      await prisma.iceLocation.create({
        data: {
          rinkMapId: rinkMap.id,
          name: loc.name,
          xPercent: loc.xPercent,
          yPercent: loc.yPercent,
          wPercent: loc.wPercent,
          hPercent: loc.hPercent,
        },
      });
    }
  }

  // Seed a 3-level chain.
  const getOrCreateLevel = async (name: string, sortOrder: number) => {
    const existing = await prisma.level.findFirst({ where: { name } });
    if (existing) return existing;
    return prisma.level.create({ data: { name, sortOrder } });
  };

  const beginner = await getOrCreateLevel("Beginner", 0);
  const intermediate = await getOrCreateLevel("Intermediate", 1);
  const advanced = await getOrCreateLevel("Advanced", 2);

  await prisma.level.updateMany({ where: { id: beginner.id }, data: { nextLevelId: intermediate.id } });
  await prisma.level.updateMany({ where: { id: intermediate.id }, data: { nextLevelId: advanced.id } });

  // Level skills
  const skillSets: Array<{ levelId: string; skills: string[] }> = [
    { levelId: beginner.id, skills: ["Basic forwards", "Basic backwards", "Stopping"] },
    {
      levelId: intermediate.id,
      skills: ["Turns", "Crossovers", "Controlled stopping"],
    },
    { levelId: advanced.id, skills: ["Speed", "Advanced turns", "Routine skills"] },
  ];

  for (const set of skillSets) {
    const existingCount = await prisma.levelSkill.count({ where: { levelId: set.levelId } });
    if (existingCount > 0) continue;

    for (let i = 0; i < set.skills.length; i++) {
      await prisma.levelSkill.create({
        data: {
          levelId: set.levelId,
          description: set.skills[i]!,
          sortOrder: i,
          isCritical: true,
        },
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

