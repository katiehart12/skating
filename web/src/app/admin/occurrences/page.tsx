"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSession } from "next-auth/react";

type Occurrence = {
  id: string;
  date: string;
  classTemplate: { id: string; name: string; startTime: string; endTime: string; dayOfWeek: number };
  sessionOccurrences: Array<{
    id: string;
    kind: "NORMAL" | "MAKE_UP";
    classSession: {
      id: string;
      level: { id: string; name: string };
      iceLocation: { id: string; name: string };
    };
  }>;
};

type TemplateSummary = {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function OccurrencesPage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;

  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId],
  );

  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;
      if (role !== "ADMIN") return;

      const [tplRes, occRes] = await Promise.all([
        fetch("/api/admin/class-templates"),
        fetch("/api/admin/class-occurrences"),
      ]);

      if (!tplRes.ok || !occRes.ok) {
        setError("Failed to load occurrences setup data.");
        return;
      }

      const tplJson = await tplRes.json();
      const occJson = await occRes.json();
      const allTemplates = (tplJson.templates ?? []) as any[];

      setTemplates(
        allTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          dayOfWeek: t.dayOfWeek,
          startTime: t.startTime,
          endTime: t.endTime,
        })),
      );
      setOccurrences(occJson.occurrences ?? []);
    }
    load();
  }, [role, status]);

  useEffect(() => {
    if (!templateId && templates[0]?.id) setTemplateId(templates[0].id);
  }, [templateId, templates]);

  async function createOccurrence(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!templateId || !date) {
      setError("Select template and date.");
      return;
    }

    const res = await fetch("/api/admin/class-occurrences", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        classTemplateId: templateId,
        date: new Date(date + "T00:00:00").toISOString(),
        kind: "NORMAL",
      }),
    });

    if (!res.ok) {
      setError("Failed to create occurrence (maybe it already exists).");
      return;
    }

    const json = await res.json();
    const created = json.occurrence as Occurrence;
    setOccurrences((prev) => [created, ...prev].sort((a, b) => (a.date < b.date ? -1 : 1)));
    setDate("");
  }

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "ADMIN") return <div className="p-6">Not authorized.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Occurrences</h1>
      </div>

      <nav className="mb-6 flex gap-3 text-sm">
        <a className="underline" href="/admin">
          Levels
        </a>
        <a className="underline" href="/admin/class-templates">
          Templates
        </a>
      </nav>

      {error ? <div className="text-red-600 text-sm mb-3">{error}</div> : null}

      <section className="bg-white shadow rounded p-4 mb-6">
        <h2 className="font-semibold mb-3">Create Occurrence</h2>
        <form onSubmit={createOccurrence} className="flex flex-col gap-3 md:grid md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Template
            <select
              className="border rounded p-2"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({dayNames[t.dayOfWeek]} {t.startTime})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Date
            <input
              className="border rounded p-2"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <button className="bg-sky-950 text-white rounded px-3 py-2 mt-2 md:col-span-3 hover:bg-indigo-950" type="submit">
            Create
          </button>
        </form>
        {selectedTemplate ? (
          <div className="text-sm text-zinc-600 mt-2">
            Creates parallel level sessions for each session group.
          </div>
        ) : null}
      </section>

      <section className="bg-white shadow rounded p-4">
        <h2 className="font-semibold mb-3">Scheduled Occurrences</h2>
        {occurrences.length === 0 ? (
          <div className="text-zinc-600">No occurrences yet.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {occurrences.map((occ) => (
              <div key={occ.id} className="border rounded p-3">
                <div className="font-medium">
                  {occ.classTemplate.name} - {new Date(occ.date).toLocaleDateString()}
                </div>
                <div className="text-sm text-zinc-600 mt-1">
                  {occ.classTemplate.startTime}-{occ.classTemplate.endTime}
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  {occ.sessionOccurrences.map((so) => (
                    <a
                      key={so.id}
                      href={`/admin/session-occurrences/${so.id}`}
                      className="border rounded p-2 bg-zinc-50 hover:bg-zinc-100 text-sm"
                    >
                      <div className="font-medium">{so.classSession.level.name}</div>
                      <div className="text-zinc-600">{so.classSession.iceLocation.name}</div>
                    </a>
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

