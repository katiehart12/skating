import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";

const BodySchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
  displayName: z.string().max(120).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password, displayName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: displayName ?? undefined,
      role: UserRole.PARENT,
      passwordHash,
      parentProfile: {
        create: {
          displayName: displayName ?? null,
        },
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, userId: created.id }, { status: 201 });
}

