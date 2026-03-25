import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ iceShowId: string }> },
) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const params = await context.params;

  const show = await prisma.iceShow.findUnique({
    where: { id: params.iceShowId },
    include: {
      parts: {
        include: {
          iceLocation: true,
          instructors: { include: { instructor: { include: { user: true } } } },
          enrollments: { include: { kid: { include: { user: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!show) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ show });
}

