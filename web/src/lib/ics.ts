export function icsEscape(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\r\n/g, "\n")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Returns a floating (no timezone suffix) ICS datetime in UTC based on the given date's UTC Y/M/D.
export function formatIcsDateTimeUTC(baseDate: Date, timeHHMM: string) {
  const [hhRaw, mmRaw] = timeHHMM.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
    throw new Error(`Invalid timeHHMM: ${timeHHMM}`);
  }

  const d = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), hh, mm, 0));
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}00`;
}

export function formatIcsTimestampZ(date: Date) {
  // Example: 20260325T153012Z
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

