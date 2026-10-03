# School Management System

A Next.js web app for running the day-to-day admin of a small school or tutoring center: class scheduling, room availability, teacher hours, announcements, and student payments — with separate views for **admins** and **teachers**.

## Tech stack

- **Runtime:** Node.js - Version >= 22.12 (required by Prisma 7)
- **Framework:** Next.js (App Router) - Version 14.2.5
- **UI library:** React / React DOM - Version 18.3.1
- **Language:** TypeScript - Version 5.9.3
- **Styling:** Tailwind CSS + PostCSS - Versions 3.4 / 8.5.28
- **Authentication:** Supabase Auth: @supabase/ssr + @supabase/supabase-js - Version 0.10 / 2.106
- **ORM:** Prisma + @prisma/client (prisma-client generator) - Version 7.10.0
- **DB driver:** @prisma/adapter-pg + pg (node-postgres) - Versions 7.10.0 / 8.23.0
- **Database:** PostgreSQL (hosted on Supabase)
- **Excel export:** SheetJS (xlsx) - Version 0.18.5
- **Env loading:** dotenv - Version 17.4.2
- **TS script runner:** tsx - Version 4.23.15
- **Linting:** ESLint + eslint-config-next - Versions 8.57.1 / 14.2.5
- **Fonts:** next/font/google (Inter) - bundled with Next.js
- **External intake:** Google Forms + Google Sheets + Google Apps Script
Note: Exact versions are taken from package-lock.json. Install with **npm ci** to get exactly these.

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

## How It Works

The application connects external data collection with an internal
education management system.

                    EXTERNAL SYSTEM
                         │
                         ▼
                  ┌─────────────┐
                  │ Google Form │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │Google Sheets│
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │Apps Script  │
                  │   Webhook   │
                  └──────┬──────┘
                         │
                    Secure API
                         │
                         ▼
              ┌─────────────────────┐
              │   NEXT.JS / REACT   │
              │                     │
              │  Dashboard          │
              │  Schedule           │
              │  Teachers / Rooms   │
              │  Students / Payments│
              │  Reports            │
              │  Settings           │
              └──────────┬──────────┘
                         │
                    Prisma ORM
                         │
                         ▼
              ┌─────────────────────┐
              │ PostgreSQL /        │
              │ Supabase            │
              │                     │
              │ Users               │
              │ Teachers            │
              │ Rooms               │
              │ Classes             │
              │ Schedule            │
              │ Form Submissions    │
              └─────────────────────┘

Main Data Flow
- Google Forms → Google Sheets → Google Apps Script → Webhook → Next.js → Prisma → PostgreSQL
- The application uses Supabase for authentication and database infrastructure,
while Next.js/React provides the user interface and application logic.

User Roles
- Admin — manages teachers, rooms, schedules, classes and system data.
- Teacher — accesses their assigned classes, schedules and relevant information.

External Integration
- Google Forms and Google Sheets are used as an external data collection
workflow. Google Apps Script processes the submitted information and sends
it to the application through a protected webhook.
