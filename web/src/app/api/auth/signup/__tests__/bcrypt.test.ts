import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

describe("bcryptjs password hashing", () => {
  it("produces a hash that is different from the original password", async () => {
    const password = "mySecretPassword";
    const hash = await bcrypt.hash(password, 10);

    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("verifies a correct password against its hash", async () => {
    const password = "mySecretPassword";
    const hash = await bcrypt.hash(password, 10);

    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it("rejects an incorrect password against a hash", async () => {
    const password = "mySecretPassword";
    const hash = await bcrypt.hash(password, 10);

    const isValid = await bcrypt.compare("wrongPassword", hash);
    expect(isValid).toBe(false);
  });
});
