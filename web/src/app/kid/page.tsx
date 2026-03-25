"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function KidPage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;

  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;
      if (role !== "KID") return;

      const res = await fetch("/api/kid/schedule");
      if (!res.ok) {
        setError("Failed to load your schedule.");
        return;
      }
      const json = await res.json();
      setItems(json.items ?? []);
    }
    load();
  }, [role, status]);

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "KID") return <div className="p-6">Not authorized.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Kid</h1>
      <div className="text-sm text-zinc-600 mb-4">Schedule + End Cards</div>

      {error ? <div className="text-red-600 text-sm mb-3">{error}</div> : null}

      <section className="bg-white shadow rounded p-4">
        <h2 className="font-semibold mb-3">Sessions</h2>
        {items.length === 0 ? (
          <div className="text-zinc-600">No sessions scheduled yet.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((it) => (
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
                  Attendance: <b>{it.attendanceStatus ?? "Not marked"}</b>
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
    </div>
  );
}

