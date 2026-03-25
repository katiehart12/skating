import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { formatIcsDateTimeUTC, formatIcsTimestampZ, icsEscape } from "@/lib/ics";

function buildIcs({
  uid,
  dtstamp,
  dtstart,
  dtend,
  summary,
  description,
  location,
}: {
  uid: string;
  dtstamp: string;
  dtstart: string;
  dtend: string;
  summary: string;
  description: string;
  location: string;
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Skating School//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}Z`.replace(/Z{2}$/, "Z"),
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `LOCATION:${icsEscape(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // Use CRLF line endings for better compatibility.
  return lines.join("\r\n");
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ iceShowId: string; kidId: string }> },
) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = token?.role as UserRole | undefined;
  const userId = token?.id as string | undefined;
  if (!role || !userId || role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;

  const parentProfile = await prisma.parentProfile.findUnique({ where: { userId } });
  if (!parentProfile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const link = await prisma.parentKid.findUnique({
    where: { parentId_kidId: { parentId: parentProfile.id, kidId: params.kidId } },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const enrollment = await prisma.iceShowEnrollment.findFirst({
    where: {
      kidId: params.kidId,
      iceShowPart: { iceShowId: params.iceShowId },
    },
    include: {
      kid: { select: { id: true, displayName: true } },
      iceShowPart: {
        include: {
          iceShow: true,
          iceLocation: true,
          instructors: { include: { instructor: { include: { user: true } } } },
        },
      },
    },
  });

  if (!enrollment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const show = enrollment.iceShowPart.iceShow;
  const part = enrollment.iceShowPart;
  const lead = part.instructors[0]?.instructor.user;

  const startTime = part.startTime ?? show.startTime;
  const endTime = part.endTime ?? show.endTime;

  const dtstart = formatIcsDateTimeUTC(show.date, startTime);
  const dtend = formatIcsDateTimeUTC(show.date, endTime);
  const dtstamp = formatIcsTimestampZ(new Date());

  const summary = `${enrollment.kid.displayName} - ${show.title} (${part.name})`;

  const descriptionParts: string[] = [];
  descriptionParts.push(`Student: ${enrollment.kid.displayName}`);
  descriptionParts.push(`Show: ${show.title}`);
  descriptionParts.push(`Practice block: ${part.name}`);
  descriptionParts.push(`Location: ${part.iceLocation.name}`);
  if (lead) {
    descriptionParts.push(`Lead contact: ${lead.name ?? lead.email}`);
    descriptionParts.push(`Contact email: ${lead.email}`);
  }
  if (show.notes) descriptionParts.push(`Notes: ${show.notes}`);
  const description = descriptionParts.join("\n");

  const location = `${part.iceLocation.name} (Ice Show: ${show.title})`;

  const uid = `skating-show-${show.id}-${enrollment.kid.id}@skating.local`;

  const ics = buildIcs({
    uid,
    dtstamp,
    dtstart,
    dtend,
    summary,
    description,
    location,
  });

  const filename = `${show.title}-${enrollment.kid.displayName}.ics`.replace(/\s+/g, "-");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

