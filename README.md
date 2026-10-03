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

How it's enforced:
- `src/middleware.ts` checks the Supabase session cookie on every request. Unauthenticated users are redirected to `/sign-in`; unauthenticated API calls get `401 Unauthorized`. The webhook route is excluded so Google Apps Script can reach it.
- `requireAuth()` (`src/lib/require-auth.ts`): any signed-in user who also has a matching row in the User table.
- `requireAdmin()` (`src/lib/require-admin.ts`): signed in and `role === 'ADMIN'`. Used to gate the students, fees and payments endpoints.
A Supabase auth user is linked to an app User row by email. Signing in with Supabase alone is not enough: the email must also exist in the User table.

## Data model   
Defined in `prisma/schema.prisma` (PostgreSQL), with the schema history in `prisma/migrations/`.

| Model | Purpose |
|---|---|
| `User` | Admins and teachers (matched to a Supabase auth user by email). Holds an optional overtime `honorariumRate` |
| `Room` | Physical rooms classes are held in |
| `ScheduleEntry` | A class: subject, weekday, start/end time, duration, teacher, room, recurrence, anchor date, overtime flag |
| `ScheduleException` | A single cancelled occurrence of a recurring `ScheduleEntry` |
| `Announcement` | 	School-wide or single-teacher-targeted notice, with optional author |
| `Student` | Parent/child info, payment method (cash/bank transfer) and schedule (full/split) |
| `Fee` | A charge owed by a student |
| `Payment` | A payment made by a student |

## How It Works

The app connects an external data-collection workflow (Google Forms) with the internal school management system.

              EXTERNAL SYSTEM
                     │
                     ▼
              ┌─────────────┐
              │ Google Form │
              └──────┬──────┘
                     ▼
              ┌─────────────┐
              │Google Sheets│
              └──────┬──────┘
                     ▼
              ┌─────────────┐
              │ Apps Script │
              │   Webhook   │
              └──────┬──────┘
                     │  POST + x-webhook-secret
                     ▼
          ┌─────────────────────┐        ┌───────────────┐
          │   NEXT.JS / REACT   │◄──────►│ Supabase Auth │
          │                     │        └───────────────┘
          │  Dashboard          │
          │  Rooms / Week       │
          │  Schedule / Hours   │
          │  Manage             │
          │  Announcements      │
          │  Payments           │
          └──────────┬──────────┘
                     │
                Prisma ORM
                     ▼
          ┌─────────────────────┐
          │ PostgreSQL          │
          │ (Supabase)          │
          │                     │
          │ User · Room         │
          │ ScheduleEntry       │
          │ ScheduleException   │
          │ Announcement        │
          │ Student · Fee       │
          │ Payment             │
          └─────────────────────┘

Main Data Flow
- Google Forms → Google Sheets → Google Apps Script → Webhook → Next.js → Prisma → PostgreSQL
- The application uses Supabase for authentication and database infrastructure,
while Next.js/React provides the user interface and application logic.

## Getting started 

### Requirements

- Node.js 22.12 or newer
- A free [Supabase](https://supabase.com) account

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm ci
```

### 2. Create a Supabase project

Create a new project on [supabase.com](https://supabase.com), then copy:

- **Project URL** and **anon key**: from *Project Settings → API*
- **Database connection string**: from the *Connect* button (use the *Direct* or *Session pooler* string)

### 3. Add environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:<password>@<host>:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
WEBHOOK_SECRET="<any-long-random-string>"
```

### 4. Set up the database

```bash
npm run db:generate
npx prisma migrate deploy
```

### 5. Create an admin account

1. In Supabase, go to *Authentication → Users → Add user* and create a user (tick *Auto Confirm User*).
2. Run `npm run db:studio`, open the `User` table and add a record with the **same email**, `role` = `ADMIN`, and your first and last name.

### 6. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

### Production build

```bash
npm run build
npm start
```

### Optional: Google Form integration

Have a Google Apps Script send a `POST` request to `https://<your-domain>/api/webhooks/google-forms` with the header `x-webhook-secret: <WEBHOOK_SECRET>` and the form answers as JSON. Each submission creates a new student. This only works on a deployed app, not on `localhost`.


