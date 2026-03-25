import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ sessionOccurrenceId: string }> },
) {
  const params = await context.params;
  const auth = await requireUserRole(req, ["ADMIN", "INSTRUCTOR"] as UserRole[]);
  if (!auth.ok) return auth;

  const sessionOccurrence = await prisma.classSessionOccurrence.findUnique({
    where: { id: params.sessionOccurrenceId },
    include: { classSession: { include: { level: true } } },
  });
  if (!sessionOccurrence) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const levelSkills = await prisma.levelSkill.findMany({
    where: { levelId: sessionOccurrence.classSession.level.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ levelSkills });
}

