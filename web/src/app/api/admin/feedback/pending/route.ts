import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

export async function GET(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const pending = await prisma.instructorFeedback.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      fromParent: { select: { id: true, user: { select: { email: true } } } },
      toInstructor: { select: { id: true, user: { select: { email: true, name: true } } } },
    },
  });

  return NextResponse.json({ pending });
}

