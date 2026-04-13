"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AdminNav } from "./components/AdminNav";

type LevelWithSkills = {
  id: string;
  name: string;
  sortOrder: number;
  levelSkills: Array<{ id: string; description: string; sortOrder: number }>;
};

export default function AdminDashboard() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;

  const [levels, setLevels] = useState<LevelWithSkills[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [skillsRaw, setSkillsRaw] = useState("Basic forwards\nStopping\n");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;
      if (role !== "ADMIN") return;

      const [levelsRes, summaryRes] = await Promise.all([
        fetch("/api/admin/levels", { method: "GET" }),
        fetch("/api/admin/summary", { method: "GET" }),
      ]);

      if (!levelsRes.ok || !summaryRes.ok) {
        setError("Failed to load admin dashboard data.");
        return;
      }

      const levelsJson = await levelsRes.json();
      const summaryJson = await summaryRes.json();
      setLevels(levelsJson.levels ?? []);
      setSummary(summaryJson.counts ?? null);
    }
    load();
  }, [role, status]);

  async function createLevel(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const skills = skillsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/levels", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          sortOrder:
            levels.length === 0 ? 0 : Math.max(...levels.map((l) => l.sortOrder)) + 1,
          skills,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error ? "Invalid input." : "Failed to create level.");
        return;
      }

      const json = await res.json();
      const created = json.level as LevelWithSkills;
      setLevels((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
      setName("");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "ADMIN") return <div className="p-6">Not authorized.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Admin Dashboard</h1>
          <p className="text-zinc-600">
            Setup + manage levels, classes, users, locations, attendance, and ice shows.
          </p>
        </div>
      </div>

      <AdminNav />

      {summary ? (
        <section className="bg-white shadow rounded p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Overview</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border rounded p-3 text-sm">
              <div className="text-zinc-600">Users</div>
              <div className="font-medium">
                Admins: {summary.usersByRole?.ADMIN ?? 0} · Instructors: {summary.usersByRole?.INSTRUCTOR ?? 0} · Parents: {summary.usersByRole?.PARENT ?? 0} · Kids: {summary.usersByRole?.KID ?? 0}
              </div>
              <div className="text-zinc-600 mt-1">
                Parent↔Kid links: <span className="font-medium">{summary.parentKidsLinks ?? 0}</span>
              </div>
            </div>
            <div className="border rounded p-3 text-sm">
              <div className="text-zinc-600">Setup</div>
              <div className="font-medium">
                Levels: {summary.levels ?? 0} · Skills: {summary.levelSkills ?? 0}
              </div>
              <div className="text-zinc-600 mt-1">
                Ice locations: <span className="font-medium">{summary.iceLocations ?? 0}</span> · Templates: <span className="font-medium">{summary.templates ?? 0}</span>
              </div>
              <div className="text-zinc-600 mt-1">
                Occurrences: <span className="font-medium">{summary.occurrences ?? 0}</span> · Session occurrences: <span className="font-medium">{summary.sessionOccurrences ?? 0}</span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white shadow rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Recommended setup order</h2>
        <ol className="list-decimal pl-5 text-sm text-zinc-700 space-y-1">
          <li>
            Create <Link className="underline" href="/admin">Levels</Link>
          </li>
          <li>
            Create <Link className="underline" href="/admin/ice-locations">Ice Locations</Link>
          </li>
          <li>
            Create <Link className="underline" href="/admin/users">Users</Link> (Kids, Parents, Instructors)
          </li>
          <li>
            Link <Link className="underline" href="/admin/parent-kids">Parents ↔ Kids</Link>
          </li>
          <li>
            Create <Link className="underline" href="/admin/class-templates">Class Templates</Link> and session groups
          </li>
          <li>
            Create <Link className="underline" href="/admin/occurrences">Occurrences</Link>
          </li>
          <li>
            Enroll kids + mark attendance/end cards from each session occurrence (from the Occurrences page)
          </li>
        </ol>
      </section>

      <section className="bg-white shadow rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Create Level</h2>
        <form onSubmit={createLevel} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Level name
            <input
              className="border rounded p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Beginner, Intermediate, ..."
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Skills (one per line)
            <textarea
              className="border rounded p-2 min-h-[90px]"
              value={skillsRaw}
              onChange={(e) => setSkillsRaw(e.target.value)}
            />
          </label>
          {error ? <div className="text-red-600 text-sm">{error}</div> : null}
          <button
            className="bg-sky-950 text-white rounded px-3 py-2 disabled:opacity-50 hover:bg-indigo-950"
            disabled={loading}
            type="submit"
          >
            {loading ? "Creating..." : "Create level"}
          </button>
        </form>
      </section>

      <section className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-3">Levels</h2>
        {levels.length === 0 ? (
          <div className="text-zinc-600">No levels yet.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {levels.map((lvl) => (
              <div key={lvl.id} className="border rounded p-3">
                <div className="font-medium">{lvl.name}</div>
                <div className="text-sm text-zinc-600">
                  Skills: {lvl.levelSkills.length}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {lvl.levelSkills.map((s) => (
                    <span
                      key={s.id}
                      className="text-xs border rounded px-2 py-1 bg-zinc-50"
                    >
                      {s.description}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

