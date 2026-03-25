import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { requireUserRole } from "@/lib/requireRole";
import type { UserRole } from "@/generated/prisma/enums";

const BodySchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ feedbackId: string }> },
) {
  const auth = await requireUserRole(req, ["ADMIN"] as UserRole[]);
  if (!auth.ok) return auth;

  const params = await context.params;
  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const userId = token?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminProfile = await prisma.adminProfile.findUnique({ where: { userId } });
  if (!adminProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const feedback = await prisma.instructorFeedback.findUnique({
    where: { id: params.feedbackId },
  });
  if (!feedback) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextStatus = parsed.data.action === "APPROVE" ? "APPROVED" : "REJECTED";

  await prisma.instructorFeedback.update({
    where: { id: params.feedbackId },
    data: {
      status: nextStatus,
      approvedAt: new Date(),
      approvedByAdminId: adminProfile.id,
    },
  });

  return NextResponse.json({ ok: true });
}

