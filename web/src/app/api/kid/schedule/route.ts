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
  if (!role || !userId || role !== "KID") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const kidProfile = await prisma.kidProfile.findUnique({ where: { userId } });
  if (!kidProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const enrollments = await prisma.kidSessionEnrollment.findMany({
    where: { kidId: kidProfile.id },
    orderBy: { sessionOccurrence: { classOccurrence: { date: "asc" } } },
    include: {
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
      kidId: kidProfile.id,
    },
    select: {
      sessionOccurrenceId: true,
      status: true,
      isMakeUp: true,
      makeUpOriginalReference: true,
      makeUpNotes: true,
    },
  });
  const attendanceById = new Map(
    attendance.map((a) => [
      a.sessionOccurrenceId,
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
      kidId: kidProfile.id,
    },
    include: { acquiredSkills: { include: { levelSkill: true } } },
  });
  const endCardById = new Map(endCards.map((c) => [c.sessionOccurrenceId, c] as const));

  const items = enrollments.map((e) => {
    const so = e.sessionOccurrence;
    const endCard = endCardById.get(e.sessionOccurrenceId) ?? null;
    return {
      sessionOccurrenceId: e.sessionOccurrenceId,
      date: so.classOccurrence.date,
      classTemplate: so.classOccurrence.classTemplate,
      level: so.classSession.level,
      iceLocation: so.classSession.iceLocation,
      attendanceStatus: attendanceById.get(e.sessionOccurrenceId)?.status ?? null,
      makeUp: attendanceById.get(e.sessionOccurrenceId)?.isMakeUp ?? false,
      makeUpOriginalReference:
        attendanceById.get(e.sessionOccurrenceId)?.makeUpOriginalReference ?? null,
      makeUpNotes: attendanceById.get(e.sessionOccurrenceId)?.makeUpNotes ?? null,
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

