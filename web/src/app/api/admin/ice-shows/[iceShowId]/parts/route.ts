import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

const CreatePartSchema = z.object({
  name: z.string().min(1).max(120),
  iceLocationId: z.string().min(1),
  startTime: z.string().min(4).max(10).optional().nullable(),
  endTime: z.string().min(4).max(10).optional().nullable(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ iceShowId: string }> },
) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const params = await context.params;

  const body = await req.json();
  const parsed = CreatePartSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const created = await prisma.iceShowPart.create({
    data: {
      iceShowId: params.iceShowId,
      name: parsed.data.name,
      iceLocationId: parsed.data.iceLocationId,
      startTime: parsed.data.startTime ?? null,
      endTime: parsed.data.endTime ?? null,
    },
    include: { iceLocation: true },
  });

  return NextResponse.json({ part: created }, { status: 201 });
}

