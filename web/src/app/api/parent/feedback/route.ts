import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  toInstructorProfileId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  message: z.string().min(1).max(1000),
  sessionOccurrenceId: z.string().min(1).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = token?.role as UserRole | undefined;
  const userId = token?.id as string | undefined;
  if (!role || !userId || role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parentProfile = await prisma.parentProfile.findUnique({ where: { userId } });
  if (!parentProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { toInstructorProfileId, rating, message, sessionOccurrenceId } = parsed.data;

  const created = await prisma.instructorFeedback.create({
    data: {
      fromParentId: parentProfile.id,
      toInstructorId: toInstructorProfileId,
      rating,
      message,
      sessionOccurrenceId: sessionOccurrenceId ?? null,
      status: "PENDING",
    },
    include: {
      toInstructor: { select: { id: true } },
    },
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}

