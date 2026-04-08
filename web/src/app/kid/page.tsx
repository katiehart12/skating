"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type ScheduleItem = {
  sessionOccurrenceId: string;
  date: string;
  classTemplate: { name: string; startTime: string; endTime: string };
  level: { name: string };
  iceLocation: { name: string; xPercent?: number; yPercent?: number; wPercent?: number; hPercent?: number };
  attendanceStatus: string | null;
  makeUp: boolean;
  makeUpOriginalReference: string | null;
  endCard: {
    passed: boolean;
    instructorNote: string | null;
    skills: Array<{ description: string; acquired: boolean }>;
  } | null;
};

function AttendanceBadge({ status }: { status: string | null }) {
  if (!status) return <span className="badge badge-neutral">Not marked</span>;
  if (status === "PRESENT") return <span className="badge badge-present">Present</span>;
  if (status === "ABSENT") return <span className="badge badge-absent">Absent</span>;
  if (status === "LATE") return <span className="badge badge-late">Late</span>;
  return <span className="badge badge-neutral">{status}</span>;
}

export default function KidPage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;
  const name = (data?.user as any)?.name as string | undefined;

  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;
      if (role !== "KID") return;
      const res = await fetch("/api/kid/schedule");
      if (!res.ok) {
        setError("Failed to load your schedule.");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setItems(json.items ?? []);
      setLoading(false);
    }
    load();
  }, [role, status]);

  if (status === "loading" || loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="h-7 bg-sky-100 rounded w-40 animate-pulse mb-2" />
        <div className="h-4 bg-sky-50 rounded w-64 animate-pulse mb-8" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4 mb-4 animate-pulse">
            <div className="h-5 bg-sky-50 rounded w-48 mb-2" />
            <div className="h-4 bg-zinc-50 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (role !== "KID") return <div className="p-8 text-zinc-600">Not authorized.</div>;

  const today = new Date();
  const upcoming = items.filter((i) => new Date(i.date) >= today);
  const past = items.filter((i) => new Date(i.date) < today);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="rounded-xl p-5 mb-6 bg-gradient-to-br from-sky-950 via-indigo-950 to-sky-900 text-white">
        <div className="text-3xl mb-1" aria-hidden>⛸️</div>
        <h1 className="text-2xl font-semibold">
          {name ? `Hey, ${name}!` : "My Schedule"}
        </h1>
        <p className="text-white/70 text-sm mt-1">Your skating classes and skill progress</p>
      </div>

      {error ? (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="card p-8 text-center text-zinc-500">
          <div className="text-4xl mb-3">🏒</div>
          <div className="font-medium">No classes yet</div>
          <div className="text-sm mt-1">Ask your instructor or admin to enroll you in a session.</div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-sky-950">Upcoming</h2>
              <div className="flex flex-col gap-3">
                {upcoming.map((item) => (
                  <div key={item.sessionOccurrenceId} className="card card-accent p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sky-950">
                          {new Date(item.date).toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-sm text-zinc-500 mt-0.5">
                          {item.classTemplate.startTime}–{item.classTemplate.endTime} ·{" "}
                          {item.level.name} · {item.iceLocation.name}
                        </div>
                      </div>
                      <AttendanceBadge status={item.attendanceStatus} />
                    </div>
                    {item.makeUp && (
                      <span className="badge badge-pending mt-2 text-xs inline-flex">Make-up session</span>
                    )}
                    {/* Rink mini-map */}
                    {item.iceLocation.xPercent != null && (
                      <div className="mt-3">
                        <div className="text-xs text-zinc-400 mb-1">Rink location</div>
                        <div className="relative border border-sky-100 rounded bg-sky-50/50" style={{ width: 160, height: 80 }}>
                          <div
                            className="absolute border-2 border-sky-500 bg-sky-400/20 rounded-sm"
                            style={{
                              left: `${item.iceLocation.xPercent ?? 0}%`,
                              top: `${item.iceLocation.yPercent ?? 0}%`,
                              width: `${item.iceLocation.wPercent ?? 0}%`,
                              height: `${item.iceLocation.hPercent ?? 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-sky-950">Past classes</h2>
              <div className="flex flex-col gap-3">
                {[...past].reverse().map((item) => (
                  <div key={item.sessionOccurrenceId} className="card p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-medium text-zinc-700">
                          {new Date(item.date).toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-sm text-zinc-500 mt-0.5">
                          {item.level.name} · {item.iceLocation.name}
                        </div>
                      </div>
                      <AttendanceBadge status={item.attendanceStatus} />
                    </div>

                    {item.endCard ? (
                      <div className="mt-2 pt-2 border-t border-zinc-100">
                        {item.endCard.passed && (
                          <div className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5 mb-2">
                            <span aria-hidden>🏅</span> Passed to next level
                          </div>
                        )}
                        {item.endCard.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {item.endCard.skills.map((s, i) => (
                              <span
                                key={i}
                                className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${
                                  s.acquired
                                    ? "bg-sky-100 text-sky-800"
                                    : "bg-zinc-100 text-zinc-400 line-through"
                                }`}
                              >
                                {s.description}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.endCard.instructorNote && (
                          <p className="text-xs text-zinc-500 mt-2 italic border-l-2 border-sky-200 pl-2">
                            {item.endCard.instructorNote}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400 mt-1 pt-2 border-t border-zinc-100">
                        End-card not submitted yet
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
