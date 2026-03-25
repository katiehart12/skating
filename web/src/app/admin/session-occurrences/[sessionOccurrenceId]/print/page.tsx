"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

type EndCard = {
  kid: { displayName: string; user: { email: string } };
  passed: boolean;
  instructorNote: string | null;
  acquiredSkills: Array<{ levelSkill: { description: string }; acquired: boolean }>;
};

export default function PrintSessionOccurrencePage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;
  const params = useParams<{ sessionOccurrenceId: string }>();
  const sessionOccurrenceId = params.sessionOccurrenceId;

  const [endCards, setEndCards] = useState<EndCard[]>([]);

  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;
      if (role !== "ADMIN") return;
      if (!sessionOccurrenceId) return;

      const res = await fetch(
        `/api/instructor/session-occurrences/${sessionOccurrenceId}/endcards`,
      );
      if (!res.ok) return;
      const json = await res.json();
      setEndCards(json.endCards ?? []);
    }
    load();
  }, [role, sessionOccurrenceId, status]);

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "ADMIN") return <div className="p-6">Not authorized.</div>;
  if (!sessionOccurrenceId) return <div className="p-6">Missing session id.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Print End Cards</h1>
        <button className="bg-sky-950 text-white rounded px-3 py-2 hover:bg-indigo-950" onClick={() => window.print()} type="button">
          Print
        </button>
      </div>

      <div className="space-y-4">
        {endCards.length === 0 ? (
          <div className="text-zinc-600">No end cards found.</div>
        ) : (
          endCards.map((c, idx) => (
            <div key={idx} className="border rounded p-3">
              <div className="font-medium text-lg">{c.kid.displayName}</div>
              <div className="text-sm text-zinc-600">{c.kid.user.email}</div>
              <div className="text-sm mt-2">
                Result: <b>{c.passed ? "Pass to next level" : "Not passing yet"}</b>
              </div>
              {c.instructorNote ? (
                <div className="text-sm mt-2">
                  Notes: <span className="text-zinc-700">{c.instructorNote}</span>
                </div>
              ) : null}

              <div className="mt-3 text-sm">
                <div className="font-medium mb-2">Skills</div>
                <ul className="list-disc pl-5 space-y-1">
                  {c.acquiredSkills
                    .filter((s) => s.acquired)
                    .map((s, i) => (
                      <li key={i}>{s.levelSkill.description}</li>
                    ))}
                  {c.acquiredSkills.filter((s) => s.acquired).length === 0 ? (
                    <li className="text-zinc-500">No skills marked yet.</li>
                  ) : null}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

