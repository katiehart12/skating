"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useSession } from "next-auth/react";
import { AdminNav } from "../components/AdminNav";

type IceLocation = {
  id: string;
  name: string;
  xPercent: number | null;
  yPercent: number | null;
  wPercent: number | null;
  hPercent: number | null;
};

export default function IceLocationsAdminPage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;

  const [locations, setLocations] = useState<IceLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [xPercent, setXPercent] = useState<string>("");
  const [yPercent, setYPercent] = useState<string>("");
  const [wPercent, setWPercent] = useState<string>("");
  const [hPercent, setHPercent] = useState<string>("");

  async function refresh() {
    const res = await fetch("/api/admin/ice-locations");
    if (!res.ok) {
      setError("Failed to load ice locations.");
      return;
    }
    const json = await res.json();
    setLocations(json.locations ?? []);
  }

  useEffect(() => {
    if (status !== "authenticated" || role !== "ADMIN") return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, status]);

  function parsePercent(value: string) {
    const v = value.trim();
    if (!v) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return n;
  }

  async function createLocation(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name,
        xPercent: parsePercent(xPercent),
        yPercent: parsePercent(yPercent),
        wPercent: parsePercent(wPercent),
        hPercent: parsePercent(hPercent),
      };

      const res = await fetch("/api/admin/ice-locations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error ? "Invalid input." : "Failed to create ice location.");
        return;
      }

      setName("");
      setXPercent("");
      setYPercent("");
      setWPercent("");
      setHPercent("");
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "ADMIN") return <div className="p-6">Not authorized.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h1 className="text-2xl font-semibold">Ice Locations</h1>
        <div className="text-sm text-zinc-600">Rink areas for classes</div>
      </div>

      <AdminNav />

      {error ? <div className="text-red-600 text-sm mb-3">{error}</div> : null}

      <section className="bg-white shadow rounded p-4 mb-6">
        <h2 className="font-semibold mb-3">Create Ice Location</h2>
        <form onSubmit={createLocation} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Name
            <input
              className="border rounded p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="North, South, Center, ..."
              required
            />
          </label>

          <div className="md:col-span-2 text-sm text-zinc-600">
            Coordinates are optional (percent of rink map). You can leave them blank for MVP.
          </div>

          <label className="flex flex-col gap-1 text-sm">
            xPercent
            <input className="border rounded p-2" inputMode="decimal" value={xPercent} onChange={(e) => setXPercent(e.target.value)} placeholder="0–100" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            yPercent
            <input className="border rounded p-2" inputMode="decimal" value={yPercent} onChange={(e) => setYPercent(e.target.value)} placeholder="0–100" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            wPercent
            <input className="border rounded p-2" inputMode="decimal" value={wPercent} onChange={(e) => setWPercent(e.target.value)} placeholder="0–100" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            hPercent
            <input className="border rounded p-2" inputMode="decimal" value={hPercent} onChange={(e) => setHPercent(e.target.value)} placeholder="0–100" />
          </label>

          <button
            type="submit"
            className="bg-sky-950 text-white rounded px-3 py-2 md:col-span-2 disabled:opacity-50 hover:bg-indigo-950"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create ice location"}
          </button>
        </form>
      </section>

      <section className="bg-white shadow rounded p-4">
        <h2 className="font-semibold mb-3">Existing Ice Locations</h2>
        {locations.length === 0 ? (
          <div className="text-zinc-600">No ice locations yet.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {locations.map((l) => (
              <div key={l.id} className="border rounded p-3 text-sm">
                <div className="font-medium">{l.name}</div>
                <div className="text-zinc-600 mt-1">
                  x:{l.xPercent ?? "—"} y:{l.yPercent ?? "—"} w:{l.wPercent ?? "—"} h:{l.hPercent ?? "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

