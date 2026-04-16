# Skating school — sports management & logistics (MVP)

Next.js app with Prisma (SQLite) and NextAuth. First phase includes role-based dashboards, class templates and occurrences, attendance (including make-up metadata), rink locations, instructor end cards, parent schedules, and ice-show ICS export.

**Developer setup:** see [`web/README.md`](web/README.md) (install, `prisma migrate`, `seed`, `npm run dev`).

---

## Submission: source, deployment, and demo

**Fill in the links below** so graders can verify a deployed or demonstrable setup with a working database-backed first phase. TAs do **not** receive your local `.env`; document any hosted env vars or use a **demo video** that shows the running app.

| Item | Link |
|------|------|
| **Source repository** (GitHub, etc.) | _Add your repo URL here_ |
| **Live site** (if deployed — Vercel, Render, etc.) | _Add URL or “N/A — see demo video”_ |
| **Demo video** (local or deployed walkthrough showing DB-backed flows) | _Add YouTube/Drive/etc. URL here_ |
| **Plan & cost documentation** | _Add link to your plan/cost doc, or use the section below_ |

### Collaborators & visibility (pick the option that matches your host)

**Option A — GitHub.iu**

- Add the **TA team** as collaborators on the repository.
- Repository may stay **private**; note that deployment to Render/Vercel may take longer than with a public repo.
- **Repository:** _paste GitHub.iu link_
- **Demo:** _video of current state (local or deployed)_ — graders won’t have your `.env` locally.

**Option B — GitHub.com**

- Add the TA team directly as collaborators:
  - [migord@iu.edu](mailto:migord@iu.edu)
  - [bdyiga@iu.edu](mailto:bdyiga@iu.edu)
  - [sgandrap@iu.edu](mailto:sgandrap@iu.edu)
- **Repository:** _paste github.com link_
- **Demo:** _video of deployed or local state_, **or** if you deployed with shared credentials/env on the host, **live site URL** above.

**Option C — Lovable / Base44 / similar (no collaborator seats)**

- Provide **videos** that show progress clearly and a **link to the live current state** that is **accessible without logging in as your personal user** (public preview or shared demo).
- **Live preview:** _URL_
- **Video(s):** _URL(s)_

### Plan and cost (documentation)

_Use this subsection or attach a separate doc and link it in the table above._

- **Hosting / plan:** _e.g. Vercel hobby, Render free tier_
- **Estimated monthly cost:** _$..._
- **Database:** _e.g. SQLite on disk for dev; for production note Postgres/SQLite on host_

---

## Tech stack (first phase)

- **App:** Next.js (App Router), TypeScript, Tailwind CSS
- **Data:** Prisma ORM, SQLite (`web/prisma/`, `web/dev.db` after migrate)
- **Auth:** NextAuth (credentials), bcrypt
All four accounts are now seeded in the main repo's database. You should be able to log in:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@skating.local` | `admin12345` |
| Instructor | `instructor@skating.local` | `instructor123` |
| Parent | `parent@skating.local` | `parent123` |
| Kid | `kid@skating.local` | `kid123` |

The problem was that the `note` field migration had only been applied to the worktree's database, not the main one where your dev server runs. It's all in sync now.