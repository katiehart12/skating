"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

type EnrollmentRow = {
  kidId: string;
  displayName: string;
  email: string;
  attendanceStatus: "PRESENT" | "ABSENT" | "LATE" | null;
};

type LevelSkill = { id: string; description: string; sortOrder?: number };

type EndCard = {
  id: string;
  kidId: string;
  passed: boolean;
  instructorNote: string | null;
  acquiredSkills: Array<{ acquired: boolean; levelSkill: { id: string; description: string } }>;
};

export default function InstructorSessionOccurrencePage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;
  const params = useParams<{ sessionOccurrenceId: string }>();
  const sessionOccurrenceId = params.sessionOccurrenceId;

  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [levelSkills, setLevelSkills] = useState<LevelSkill[]>([]);
  const [endCardByKidId, setEndCardByKidId] = useState<
    Record<string, { passed: boolean; acquiredSkillIds: string[]; instructorNote: string }>
  >({});
  const [error, setError] = useState<string | null>(null);

  const kidIds = useMemo(() => enrollments.map((e) => e.kidId), [enrollments]);

  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;
      if (role !== "INSTRUCTOR" && role !== "ADMIN") return;
      if (!sessionOccurrenceId) return;

      const [enrRes, endRes, skillsRes] = await Promise.all([
        fetch(`/api/instructor/session-occurrences/${sessionOccurrenceId}/enrollments`),
        fetch(`/api/instructor/session-occurrences/${sessionOccurrenceId}/endcards`),
        fetch(`/api/admin/session-occurrences/${sessionOccurrenceId}/level-skills`),
      ]);

      if (![enrRes, endRes, skillsRes].every((r) => r.ok)) {
        setError("Failed to load instructor session data.");
        return;
      }

      const enrJson = await enrRes.json();
      const endJson = await endRes.json();
      const skillsJson = await skillsRes.json();

      const enr = (enrJson.enrollments ?? []) as EnrollmentRow[];
      setEnrollments(enr);
      setLevelSkills(skillsJson.levelSkills ?? []);

      const cards = (endJson.endCards ?? []) as EndCard[];
      setEndCardByKidId(
        Object.fromEntries(
          cards.map((c) => [
            c.kidId,
            {
              passed: c.passed,
              acquiredSkillIds: c.acquiredSkills.filter((s) => s.acquired).map((s) => s.levelSkill.id),
              instructorNote: c.instructorNote ?? "",
            },
          ]),
        ),
      );
    }
    load();
  }, [role, sessionOccurrenceId, status]);

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

  async function saveEndCard(kidId: string) {
    if (!sessionOccurrenceId) return;
    setError(null);
    const state = endCardByKidId[kidId] ?? {
      passed: false,
      acquiredSkillIds: [],
      instructorNote: "",
    };

    const res = await fetch(`/api/instructor/session-occurrences/${sessionOccurrenceId}/endcards`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kidProfileId: kidId,
        passed: state.passed,
        instructorNote: state.instructorNote,
        acquiredLevelSkillIds: state.acquiredSkillIds,
      }),
    });

    if (!res.ok) {
      setError("Failed to save end card.");
    }
  }

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "INSTRUCTOR" && role !== "ADMIN") return <div className="p-6">Not authorized.</div>;
  if (!sessionOccurrenceId) return <div className="p-6">Missing session id.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-semibold">End Cards</h1>
      </div>

      {error ? <div className="text-red-600 text-sm mb-3">{error}</div> : null}

      {enrollments.length === 0 ? (
        <div className="text-zinc-600">No kids enrolled for this session yet.</div>
      ) : (
        <div className="flex flex-col gap-5">
          {enrollments.map((e) => {
            const endState =
              endCardByKidId[e.kidId] ?? {
                passed: false,
                acquiredSkillIds: [],
                instructorNote: "",
              };
            return (
              <div key={e.kidId} className="border rounded p-4 bg-white shadow">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <div className="font-medium">{e.displayName}</div>
                    <div className="text-xs text-zinc-600">{e.email}</div>
                    {e.attendanceStatus ? (
                      <div className="text-xs text-zinc-600">
                        Attendance: {e.attendanceStatus}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => saveEndCard(e.kidId)}
                    className="bg-sky-950 text-white rounded px-3 py-1.5 hover:bg-indigo-950"
                  >
                    Save
                  </button>
                </div>

                <label className="flex items-center gap-2 text-sm mb-3">
                  <input
                    type="checkbox"
                    checked={endState.passed}
                    onChange={(ev) =>
                      setEndCardByKidId((prev) => ({
                        ...prev,
                        [e.kidId]: {
                          ...(prev[e.kidId] ?? {
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

                <label className="block text-sm mb-3">
                  Instructor notes
                  <input
                    className="border rounded p-2 w-full mt-1"
                    value={endState.instructorNote}
                    onChange={(ev) =>
                      setEndCardByKidId((prev) => ({
                        ...prev,
                        [e.kidId]: { ...endState, instructorNote: ev.target.value },
                      }))
                    }
                  />
                </label>

                {levelSkills.length === 0 ? (
                  <div className="text-zinc-600 text-sm">No skills configured.</div>
                ) : (
                  <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                    {levelSkills.map((ls) => {
                      const checked = endState.acquiredSkillIds.includes(ls.id);
                      return (
                        <label key={ls.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSkill(e.kidId, ls.id)}
                          />
                          {ls.description}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

