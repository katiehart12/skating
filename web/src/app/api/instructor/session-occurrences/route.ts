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
    // Admin can see everything; MVP keep simple.
    const all = await prisma.classSessionOccurrence.findMany({
      orderBy: { classOccurrence: { date: "asc" } },
      include: {
        classOccurrence: { include: { classTemplate: true } },
        classSession: { include: { level: true, iceLocation: true } },
      },
    });
    return NextResponse.json({ sessionOccurrences: all });
  }

  const instructorProfile = await prisma.instructorProfile.findUnique({
    where: { userId },
  });
  if (!instructorProfile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.classSessionOccurrence.findMany({
    where: {
      classSession: {
        instructorLinks: {
          some: { instructorId: instructorProfile.id },
        },
      },
    },
    orderBy: { classOccurrence: { date: "asc" } },
    include: {
      classOccurrence: { include: { classTemplate: true } },
      classSession: { include: { level: true, iceLocation: true } },
    },
  });

  return NextResponse.json({ sessionOccurrences: sessions });
}

