import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

const CreateEnrollmentSchema = z.object({
  kidProfileIds: z.array(z.string().min(1)).min(1),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ sessionOccurrenceId: string }> },
) {
  const params = await context.params;
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const enrollments = await prisma.kidSessionEnrollment.findMany({
    where: { sessionOccurrenceId: params.sessionOccurrenceId },
    include: {
      kid: { select: { id: true, displayName: true, user: { select: { email: true } } } },
      sessionOccurrence: {
        include: {
          classSession: { include: { level: true } },
        },
      },
    },
  });

  return NextResponse.json({ enrollments });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sessionOccurrenceId: string }> },
) {
  const params = await context.params;
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const body = await req.json();
  const parsed = CreateEnrollmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      parsed.data.kidProfileIds.map((kidId) =>
        tx.kidSessionEnrollment.upsert({
          where: {
            kidId_sessionOccurrenceId: {
              kidId,
              sessionOccurrenceId: params.sessionOccurrenceId,
            },
          },
          update: {},
          create: {
            kidId,
            sessionOccurrenceId: params.sessionOccurrenceId,
          },
        }),
      ),
    );
  });

  return NextResponse.json({ ok: true, enrolledCount: parsed.data.kidProfileIds.length }, { status: 201 });
}

