import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

const AttendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "LATE"]);
const AttendanceRecordSchema = z.object({
  kidProfileId: z.string().min(1),
  status: AttendanceStatusSchema,
  note: z.string().max(500).optional(),
  isMakeUp: z.boolean().optional(),
  makeUpOriginalReference: z.string().max(300).optional().nullable(),
  makeUpNotes: z.string().max(500).optional().nullable(),
});

const BodySchema = z.object({
  records: z.array(AttendanceRecordSchema).min(1),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ sessionOccurrenceId: string }> },
) {
  const params = await context.params;
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const attendance = await prisma.attendanceRecord.findMany({
    where: { sessionOccurrenceId: params.sessionOccurrenceId },
    include: {
      kid: { select: { id: true, displayName: true, user: { select: { email: true } } } },
    },
  });

  return NextResponse.json({ attendance });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sessionOccurrenceId: string }> },
) {
  const params = await context.params;
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sessionOccurrenceId = params.sessionOccurrenceId;

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      parsed.data.records.map((r) =>
        tx.attendanceRecord.upsert({
          where: {
            sessionOccurrenceId_kidId: {
              sessionOccurrenceId,
              kidId: r.kidProfileId,
            },
          },
          update: {
            status: r.status,
            note: r.note ?? null,
            isMakeUp: r.isMakeUp ?? false,
            makeUpOriginalReference: r.makeUpOriginalReference ?? null,
            makeUpNotes: r.makeUpNotes ?? null,
          },
          create: {
            sessionOccurrenceId,
            kidId: r.kidProfileId,
            status: r.status,
            note: r.note ?? null,
            isMakeUp: r.isMakeUp ?? false,
            makeUpOriginalReference: r.makeUpOriginalReference ?? null,
            makeUpNotes: r.makeUpNotes ?? null,
          },
        }),
      ),
    );
  });

  return NextResponse.json({ ok: true });
}

