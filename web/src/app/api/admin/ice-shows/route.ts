import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";
import { getToken } from "next-auth/jwt";

const CreateIceShowSchema = z.object({
  title: z.string().min(1).max(120),
  date: z.string().min(1), // YYYY-MM-DD
  startTime: z.string().min(4).max(10), // HH:MM
  endTime: z.string().min(4).max(10),
  notes: z.string().max(2000).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const shows = await prisma.iceShow.findMany({
    orderBy: { date: "asc" },
    select: { id: true, title: true, date: true, startTime: true, endTime: true, notes: true },
  });

  return NextResponse.json({ shows });
}

export async function POST(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const body = await req.json();
  const parsed = CreateIceShowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, date, startTime, endTime, notes } = parsed.data;

  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const adminUserId = token?.id as string | undefined;
  if (!adminUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminProfile = await prisma.adminProfile.findUnique({ where: { userId: adminUserId } });
  if (!adminProfile) return NextResponse.json({ error: "Admin profile missing" }, { status: 401 });

  const created = await prisma.iceShow.create({
    data: {
      title,
      date: dt,
      startTime,
      endTime,
      notes: notes ?? null,
      createdByAdminId: adminProfile.id,
    },
  });

  return NextResponse.json({ show: created }, { status: 201 });
}

