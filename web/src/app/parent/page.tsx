"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

export default function ParentPage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;

  const [kids, setKids] = useState<Array<{ kidId: string; displayName: string; email: string }>>([]);
  const [items, setItems] = useState<any[]>([]);
  const [activeKidId, setActiveKidId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;
      if (role !== "PARENT") return;

      const [kidsRes, scheduleRes] = await Promise.all([
        fetch("/api/parent/my-kids"),
        fetch("/api/parent/schedule"),
      ]);

      if (!kidsRes.ok || !scheduleRes.ok) {
        setError("Failed to load parent schedule.");
        return;
      }

      const kidsJson = await kidsRes.json();
      const scheduleJson = await scheduleRes.json();

      const k = kidsJson.kids ?? [];
      setKids(k);
      setItems(scheduleJson.items ?? []);
      if (!activeKidId && k[0]?.kidId) setActiveKidId(k[0].kidId);
    }
    load();
  }, [activeKidId, role, status]);

  const filtered = useMemo(() => {
    if (!activeKidId) return items;
    return items.filter((it) => it.kidId === activeKidId);
  }, [activeKidId, items]);

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "PARENT") return <div className="p-6">Not authorized.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Parent</h1>
          <div className="text-sm text-zinc-600">Schedule + End Cards</div>
        </div>
        <a className="underline text-sm text-zinc-700" href="/parent/ice-shows">
          Ice Shows
        </a>
      </div>

      {error ? <div className="text-red-600 text-sm mb-3">{error}</div> : null}

      {kids.length === 0 ? (
        <div className="bg-white shadow rounded p-4">
          <div className="font-semibold text-sky-950">No kids linked yet</div>
          <div className="text-sm text-zinc-700 mt-1">
            To see schedules and end-card feedback, your skating school admin needs to connect your account to your child(ren).
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="border border-sky-200 rounded p-3 bg-sky-50/50">
              <div className="text-sm font-medium text-sky-950">Contact your skating school admin</div>
              <div className="text-sm text-zinc-700 mt-2 space-y-1">
                <div>
                  <span className="font-medium">Email:</span> admin@frankskating.local
                </div>
                <div>
                  <span className="font-medium">Phone:</span> (812) 349-3740
                </div>
                <div className="text-xs text-zinc-600 pt-1">
                  (Example contact info for MVP — replace with your school’s real admin contact.)
                </div>
              </div>
            </div>

            <div className="border border-sky-200 rounded p-3 bg-white">
              <div className="text-sm font-medium text-sky-950">What to send</div>
              <ul className="text-sm text-zinc-700 mt-2 space-y-1 list-disc pl-5">
                <li>Your account email</li>
                <li>Your child’s name(s)</li>
                <li>Which class/day/time you’re enrolled in (if known)</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded p-4 mb-4">
          <div className="flex gap-2 flex-wrap">
            {kids.map((k) => (
              <button
                key={k.kidId}
                className={
                  activeKidId === k.kidId
                    ? "bg-sky-950 text-white rounded px-3 py-1 text-sm"
                    : "border border-sky-200 rounded px-3 py-1 text-sm hover:bg-sky-50"
                }
                onClick={() => setActiveKidId(k.kidId)}
                type="button"
              >
                {k.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      <section className="bg-white shadow rounded p-4 mt-4">
        <h2 className="font-semibold mb-2 text-sky-950">Levels & Classes (examples)</h2>
        <div className="text-sm text-zinc-700">
          Here’s how most skating schools structure levels and sessions. These are sample descriptions to help parents understand what to expect.
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="border border-sky-200 rounded p-3 bg-sky-50/50">
            <div className="text-sm font-medium text-sky-950">Example levels</div>
            <ul className="text-sm text-zinc-700 mt-2 space-y-2">
              <li>
                <span className="font-medium">Beginner:</span> balance, safe falling, basic forward skating, stopping.
              </li>
              <li>
                <span className="font-medium">Intermediate:</span> backward skating, turns, crossovers, controlled stops.
              </li>
              <li>
                <span className="font-medium">Advanced:</span> speed control, advanced turns, performance/routine skills.
              </li>
            </ul>
          </div>

          <div className="border border-sky-200 rounded p-3 bg-white">
            <div className="text-sm font-medium text-sky-950">Example class format</div>
            <ul className="text-sm text-zinc-700 mt-2 space-y-2">
              <li>
                <span className="font-medium">Weekly session:</span> one day/time slot (e.g., Wednesdays 6:30–7:20pm).
              </li>
              <li>
                <span className="font-medium">Parallel levels:</span> multiple levels can run at the same time in different rink areas.
              </li>
              <li>
                <span className="font-medium">End-card feedback:</span> instructors mark skills achieved and “pass/not yet” for next level.
              </li>
              <li>
                <span className="font-medium">Make-ups (MVP):</span> if a class is missed, admin can record a one-off make-up via attendance notes.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 border border-sky-200 rounded p-3 bg-sky-50/50">
          <div className="text-sm font-medium text-sky-950">Sample weekly schedule blocks</div>
          <div className="text-sm text-zinc-700 mt-2 grid gap-2 sm:grid-cols-2">
            <div className="border border-sky-200 rounded p-2 bg-white">
              Mon 5:30–6:20pm — Beginner / Intermediate
            </div>
            <div className="border border-sky-200 rounded p-2 bg-white">
              Wed 6:30–7:20pm — Beginner / Intermediate / Advanced
            </div>
            <div className="border border-sky-200 rounded p-2 bg-white">
              Sat 9:00–9:50am — Beginner / Intermediate
            </div>
            <div className="border border-sky-200 rounded p-2 bg-white">
              Sat 10:00–10:50am — Advanced / Ice Show practice (seasonal)
            </div>
          </div>
          <div className="text-xs text-zinc-600 mt-2">
            (Examples only — your admin will set the real schedule and locations.)
          </div>
        </div>
      </section>

      {kids.length === 0 ? null : (
        <section className="bg-white shadow rounded p-4">
          <h2 className="font-semibold mb-3">Upcoming Sessions</h2>
          {filtered.length === 0 ? (
            <div className="text-zinc-600">No scheduled sessions yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((it) => (
                <div key={it.sessionOccurrenceId} className="border rounded p-3">
                  <div className="font-medium">
                    {new Date(it.date).toLocaleDateString()} - {it.classTemplate.startTime}-{it.classTemplate.endTime}
                  </div>
                  <div className="text-sm text-zinc-600">
                    {it.level.name} | {it.iceLocation.name}
                  </div>
                  <div className="mt-3">
                    <div className="text-xs text-zinc-600 mb-1">Rink location</div>
                    <div className="relative border rounded bg-zinc-50" style={{ width: 180, height: 90 }}>
                      <div
                        className="absolute border-2 border-sky-900 bg-sky-400/15"
                        style={{
                          left: `${it.iceLocation.xPercent ?? 0}%`,
                          top: `${it.iceLocation.yPercent ?? 0}%`,
                          width: `${it.iceLocation.wPercent ?? 0}%`,
                          height: `${it.iceLocation.hPercent ?? 0}%`,
                        }}
                        title={it.iceLocation.name}
                      />
                    </div>
                  </div>
                  <div className="text-sm mt-2">
                    Attendance:{" "}
                    <b>
                      {it.attendanceStatus ?? "Not marked"}
                    </b>
                  </div>
                  {it.makeUp ? (
                    <div className="text-xs text-zinc-600 mt-1">
                      Make-up: {it.makeUpOriginalReference ?? "original class"}
                    </div>
                  ) : null}
                  <div className="text-sm mt-2">
                    End Card:{" "}
                    {it.endCard ? (
                      <b>{it.endCard.passed ? "Pass" : "Not yet"}</b>
                    ) : (
                      <span className="text-zinc-600">Not submitted</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

