import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import { SignupBodySchema as BodySchema } from "@/lib/schemas/signup";

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

