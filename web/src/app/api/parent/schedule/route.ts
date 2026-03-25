import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = token?.role as UserRole | undefined;
  const userId = token?.id as string | undefined;
  if (!role || !userId || role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parentProfile = await prisma.parentProfile.findUnique({ where: { userId } });
  if (!parentProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kidLinks = await prisma.parentKid.findMany({
    where: { parentId: parentProfile.id },
    select: { kidId: true },
  });
  const kidIds = kidLinks.map((k) => k.kidId);
  if (kidIds.length === 0) return NextResponse.json({ items: [] });

  const enrollments = await prisma.kidSessionEnrollment.findMany({
    where: { kidId: { in: kidIds } },
    orderBy: {
      sessionOccurrence: { classOccurrence: { date: "asc" } },
    },
    include: {
      kid: { select: { id: true, displayName: true } },
      sessionOccurrence: {
        include: {
          classOccurrence: { include: { classTemplate: true } },
          classSession: { include: { level: true, iceLocation: true } },
        },
      },
    },
  });

  const sessionOccurrenceIds = enrollments.map((e) => e.sessionOccurrenceId);

  const attendance = await prisma.attendanceRecord.findMany({
    where: {
      sessionOccurrenceId: { in: sessionOccurrenceIds },
      kidId: { in: kidIds },
    },
    select: {
      sessionOccurrenceId: true,
      kidId: true,
      status: true,
      isMakeUp: true,
      makeUpOriginalReference: true,
      makeUpNotes: true,
    },
  });
  const attendanceByKey = new Map(
    attendance.map((a) => [
      `${a.sessionOccurrenceId}:${a.kidId}` as `${string}:${string}`,
      {
        status: a.status,
        isMakeUp: a.isMakeUp,
        makeUpOriginalReference: a.makeUpOriginalReference,
        makeUpNotes: a.makeUpNotes,
      },
    ] as const),
  );

  const endCards = await prisma.sessionEndCard.findMany({
    where: {
      sessionOccurrenceId: { in: sessionOccurrenceIds },
      kidId: { in: kidIds },
    },
    include: {
      acquiredSkills: { include: { levelSkill: true } },
    },
  });

  const endCardByKey = new Map(
    endCards.map((c) => [`${c.sessionOccurrenceId}:${c.kidId}`, c] as const),
  );

  const items = enrollments.map((e) => {
    const key = `${e.sessionOccurrenceId}:${e.kidId}` as `${string}:${string}`;
    const attendanceMeta = attendanceByKey.get(key) ?? null;
    const endCard = endCardByKey.get(key) ?? null;

    return {
      kidId: e.kidId,
      kidDisplayName: e.kid.displayName,
      sessionOccurrenceId: e.sessionOccurrenceId,
      date: e.sessionOccurrence.classOccurrence.date,
      classTemplate: e.sessionOccurrence.classOccurrence.classTemplate,
      level: e.sessionOccurrence.classSession.level,
      iceLocation: e.sessionOccurrence.classSession.iceLocation,
      attendanceStatus: attendanceMeta?.status ?? null,
      makeUp: attendanceMeta?.isMakeUp ?? false,
      makeUpOriginalReference: attendanceMeta?.makeUpOriginalReference ?? null,
      makeUpNotes: attendanceMeta?.makeUpNotes ?? null,
      endCard: endCard
        ? {
            passed: endCard.passed,
            instructorNote: endCard.instructorNote,
            skills: endCard.acquiredSkills.map((s) => ({
              levelSkillId: s.levelSkillId,
              description: s.levelSkill.description,
              acquired: s.acquired,
            })),
          }
        : null,
    };
  });

  return NextResponse.json({ items });
}

