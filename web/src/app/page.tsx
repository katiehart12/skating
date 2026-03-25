import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <section className="mb-10">
        <div className="bg-gradient-to-br from-sky-950 via-indigo-950 to-sky-900 text-white rounded-xl p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-semibold">Frank Southern Ice Arena</h1>
          <p className="mt-3 text-white/90 max-w-2xl">
            Sports Management & Logistics for your skating school: replace paper tracking with
            attendance, skill end-cards, and parent-friendly schedules.
          </p>
          <div className="mt-5 inline-flex items-center gap-3">
            <div className="rounded bg-white/10 border border-white/20 px-3 py-1 text-sm">
              Closed for the Spring 2026 season
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">General Admission Public Skating</h2>
          <ul className="text-sm text-zinc-700 space-y-2">
            <li>Public skating is available only during scheduled times.</li>
            <li>
              <span className="font-medium">General admission:</span> $7/person
            </li>
            <li>
              <span className="font-medium">Skate rental:</span> $3
            </li>
            <li>
              <span className="font-medium">New skate sharpening:</span> $10
            </li>
            <li>
              <span className="font-medium">Skate sharpening (immediate service):</span> $6 and $7
            </li>
            <li>
              <span className="font-medium">Economy Pass:</span> $85 for 10 admissions (includes skate rental)
            </li>
          </ul>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">Sign Up for Lessons</h2>
          <p className="text-sm text-zinc-700 mb-4">
            Get organized, track progress by level, and make it easy for parents to see schedules and end-card feedback.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/signup"
              className="bg-sky-700 text-white rounded px-4 py-2 text-center hover:bg-sky-800"
            >
              Sign up for lessons
            </Link>
            <Link href="/login" className="text-sm text-sky-900/80 hover:underline sm:self-center">
              Already have an account?
            </Link>
            <div className="text-sm text-zinc-600 flex items-center justify-center sm:justify-start">
              Admin creates classes & tracks attendance.
            </div>
          </div>

          <div className="mt-6 border-t pt-5">
            <h3 className="font-semibold mb-2">What you’ll get</h3>
            <ul className="text-sm text-zinc-700 space-y-2">
              <li>Class management with parallel level sessions</li>
              <li>Daily attendance + make-up metadata</li>
              <li>Skill end-cards and printable reports</li>
              <li>Ice-show planning with calendar events per student</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">Address / Contact</h2>
          <div className="text-sm text-zinc-700 space-y-2">
            <div>
              <div className="font-medium">Address</div>
              <div>2100 S. Henderson St, Bloomington IN 47401</div>
            </div>
            <div>
              <div className="font-medium">Phone</div>
              <div>(812) 349-3740</div>
            </div>
            <div>
              <div className="font-medium">Fax</div>
              <div>(812) 349-3705</div>
            </div>
            <div>
              <div className="font-medium">Email</div>
              <div>parks@bloomington.in.gov</div>
            </div>
            <div>
              <div className="font-medium">Facebook</div>
              <div>Connect on Facebook</div>
            </div>
            <div className="pt-2 text-xs text-zinc-500">
              Page last updated on March 13, 2026 at 9:23 am
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">About The Frank</h2>
          <div className="text-sm text-zinc-700 space-y-4">
            <div>
              <div className="font-medium">Staff</div>
              <div className="mt-1">
                <div>
                  Sports Facility/Program Manager: Chris Hamric, 812-349-3740 or email{" "}
                  chris.hamric@bloomington.in.gov
                </div>
                <div className="mt-2">
                  Sports Specialist: Alec Curry, 812-349-3740 or email{" "}
                  alec.curry@bloomington.in.gov
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium">Bus Line</div>
              <div>Bloomington Transit #7 drops at North and Henderson Streets.</div>
              <div className="mt-1">Frank Southern Ice Arena is located at 2100 S. Henderson St.</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">Accessibility</h2>
          <div className="text-sm text-zinc-700 space-y-2">
            <div>Power-operated entry doors</div>
            <div>Six designated accessible parking spaces in the asphalt parking lot off Henderson Street</div>
            <div>Approximately 120' on an asphalt surface from the farthest accessible parking space to the entry door</div>
            <div>Designated spectator seating platform on northwest side of arena for people using wheelchairs or other mobility assistance devices</div>
            <div>Accessible restrooms</div>
          </div>
        </div>
      </section>
    </div>
  );
}
