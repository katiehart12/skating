import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import { getToken } from "next-auth/jwt";
import type { UserRole } from "@/generated/prisma/enums";

const EndCardSchema = z.object({
  kidProfileId: z.string().min(1),
  passed: z.boolean(),
  instructorNote: z.string().max(1000).optional(),
  acquiredLevelSkillIds: z.array(z.string().min(1)).optional().default([]),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ sessionOccurrenceId: string }> },
) {
  const params = await context.params;
  const auth = await requireUserRole(req, ["ADMIN", "INSTRUCTOR"] as UserRole[]);
  if (!auth.ok) return auth;

  const endCards = await prisma.sessionEndCard.findMany({
    where: { sessionOccurrenceId: params.sessionOccurrenceId },
    include: {
      kid: { select: { id: true, displayName: true, user: { select: { email: true } } } },
      acquiredSkills: {
        include: { levelSkill: true },
        orderBy: { levelSkill: { sortOrder: "asc" } },
      },
    },
    orderBy: { kidId: "asc" },
  });

  return NextResponse.json({ endCards });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sessionOccurrenceId: string }> },
) {
  const params = await context.params;
  const auth = await requireUserRole(req, ["ADMIN", "INSTRUCTOR"] as UserRole[]);
  if (!auth.ok) return auth;

  // For instructor authorization checks.
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = token?.role as UserRole | undefined;
  const userId = token?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = EndCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { kidProfileId, passed, instructorNote, acquiredLevelSkillIds } = parsed.data;

  const sessionOccurrence = await prisma.classSessionOccurrence.findUnique({
    where: { id: params.sessionOccurrenceId },
    include: {
      classSession: { include: { level: true } },
    },
  });
  if (!sessionOccurrence) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  let instructorProfileId: string | undefined;
  if (role === "INSTRUCTOR") {
    const instructorProfile = await prisma.instructorProfile.findUnique({
      where: { userId },
    });
    if (!instructorProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    instructorProfileId = instructorProfile.id;

    // Ensure instructor is assigned to the class session.
    const assignment = await prisma.classSessionInstructor.findFirst({
      where: {
        classSessionId: sessionOccurrence.classSessionId,
        instructorId: instructorProfileId,
      },
    });
    if (!assignment) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else {
    // Admin can set instructorId to any instructor in MVP; pick the first assigned instructor.
    const firstAssignment = await prisma.classSessionInstructor.findFirst({
      where: { classSessionId: sessionOccurrence.classSessionId },
      orderBy: { id: "asc" },
    });
    instructorProfileId = firstAssignment?.instructorId;
    if (!instructorProfileId) {
      return NextResponse.json(
        { error: "No instructors assigned to this session group." },
        { status: 400 },
      );
    }
  }

  const levelId = sessionOccurrence.classSession.level.id;
  const levelSkills = await prisma.levelSkill.findMany({
    where: { levelId },
    orderBy: { sortOrder: "asc" },
  });

  const acquiredSet = new Set(acquiredLevelSkillIds);

  await prisma.$transaction(async (tx) => {
    const endCard = await tx.sessionEndCard.upsert({
      where: {
        sessionOccurrenceId_kidId: {
          sessionOccurrenceId: params.sessionOccurrenceId,
          kidId: kidProfileId,
        },
      },
      update: {
        passed,
        instructorNote: instructorNote ?? null,
        instructorId: instructorProfileId!,
      },
      create: {
        sessionOccurrenceId: params.sessionOccurrenceId,
        kidId: kidProfileId,
        passed,
        instructorNote: instructorNote ?? null,
        instructorId: instructorProfileId!,
      },
    });

    await tx.endCardSkill.deleteMany({ where: { endCardId: endCard.id } });

    if (levelSkills.length > 0) {
      await tx.endCardSkill.createMany({
        data: levelSkills.map((ls) => ({
          endCardId: endCard.id,
          levelSkillId: ls.id,
          acquired: acquiredSet.has(ls.id),
          note: null,
        })),
      });
    }
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

