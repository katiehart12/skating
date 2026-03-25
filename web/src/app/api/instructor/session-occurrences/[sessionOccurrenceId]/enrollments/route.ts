import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ sessionOccurrenceId: string }> },
) {
  const params = await context.params;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = token?.role as UserRole | undefined;
  const userId = token?.id as string | undefined;

  if (!role || !userId || (role !== "INSTRUCTOR" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOccurrence = await prisma.classSessionOccurrence.findUnique({
    where: { id: params.sessionOccurrenceId },
    include: {
      classSession: { include: { classTemplate: true } },
    },
  });
  if (!sessionOccurrence) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (role === "INSTRUCTOR") {
    const instructorProfile = await prisma.instructorProfile.findUnique({
      where: { userId },
    });
    if (!instructorProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const assignment = await prisma.classSessionInstructor.findFirst({
      where: { classSessionId: sessionOccurrence.classSessionId, instructorId: instructorProfile.id },
    });
    if (!assignment) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enrollments = await prisma.kidSessionEnrollment.findMany({
    where: { sessionOccurrenceId: params.sessionOccurrenceId },
    include: { kid: { select: { id: true, displayName: true, user: { select: { email: true } } } } },
    orderBy: { kid: { displayName: "asc" } },
  });

  const attendance = await prisma.attendanceRecord.findMany({
    where: { sessionOccurrenceId: params.sessionOccurrenceId },
    select: { kidId: true, status: true },
  });
  const attendanceByKidId = new Map(attendance.map((a) => [a.kidId, a.status]));

  const payload = enrollments.map((e) => ({
    kidId: e.kid.id,
    displayName: e.kid.displayName,
    email: e.kid.user.email,
    attendanceStatus: attendanceByKidId.get(e.kid.id) ?? null,
  }));

  return NextResponse.json({ enrollments: payload });
}

