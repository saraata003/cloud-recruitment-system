# DRINKAT Recruitment

A fast, visual, paperless hiring system for DRINKAT. Candidates apply from their phone with no login; the team reviews photo-first candidate cards, runs AI-assisted interviews, and moves people through a drag-and-drop pipeline — no spreadsheets, no paper.

## Core flow

1. A candidate opens the public link (`/apply`) on their phone and submits a short form with a photo.
2. The application lands on the Dashboard, already summarized by AI.
3. You open the candidate, see their photo, CV, and AI summary.
4. You start an interview — AI suggests questions tailored to that specific person.
5. You rate them, add notes, and decide: **Hire**, **Shortlist**, **Future Talent**, **Second Interview**, or **Reject**.

## Features

- **Public application form** (`/apply`) — mobile-first, no login, photo required, CV optional (PDF or image).
- **Visual dashboard** — stat tiles, Today's Interviews, and photo-first candidate cards (no dense tables).
- **AI CV summaries** — a one-glance summary plus key points to notice (never judges appearance; never decides hire/reject — that's always a human call).
- **AI interview questions** — generated per candidate from their actual application/CV, not a generic script.
- **Interview workspace** — notes, 5-category 1–5 ratings, and an AI-generated post-interview summary.
- **Recruitment Pipeline** — a drag-and-drop Kanban board across New → Reviewing → Interview → Shortlisted → Future Talent → Hired → Rejected.
- **Future Talent pool** — tag great candidates (role, branch, experience) and filter to find them later when a seat opens up.
- **Search & filters** — by name/phone, position, branch, employment type, experience, and Future Candidate status.
- **Duplicate applicant detection** — a second submission from the same phone number updates the *same* profile (with a snapshot of what changed) instead of creating a duplicate person, so interview history and notes are never split across two records.
- **WhatsApp integration** — one tap opens a chat with the candidate, with ready-made templates (Interview Invitation, Accepted, Not Selected, Keep For Future).
- **Hired hand-off** — hired candidates get a dedicated view with an exportable JSON employee profile, ready to feed a future DRINKAT HR system.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Drizzle ORM** + **better-sqlite3** — a single-file SQLite database, zero external services to run
- **Claude (Anthropic API)** for AI features, with a deterministic built-in fallback when no API key is configured
- **@hello-pangea/dnd** for the pipeline board

No accounts, no cloud database, no paid services are required to run this project.

## Getting started

```bash
npm install
npm run db:generate   # generate SQL migrations from the schema (already committed under /drizzle)
npm run db:migrate     # create/update the local SQLite database
npm run db:seed        # populate ~20 realistic sample candidates across every stage
npm run dev             # start the app at http://localhost:3000
```

Open `http://localhost:3000/apply` to try the public form, and `http://localhost:3000/dashboard` for the admin view.

### Environment variables

All optional — see [`.env.example`](./.env.example). Copy it to `.env.local` to customize. Without any configuration:

- The database is created at `./data/drinkat.db`.
- AI features run on a built-in rule-based engine — fully functional, free, and fast. Add `ANTHROPIC_API_KEY` to switch on real Claude-generated summaries and interview questions; the app upgrades automatically with no code changes.
- Phone numbers are normalized assuming Jordan (`962`); change `DEFAULT_COUNTRY_CODE` for another country.

## Project structure

```
src/
  app/
    apply/                 # public application form (no admin shell)
    (admin)/                # dashboard, candidates, pipeline, interviews, future-talent, hired, settings
    api/                    # route handlers (REST-ish JSON API)
  components/               # shared UI (Avatar, CandidateCard, Sidebar, Section, ...)
  db/
    schema.ts               # Drizzle table definitions
    seed.ts                 # sample data generator
  lib/
    ai.ts                   # Claude integration + heuristic fallback
    application-service.ts  # public-form submission + duplicate-merge logic
    constants.ts             # positions/branches/stages/WhatsApp templates
    validation.ts            # zod schemas
```

Uploaded photos/CVs are stored under `public/uploads/` (gitignored) and served statically — no object storage service required for this scale. `data/` (the SQLite file) is also gitignored; run `npm run db:migrate && npm run db:seed` after cloning to recreate it.

## Design notes

- Candidate photos are the primary visual anchor everywhere — a person without a photo shows a colored initials avatar as a placeholder, never a blank silhouette.
- The AI never rates appearance and never makes the hire/reject call — it only summarizes and suggests; the recruiter decides everything.
- Re-applications never create a second profile: the existing candidate record is updated in place, the previous answers are kept as a snapshot, and the recruiter is shown a duplicate-applicant notice with full history intact.

## Suggested next steps

Not built yet, intentionally — the brief asked for a complete, working core before extras:

- A lightweight admin login (the public `/apply` form is deliberately open; the dashboard currently is too — add a shared password or real auth before deploying somewhere public).
- Real object storage (S3-compatible) for photos/CVs if you outgrow a single server's local disk.
- Push/SMS notifications when a candidate reaches a given stage.
