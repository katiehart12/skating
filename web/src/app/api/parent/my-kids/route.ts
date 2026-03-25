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
    include: { kid: { include: { user: { select: { email: true } } } } },
    orderBy: { kid: { displayName: "asc" } },
  });

  const kids = kidLinks.map((l) => ({
    kidId: l.kid.id,
    displayName: l.kid.displayName,
    email: l.kid.user.email,
  }));

  return NextResponse.json({ kids });
}

