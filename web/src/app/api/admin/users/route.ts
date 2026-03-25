import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

const CreateUserSchema = z.object({
  role: z.enum(["ADMIN", "INSTRUCTOR", "KID", "PARENT"]),
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
  displayName: z.string().max(120).optional(),
  currentLevelId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const url = new URL(req.url);
  const role = url.searchParams.get("role") as UserRole | null;
  if (!role) {
    return NextResponse.json({ error: "Missing role query param." }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: { role },
    orderBy: { createdAt: "desc" },
  });

  // Include profile ids where available so the admin UI can link records.
  const enriched = await Promise.all(
    users.map(async (u) => {
      const [admin, instructor, kid, parent] = await Promise.all([
        prisma.adminProfile.findUnique({ where: { userId: u.id } }),
        prisma.instructorProfile.findUnique({ where: { userId: u.id } }),
        prisma.kidProfile.findUnique({ where: { userId: u.id } }),
        prisma.parentProfile.findUnique({ where: { userId: u.id } }),
      ]);

      return {
        id: u.id,
        email: u.email,
        role: u.role,
        displayName: kid?.displayName ?? parent?.displayName ?? u.name ?? null,
        adminProfileId: admin?.id ?? null,
        instructorProfileId: instructor?.id ?? null,
        kidProfileId: kid?.id ?? null,
        parentProfileId: parent?.id ?? null,
      };
    }),
  );

  return NextResponse.json({ users: enriched });
}

export async function POST(req: NextRequest) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const body = await req.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { role, email, password, displayName, currentLevelId } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: displayName ?? undefined,
      role: role as UserRole,
      passwordHash,
      adminProfile:
        role === "ADMIN"
          ? {
              create: {},
            }
          : undefined,
      instructorProfile:
        role === "INSTRUCTOR"
          ? {
              create: {},
            }
          : undefined,
      kidProfile:
        role === "KID"
          ? {
              create: {
                displayName: displayName ?? email.split("@")[0]!,
                currentLevelId: currentLevelId ?? null,
              },
            }
          : undefined,
      parentProfile:
        role === "PARENT"
          ? {
              create: {
                displayName: displayName ?? undefined,
              },
            }
          : undefined,
    },
  });

  return NextResponse.json({ userId: created.id }, { status: 201 });
}

