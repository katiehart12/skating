"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useSession } from "next-auth/react";

type UserRole = "ADMIN" | "INSTRUCTOR" | "KID" | "PARENT";

type Level = { id: string; name: string; sortOrder: number };

type UserSummary = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
  kidProfileId: string | null;
  instructorProfileId: string | null;
  parentProfileId: string | null;
  adminProfileId: string | null;
};

export default function AdminUsersPage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;

  const [levels, setLevels] = useState<Level[]>([]);
  const [userRole, setUserRole] = useState<UserRole>("INSTRUCTOR");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currentLevelId, setCurrentLevelId] = useState<string>("");

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (status !== "authenticated" || role !== "ADMIN") return;

      const [levelsRes, usersRes] = await Promise.all([
        fetch("/api/admin/levels"),
        fetch(`/api/admin/users?role=${userRole}`),
      ]);

      if (!levelsRes.ok || !usersRes.ok) {
        setError("Failed to load admin users data.");
        return;
      }

      const levelsJson = await levelsRes.json();
      const usersJson = await usersRes.json();

      const lvls = levelsJson.levels ?? [];
      setLevels(lvls);
      if (!currentLevelId && lvls[0]?.id) setCurrentLevelId(lvls[0].id);

      setUsers(usersJson.users ?? []);
    }
    load();
  }, [currentLevelId, role, status, userRole]);

  useEffect(() => {
    if (userRole !== "KID" && !displayName) return;
  }, [displayName, userRole]);

  async function createUser(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: any = {
        role: userRole,
        email,
        password,
        displayName: displayName || undefined,
      };
      if (userRole === "KID") body.currentLevelId = currentLevelId || null;

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error ? "Invalid input." : "Failed to create user.");
        return;
      }

      setEmail("");
      setPassword("");
      setDisplayName("");

      const usersRes = await fetch(`/api/admin/users?role=${userRole}`);
      const usersJson = await usersRes.json();
      setUsers(usersJson.users ?? []);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "ADMIN") return <div className="p-6">Not authorized.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-3">
        <h1 className="text-2xl font-semibold">Users</h1>
        <div className="text-sm text-zinc-600">Create Kids, Instructors, Parents</div>
      </div>

      <nav className="mb-6 flex gap-3 text-sm">
        <a className="underline" href="/admin">
          Levels
        </a>
        <a className="underline" href="/admin/class-templates">
          Templates
        </a>
        <a className="underline" href="/admin/occurrences">
          Occurrences
        </a>
      </nav>

      {error ? <div className="text-red-600 text-sm mb-3">{error}</div> : null}

      <section className="bg-white shadow rounded p-4 mb-6">
        <h2 className="font-semibold mb-3">Create User</h2>
        <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Role
            <select
              className="border rounded p-2"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
            >
              {(["INSTRUCTOR", "KID", "PARENT"] as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              className="border rounded p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              className="border rounded p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Display name
            <input
              className="border rounded p-2"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              type="text"
            />
          </label>

          {userRole === "KID" ? (
            <label className="flex flex-col gap-1 text-sm md:col-span-2">
              Current level
              <select
                className="border rounded p-2"
                value={currentLevelId}
                onChange={(e) => setCurrentLevelId(e.target.value)}
              >
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button
            type="submit"
            className="bg-sky-950 text-white rounded px-3 py-2 md:col-span-2 disabled:opacity-50 hover:bg-indigo-950"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      </section>

      <section className="bg-white shadow rounded p-4">
        <h2 className="font-semibold mb-3">Existing {userRole}s</h2>
        {users.length === 0 ? (
          <div className="text-zinc-600">No users yet.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map((u) => (
              <div key={u.id} className="border rounded p-3 text-sm">
                <div className="font-medium">{u.displayName ?? u.email}</div>
                <div className="text-zinc-600">{u.email}</div>
                {u.kidProfileId ? <div className="text-zinc-600">kidProfileId: {u.kidProfileId}</div> : null}
                {u.instructorProfileId ? (
                  <div className="text-zinc-600">instructorProfileId: {u.instructorProfileId}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

