import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

const CreateLinkSchema = z.object({
  parentProfileId: z.string().min(1),
  kidProfileId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const links = await prisma.parentKid.findMany({
    include: {
      parent: { include: { user: { select: { email: true } } } },
      kid: { include: { user: { select: { email: true } } } },
    },
    orderBy: { parentId: "asc" },
  });

  return NextResponse.json({ links });
}

export async function POST(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const body = await req.json();
  const parsed = CreateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { parentProfileId, kidProfileId } = parsed.data;

  // Upsert by compound primary key (parentId,kidId).
  await prisma.parentKid.upsert({
    where: { parentId_kidId: { parentId: parentProfileId, kidId: kidProfileId } },
    create: { parentId: parentProfileId, kidId: kidProfileId },
    update: {},
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

