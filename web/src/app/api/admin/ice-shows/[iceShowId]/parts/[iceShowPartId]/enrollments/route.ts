import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

const BodySchema = z.object({
  kidProfileIds: z.array(z.string().min(1)).min(1),
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

  await prisma.$transaction(async (tx) => {
    // Ensure each kid has exactly one event per show by removing enrollments from other parts in the show.
    await tx.iceShowEnrollment.deleteMany({
      where: {
        kidId: { in: parsed.data.kidProfileIds },
        iceShowPart: { iceShowId: params.iceShowId },
      },
    });

    await Promise.all(
      parsed.data.kidProfileIds.map((kidId) =>
        tx.iceShowEnrollment.upsert({
          where: {
            iceShowPartId_kidId: { iceShowPartId: params.iceShowPartId, kidId },
          },
          update: {},
          create: {
            iceShowPartId: params.iceShowPartId,
            kidId,
          },
        }),
      ),
    );
  });

  return NextResponse.json({ ok: true });
}

