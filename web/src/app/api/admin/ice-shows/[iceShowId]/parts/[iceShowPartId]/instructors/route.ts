import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

const BodySchema = z.object({
  instructorProfileIds: z.array(z.string().min(1)).min(1),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ iceShowId: string; iceShowPartId: string }> },
) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const params = await context.params;
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Replace instructors for the part.
  await prisma.$transaction(async (tx) => {
    await tx.iceShowPartInstructor.deleteMany({
      where: { iceShowPartId: params.iceShowPartId },
    });

    await Promise.all(
      parsed.data.instructorProfileIds.map((instructorId) =>
        tx.iceShowPartInstructor.create({
          data: { iceShowPartId: params.iceShowPartId, instructorId },
        }),
      ),
    );
  });

  return NextResponse.json({ ok: true });
}

