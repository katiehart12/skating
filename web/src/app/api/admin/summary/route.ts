import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";

export async function GET(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const [
    levels,
    levelSkills,
    rinkMaps,
    iceLocations,
    templates,
    occurrences,
    sessionOccurrences,
    users,
    parentKidsLinks,
    iceShows,
  ] = await Promise.all([
    prisma.level.count(),
    prisma.levelSkill.count(),
    prisma.rinkMap.count(),
    prisma.iceLocation.count(),
    prisma.classTemplate.count(),
    prisma.classOccurrence.count(),
    prisma.classSessionOccurrence.count(),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.parentKid.count(),
    prisma.iceShow.count(),
  ]);

  const usersByRole = Object.fromEntries(users.map((u) => [u.role, u._count._all]));

  return NextResponse.json({
    counts: {
      levels,
      levelSkills,
      rinkMaps,
      iceLocations,
      templates,
      occurrences,
      sessionOccurrences,
      parentKidsLinks,
      iceShows,
      usersByRole,
    },
  });
}

