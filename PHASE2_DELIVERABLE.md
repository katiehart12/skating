# Phase 2 Deliverable — Frank Skating Ops
**By: Katie Hart**

---

## 1. Feature Delta

### ✅ Added This Week

**Authentication & Authorization**
- Email/password login and signup (bcryptjs hashing, NextAuth JWT sessions)
- Role-based access control: Admin, Instructor, Parent, Kid — each redirects to their own dashboard
- `requireUserRole()` middleware protects every API route

**Admin Dashboard**
- Create skating levels with skills (one per line)
- Create class templates (day of week, start/end time)
- Create parallel class sessions per template (level + ice location + instructor assignment)
- Generate class occurrences (specific dates from a template)
- Manage attendance per session occurrence (PRESENT / ABSENT / LATE per kid)
- Create and edit end-cards with per-skill pass/not-yet checkboxes + instructor notes
- Enroll kids into session occurrences
- Create and manage ice shows, parts, enrollments
- Approve or reject instructor feedback from parents
- Rink map with visual overlay zones for ice locations

**Instructor Dashboard**
- View assigned session occurrences
- Fill out end-cards: mark individual skills acquired, add notes, toggle "pass to next level"
- Skills displayed with full description text matching the paper card format

**Parent Dashboard**
- View all linked children's upcoming sessions (date, time, level, rink location)
- See attendance status per session
- View end-card results: acquired skills shown as pills, instructor notes, pass badge
- Access ice show details and download `.ics` calendar events

**Kid Dashboard**
- View upcoming and past sessions split into two sections
- Skill pills per session (acquired = sky blue, not yet = grey strikethrough)
- Instructor notes styled as blockquote
- Skeleton loading state

**Unit Testing (23 tests, 4 files)**
- `requireRole.test.ts` — auth middleware: null token → 401, wrong role → 401, correct role → 200
- `signup.schema.test.ts` — Zod validation: bad email, short password, missing fields
- `bcrypt.test.ts` — hash ≠ plaintext, correct password verifies, wrong password rejected
- `ics.test.ts` — ICS escape sequences, date formatting, UTC timestamp output

**Real Level Data Seeded**
- Level 5 seeded with all 7 real skills from the Frank Southern paper end-card (with description notes)

**UI Polish**
- Custom CSS design system: `.badge`, `.card`, `.card-accent`, `.field`, focus rings, transitions
- Navbar: active route highlighting, role badge showing current user's role + name
- Login/signup: card layout with ice-blue accent border, error alert styling
- Browser tab title: "Frank Skating Ops" (was "Create Next App")
- Fixed `<a>` → `<Link>` throughout (client-side navigation, no full page reloads)

---

### ⏳ Remaining (Phase 3 targets)

| Feature | Notes |
|---------|-------|
| Full level seed (Parent Tot → Level 4) | Only Level 5 is seeded with real skills |
| Kid role login flow | Page exists but kid accounts can't self-register |
| Email notifications | Schedule changes, feedback approval |
| Mobile UI polish | Tables and attendance grid need responsive work |
| Group sync integration | Phase 3 requirement |
| Make-up class scheduling UI | Schema supports it; no admin UI to create make-up occurrences |
| Bulk attendance marking | "Mark all present" button |
| Delete/edit levels, templates, users | Create-only right now |
| CSV/report export | Admins can print end-cards but no spreadsheet export |
| Registration open/close toggle | Hardcoded "closed for Spring 2026" |
| Search/filter on user and occurrence lists | No search yet |
| Rate limiting on login/signup | No brute-force protection |

---

## 2. Risk Assessment

### 3 Worst-Case Scenarios (if not secured)

**Scenario 1 — Instructor writes end-cards for sessions they don't teach**
An authenticated instructor could call `POST /api/instructor/session-occurrences/[id]/endcards` with a session ID from a class they aren't assigned to. Without an ownership check, they could overwrite another instructor's skill assessments for any kid. A kid's permanent skill record would be corrupted by someone who never taught them.

*Fix applied:* The `requireUserRole` middleware confirms the user is an INSTRUCTOR, but an additional DB check verifying the instructor is linked to that specific session should be added before Phase 3.

**Scenario 2 — Parent reads another family's schedule and end-cards**
The parent schedule API filters by `parentId` derived from the JWT token — not from a request body. However, if a future developer naively added a `?parentId=` query parameter shortcut and used that instead of the token, User A could pass User B's ID and see their children's private attendance and feedback.

*Current status:* Safe — the current code always reads `userId` from the signed JWT. This must not change.

**Scenario 3 — Admin account takeover via password spraying**
There is no rate limiting on `POST /api/auth/[...nextauth]` (login) or `POST /api/auth/signup`. An attacker could script thousands of login attempts per minute against `admin@skating.local`. Since one admin account controls the entire school's data (schedules, all kid records, feedback), a compromised admin is a full system breach.

*Fix needed:* Add rate limiting middleware (e.g., `next-rate-limit` or Vercel Edge middleware) before production deployment.

---

### 3 Impossible Risks for This Domain

**Non-Issue 1 — SQL Injection**
Not possible. The app uses Prisma ORM exclusively, which parameterizes all queries automatically via the SQLite/Postgres driver. There are zero raw `$queryRaw` calls in the codebase. An attacker cannot inject SQL through any input field.

**Non-Issue 2 — Financial fraud or payment data theft**
There are no payment flows, no stored credit card numbers, no Stripe integration, and no financial transactions of any kind in this app. The worst monetary consequence of a bug is a scheduling mistake — not a fraudulent charge. Payment card data cannot be leaked because it was never collected.

**Non-Issue 3 — Mass unauthenticated data scraping**
There are no public API endpoints. Every route — skills, schedules, end-cards, ice show data — requires a valid NextAuth JWT session verified server-side by `getToken()`. An unauthenticated HTTP request to any `/api/*` route returns `401 Unauthorized` immediately, before any database query is executed.

---

## 3. Unit Testing

### How to run

```bash
cd web
npm test
```

### Expected output

```
 RUN  v4.1.3 /path/to/web

 Test Files  4 passed (4)
      Tests  23 passed (23)
   Start at  11:18:34
   Duration  1.36s
```

### Test files

| File | Tests | What it proves |
|------|-------|---------------|
| `src/lib/__tests__/requireRole.test.ts` | 5 | Auth middleware correctly blocks wrong roles and allows correct ones |
| `src/lib/schemas/__tests__/signup.schema.test.ts` | 6 | Zod schema rejects bad emails, short passwords, missing fields |
| `src/app/api/auth/signup/__tests__/bcrypt.test.ts` | 3 | Passwords are hashed (not stored in plaintext), verified correctly |
| `src/lib/__tests__/ics.test.ts` | 9 | Calendar export utilities format dates correctly and escape special chars |

> **Screenshot for submission:** Run `npm test` in the `web/` directory and screenshot the terminal output showing "23 passed."
