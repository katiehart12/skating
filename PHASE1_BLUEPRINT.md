# Project Blueprint — Phase 1
## Frank Skating Ops
**By: Katie Hart**

---

## 1. Project Concept

**Frank Skating Ops** is an internal operations platform for Frank Southern Ice Arena (Bloomington, IN). It replaces paper-based tracking with a digital system for attendance, skill progression ("end-cards"), ice show scheduling, and parent communication.

**Who uses it:**
| Role | What they do |
|------|-------------|
| **Admin** | Creates levels, classes, sessions, manages users and ice shows |
| **Instructor** | Takes attendance, fills out skill end-cards per session |
| **Parent** | Views their kid's schedule, attendance, skill feedback, ice shows |
| **Kid** | Has a profile linked to a parent; enrolled by admin |

**Technical Stack:**

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS 4 |
| Backend | Next.js API Routes (built-in) |
| Database | SQLite (dev) → Supabase Postgres (production) via Prisma ORM |
| Auth | NextAuth.js v4 — Credentials provider (email/password), JWT sessions |
| Validation | Zod 4 |
| Hosting | Vercel (frontend + API) |
| AI Agents Used | Claude Code (Anthropic) |

> **Note on database:** Development uses SQLite for zero-setup local iteration. The Prisma schema is provider-agnostic — switching to Supabase Postgres for production requires only a `datasource` change and a `prisma migrate deploy`. No application code changes needed.

---

## 2. Vibe-Coding Task List (Phase 2 Prompts)

These are the 10 focused AI agent tasks used to build out Phase 2 features. Each task is scoped small enough for a single agent context window.

| # | Task / Prompt |
|---|--------------|
| 1 | "Set up NextAuth Credentials provider with bcryptjs. On login, return `{ id, email, role }` from the JWT callback. Protect all API routes with a `requireUserRole(req, allowedRoles)` middleware that reads the JWT token." |
| 2 | "Create the Prisma schema for `Level`, `LevelSkill`, `ClassTemplate`, `ClassSession`, and `ClassOccurrence`. Add a seed script that creates one admin user and two levels with 3 skills each." |
| 3 | "Build the Admin dashboard: a page to create skating levels (name, sortOrder) and add skills to each level (name, isCritical flag). Use a POST `/api/admin/levels` route with Zod validation." |
| 4 | "Build the class scheduling flow: create a `ClassTemplate` (day of week, time), attach `ClassSession` rows to it (one per level/location), then generate `ClassOccurrence` records for each date the template runs." |
| 5 | "Build the attendance and end-card page for admin/instructor. Show enrolled kids for a session occurrence; allow marking PRESENT/ABSENT/LATE. Allow creating an `EndCard` with per-skill pass/not-yet checkboxes and instructor notes." |
| 6 | "Build the parent dashboard: fetch the parent's linked kids, show upcoming class sessions with level, time, location. For each past session, show the end-card (skills acquired, instructor notes)." |
| 7 | "Build the ice show management flow: create `IceShow`, add `IceShowPart` segments, assign instructors to parts, enroll kids. Add a `/api/parent/ice-shows/[id]/kids/[kidId]/ics` endpoint that returns an iCalendar file." |
| 8 | "Build the instructor feedback system: parents can submit a 1–5 rating + message on an instructor. Feedback status starts PENDING; admin can APPROVE or REJECT. Instructors can view their approved feedback." |
| 9 | "Add the rink map feature: store `IceLocation` records with percentage-based x/y/width/height overlay values relative to a `rink.png` background. Show a visual overlay in the UI for each location." |
| 10 | "Set up Vitest with `vite-tsconfig-paths`. Write unit tests for: `requireUserRole` middleware (401/200 cases), Zod signup schema validation, bcryptjs hash/verify, and ICS calendar utility functions." |

---

## 3. Economic Forecast

**Assumptions:** 10 API requests per user per month. Skating school users are parents, instructors, and admins — not high-traffic consumers. Storage estimate: ~50KB per end-card PDF printout, ~1MB per rink map image.

### Cost Table

| Metric | 500 Users | 5,000 Users | 50,000 Users |
|--------|-----------|-------------|--------------|
| **Monthly requests** | 5,000 | 50,000 | 500,000 |
| **DB storage est.** | ~10 MB | ~100 MB | ~1 GB |
| **File storage est.** | ~50 MB | ~500 MB | ~5 GB |
| **Vercel** (Hobby/Pro) | $0 | $20 | $20–$40 |
| **Supabase** (Free/Pro) | $0 | $25 | $25–$50 |
| **Total** | **$0 / mo** | **~$45 / mo** | **~$65–90 / mo** |

### Tier Breakdowns

**500 users — Free tier**
- Vercel Hobby: free (100 GB-hrs compute/mo, well within limit for 5k requests)
- Supabase Free: 500 MB DB, 1 GB file storage, 50,000 monthly active users — more than sufficient
- Total: **$0/mo**

**5,000 users — Paid tier**
- Vercel Pro: $20/mo (100 GB bandwidth, 1,000 GB-hrs compute — needed for team deploys and analytics)
- Supabase Pro: $25/mo (8 GB DB, 100 GB bandwidth, unlimited API requests)
- Total: **~$45/mo**

**50,000 users — Growth tier**
- Vercel Pro: $20/mo base + ~$10–20 in bandwidth overages (500k requests with avg 10 KB response = ~5 GB)
- Supabase Pro: $25/mo base + ~$25 in compute add-ons (daily backups, higher connection pooling)
- Total: **~$65–90/mo**

**Critical Note:** At 50,000 users, if each parent uploads a profile photo at 1 MB each, storage jumps to ~50 GB — adding ~$2.50/mo on Supabase (billed at $0.021/GB after the free 1 GB). This app has no user-uploaded images currently, so storage costs remain minimal.

**Cost References:**
- Vercel pricing: https://vercel.com/pricing
- Supabase pricing: https://supabase.com/pricing
- Supabase free tier limits: 500 MB DB, 50,000 monthly active users, 1 GB file storage

---

## 4. Testing Roadmap

### Auth Flow Testing

**What to verify:**
1. A new parent can sign up at `/signup` → account appears in the database with a hashed password (never plaintext)
2. Logging in with correct credentials redirects to `/parent` dashboard
3. Logging in with wrong credentials shows an error — no redirect
4. An unauthenticated user hitting `/api/admin/levels` receives `401 Unauthorized`
5. A PARENT-role user hitting `/api/admin/levels` (admin-only) receives `401 Unauthorized`
6. An ADMIN-role user hitting `/api/admin/levels` receives `200 OK`

**Connectivity test steps:**
1. Run `npm run seed` to create the admin user and sample data
2. Open the app at `http://localhost:3000`
3. Register a new parent account via the UI
4. Open the database viewer (`npx prisma studio`) — confirm the `User` row exists with a `passwordHash` starting with `$2b$`
5. Log in as that parent — confirm redirect to `/parent`
6. Log out, then log in as admin — confirm redirect to `/admin`

### Unit Test Coverage (Phase 2 deliverable)

Run from `/web`:
```bash
npm test
```

Expected output: **4 test files, 23 tests passed**

| Test File | What It Covers |
|-----------|---------------|
| `requireRole.test.ts` | Auth middleware: null token → 401, wrong role → 401, correct role → 200 |
| `signup.schema.test.ts` | Zod validation: invalid email, short password, missing fields |
| `bcrypt.test.ts` | Password hashing: hash ≠ plaintext, correct password verifies, wrong password rejected |
| `ics.test.ts` | Calendar export: escape sequences, date formatting, UTC timestamp |

---

## 5. Security & .gitignore

**Secrets management:** All sensitive values are stored in `.env.local` (Next.js convention), which is excluded by `.gitignore`. The repository never contains:
- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- Any API keys

**Role enforcement:** Every API route calls `requireUserRole(req, ["ROLE"])` before touching the database. The role is read from the signed JWT — never from a client-supplied request body.

**Password security:** bcryptjs with 10 salt rounds. The `passwordHash` field is never returned in any API response.
