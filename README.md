# CUD Mental Health Week

A website for the student council's **CUD Mental Health Week** campaign at
โรงเรียนสาธิตจุฬาลงกรณ์มหาวิทยาลัย ฝ่ายมัธยม, November 2026 – February 2027.
Thai only, built for a phone in a hallway and for a shared screen in the canteen.

It has three parts:

| Part | Where | What it does |
|---|---|---|
| **Check-in** | `/checkin` → `/result` | Eight short questions about how the student has been lately, then a result with a few small things to try and a route to CUD Care. |
| **Booth quiz** | `/booth` (phone) and `/booth/kiosk` (a shared iPad) | "คุณเป็นดอกไม้แบบไหน?" Three easy questions, then a flower to collect at the booth. |
| **Booth TV** | `/booth/display` | A wall display, cast to a TV, showing what everyone is getting. A quiet screen greets each new flower. |

**It is anonymous by construction.** There is no name, student ID, class, email,
IP address, user-agent or free-text field anywhere, so there is nothing to leak.
The database has no column that could hold one, and a test fails if one is ever
added. The site never diagnoses anyone and never tells a student they are fine;
every result carries a visible route to CUD Care.

## Status

Built and tested: the design, the check-in and its scoring, the booth quiz, the
kiosk, the TV, saving to a database, and live updates.

**Not built yet:** the admin panel (log in, change the festival or the dates, see
statistics, export, delete), the booth login, and the final polish pass. Until the
admin panel exists, **the booth pages have no login**, and the live festival and
the event dates can only be changed in the database. Do not put this in front of
real students before that is decided.

Everything is specified in **[BRIEF.md](BRIEF.md)**: what to build, the reasoning
behind each decision, and what is still needed from the student council. Read it
before changing anything, because many rules that look arbitrary are there for a
reason.

## Run it

You need **Node 22 or newer**.

```bash
npm install
cp .env.example .env.local     # the defaults work as they are
npm run dev
```

Then open <http://localhost:3000>. The database is created on the first request,
in `data/app.db`, which is never committed.

To try it on a real phone or iPad on the same wifi, use `npm run dev:lan` and open
the address it prints. To preview the TV design with invented numbers, open
<http://localhost:3000/booth/display?demo=1> (this is ignored in production, so
made-up figures can never appear on the real wall).

## Test it

| Command | What it checks |
|---|---|
| `npm run lint` and `npx tsc --noEmit` | Style and types. |
| `npm run test:scoring` | The check-in scoring against the brief's reference result, every band edge, and **all 65,536** possible answer sets. |
| `npm run check:booth` | That every flower gets an equal share of the booth quiz, every question matters, and no two answers count the same. Run it after editing any booth question. |
| `npm run test:db` | The data layer, against a throwaway database: answers must exist in the content, results are recomputed on the server, finished sessions are immutable, "today" is Thailand time. |
| `npm run test:dates` | Thai date formatting, including bad input. |
| `npm run test:moment` | Detecting new flowers for the TV. |
| `npm run test:e2e` | Drives a **real Chrome** through the check-in, the booth quiz on all 18 paths, the kiosk and the TV, then reads the database to check what was saved. Needs `npm run dev` running and Chrome or Edge installed. It deletes only the sessions it creates. |

## Configuration

Everything is set with environment variables; see [`.env.example`](.env.example).

- `DATABASE_URL`: where the data lives. `file:./data/app.db` is a single file (a
  school server, or your laptop). `libsql://…` is a hosted database (Vercel).
  The same code runs against either.
- `DATABASE_AUTH_TOKEN`: only for a hosted database.

## Deploying

The site is a Node app with a database, so it needs a host that can run Node.
**GitHub Pages cannot host it**; GitHub only holds the code.

**On Vercel** (the plan for launch):

1. Create a hosted libSQL database, for example on [Turso](https://turso.tech)
   (there is a free tier), in a region near Thailand.
2. Import this repository into Vercel.
3. Set `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in the project's environment
   variables. On Vercel, leaving `DATABASE_URL` unset is an error on purpose: a
   file would appear to work and then quietly lose every answer.
4. Choose a region near Thailand (Singapore) for the function.

The tables are created automatically on the first request.

**On a school server** (likely later):

```bash
npm ci
npm run build
npm start            # behind a reverse proxy with HTTPS
```

with `DATABASE_URL=file:./data/app.db`. **Back up `data/app.db`**: it is one file,
and copying it is the whole backup plan.

**The QR code must point at the school's own domain from the start**, never at a
`*.vercel.app` address. A printed QR code cannot be changed, so if the school
domain points at Vercel now and at the school server later, every code already on
a poster keeps working. Do not print any until that domain exists.

## How it is organised

```
app/            pages and API routes (student pages, /booth/*, /api/session/*)
components/     illustrations, UI, the quiz, the booth screens
content/th/     ALL Thai copy: questions, results, flowers, dates. Never in components.
lib/            scoring, the database, sessions, events, the TV's data
scripts/        the tests
public/fonts/   the fonts, self-hosted (nothing loads from Google at runtime)
reference/      the approved visual design; the build must match it
BRIEF.md        the specification and every decision, with the reasons
```

The Thai copy in `content/th/` is written for review: much of it is marked as a
**draft awaiting student-council approval**, and the brief lists what is still
needed from them.

## Privacy

No analytics, no ad scripts, no third-party widgets, no tracking pixels, and no
external font requests. This is a mental health page. Keep it that way.

## Working on it with an AI assistant

This repo includes `AGENTS.md` and `CLAUDE.md`. `AGENTS.md` warns that this
version of Next.js has breaking changes from what most tools were trained on, and
points at the docs shipped inside `node_modules/next/dist/docs/`. Read them before
writing Next.js code.
