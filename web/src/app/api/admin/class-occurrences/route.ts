import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

const CreateOccurrenceSchema = z.object({
  classTemplateId: z.string().min(1),
  date: z.string().min(1), // ISO date/time
  kind: z.enum(["NORMAL", "MAKE_UP"]).optional(),
  sourceSessionOccurrenceId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const occurrences = await prisma.classOccurrence.findMany({
    orderBy: { date: "asc" },
    include: {
      classTemplate: true,
      sessionOccurrences: {
        include: {
          classSession: { include: { level: true, iceLocation: true } },
        },
      },
    },
  });

  return NextResponse.json({ occurrences });
}

export async function POST(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const body = await req.json();
  const parsed = CreateOccurrenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { classTemplateId, date, kind, sourceSessionOccurrenceId } = parsed.data;
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const template = await prisma.classTemplate.findUnique({
    where: { id: classTemplateId },
    include: { sessionGroups: true },
  });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  if (template.sessionGroups.length === 0) {
    return NextResponse.json({ error: "Template has no session groups." }, { status: 400 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const occurrence = await tx.classOccurrence.create({
      data: {
        classTemplateId,
        date: dt,
      },
    });

    await tx.classSessionOccurrence.createMany({
      data: template.sessionGroups.map((sg) => ({
        classOccurrenceId: occurrence.id,
        classSessionId: sg.id,
        kind: kind ?? "NORMAL",
        sourceSessionOccurrenceId: sourceSessionOccurrenceId ?? null,
      })),
    });

    return occurrence;
  });

  return NextResponse.json({ occurrence: created }, { status: 201 });
}

