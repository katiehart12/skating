"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type UserRole = "ADMIN" | "INSTRUCTOR" | "KID" | "PARENT";

type IceShowEvent = {
  iceShowId: string;
  iceShowTitle: string;
  showDate: string;
  partName: string;
  startTime: string;
  endTime: string;
  locationName: string;
  kidId: string;
  kidDisplayName: string;
  leadContact: { name: string | null; email: string } | null;
  showNotes: string | null;
  icsUrl: string;
};

export default function ParentIceShowsPage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;

  const [events, setEvents] = useState<IceShowEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;
      if (role !== "PARENT") return;
      const res = await fetch("/api/parent/ice-shows");
      if (!res.ok) {
        setError("Failed to load ice show events.");
        return;
      }
      const json = await res.json();
      setEvents(json.events ?? []);
    }
    load();
  }, [role, status]);

  const grouped = useMemo(() => {
    const map = new Map<string, IceShowEvent[]>();
    for (const ev of events) {
      const key = ev.iceShowId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return Array.from(map.entries())
      .map(([iceShowId, items]) => ({ iceShowId, items }))
      .sort((a, b) => (a.items[0].showDate < b.items[0].showDate ? -1 : 1));
  }, [events]);

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "PARENT") return <div className="p-6">Not authorized.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Ice Shows</h1>
        <a className="underline text-sm text-zinc-700" href="/parent">
          Back to schedule
        </a>
      </div>

      {error ? <div className="text-red-600 text-sm mb-3">{error}</div> : null}

      {grouped.length === 0 ? (
        <div className="text-zinc-600">No ice show events yet.</div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map((g) => (
            <section key={g.iceShowId} className="bg-white shadow rounded p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="font-semibold text-lg">{g.items[0].iceShowTitle}</div>
                  <div className="text-sm text-zinc-600">
                    {new Date(g.items[0].showDate).toLocaleDateString()} {g.items[0].startTime}-{g.items[0].endTime}
                  </div>
                </div>
                {g.items[0].showNotes ? (
                  <div className="text-xs text-zinc-600 max-w-xs whitespace-pre-wrap">
                    Notes: {g.items[0].showNotes}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-3">
                {g.items.map((ev) => (
                  <div key={`${ev.kidId}:${ev.partName}`} className="border rounded p-3">
                    <div className="font-medium">{ev.kidDisplayName}</div>
                    <div className="text-sm text-zinc-600">
                      {ev.partName} | {ev.locationName}
                    </div>
                    {ev.leadContact ? (
                      <div className="text-sm text-zinc-700 mt-1">
                        Lead: {ev.leadContact.name ?? ev.leadContact.email} ({ev.leadContact.email})
                      </div>
                    ) : null}

                    <div className="mt-3">
                      <a
                        href={ev.icsUrl}
                        className="inline-flex items-center justify-center bg-sky-950 text-white rounded px-3 py-2 text-sm hover:bg-indigo-950"
                      >
                        Download .ics
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

