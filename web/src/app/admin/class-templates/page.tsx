"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSession } from "next-auth/react";

type LevelSkill = { id: string; description: string; sortOrder: number };
type Level = { id: string; name: string; sortOrder: number; levelSkills: LevelSkill[] };

type IceLocation = { id: string; name: string };

type InstructorSummary = {
  id: string;
  email: string;
  instructorProfileId: string | null;
  displayName: string | null;
};

type ClassTemplate = {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  sessionGroups: Array<{
    id: string;
    level: { id: string; name: string };
    iceLocation: IceLocation;
    instructorLinks: Array<{ instructor: { id: string; userId: string } }>;
  }>;
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ClassTemplatesPage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;

  const [templates, setTemplates] = useState<ClassTemplate[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [iceLocations, setIceLocations] = useState<IceLocation[]>([]);
  const [instructors, setInstructors] = useState<InstructorSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Create template form
  const [tplName, setTplName] = useState("");
  const [tplDay, setTplDay] = useState(0);
  const [tplStart, setTplStart] = useState("18:00");
  const [tplEnd, setTplEnd] = useState("19:00");

  // Create session group form
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [sessionLevelId, setSessionLevelId] = useState<string>("");
  const [sessionIceLocationId, setSessionIceLocationId] = useState<string>("");
  const [selectedInstructorProfileIds, setSelectedInstructorProfileIds] = useState<string[]>([]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId],
  );

  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;
      if (role !== "ADMIN") return;

      const [tplRes, levelsRes, iceRes, instructorRes] = await Promise.all([
        fetch("/api/admin/class-templates"),
        fetch("/api/admin/levels"),
        fetch("/api/admin/ice-locations"),
        fetch("/api/admin/users?role=INSTRUCTOR"),
      ]);

      if (![tplRes, levelsRes, iceRes, instructorRes].every((r) => r.ok)) {
        setError("Failed to load setup data.");
        return;
      }

      const tplJson = await tplRes.json();
      const levelsJson = await levelsRes.json();
      const iceJson = await iceRes.json();
      const instJson = await instructorRes.json();

      setTemplates(tplJson.templates ?? []);
      setLevels(levelsJson.levels ?? []);
      setIceLocations(iceJson.locations ?? []);
      setInstructors(instJson.users ?? []);
    }
    load();
  }, [role, status]);

  useEffect(() => {
    if (!selectedTemplateId && templates[0]?.id) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [selectedTemplateId, templates]);

  useEffect(() => {
    if (!sessionLevelId && levels[0]?.id) setSessionLevelId(levels[0].id);
    if (!sessionIceLocationId && iceLocations[0]?.id) setSessionIceLocationId(iceLocations[0].id);
  }, [iceLocations, levels, sessionIceLocationId, sessionLevelId]);

  async function createTemplate(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/admin/class-templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: tplName,
        dayOfWeek: tplDay,
        startTime: tplStart,
        endTime: tplEnd,
      }),
    });
    if (!res.ok) {
      setError("Failed to create template.");
      return;
    }
    const json = await res.json();
    setTemplates((prev) => [json.template, ...prev]);
    setTplName("");
  }

  function toggleInstructor(profileId: string) {
    setSelectedInstructorProfileIds((prev) => {
      if (prev.includes(profileId)) return prev.filter((id) => id !== profileId);
      return [...prev, profileId];
    });
  }

  async function createSessionGroup(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedTemplateId || !sessionLevelId || !sessionIceLocationId) {
      setError("Select template, level, and ice location.");
      return;
    }
    if (selectedInstructorProfileIds.length < 1) {
      setError("Each session group must have at least 1 instructor.");
      return;
    }

    const res = await fetch(`/api/admin/class-templates/${selectedTemplateId}/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        levelId: sessionLevelId,
        iceLocationId: sessionIceLocationId,
        instructorProfileIds: selectedInstructorProfileIds,
      }),
    });

    if (!res.ok) {
      setError("Failed to create session group.");
      return;
    }

    const json = await res.json();
    const createdGroup = json.sessionGroup as ClassTemplate["sessionGroups"][number];

    setTemplates((prev) =>
      prev.map((t) =>
        t.id === selectedTemplateId
          ? { ...t, sessionGroups: [...t.sessionGroups, createdGroup] }
          : t,
      ),
    );

    setSelectedInstructorProfileIds([]);
  }

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "ADMIN") return <div className="p-6">Not authorized.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-semibold">Class Templates</h1>
        <div className="text-sm text-zinc-600">
          Parallel sessions by level (same day/time)
        </div>
      </div>

      <nav className="mb-6 flex gap-3 text-sm">
        <a className="underline" href="/admin">
          Levels
        </a>
        <a className="underline" href="/admin/occurrences">
          Occurrences
        </a>
      </nav>

      {error ? <div className="text-red-600 text-sm mb-3">{error}</div> : null}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="bg-white shadow rounded p-4">
          <h2 className="font-semibold mb-3">Create Template</h2>
          <form onSubmit={createTemplate} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Name
              <input
                className="border rounded p-2"
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Day of week
              <select
                className="border rounded p-2"
                value={tplDay}
                onChange={(e) => setTplDay(parseInt(e.target.value, 10))}
              >
                {dayNames.map((d, idx) => (
                  <option key={d} value={idx}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Start time
                <input
                  className="border rounded p-2"
                  value={tplStart}
                  onChange={(e) => setTplStart(e.target.value)}
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                End time
                <input
                  className="border rounded p-2"
                  value={tplEnd}
                  onChange={(e) => setTplEnd(e.target.value)}
                  required
                />
              </label>
            </div>
            <button className="bg-sky-950 text-white rounded px-3 py-2 hover:bg-indigo-950" type="submit">
              Create template
            </button>
          </form>
        </section>

        <section className="bg-white shadow rounded p-4">
          <h2 className="font-semibold mb-3">Create Session Group</h2>
          <form onSubmit={createSessionGroup} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Template
              <select
                className="border rounded p-2"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({dayNames[t.dayOfWeek]} {t.startTime})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Level
              <select
                className="border rounded p-2"
                value={sessionLevelId}
                onChange={(e) => setSessionLevelId(e.target.value)}
              >
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Ice location
              <select
                className="border rounded p-2"
                value={sessionIceLocationId}
                onChange={(e) => setSessionIceLocationId(e.target.value)}
              >
                {iceLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="text-sm font-medium">Instructors (required)</div>
            <div className="grid gap-2">
              {instructors.map((inst) => {
                const pid = inst.instructorProfileId;
                if (!pid) return null;
                return (
                  <label key={inst.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedInstructorProfileIds.includes(pid)}
                      onChange={() => toggleInstructor(pid)}
                    />
                    <span>
                      {inst.displayName ?? inst.email} ({inst.email})
                    </span>
                  </label>
                );
              })}
            </div>

            <button className="bg-sky-950 text-white rounded px-3 py-2 hover:bg-indigo-950" type="submit">
              Create session group
            </button>
          </form>
        </section>
      </div>

      <section className="mt-6 bg-white shadow rounded p-4">
        <h2 className="font-semibold mb-3">Existing Templates</h2>
        {templates.length === 0 ? (
          <div className="text-zinc-600">No templates yet.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {templates.map((t) => (
              <div key={t.id} className="border rounded p-3">
                <div className="font-medium">
                  {t.name} - {dayNames[t.dayOfWeek]} {t.startTime}-{t.endTime}
                </div>
                <div className="text-sm text-zinc-600 mt-1">
                  Parallel sessions: {t.sessionGroups.length}
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {t.sessionGroups.map((sg) => (
                    <div key={sg.id} className="bg-zinc-50 border rounded p-2 text-sm">
                      <div>
                        Level: <b>{sg.level.name}</b> | Ice: <b>{sg.iceLocation.name}</b>
                      </div>
                      <div className="text-zinc-600">
                        Instructors: {sg.instructorLinks.length}
                      </div>
                    </div>
                  ))}
                  {t.sessionGroups.length === 0 ? (
                    <div className="text-zinc-600">No session groups yet.</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

