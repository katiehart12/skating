"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type UserRole = "ADMIN" | "INSTRUCTOR" | "KID" | "PARENT";

type Show = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string | null;
};

type IceLocation = { id: string; name: string };

type InstructorSummary = { id: string; email: string; instructorProfileId: string | null; displayName: string | null };
type KidSummary = { id: string; email: string; kidProfileId: string | null; displayName: string | null };

type Part = {
  id: string;
  name: string;
  iceLocation: IceLocation;
  startTime: string | null;
  endTime: string | null;
  instructors: Array<{ id: string; instructor: { user: { email: string; name: string | null } } }>;
  enrollments: Array<{ id: string; kid: { id: string; displayName: string } }>;
};

export default function IceShowsAdminPage() {
  const { data, status } = useSession();
  const role = (data?.user as any)?.role as string | undefined;

  const [shows, setShows] = useState<Show[]>([]);
  const [selectedShowId, setSelectedShowId] = useState<string>("");
  const [showDetails, setShowDetails] = useState<any | null>(null);

  const [iceLocations, setIceLocations] = useState<IceLocation[]>([]);
  const [instructors, setInstructors] = useState<InstructorSummary[]>([]);
  const [kids, setKids] = useState<KidSummary[]>([]);

  const selectedParts: Part[] = showDetails?.parts ?? [];
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const selectedPart = useMemo(() => selectedParts.find((p) => p.id === selectedPartId), [selectedPartId, selectedParts]);

  // Create show
  const [showTitle, setShowTitle] = useState("");
  const [showDate, setShowDate] = useState("");
  const [showStartTime, setShowStartTime] = useState("18:30");
  const [showEndTime, setShowEndTime] = useState("19:20");
  const [showNotes, setShowNotes] = useState("");

  // Create part
  const [partName, setPartName] = useState("");
  const [partIceLocationId, setPartIceLocationId] = useState<string>("");
  const [partStartTime, setPartStartTime] = useState<string>("");
  const [partEndTime, setPartEndTime] = useState<string>("");

  // Assignments
  const [selectedInstructorProfileIds, setSelectedInstructorProfileIds] = useState<string[]>([]);
  const [selectedKidProfileIds, setSelectedKidProfileIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (status !== "authenticated") return;
      if (role !== "ADMIN") return;

      const [showsRes, locationsRes, instructorsRes, kidsRes] = await Promise.all([
        fetch("/api/admin/ice-shows"),
        fetch("/api/admin/ice-locations"),
        fetch("/api/admin/users?role=INSTRUCTOR"),
        fetch("/api/admin/users?role=KID"),
      ]);

      if (![showsRes, locationsRes, instructorsRes, kidsRes].every((r) => r.ok)) {
        setError("Failed to load setup data.");
        return;
      }

      const showsJson = await showsRes.json();
      setShows(showsJson.shows ?? []);
      const locJson = await locationsRes.json();
      setIceLocations(locJson.locations ?? []);
      const instJson = await instructorsRes.json();
      setInstructors(instJson.users ?? []);
      const kidJson = await kidsRes.json();
      setKids(kidJson.users ?? []);
    }
    load();
  }, [role, status]);

  useEffect(() => {
    if (!selectedShowId && shows[0]?.id) {
      setSelectedShowId(shows[0].id);
    }
  }, [selectedShowId, shows]);

  useEffect(() => {
    async function loadDetails() {
      if (status !== "authenticated") return;
      if (role !== "ADMIN") return;
      if (!selectedShowId) return;

      const res = await fetch(`/api/admin/ice-shows/${selectedShowId}`);
      if (!res.ok) return;
      const json = await res.json();
      setShowDetails(json.show ?? null);
      setSelectedPartId(json.show?.parts?.[0]?.id ?? "");
    }
    loadDetails();
  }, [role, selectedShowId, status]);

  useEffect(() => {
    // When selecting a part, prefill selected assignments from server.
    if (!selectedPart) {
      setSelectedInstructorProfileIds([]);
      setSelectedKidProfileIds([]);
      return;
    }
    setSelectedInstructorProfileIds(
      (selectedPart.instructors ?? []).map((pi: any) => pi.instructorId ?? pi.instructor?.id ?? pi.id),
    );
    setSelectedKidProfileIds(
      (selectedPart.enrollments ?? []).map((en: any) => en.kidId ?? en.kid?.id ?? en.id),
    );
  }, [selectedPart]);

  async function createShow(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/ice-shows", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: showTitle,
        date: showDate,
        startTime: showStartTime,
        endTime: showEndTime,
        notes: showNotes || null,
      }),
    });
    if (!res.ok) {
      setError("Failed to create ice show.");
      return;
    }
    const json = await res.json();
    setShowTitle("");
    setShowNotes("");
    setShows((prev) => [json.show, ...prev]);
    setSelectedShowId(json.show.id);
    setShowDetails(null);
  }

  async function createPart(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedShowId) return;
    if (!partName.trim() || !partIceLocationId) {
      setError("Part name and ice location are required.");
      return;
    }
    setError(null);

    const res = await fetch(`/api/admin/ice-shows/${selectedShowId}/parts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: partName,
        iceLocationId: partIceLocationId,
        startTime: partStartTime || null,
        endTime: partEndTime || null,
      }),
    });
    if (!res.ok) {
      setError("Failed to create part.");
      return;
    }

    setPartName("");
    setPartStartTime("");
    setPartEndTime("");

    // Reload details to include new part.
    const detailsRes = await fetch(`/api/admin/ice-shows/${selectedShowId}`);
    if (detailsRes.ok) {
      const detailsJson = await detailsRes.json();
      setShowDetails(detailsJson.show ?? null);
    }
  }

  function toggleInstructor(profileId: string) {
    setSelectedInstructorProfileIds((prev) => (prev.includes(profileId) ? prev.filter((x) => x !== profileId) : [...prev, profileId]));
  }

  function toggleKid(profileId: string) {
    setSelectedKidProfileIds((prev) => (prev.includes(profileId) ? prev.filter((x) => x !== profileId) : [...prev, profileId]));
  }

  async function saveInstructors() {
    if (!selectedShowId || !selectedPartId) return;
    const res = await fetch(`/api/admin/ice-shows/${selectedShowId}/parts/${selectedPartId}/instructors`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ instructorProfileIds: selectedInstructorProfileIds }),
    });
    if (!res.ok) {
      setError("Failed to save instructors.");
      return;
    }
    const detailsRes = await fetch(`/api/admin/ice-shows/${selectedShowId}`);
    if (detailsRes.ok) {
      const detailsJson = await detailsRes.json();
      setShowDetails(detailsJson.show ?? null);
    }
  }

  async function saveKids() {
    if (!selectedShowId || !selectedPartId) return;
    const res = await fetch(`/api/admin/ice-shows/${selectedShowId}/parts/${selectedPartId}/enrollments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kidProfileIds: selectedKidProfileIds }),
    });
    if (!res.ok) {
      setError("Failed to enroll kids for this part.");
      return;
    }
    const detailsRes = await fetch(`/api/admin/ice-shows/${selectedShowId}`);
    if (detailsRes.ok) {
      const detailsJson = await detailsRes.json();
      setShowDetails(detailsJson.show ?? null);
    }
  }

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (role !== "ADMIN") return <div className="p-6">Not authorized.</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Ice Show Admin</h1>
        <div className="text-sm text-zinc-600">
          Create show parts, assign instructors and kids
        </div>
      </div>

      {error ? <div className="text-red-600 text-sm mb-3">{error}</div> : null}

      <section className="bg-white shadow rounded p-4 mb-6">
        <h2 className="font-semibold mb-3">Create Ice Show</h2>
        <form onSubmit={createShow} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input className="border rounded p-2" value={showTitle} onChange={(e) => setShowTitle(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Date
            <input className="border rounded p-2" type="date" value={showDate} onChange={(e) => setShowDate(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Start time
            <input className="border rounded p-2" value={showStartTime} onChange={(e) => setShowStartTime(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            End time
            <input className="border rounded p-2" value={showEndTime} onChange={(e) => setShowEndTime(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Notes (costume/check-in)
            <textarea className="border rounded p-2 min-h-[90px]" value={showNotes} onChange={(e) => setShowNotes(e.target.value)} />
          </label>
          <button type="submit" className="bg-sky-950 text-white rounded px-3 py-2 md:col-span-2 hover:bg-indigo-950">
            Create show
          </button>
        </form>
      </section>

      <section className="bg-white shadow rounded p-4 mb-6">
        <h2 className="font-semibold mb-3">Shows</h2>
        {shows.length === 0 ? (
          <div className="text-zinc-600">No ice shows yet.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {shows.map((s) => (
              <button
                key={s.id}
                type="button"
                className={selectedShowId === s.id ? "bg-sky-950 text-white rounded px-3 py-1 text-sm" : "border border-sky-200 rounded px-3 py-1 text-sm hover:bg-sky-50"}
                onClick={() => setSelectedShowId(s.id)}
              >
                {s.title} ({new Date(s.date).toLocaleDateString()})
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedShowId ? (
        <section className="bg-white shadow rounded p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold">Parts for selected show</h2>
            <div className="text-sm text-zinc-600">
              One calendar event per kid
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">Create Part</h3>
              <form onSubmit={createPart} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  Part name
                  <input className="border rounded p-2" value={partName} onChange={(e) => setPartName(e.target.value)} required />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Ice location
                  <select className="border rounded p-2" value={partIceLocationId} onChange={(e) => setPartIceLocationId(e.target.value)} required>
                    <option value="">Select...</option>
                    {iceLocations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Start time (optional)
                  <input className="border rounded p-2" value={partStartTime} onChange={(e) => setPartStartTime(e.target.value)} placeholder="e.g., 18:30" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  End time (optional)
                  <input className="border rounded p-2" value={partEndTime} onChange={(e) => setPartEndTime(e.target.value)} placeholder="e.g., 19:20" />
                </label>
                <button type="submit" className="bg-sky-950 text-white rounded px-3 py-2 hover:bg-indigo-950">
                  Create part
                </button>
              </form>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Select Part</h3>
              <div className="flex flex-col gap-2 mb-4">
                {selectedParts.length === 0 ? (
                  <div className="text-zinc-600">No parts yet.</div>
                ) : (
                  selectedParts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={selectedPartId === p.id ? "bg-sky-950 text-white rounded px-3 py-2 text-left text-sm" : "border border-sky-200 rounded px-3 py-2 text-left text-sm hover:bg-sky-50"}
                      onClick={() => setSelectedPartId(p.id)}
                    >
                      {p.name} | {p.iceLocation.name} | kids: {p.enrollments?.length ?? 0}
                    </button>
                  ))
                )}
              </div>

              {selectedPart ? (
                <>
                  <h3 className="font-semibold mb-2">Assign Instructors</h3>
                  <div className="grid gap-2 mb-4">
                    {instructors.map((inst) => {
                      const pid = inst.instructorProfileId;
                      if (!pid) return null;
                      const checked = selectedInstructorProfileIds.includes(pid);
                      return (
                        <label key={pid} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={checked} onChange={() => toggleInstructor(pid)} />
                          <span>{inst.displayName ?? inst.email}</span>
                        </label>
                      );
                    })}
                  </div>
                  <button type="button" className="bg-sky-950 text-white rounded px-3 py-2 mb-6 hover:bg-indigo-950" onClick={saveInstructors}>
                    Save instructors
                  </button>

                  <h3 className="font-semibold mb-2">Enroll Kids</h3>
                  <div className="grid gap-2 mb-4">
                    {kids.map((k) => {
                      const pid = k.kidProfileId;
                      if (!pid) return null;
                      const checked = selectedKidProfileIds.includes(pid);
                      return (
                        <label key={pid} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={checked} onChange={() => toggleKid(pid)} />
                          <span>{k.displayName ?? k.email}</span>
                        </label>
                      );
                    })}
                  </div>
                  <button type="button" className="bg-sky-950 text-white rounded px-3 py-2 hover:bg-indigo-950" onClick={saveKids}>
                    Enroll kids for this part
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

