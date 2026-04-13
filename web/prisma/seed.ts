import bcrypt from "bcryptjs";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { UserRole } from "../src/generated/prisma/enums";

import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL in environment");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  // ── Admin ────────────────────────────────────────────────────────────────
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
        adminProfile: { create: {} },
      },
    });
    console.log(`Seeded admin: ${user.email}`);
  } else {
    console.log(`Admin already exists: ${existingAdmin.email}`);
  }

  // ── Demo instructor ──────────────────────────────────────────────────────
  let instructorProfile = await prisma.instructorProfile.findFirst({
    where: { user: { email: "instructor@skating.local" } },
  });
  if (!instructorProfile) {
    const hash = await bcrypt.hash("instructor123", 10);
    const u = await prisma.user.create({
      data: {
        email: "instructor@skating.local",
        name: "Sarah Miller",
        role: UserRole.INSTRUCTOR,
        passwordHash: hash,
        instructorProfile: { create: {} },
      },
      include: { instructorProfile: true },
    });
    instructorProfile = u.instructorProfile!;
    console.log("Seeded instructor: instructor@skating.local / instructor123");
  } else {
    console.log("Instructor already exists.");
  }

  // ── Demo parent + kid ────────────────────────────────────────────────────
  let kidProfile = await prisma.kidProfile.findFirst({
    where: { user: { email: "kid@skating.local" } },
  });
  if (!kidProfile) {
    // Parent
    const parentHash = await bcrypt.hash("parent123", 10);
    const parentUser = await prisma.user.create({
      data: {
        email: "parent@skating.local",
        name: "Jordan Smith",
        role: UserRole.PARENT,
        passwordHash: parentHash,
        parentProfile: { create: { displayName: "Jordan Smith" } },
      },
      include: { parentProfile: true },
    });

    // Kid
    const kidHash = await bcrypt.hash("kid123", 10);
    const kidUser = await prisma.user.create({
      data: {
        email: "kid@skating.local",
        name: "Alex Smith",
        role: UserRole.KID,
        passwordHash: kidHash,
        kidProfile: { create: { displayName: "Alex Smith" } },
      },
      include: { kidProfile: true },
    });
    kidProfile = kidUser.kidProfile!;

    // Link parent ↔ kid
    await prisma.parentKid.create({
      data: {
        parentId: parentUser.parentProfile!.id,
        kidId: kidProfile.id,
      },
    });
    console.log("Seeded parent: parent@skating.local / parent123");
    console.log("Seeded kid: Alex Smith");
  } else {
    console.log("Demo kid already exists.");
  }

  // ── Rink map + locations ─────────────────────────────────────────────────
  const existingRinkMap = await prisma.rinkMap.findFirst({ where: { name: "Default Rink" } });
  const rinkMap =
    existingRinkMap ??
    (await prisma.rinkMap.create({ data: { name: "Default Rink", imageUrl: "/rink.png" } }));

  const locationDefs = [
    { name: "North", xPercent: 0, yPercent: 0, wPercent: 100, hPercent: 50 },
    { name: "South", xPercent: 0, yPercent: 50, wPercent: 100, hPercent: 50 },
  ];
  const locationIds: Record<string, string> = {};
  for (const loc of locationDefs) {
    const existing = await prisma.iceLocation.findFirst({
      where: { rinkMapId: rinkMap.id, name: loc.name },
    });
    const created =
      existing ??
      (await prisma.iceLocation.create({
        data: { rinkMapId: rinkMap.id, ...loc },
      }));
    locationIds[loc.name] = created.id;
  }

  // ── Level 5 (real skills from the paper end-card) ────────────────────────
  const getOrCreateLevel = async (name: string, sortOrder: number) => {
    const existing = await prisma.level.findFirst({ where: { name } });
    if (existing) return existing;
    return prisma.level.create({ data: { name, sortOrder } });
  };

  const level5 = await getOrCreateLevel("Level 5", 5);

  // Assign kid to Level 5
  await prisma.kidProfile.update({
    where: { id: kidProfile.id },
    data: { currentLevelId: level5.id },
  });

  const level5Skills = [
    {
      description: "2-foot turn forward to backward (moving)",
      note: "Moving in a circle, turn from forward to backward, clockwise & counter clockwise",
      sortOrder: 0,
      isCritical: true,
    },
    {
      description: "Beginning forward crossovers (5 C & CC)",
      note: "Forward pump, crossover & hold cross-footed position / five consecutive",
      sortOrder: 1,
      isCritical: true,
    },
    {
      description: "Backward one-foot glide (R & L)",
      note: "Backward skating followed by a glide held for a count of four - six",
      sortOrder: 2,
      isCritical: true,
    },
    {
      description: "Backward snowplow stop (moving)",
      note: "B. skating followed by a complete stop with one foot & a three-second hold",
      sortOrder: 3,
      isCritical: true,
    },
    {
      description: "Side-toe hop (both directions) / two-foot hop",
      note: "Hop to the side from one toe to the other / Hockey skaters may do a 2-foot hop",
      sortOrder: 4,
      isCritical: false,
    },
    {
      description: "Backward stroking (width of rink)",
      note: "Push from inside edge, hold free foot in front / strong glides in between pushes",
      sortOrder: 5,
      isCritical: true,
    },
    {
      description: "Two-foot spin",
      note: "Optional entry, minimum of four revolutions",
      sortOrder: 6,
      isCritical: false,
    },
  ];

  const existingSkillCount = await prisma.levelSkill.count({ where: { levelId: level5.id } });
  if (existingSkillCount === 0) {
    for (const skill of level5Skills) {
      await prisma.levelSkill.create({ data: { levelId: level5.id, ...skill } });
    }
    console.log("Seeded Level 5 skills.");
  } else {
    console.log("Level 5 skills already exist.");
  }

  // ── Class template → session → occurrence → session occurrence ───────────
  // Wednesday (dayOfWeek=3), 5:30–6:20 PM
  let template = await prisma.classTemplate.findFirst({ where: { name: "Wednesday Level 5" } });
  if (!template) {
    template = await prisma.classTemplate.create({
      data: {
        name: "Wednesday Level 5",
        dayOfWeek: 3,
        startTime: "17:30",
        endTime: "18:20",
      },
    });
  }

  // Class session: Level 5, North end of rink
  let classSession = await prisma.classSession.findFirst({
    where: { classTemplateId: template.id, levelId: level5.id },
  });
  if (!classSession) {
    classSession = await prisma.classSession.create({
      data: {
        classTemplateId: template.id,
        levelId: level5.id,
        iceLocationId: locationIds["North"]!,
      },
    });
  }

  // Assign instructor to the class session
  const existingInstructorLink = await prisma.classSessionInstructor.findFirst({
    where: { classSessionId: classSession.id, instructorId: instructorProfile.id },
  });
  if (!existingInstructorLink) {
    await prisma.classSessionInstructor.create({
      data: { classSessionId: classSession.id, instructorId: instructorProfile.id },
    });
  }

  // Create a class occurrence for today (or the next upcoming Wednesday)
  const today = new Date();
  const dayOfWeek = today.getUTCDay();
  const daysUntilWed = (3 - dayOfWeek + 7) % 7; // 0 if today is Wednesday
  const occurrenceDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + daysUntilWed),
  );

  let classOccurrence = await prisma.classOccurrence.findFirst({
    where: { classTemplateId: template.id, date: occurrenceDate },
  });
  if (!classOccurrence) {
    classOccurrence = await prisma.classOccurrence.create({
      data: { classTemplateId: template.id, date: occurrenceDate },
    });
  }

  // Session occurrence
  let sessionOccurrence = await prisma.classSessionOccurrence.findFirst({
    where: { classOccurrenceId: classOccurrence.id, classSessionId: classSession.id },
  });
  if (!sessionOccurrence) {
    sessionOccurrence = await prisma.classSessionOccurrence.create({
      data: { classOccurrenceId: classOccurrence.id, classSessionId: classSession.id },
    });
  }
  console.log(`Session occurrence ID (for instructor URL): ${sessionOccurrence.id}`);

  // Enroll kid in the session occurrence
  const existingEnrollment = await prisma.kidSessionEnrollment.findFirst({
    where: { kidId: kidProfile.id, sessionOccurrenceId: sessionOccurrence.id },
  });
  if (!existingEnrollment) {
    await prisma.kidSessionEnrollment.create({
      data: { kidId: kidProfile.id, sessionOccurrenceId: sessionOccurrence.id },
    });
    console.log("Enrolled Alex Smith in Wednesday Level 5 session.");
  }

  console.log("\n── Demo login credentials ──────────────────────────");
  console.log("Admin:      admin@skating.local      / admin12345");
  console.log("Instructor: instructor@skating.local / instructor123");
  console.log("Parent:     parent@skating.local     / parent123");
  console.log(`\nInstructor end-card URL: /instructor/session-occurrences/${sessionOccurrence.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
