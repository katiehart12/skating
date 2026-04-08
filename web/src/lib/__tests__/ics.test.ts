import { describe, it, expect } from "vitest";
import { icsEscape, formatIcsDateTimeUTC, formatIcsTimestampZ } from "@/lib/ics";

describe("icsEscape", () => {
  it("escapes backslashes", () => {
    expect(icsEscape("path\\to\\file")).toBe("path\\\\to\\\\file");
  });

  it("escapes newlines as \\n", () => {
    expect(icsEscape("line1\nline2")).toBe("line1\\nline2");
  });

  it("escapes commas", () => {
    expect(icsEscape("a,b,c")).toBe("a\\,b\\,c");
  });

  it("escapes semicolons", () => {
    expect(icsEscape("a;b")).toBe("a\\;b");
  });

  it("returns plain text unchanged", () => {
    expect(icsEscape("Hello World")).toBe("Hello World");
  });
});

describe("formatIcsDateTimeUTC", () => {
  it("formats a date and time as an ICS datetime string", () => {
    const date = new Date(Date.UTC(2026, 2, 15)); // March 15, 2026
    const result = formatIcsDateTimeUTC(date, "09:30");
    expect(result).toBe("20260315T093000");
  });

  it("zero-pads month and day", () => {
    const date = new Date(Date.UTC(2026, 0, 5)); // Jan 5, 2026
    const result = formatIcsDateTimeUTC(date, "08:05");
    expect(result).toBe("20260105T080500");
  });

  it("throws on an invalid time string", () => {
    const date = new Date(Date.UTC(2026, 0, 1));
    expect(() => formatIcsDateTimeUTC(date, "not-a-time")).toThrow("Invalid timeHHMM");
  });
});

describe("formatIcsTimestampZ", () => {
  it("formats a date as a UTC ICS timestamp ending in Z", () => {
    const date = new Date("2026-03-25T15:30:12.000Z");
    const result = formatIcsTimestampZ(date);
    expect(result).toBe("20260325T153012Z");
  });
});
