"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

type Enrollment = {
  id: string;
  kid: { id: string; displayName: string; user: { email: string } };
  sessionOccurrence: { classSession: { level: { id: string; name: string } } };
};

type AttendanceRow = {
  kidId: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  note: string | null;
  isMakeUp: boolean;
  makeUpOriginalReference: string | null;
  makeUpNotes: string | null;
  kid: { id: string; displayName: string; user: { email: string } };
};

type AttendanceMeta = Pick<AttendanceRow, "status" | "isMakeUp" | "makeUpOriginalReference" | "makeUpNotes">;

type EndCard = {
  id: string;
  kidId: string;
  passed: boolean;
  instructorNote: string | null;
  acquiredSkills: Array<{ acquired: boolean; levelSkill: { id: string; description: string } }>;
};

type LevelSkill = { id: string; description: string; sortOrder: number };
type KidSummary = {
  id: string;
  email: string;
  displayName: string | null;
  kidProfileId: string | null;
};

const AttendanceOptions: Array<AttendanceRow["status"]> = ["PRESENT", "ABSENT", "LATE"];

export default function SessionOccurrenceAdminPage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;
  const params = useParams<{ sessionOccurrenceId: string }>();

  const sessionOccurrenceId = params.sessionOccurrenceId;

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceByKidId, setAttendanceByKidId] = useState<Record<string, AttendanceMeta>>({});
  const [endCardByKidId, setEndCardByKidId] = useState<
    Record<string, { passed: boolean; acquiredSkillIds: string[]; instructorNote: string }>
  >({});
  const [levelSkills, setLevelSkills] = useState<LevelSkill[]>([]);
  const [kids, setKids] = useState<KidSummary[]>([]);
  const [selectedKidProfileIds, setSelectedKidProfileIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kidIds = useMemo(() => enrollments.map((e) => e.kid.id), [enrollments]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (role !== "ADMIN") return;
    if (!sessionOccurrenceId) return;

    async function load() {
      const [enrRes, attRes, endRes, skillsRes] = await Promise.all([
        fetch(`/api/admin/session-occurrences/${sessionOccurrenceId}/enrollments`),
        fetch(`/api/admin/session-occurrences/${sessionOccurrenceId}/attendance`),
        fetch(`/api/instructor/session-occurrences/${sessionOccurrenceId}/endcards`),
        fetch(`/api/admin/session-occurrences/${sessionOccurrenceId}/level-skills`),
      ]);

      const kidsRes = await fetch("/api/admin/users?role=KID");

      if (![enrRes, attRes, endRes, skillsRes, kidsRes].every((r) => r.ok)) {
        setError("Failed to load session occurrence data.");
        return;
      }

      const enrJson = await enrRes.json();
      const attJson = await attRes.json();
      const endJson = await endRes.json();
      const skillsJson = await skillsRes.json();
      const kidsJson = await kidsRes.json();

      const enr = (enrJson.enrollments ?? []) as Enrollment[];
      setEnrollments(enr);

      const attendance = (attJson.attendance ?? []) as AttendanceRow[];
      setAttendanceByKidId(
        Object.fromEntries(attendance.map((a) => [a.kidId, {
          status: a.status,
          isMakeUp: a.isMakeUp,
          makeUpOriginalReference: a.makeUpOriginalReference,
          makeUpNotes: a.makeUpNotes,
        }])),
      );

      const cards = (endJson.endCards ?? []) as EndCard[];
      setEndCardByKidId(
        Object.fromEntries(
          cards.map((c) => [
            c.kidId,
            {
              passed: c.passed,
              acquiredSkillIds: c.acquiredSkills
                .filter((s) => s.acquired)
                .map((s) => s.levelSkill.id),
              instructorNote: c.instructorNote ?? "",
            },
          ]),
        ),
      );

      setLevelSkills(skillsJson.levelSkills ?? []);
      setKids(kidsJson.users ?? []);
    }
    load();
  }, [role, sessionOccurrenceId, status]);

  async function saveAttendance() {
    if (!sessionOccurrenceId) return;
    setLoading(true);
    setError(null);
    try {
      const records = kidIds.map((kidId) => ({
        kidProfileId: kidId,
        status: attendanceByKidId[kidId]?.status ?? "PRESENT",
        isMakeUp: attendanceByKidId[kidId]?.isMakeUp ?? false,
        makeUpOriginalReference: attendanceByKidId[kidId]?.makeUpOriginalReference ?? null,
        makeUpNotes: attendanceByKidId[kidId]?.makeUpNotes ?? null,
      }));

      const res = await fetch(
        `/api/admin/session-occurrences/${sessionOccurrenceId}/attendance`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ records }),
        },
      );

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error ? "Invalid attendance payload." : "Failed to save attendance.");
        return;
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveEndCard(kidId: string) {
    if (!sessionOccurrenceId) return;
    setError(null);

    const state = endCardByKidId[kidId] ?? { passed: false, acquiredSkillIds: [], instructorNote: "" };
    const res = await fetch(
      `/api/instructor/session-occurrences/${sessionOccurrenceId}/endcards`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kidProfileId: kidId,
          passed: state.passed,
          instructorNote: state.instructorNote,
          acquiredLevelSkillIds: state.acquiredSkillIds,
        }),
      },
    );

    if (!res.ok) {
      setError("Failed to save end card.");
    }
  }

  function toggleKidSelection(profileId: string) {
    setSelectedKidProfileIds((prev) => {
      if (prev.includes(profileId)) return prev.filter((id) => id !== profileId);
      return [...prev, profileId];
    });
  }

  async function enrollSelectedKids() {
    if (!sessionOccurrenceId) return;
    if (selectedKidProfileIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/session-occurrences/${sessionOccurrenceId}/enrollments`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kidProfileIds: selectedKidProfileIds }),
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error ? "Invalid enrollment payload." : "Failed to enroll kids.");
        return;
      }
      // Refresh enrollments/attendance/endcards.
      setSelectedKidProfileIds([]);
      const enrRes = await fetch(`/api/admin/session-occurrences/${sessionOccurrenceId}/enrollments`);
      const enrJson = await enrRes.json();
      setEnrollments(enrJson.enrollments ?? []);
    } finally {
      setLoading(false);
    }
  }

  function toggleSkill(kidId: string, skillId: string) {
    setEndCardByKidId((prev) => {
      const existing =
        prev[kidId] ?? { passed: false, acquiredSkillIds: [], instructorNote: "" };
      const set = new Set(existing.acquiredSkillIds);
      if (set.has(skillId)) set.delete(skillId);
      else set.add(skillId);
      return {
        ...prev,
        [kidId]: { ...existing, acquiredSkillIds: Array.from(set) },
      };
    });
  }

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "ADMIN") return <div className="p-6">Not authorized.</div>;
  if (!sessionOccurrenceId) return <div className="p-6">Missing session id.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-semibold">Session Occurrence</h1>
        <div className="text-sm text-zinc-600">Attendance + End Cards</div>
      </div>

      <nav className="mb-4 flex gap-3 text-sm">
        <a className="underline" href="/admin/occurrences">
          Back to Occurrences
        </a>
        <a
          className="underline"
          href={`/admin/session-occurrences/${sessionOccurrenceId}/print`}
        >
          Print report
        </a>
      </nav>

      {error ? <div className="text-red-600 text-sm mb-3">{error}</div> : null}

      <section className="bg-white shadow rounded p-4 mb-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-semibold">Attendance</h2>
          <button
            className="bg-sky-950 text-white rounded px-3 py-2 disabled:opacity-50 hover:bg-indigo-950"
            onClick={saveAttendance}
            disabled={loading || kidIds.length === 0}
            type="button"
          >
            {loading ? "Saving..." : "Save attendance"}
          </button>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-zinc-600">No enrolled kids yet.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Kid</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">End Card Pass</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => {
                  const kidId = e.kid.id;
                  const attendance =
                    attendanceByKidId[kidId] ?? ({
                      status: "PRESENT",
                      isMakeUp: false,
                      makeUpOriginalReference: null,
                      makeUpNotes: null,
                    } as AttendanceMeta);
                  const endState =
                    endCardByKidId[kidId] ?? {
                      passed: false,
                      acquiredSkillIds: [],
                      instructorNote: "",
                    };
                  return (
                    <tr key={kidId} className="border-b">
                      <td className="p-2">
                        <div className="font-medium">{e.kid.displayName}</div>
                        <div className="text-xs text-zinc-600">{e.kid.user.email}</div>
                      </td>
                      <td className="p-2">
                        <select
                          className="border rounded p-1"
                          value={attendance.status}
                          onChange={(ev) =>
                            setAttendanceByKidId((prev) => ({
                              ...prev,
                              [kidId]: {
                                ...(prev[kidId] ?? {
                                  status: "PRESENT",
                                  isMakeUp: false,
                                  makeUpOriginalReference: null,
                                  makeUpNotes: null,
                                }),
                                status: ev.target.value as AttendanceRow["status"],
                              },
                            }))
                          }
                        >
                          {AttendanceOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>

                        <div className="mt-2 flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-xs text-zinc-700">
                            <input
                              type="checkbox"
                              checked={attendance.isMakeUp}
                              onChange={(ev) =>
                                setAttendanceByKidId((prev) => ({
                                  ...prev,
                                  [kidId]: {
                                    ...(prev[kidId] ?? attendance),
                                    isMakeUp: ev.target.checked,
                                    makeUpOriginalReference: ev.target.checked
                                      ? attendance.makeUpOriginalReference
                                      : null,
                                    makeUpNotes: ev.target.checked ? attendance.makeUpNotes : null,
                                  },
                                }))
                              }
                            />
                            Make-up attendance
                          </label>

                          <input
                            className="border rounded p-1 text-xs disabled:opacity-50"
                            disabled={!attendance.isMakeUp}
                            placeholder="Original missed class (e.g., 3/12 Beginner)"
                            value={attendance.makeUpOriginalReference ?? ""}
                            onChange={(ev) =>
                              setAttendanceByKidId((prev) => ({
                                ...prev,
                                [kidId]: {
                                  ...(prev[kidId] ?? attendance),
                                  makeUpOriginalReference: ev.target.value || null,
                                },
                              }))
                            }
                          />

                          <input
                            className="border rounded p-1 text-xs disabled:opacity-50"
                            disabled={!attendance.isMakeUp}
                            placeholder="Make-up notes (optional)"
                            value={attendance.makeUpNotes ?? ""}
                            onChange={(ev) =>
                              setAttendanceByKidId((prev) => ({
                                ...prev,
                                [kidId]: {
                                  ...(prev[kidId] ?? attendance),
                                  makeUpNotes: ev.target.value || null,
                                },
                              }))
                            }
                          />
                        </div>
                      </td>
                      <td className="p-2">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={endState.passed}
                            onChange={(ev) =>
                              setEndCardByKidId((prev) => ({
                                ...prev,
                                [kidId]: {
                                  ...(prev[kidId] ?? {
                                    passed: false,
                                    acquiredSkillIds: [],
                                    instructorNote: "",
                                  }),
                                  passed: ev.target.checked,
                                },
                              }))
                            }
                          />
                          Pass next level
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white shadow rounded p-4 mb-6">
        <h2 className="font-semibold mb-3">Enroll Kids</h2>
        {kids.length === 0 ? (
          <div className="text-zinc-600">No kids created yet.</div>
        ) : (
          <div className="grid gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {kids.map((k) => {
                const pid = k.kidProfileId;
                if (!pid) return null;
                const checked = selectedKidProfileIds.includes(pid);
                return (
                  <label key={pid} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleKidSelection(pid)}
                    />
                    <span>
                      {k.displayName ?? k.email} ({k.email})
                    </span>
                  </label>
                );
              })}
            </div>
            <button
              className="bg-sky-950 text-white rounded px-3 py-2 disabled:opacity-50 hover:bg-indigo-950"
              type="button"
              onClick={enrollSelectedKids}
              disabled={loading || selectedKidProfileIds.length === 0}
            >
              {loading ? "Saving..." : `Enroll selected (${selectedKidProfileIds.length})`}
            </button>
          </div>
        )}
      </section>

      <section className="bg-white shadow rounded p-4">
        <h2 className="font-semibold mb-3">End Cards (skills)</h2>
        {levelSkills.length === 0 ? (
          <div className="text-zinc-600">No skills configured for this level yet.</div>
        ) : (
          <div className="flex flex-col gap-5">
            {enrollments.map((e) => {
              const kidId = e.kid.id;
              const endState =
                endCardByKidId[kidId] ?? {
                  passed: false,
                  acquiredSkillIds: [],
                  instructorNote: "",
                };

              return (
                <div key={kidId} className="border rounded p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <div className="font-medium">{e.kid.displayName}</div>
                      <div className="text-xs text-zinc-600">{e.kid.user.email}</div>
                    </div>
                    <button
                      className="bg-sky-950 text-white rounded px-3 py-1.5 disabled:opacity-50 hover:bg-indigo-950"
                      type="button"
                      onClick={() => saveEndCard(kidId)}
                    >
                      Save end card
                    </button>
                  </div>

                  <label className="block text-sm mb-2">
                    Instructor notes
                    <input
                      className="border rounded p-2 w-full mt-1"
                      value={endState.instructorNote}
                      onChange={(ev) =>
                        setEndCardByKidId((prev) => ({
                          ...prev,
                          [kidId]: { ...endState, instructorNote: ev.target.value },
                        }))
                      }
                    />
                  </label>

                  <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                    {levelSkills.map((ls) => {
                      const checked = endState.acquiredSkillIds.includes(ls.id);
                      return (
                        <label key={ls.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSkill(kidId, ls.id)}
                          />
                          {ls.description}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

