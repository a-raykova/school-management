# School Management Dashboard

A Next.js web app for running the day-to-day admin of a small school or tutoring center: class scheduling, room availability, teacher hours, announcements, and student payments — with separate views for **admins** and **teachers**.

## Tech stack

- **Framework:** Next.js (App Router) + React, TypeScript
- **Styling:** Tailwind CSS
- **Auth:** Supabase Auth (`@supabase/ssr`), enforced via `middleware.ts`
- **Database:** Prisma ORM (generated client checked into `src/generated/prisma`)
- **Fonts:** `next/font/google` (Inter)

## Features

- **Dashboard** — quick view of room usage, announcements, and (for teachers) their busiest day
- **Rooms** — live "free / occupied" status per room, computed from the schedule
- **Schedule** — create, edit, and delete class entries with support for recurrence (`once`, `weekly`, `biweekly`, `monthly`) and one-off cancellations ("exceptions") to a recurring entry
- **Week view** — weekly calendar view of classes
- **Hours** (admin only) — worked vs. planned hours per teacher for the month
- **Announcements** — school-wide or teacher-targeted notices; scheduling changes automatically post an announcement
- **Payments** (admin only) — log student fees and payments (cash or bank transfer, full or split payment schedules)
- **Profile** — current user's info
- **Google Forms webhook** — `POST /api/webhooks/google-forms` lets an external form (e.g. a parent sign-up form) create a `Student` record via a shared secret header

## Roles & access control

Two roles: `ADMIN` and `TEACHER`.

- `middleware.ts` redirects unauthenticated users to `/sign-in` (or returns `401` for API routes), based on a Supabase session cookie.
- `requireAuth()` (`src/lib/require-auth.ts`) — any signed-in user with a matching `User` row.
- `requireAdmin()` (`src/lib/require-admin.ts`) — signed-in **and** `role === 'ADMIN'`. Used to gate students, fees, and payments endpoints.

## Data model (Prisma)

| Model | Purpose |
|---|---|
| `User` | Admins and teachers (matched to a Supabase auth user by email) |
| `Room` | Physical rooms classes are held in |
| `ScheduleEntry` | A class: subject, weekday, start/end time, teacher, room, recurrence, anchor date |
| `ScheduleException` | A single cancelled occurrence of a recurring `ScheduleEntry` |
| `Announcement` | School-wide or single-teacher-targeted notice |
| `Student` | Parent/child info, payment method (cash/bank transfer) and schedule (full/split) |
| `Fee` | A charge owed by a student |
| `Payment` | A payment made by a student against fees |


## Environment variables

Inferred from the code — create a `.env.local` with:

```
DATABASE_URL=                        # Prisma connection string
NEXT_PUBLIC_SUPABASE_URL=            # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # Supabase anon/public key
WEBHOOK_SECRET=                      # Shared secret checked against the
                                      #   x-webhook-secret header on the
                                      #   Google Forms webhook
```
