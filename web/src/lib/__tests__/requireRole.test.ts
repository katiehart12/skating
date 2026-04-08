import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireUserRole } from "@/lib/requireRole";

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

describe("requireUserRole", () => {
  const makeRequest = () => new NextRequest("http://localhost/api/test");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no token is present (unauthenticated)", async () => {
    vi.mocked(getToken).mockResolvedValue(null);

    const response = await requireUserRole(makeRequest(), ["ADMIN"]);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when the token role is not in the allowed list", async () => {
    vi.mocked(getToken).mockResolvedValue({ role: "PARENT", id: "user-1" } as any);

    const response = await requireUserRole(makeRequest(), ["ADMIN"]);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 and includes role and userId when role is allowed", async () => {
    vi.mocked(getToken).mockResolvedValue({ role: "ADMIN", id: "user-abc" } as any);

    const response = await requireUserRole(makeRequest(), ["ADMIN"]);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.role).toBe("ADMIN");
    expect(body.userId).toBe("user-abc");
  });

  it("allows access when the token role matches any role in a multi-role list", async () => {
    vi.mocked(getToken).mockResolvedValue({ role: "INSTRUCTOR", id: "user-2" } as any);

    const response = await requireUserRole(makeRequest(), ["ADMIN", "INSTRUCTOR"]);

    expect(response.status).toBe(200);
  });

  it("returns 401 when token has no role field", async () => {
    vi.mocked(getToken).mockResolvedValue({ id: "user-3" } as any);

    const response = await requireUserRole(makeRequest(), ["ADMIN"]);

    expect(response.status).toBe(401);
  });
});
