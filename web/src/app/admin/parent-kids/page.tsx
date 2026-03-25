"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type UserRole = "PARENT" | "KID";

type UserSummary = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
  kidProfileId: string | null;
  parentProfileId: string | null;
};

type LinkRow = {
  parentId: string;
  kidId: string;
  parent: { user: { email: string } };
  kid: { user: { email: string } };
};

export default function ParentKidsPage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;

  const [parents, setParents] = useState<UserSummary[]>([]);
  const [kids, setKids] = useState<UserSummary[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [selectedParentProfileId, setSelectedParentProfileId] = useState<string>("");
  const [selectedKidProfileIds, setSelectedKidProfileIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const selectedParent = useMemo(
    () => parents.find((p) => p.parentProfileId === selectedParentProfileId),
    [kids, parents, selectedParentProfileId],
  );

  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;
      if (role !== "ADMIN") return;

      const [pRes, kRes, lRes] = await Promise.all([
        fetch("/api/admin/users?role=PARENT"),
        fetch("/api/admin/users?role=KID"),
        fetch("/api/admin/parent-kids"),
      ]);

      if (![pRes, kRes, lRes].every((r) => r.ok)) {
        setError("Failed to load parent-kid data.");
        return;
      }

      const pJson = await pRes.json();
      const kJson = await kRes.json();
      const lJson = await lRes.json();

      const p = (pJson.users ?? []) as UserSummary[];
      const k = (kJson.users ?? []) as UserSummary[];
      const l = (lJson.links ?? []) as LinkRow[];

      setParents(p);
      setKids(k);
      setLinks(l);
      if (!selectedParentProfileId && p[0]?.parentProfileId) {
        setSelectedParentProfileId(p[0].parentProfileId);
      }
    }
    load();
  }, [role, status]);

  useEffect(() => {
    setSelectedKidProfileIds([]);
  }, [selectedParentProfileId]);

  function toggleKid(pid: string) {
    setSelectedKidProfileIds((prev) => {
      if (prev.includes(pid)) return prev.filter((id) => id !== pid);
      return [...prev, pid];
    });
  }

  async function saveLinks() {
    if (!selectedParentProfileId || selectedKidProfileIds.length === 0) return;
    setError(null);

    const requests = selectedKidProfileIds.map((kidProfileId) =>
      fetch("/api/admin/parent-kids", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parentProfileId: selectedParentProfileId, kidProfileId }),
      }),
    );

    const results = await Promise.all(requests);
    if (!results.every((r) => r.ok)) {
      setError("Failed to save one or more links.");
      return;
    }

    // Refresh links for the UI.
    const lRes = await fetch("/api/admin/parent-kids");
    const lJson = await lRes.json();
    setLinks(lJson.links ?? []);
    setSelectedKidProfileIds([]);
  }

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "ADMIN") return <div className="p-6">Not authorized.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-3">Parent-Kids</h1>
      <div className="text-sm text-zinc-600 mb-6">
        Connect parents to kids so they can view schedules and end cards.
      </div>

      {error ? <div className="text-red-600 text-sm mb-3">{error}</div> : null}

      <section className="bg-white shadow rounded p-4 mb-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Parent
            <select
              className="border rounded p-2"
              value={selectedParentProfileId}
              onChange={(e) => setSelectedParentProfileId(e.target.value)}
            >
              {parents.map((p) => (
                <option key={p.parentProfileId ?? p.id} value={p.parentProfileId ?? ""}>
                  {p.displayName ?? p.email}
                </option>
              ))}
            </select>
          </label>

          <div className="text-sm text-zinc-600">
            {selectedParent ? (
              <span>Selected: {selectedParent.displayName ?? selectedParent.email}</span>
            ) : (
              <span>Select a parent account.</span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Kids to link</div>
          <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
            {kids.map((k) => {
              const pid = k.kidProfileId;
              if (!pid) return null;
              const checked = selectedKidProfileIds.includes(pid);
              return (
                <label key={pid} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={checked} onChange={() => toggleKid(pid)} />
                  {k.displayName ?? k.email}
                </label>
              );
            })}
          </div>

          <button
            type="button"
            className="mt-4 bg-sky-950 text-white rounded px-3 py-2 disabled:opacity-50 hover:bg-indigo-950"
            onClick={saveLinks}
            disabled={!selectedParentProfileId || selectedKidProfileIds.length === 0}
          >
            Save links ({selectedKidProfileIds.length})
          </button>
        </div>
      </section>

      <section className="bg-white shadow rounded p-4">
        <h2 className="font-semibold mb-3">Existing Links</h2>
        {links.length === 0 ? (
          <div className="text-zinc-600">No parent-kid links yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {links
              .filter((l) => l.parentId === selectedParentProfileId)
              .map((l) => (
                <div key={`${l.parentId}:${l.kidId}`} className="border rounded p-3 text-sm">
                  {l.parent.user.email} to {l.kid.user.email}
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

