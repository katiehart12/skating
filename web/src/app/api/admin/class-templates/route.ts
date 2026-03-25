import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().min(4).max(10), // keep flexible for MVP
  endTime: z.string().min(4).max(10),
});

export async function GET(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const templates = await prisma.classTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sessionGroups: {
        include: {
          level: true,
          iceLocation: true,
          instructorLinks: {
            include: {
              instructor: { select: { id: true, userId: true } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const body = await req.json();
  const parsed = CreateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await prisma.classTemplate.create({
    data: parsed.data,
  });

  return NextResponse.json({ template: created }, { status: 201 });
}

