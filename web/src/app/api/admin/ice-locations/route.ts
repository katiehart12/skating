import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

export async function GET(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const locations = await prisma.iceLocation.findMany({
    orderBy: { name: "asc" },
    include: { rinkMap: true },
  });

  return NextResponse.json({ locations });
}

const CreateIceLocationSchema = z.object({
  name: z.string().min(1).max(80),
  rinkMapId: z.string().optional().nullable(),
  xPercent: z.number().optional().nullable(),
  yPercent: z.number().optional().nullable(),
  wPercent: z.number().optional().nullable(),
  hPercent: z.number().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const body = await req.json();
  const parsed = CreateIceLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, rinkMapId, xPercent, yPercent, wPercent, hPercent } = parsed.data;

  const rinkMap =
    rinkMapId
      ? await prisma.rinkMap.findUnique({ where: { id: rinkMapId } })
      : await prisma.rinkMap.findFirst();
  if (!rinkMap) {
    return NextResponse.json({ error: "No rink map found. Seed database first." }, { status: 400 });
  }

  const created = await prisma.iceLocation.create({
    data: {
      rinkMapId: rinkMap.id,
      name,
      xPercent: xPercent ?? null,
      yPercent: yPercent ?? null,
      wPercent: wPercent ?? null,
      hPercent: hPercent ?? null,
    },
  });

  return NextResponse.json({ location: created }, { status: 201 });
}

