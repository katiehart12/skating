import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

const CreateLevelSchema = z.object({
  name: z.string().min(1).max(80),
  sortOrder: z.number().int().optional(),
  skills: z.array(z.string().min(1).max(200)).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const levels = await prisma.level.findMany({
    orderBy: { sortOrder: "asc" },
    include: { levelSkills: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ levels });
}

export async function POST(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const body = await req.json();
  const parsed = CreateLevelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, sortOrder, skills } = parsed.data;

  const createdLevel = await prisma.level.create({
    data: {
      name,
      sortOrder: sortOrder ?? 0,
      levelSkills: skills
        ? {
            create: skills.map((s, idx) => ({
              description: s,
              sortOrder: idx,
              isCritical: true,
            })),
          }
        : undefined,
    },
    include: { levelSkills: true },
  });

  return NextResponse.json({ level: createdLevel }, { status: 201 });
}

