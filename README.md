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
kiosk, the TV, saving to a database, live updates, **and the admin panel** (log in,
switch the live booth, edit dates, statistics, export, delete) with the **booth login**
for the kiosk and TV.

**The admin needs no command and no configuration.** The first time `/admin` is opened
it asks you to choose a username and a password, then signs you in; the password is
stored only as a hash. On a live server it also asks for a **setup code**, printed in the
server's log and written to `data/admin-setup-code-app.txt`, so a stranger who reaches the
page first cannot claim it. The password can be changed from the panel. Forgot it? Run
`npm run admin:reset`, then open `/admin` again. Until an admin has generated a booth
password from the panel, the kiosk and TV are open to anyone who knows the address (the
panel warns about it).

**Not built yet:** the final polish pass (an old-phone check, a wider accessibility
pass). Several pieces of copy are still drafts for the student council to approve; the
brief lists them.

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
| `npm run test:moment` | Detecting new flowers for the TV, and how the river's flowers recede with age. |
| `npm run check:theme` | The look's guard rails, computed from the real files: contrast of every text/paper pairing, that a festival file sets only its scene variables, that the base names no festival, and that no crosshair or halftone marks creep back. |
| `npm run test:look` | In a real browser: the private screens carry no festival layer, the festival appears where it should, the TV never scrolls, and reduced motion really stops everything. Needs `npm run dev` running. Writes nothing to the database. |
| `npm run test:auth` | Passwords, signed cookies (forged, tampered, expired), the five-tries lockout, and the booth password. |
| `npm run test:admin` | What the panel reads and does to the data: filters, the numbers, Thailand-time days, exports, delete, wipe. |
| `npm run test:setup:e2e` | Setting up the admin in the browser with no configuration: the setup code, the first-time form, changing the password, a server restart, and the forgot-password reset. Run `npm run build` first; it starts its own server and database. |
| `npm run test:admin:e2e` | The whole admin panel and the booth login in a real browser, including the security rules (no access without a login, cross-site requests refused, the lockout, cookies). Run `npm run build` first. It starts **its own** server on its own throwaway database, so it can never touch real data. |
| `npm run db:backup` | Not a test: a safe snapshot of the database, made while the site is running. |
| `npm run test:e2e` | Drives a **real Chrome** through the check-in, the booth quiz on all 18 paths, the kiosk and the TV, then reads the database to check what was saved. Needs `npm run dev` running and Chrome or Edge installed. It deletes only the sessions it creates. |

## Configuration

Everything is set with environment variables; see [`.env.example`](.env.example).

- `DATABASE_URL`: where the data lives. `file:./data/app.db` is a single file (a
  school server, or your laptop). `libsql://…` is a hosted database (Vercel).
  The same code runs against either.
- `DATABASE_AUTH_TOKEN`: only for a hosted database.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`: **optional.** Normally the
  admin is set up in the browser and none of these are needed. A server that prefers to
  set the admin itself can: `npm run admin:setup -- --write` asks for a password and
  saves the three lines into `.env.local`. When set, they win over a browser-made
  account, and the password is then changed there, not in the panel. `SESSION_SECRET`
  must be at least 32 characters; without one the app makes its own and keeps it in the
  database.

The **booth** account (for the kiosk and TV) is different: the admin sets it from the
panel, and it is stored in the database as a hash. A new password is shown once, when
it is made, and can never be read back.

## Deploying

The site is a Node app with a database, so it needs a host that can run Node.
**GitHub Pages cannot host it**; GitHub only holds the code.

**On Vercel** (the plan for launch):

1. Create a hosted libSQL database, for example on [Turso](https://turso.tech)
   (there is a free tier), in a region near Thailand.
2. Import this repository into Vercel.
3. Set `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in the project's environment
   variables. (The admin is set up in the browser on first visit; on Vercel the setup code
   is in the function's log.) On Vercel, leaving `DATABASE_URL` unset is an error on purpose: a
   file would appear to work and then quietly lose every answer.
4. Choose a region near Thailand (Singapore) for the function.

The tables are created automatically on the first request.

**On a school server** (likely later): there is a printable, step-by-step guide for
the school's IT person in **[docs/school-server-guide.pdf](docs/school-server-guide.pdf)**
(its source is `docs/school-server-guide.html`; `npm run docs:guide` rebuilds the PDF).
In short:

```bash
npm ci
npm run build
npm start                          # behind a reverse proxy with HTTPS
# then open /admin: it asks for the setup code (see the server's log) and a new login
```

with `DATABASE_URL=file:./data/app.db`. **Back up the database with `npm run db:backup`**
(hourly is sensible). Copying `data/app.db` by hand can catch it mid-write; this makes a
consistent snapshot at any moment and keeps the newest 60 in `data/backups/`.

The app sends its own security headers (a content security policy that allows only this
site, nosniff, no-referrer, no framing), so the reverse proxy only has to do HTTPS.

**The QR code must point at the school's own domain from the start**, never at a
`*.vercel.app` address. A printed QR code cannot be changed, so if the school
domain points at Vercel now and at the school server later, every code already on
a poster keeps working. Do not print any until that domain exists.

## The look: a base and a festival layer

The **base identity** belongs to Mental Health Week: warm peach-cream paper printed with
four inks (navy, hot pink, cobalt, marigold), hand-cut shapes with a soft paper edge,
slab cards, and a faint grain. It is defined in `app/globals.css` and is the same for
every festival.

A **festival** is only a scene laid on top: for Loy Krathong, a night river with a
marigold moon, and each result floating as a lit flower. It lives in
`components/festival/<id>/` with one token file, `app/festivals/<id>.css`, and one line
in `components/festival/registry.tsx`. A festival may set only the `--fest-*` scene
variables and never touches paper, text colours, type, sizes or motion, so it cannot make
anything illegible. The private screens (`/checkin`, `/result`) never carry it.

To add a festival, copy the Loy Krathong folder and token file, change them, and add the
line to the registry. `npm run check:theme` tells you if you broke a rule.

The grain is two small pre-rendered image tiles (plus retina versions) in
`public/textures/`. They are committed; `npm run textures` re-makes them if you want to
tune the grain. See BRIEF section 4 for why it is tiles and not a live filter.

## How it is organised

```
app/            pages and API routes (student pages, /booth/*, /api/session/*)
app/festivals/  one CSS file per festival: only its scene variables
components/     illustrations, UI, the quiz, the booth screens
components/festival/  the festival layer: each festival's scene, and the registry
content/th/     ALL Thai copy: questions, results, flowers, dates. Never in components.
lib/            scoring, the database, sessions, events, the TV's data
scripts/        the tests, and the texture generator
public/fonts/   the fonts, self-hosted (nothing loads from Google at runtime)
public/textures/  the grain tiles
reference/      the ORIGINAL design (screens.html, kept as history) and the current
                direction (reference/direction/)
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
