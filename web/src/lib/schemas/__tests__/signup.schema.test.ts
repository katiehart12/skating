import { describe, it, expect } from "vitest";
import { SignupBodySchema } from "@/lib/schemas/signup";

describe("SignupBodySchema (Zod validation)", () => {
  it("accepts a valid signup payload", () => {
    const result = SignupBodySchema.safeParse({
      email: "test@example.com",
      password: "securepassword",
      displayName: "Alice",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a payload without the optional displayName", () => {
    const result = SignupBodySchema.safeParse({
      email: "test@example.com",
      password: "securepassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email address", () => {
    const result = SignupBodySchema.safeParse({
      email: "not-an-email",
      password: "securepassword",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = SignupBodySchema.safeParse({
      email: "test@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing email field", () => {
    const result = SignupBodySchema.safeParse({
      password: "securepassword",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an email longer than 120 characters", () => {
    const longEmail = "a".repeat(115) + "@x.com"; // 121 chars
    const result = SignupBodySchema.safeParse({
      email: longEmail,
      password: "securepassword",
    });
    expect(result.success).toBe(false);
  });
});
