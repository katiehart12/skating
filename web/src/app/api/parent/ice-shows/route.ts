import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

  const kidLinks = await prisma.parentKid.findMany({
    where: { parentId: parentProfile.id },
    select: { kidId: true },
  });
  const kidIds = kidLinks.map((k) => k.kidId);
  if (kidIds.length === 0) return NextResponse.json({ events: [] });

  const enrollments = await prisma.iceShowEnrollment.findMany({
    where: { kidId: { in: kidIds } },
    include: {
      kid: { select: { id: true, displayName: true, user: { select: { email: true } } } },
      iceShowPart: {
        include: {
          iceShow: true,
          iceLocation: true,
          instructors: {
            include: {
              instructor: { include: { user: { select: { email: true, name: true } } } },
            },
          },
        },
      },
    },
  });

  const events = enrollments
    .map((enr) => {
      const show = enr.iceShowPart.iceShow;
      const part = enr.iceShowPart;
      const lead = part.instructors[0]?.instructor.user;
      return {
        iceShowId: show.id,
        iceShowTitle: show.title,
        showDate: show.date,
        showStartTime: show.startTime,
        showEndTime: show.endTime,
        showNotes: show.notes ?? null,
        partId: part.id,
        partName: part.name,
        startTime: part.startTime ?? show.startTime,
        endTime: part.endTime ?? show.endTime,
        kidId: enr.kid.id,
        kidDisplayName: enr.kid.displayName,
        kidEmail: enr.kid.user.email,
        locationName: part.iceLocation.name,
        leadContact: lead ? { name: lead.name ?? null, email: lead.email } : null,
        icsUrl: `/api/parent/ice-shows/${show.id}/kids/${enr.kid.id}/ics`,
      };
    })
    // Ensure one event per kid: if somehow duplicates exist, keep the first.
    .filter((ev, idx, arr) => arr.findIndex((x) => x.kidId === ev.kidId && x.iceShowId === ev.iceShowId) === idx);

  events.sort((a, b) => (a.showDate < b.showDate ? -1 : 1));

  return NextResponse.json({ events });
}

