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
  if (!role || !userId || (role !== "INSTRUCTOR" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (role === "ADMIN") {
    const all = await prisma.instructorFeedback.findMany({
      where: { status: "APPROVED" },
      orderBy: { approvedAt: "desc" },
      include: {
        fromParent: { select: { user: { select: { email: true } }, id: true } },
        toInstructor: { select: { id: true, user: { select: { email: true, name: true } } } },
      },
    });
    return NextResponse.json({ feedback: all });
  }

  const instructorProfile = await prisma.instructorProfile.findUnique({ where: { userId } });
  if (!instructorProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const feedback = await prisma.instructorFeedback.findMany({
    where: { toInstructorId: instructorProfile.id, status: "APPROVED" },
    orderBy: { approvedAt: "desc" },
    include: {
      fromParent: { select: { user: { select: { email: true } }, id: true, displayName: true } },
      toInstructor: { select: { id: true } },
      sessionOccurrenceId: true,
    } as any,
  });

  return NextResponse.json({ feedback });
}

