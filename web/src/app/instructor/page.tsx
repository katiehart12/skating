"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function InstructorPage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;

  const [sessionOccurrences, setSessionOccurrences] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;
      if (role !== "INSTRUCTOR" && role !== "ADMIN") return;

      const res = await fetch("/api/instructor/session-occurrences");
      if (!res.ok) {
        setError("Failed to load assigned sessions.");
        return;
      }
      const json = await res.json();
      setSessionOccurrences(json.sessionOccurrences ?? []);
    }
    load();
  }, [role, status]);

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "INSTRUCTOR" && role !== "ADMIN") return <div className="p-6">Not authorized.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Instructor</h1>
        <div className="text-sm text-zinc-600">End Cards</div>
      </div>

      {error ? <div className="text-red-600 text-sm mb-3">{error}</div> : null}

      {sessionOccurrences.length === 0 ? (
        <div className="text-zinc-600">No sessions assigned yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessionOccurrences.map((so) => (
            <a
              key={so.id}
              href={`/instructor/session-occurrences/${so.id}`}
              className="border rounded p-3 bg-white shadow hover:bg-zinc-50"
            >
              <div className="font-medium">
                {so.classOccurrence.classTemplate.name} - {new Date(so.classOccurrence.date).toLocaleDateString()}
              </div>
              <div className="text-sm text-zinc-600 mt-1">
                {so.classSession.level.name} | {so.classSession.iceLocation.name} | {so.classOccurrence.classTemplate.startTime}-{so.classOccurrence.classTemplate.endTime}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

