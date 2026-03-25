import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

const CreateSessionSchema = z.object({
  levelId: z.string().min(1),
  iceLocationId: z.string().min(1),
  instructorProfileIds: z.array(z.string().min(1)).min(1),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ templateId: string }> },
) {
  const params = await context.params;
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const body = await req.json();
  const parsed = CreateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { levelId, iceLocationId, instructorProfileIds } = parsed.data;

  const created = await prisma.classSession.create({
    data: {
      classTemplateId: params.templateId,
      levelId,
      iceLocationId,
      instructorLinks: {
        createMany: {
          data: instructorProfileIds.map((instructorId) => ({
            instructorId,
          })),
        },
      },
    },
    include: {
      instructorLinks: { include: { instructor: true } },
      level: true,
      iceLocation: true,
    },
  });

  return NextResponse.json({ sessionGroup: created }, { status: 201 });
}

