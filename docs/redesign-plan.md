# CUD Mental Health Week — redesign plan: from "a form" to "a place"

> **Update 2026-09-26 — superseded in part.** The student pages are NOT festival-themed. They wear Mental Health Week's own look (light pink sky, drifting hearts: `components/landing`, `components/checkup`), and only the booth screens carry Loy Krathong, Christmas or CNY. Sections 4, 7 (Vessel) and 10 below still describe the rejected "one seasonal place" direction; the MBTI engine, VENT contract, privacy and safety sections still stand. See BRIEF's decisions table.


## Context

You said the site feels clinical, and that someone opening it should feel relief at once and sense that an experience is starting. Reading the code, that clinical feeling is **built into the structure, not only the styling**, and it traces back to decisions in BRIEF.md:

| What the student meets | Why it reads as clinical | Where it comes from |
|---|---|---|
| Home's first line, "วันนี้ใจเป็นยังไงบ้าง?", then a single "เช็กอินความรู้สึก" button | Opening with a question about your mental state is how an intake form starts | `content/th/common.ts` `home`, BRIEF §8 |
| An 8-question check-in, 4 answers weighted 0–3 and drawn as full→empty moons, with a "3/8" progress bar | It works like a screening questionnaire (PHQ/GAD style): graded severity plus a progress bar | `content/th/questions.ts`, `lib/scoring.ts` |
| The result is a *state* ("ช่วงนี้น่าจะหนักอยู่เหมือนกัน") drawn as a battery, then topic pills, then three advice rows | A severity label followed by suggestions reads like a report or a diagnosis | `content/th/results.ts`, `ResultView.tsx` |
| The festival scene, motion and light appear only on booth screens. §8 bans the festival on `/checkin` and `/result`, and §9 bans motion on Home | The private side, where a student is most vulnerable, is the plainest and stillest part | BRIEF §8, §9; enforced by `test:look` |
| Home is a stack of sections (hero, festival block, CUD Care block, a data notice, footer) | It reads like a portal, and it mentions data collection on the first screen | `app/(student)/page.tsx` |

The warm parts already exist: the paper, the four inks, the cut-paper scenes, the Loy Krathong night river, the flowers that bloom and float. They are kept for the booth today. **The change is to turn the whole student side into one place the student is *in* from the first frame, so that it stops being a set of pages with a form in the middle.** The underlying logic changes from *assessment → score → advice* to *arrive → do one thing → leave with something*.

**What you've decided so far (2026-09-26):**
- **Scope for Loy Krathong (19–20 Nov):** the new Home, MBTI (phone and booth) and VENT, all in the Loy Krathong skin. The Christmas and CNY skins come later on the same engine.
- **Home is an experience from the very first page.** A living scene is not enough; the elements themselves should be experiential.
- **Statistics:** you only need *what students answered, anonymously, as statistics*. There is no separate school-report requirement. (BRIEF §11's line about "the statistics the school needs for its report" overstated it and should be corrected.) The 8-question check-in therefore isn't protected by a reporting need.

Hard facts that shape the plan:
- **VENT reverses four explicit brief rules:** no LLM (§8, §15), no free-text box (§12, which says "someone would have to be responsible for reading it"), no festival on private screens (§8) and no motion on Home (§9). Each needs a new entry in BRIEF's decisions table, and the text-box rule also needs CUD Care's sign-off.
- The final host is the school server (one Node process, SQLite `file:`). The AI call runs server-side there, and the key never reaches the browser.
- The booth hands out physical flowers, and inventory needs each flower at about 1/6. `npm run check:booth` enforces that and must keep passing.
- Scale is roughly 10–30 students per event and 5 devices. Keep the architecture small.

---

## 1. Current system (verified from source)

**Stack:** Next.js App Router (a newer major version; AGENTS.md says to read `node_modules/next/dist/docs/` before writing code), TypeScript, plain CSS Modules, `@libsql/client`, zod, and scrypt auth. The only dependencies are next, react, libsql and zod. There is no AI code anywhere. Thai copy lives in `content/th/*`; illustrations are inline SVG; fonts are self-hosted; there are no analytics.

**Routes**
- Student side: `/` (Home), `/checkin` (`CheckinFlow` → `PhoneQuiz`), `/result` (scored on the client from sessionStorage), `/booth` (`BoothPhone` → `PhoneQuiz` → flower).
- Booth devices: `/booth/kiosk` (a landscape two-column quiz, a poster result, a 45 s reset), `/booth/display` (a TV using `AutoRefresh` to call `router.refresh()` every 5 s, plus the river, the "new flower" moment via `lib/new-flowers.ts`, and river depth via `lib/river.ts`), `/booth/login`.
- Admin: `/admin`, `/admin/login`, `/admin/setup`. The admin panel has setup in the browser with a production setup code, a theme switch, event dates, filters (dates, mode, status, festival, id), a summary strip, CSS charts (per day, result states, flowers, answer breakdown per question), the newest 500 sessions, CSV exports, delete/wipe, and the booth account.
- API: `POST /api/session`, `/answer`, `/complete` (the server recomputes results in `lib/session.ts`), plus `/api/admin/*` and `/api/booth/login`.

**Data** (`lib/db.ts`): `session(id, mode, festival, started_at, completed_at, result_state, primary_topic, secondary_topic, booth_result, device_bucket)`, `answer(session_id, question_id, choice_id, answered_at)`, `setting`, `event`, `auth_lock`. No free text and nothing identifying. The phone's writes are fire-and-forget, and there is a global cap of 120 new sessions a minute.

**Event/theme:** the active festival is `setting.active_festival`, set **only** by the admin switch. Dates in `event` are display-only, and after a booth's dates pass nothing changes by itself. Only `loykrathong` is `ready` and has CSS (`app/festivals/loykrathong.css`) and a registry entry.

**Checking the section 0 leads**
| Lead | Verdict |
|---|---|
| Routes as listed | ✅ Confirmed, plus `/booth/login`, `/admin/setup` and the booth-login API |
| `PhoneQuiz` is shared | ✅ It takes generic `QuizQuestion[]` and knows nothing about scoring |
| Flower quiz is a 2-axis model | ✅ energy (b1+b3 → 3 bands) × heart (b2, self/others) = a 3×2 grid, exactly 3 of 18 answer sets per flower |
| `BoothPhone` imports `loykrathongQuiz` | ✅ And more: `session.ts` (validation and completion), `admin-data.ts` (labels, flower lists) and `booth-wall.ts` are all hard-wired to Loy Krathong |
| One content module, three presentations | ✅ `booth.ts` holds the quiz, flowers, `kiosk`, `tv` and `boothNext` |
| Check-in: 8 questions, weight and topic, 4 states | ✅ |
| Sessions record no event ID | ❌ **Corrected:** `session.festival` is recorded (server-side, from the live setting). ✅ There is no activity or version field; `b1`/`a` IDs **would collide** in `answer` and admin stats once a second festival has a quiz |
| Only loykrathong has CSS; the current event is decided server-side | ✅ By the admin switch, not by date |
| Inventory constrains results | ✅ Enforced by `check:booth` |
| 500 on kiosk/display/admin/login | ✅ Explained: those pages call `db()` without a guard (`auth.ts` `getBoothAccount` / `getStoredAdmin`), while Home survives because `getActiveFestival` catches the error. **The most likely cause is that `DATABASE_URL` isn't set on Vercel.** `db.ts` deliberately throws when `VERCEL` is set without it; alternatively a `file:` URL fails there with EROFS. The fix is a hosted libSQL URL + token, or it's moot once on the school server. This is not a code bug |

**Already working well:** the shared `PhoneQuiz`; server-side recomputation; fire-and-forget logging; the festival-as-layer idea; the honest, balanced flower grid; the TV's calm river; the privacy discipline; the tested scripts (`check:theme`, `check:booth`, `test:*`, the e2e suites).

**Structural limits:** booth quiz content is hard-wired in about 5 places; there's no activity or version field; the private side is kept apart from all the warmth; Home is a portal, not an arrival; the check-in is the only private activity; there's no free text or AI.

## 2. Current journeys

- **User:** QR → Home ("how's your heart?") → 8 graded questions → a state label and a battery → 3 tips plus CUD Care → "back home / check in again".
- **Booth:** the kiosk's idle screen ("คุณเป็นดอกไม้แบบไหน?") → 3 questions about what you *do* → the flower blooms on a poster with a wish and a ticket → the student shows staff and gets a real flower → the TV shows a quiet moment for the new flower, then it joins the river → reset after 45 s. The phone version `/booth` ends in a ticket and a link to the check-in.

## 3. Current activity architecture

There is **half an engine**. The *runner* is reusable (`PhoneQuiz`, and the kiosk's own runner), but each activity's *definition and scoring* is hand-built. The check-in's model is weighted severity (`scoring.ts` + `results.ts`); the booth's is personality axes (`booth.ts` `axis` + `value` + `FLOWER_GRID`). **MBTI belongs with the booth's axis model.** The flower quiz already *is* a 2-axis engine, and it generalises to 4 axes.

---

## 4. Direction: the site is one place, and you're in it from the first frame

The site isn't pages with buttons. It's **a scene the student enters**: during Loy Krathong, a night riverbank on paper. Everything they can do is **an object in that place** that responds to touch. When they choose one, the scene carries them into it. Nothing cuts to a blank form.

```
  QR ─▶  ARRIVE: the river at night fades up from paper (no question asked of you)
          │   the water moves, the moon's light breathes, one quiet line appears
          │   the water ripples under a finger; things drift by and can be touched
          │
          ├─ a krathong waiting at the water's edge ─▶ VENT  (write → AI hears → let it float)
          ├─ a flower on the bank                    ─▶ MBTI  (what kind of flower/person are you)
          └─ a small lit window / lantern            ─▶ CUD Care (a person to talk to, always there)
                     the scene stays behind every activity; you return to the same river
```

**What makes the first page an experience (to be explored in mockups, not decided yet):**
- **Arrival:** the paper surface, then the ink "prints" in layer by layer (water, moon, far bank) over about 1.5 s. It's skippable and never blocks input, and reduced motion shows the final frame. The first line is an invitation, not a question (e.g. "มานั่งริมน้ำด้วยกันก่อนนะ").
- **Touchable world:** a touch on the water makes a ripple, flowers on the water bob away from the finger, and the moon's reflection breaks and rejoins. It's small, cheap (transform/opacity/SVG only) and calm, in the TV's language.
- **Objects instead of buttons:** each choice is a drawn object with a short handwritten label beside it (the Itim face), with a real `<a>`/`<button>` underneath for accessibility. Tapping one lifts it, and a **shared-element transition** carries it into the activity (the krathong becomes VENT's writing surface; the flower becomes MBTI's first question). Check Next's docs for View Transitions support first; otherwise use a CSS/FLIP fallback.
- **Continuity:** activities happen *over* the same scene (dimmed, text on paper slabs, so legibility holds), and leaving returns you to the river, now carrying what you made: your krathong floating, your flower on the bank. The **keepsake lives in the world** (on-device only, with no server memory; decision D4).
- **CUD Care** is one of the objects in the place, always there, not a block of text.
- **Where the privacy note goes:** inside VENT and the quiz, at the moment it's relevant, not on the first screen.

This drops the old Home sections (the festival block, "next booth" pills, the data notice) from the first view. Booth dates can live on the booth-flower object or a small "ที่โรงอาหาร 19–20 พ.ย." tag.

Also considered: **B.** a guided sequence (MBTI → VENT → ending), rejected because it gates and repeats the form feeling; **C.** a "what do you need right now?" chooser, which asks a question before letting the student arrive.

## 5. Keep / modify / refactor / replace / new

| Piece | Class | Why |
|---|---|---|
| Tokens, paper, inks, fonts, cut-paper SVG, grain, the River scene | **KEEP** | This is the warmth, reused on the student side |
| `PhoneQuiz` runner (history, auto-advance, focus) | **KEEP**, restyled | Generic already; it gets a slab-over-scene look |
| Fire-and-forget tracking, server recompute, zod, auth, admin shell, TV, kiosk poster | **KEEP** | Solid |
| Home page | **REPLACE** | Portal → a place (section 4) |
| Check-in (8 graded questions, state label, battery) | **REPLACE / retire** (decision D3) | The clinical core, and not needed for statistics. Its job (a gentle "how are you" plus the bridge to CUD Care) moves to VENT and the CUD Care object |
| `booth.ts` flower quiz + `FLOWER_GRID` | **REFACTOR** → the axis engine | Same idea, N axes, with festival skins |
| The Loy Krathong hard-wiring in `BoothPhone`, `Kiosk`, `session.ts`, `admin-data.ts`, `booth-wall.ts` | **REFACTOR** | Read the active activity definition |
| `session` / `answer` | **MODIFY** | Add an `activity` + `activity_version` column; namespace question IDs (`lk-mbti.e1`) |
| `check:theme` / `test:look` rules | **MODIFY** | They currently *enforce* "no festival on private screens" |
| BRIEF §8/§9/§11/§12/§15 | **MODIFY** | Record the reversals and correct the stats wording |
| Axis engine (MBTI) | **NEW** | `lib/activity/` |
| VENT (page, `/api/vent`, provider interface + mock, safety layer) | **NEW** | |
| The Home scene as an interactive world | **NEW** | |
| Date-based festival selection with an admin override | **NEW** (small, after Loy Krathong) | |

## 6. MBTI — one engine, two presentations

**Recommendation:** one axis engine (`lib/activity/axes.ts`) that generalises `flowerFromAnswers`. An activity definition is `{ id, version, axes[], questions[{id, axis, choices[{id,label,value}]}], resolve(scores) → resultId }`. The same definition feeds the phone and the kiosk; the festival supplies the *skin* (result names, art, copy).

- **Four axes** with Thai names, letters shown last and small: energy (E/I, which is *already* the flower's energy axis), noticing (S/N), deciding (T/F, which is close to the flower's self/others axis), and planning (J/P).
- **Phone:** about 8 situational questions, two per axis, in the booth's rule ("what you DO, never how you FEEL"). The result is the student's flower as a character, then 2–3 lines that **echo their own answers**, and each axis shown as a *lean*, not a binary. Echoing answers is the main guard against the Barnum effect.
- **Booth:** a **subset** of the same questions (3–4). It still resolves the physical flower on energy × heart (6 flowers, 1/6 each), so `check:booth` stays valid. The kiosk result shows a QR code carrying the answers in the URL (answers only, no ID) so the student can **finish the rest privately on their phone** and get the full four-axis result.
- **How results map (decision D5):** with 16 types and 6 flowers, the phone shows *your flower* (the same 2 axes, so the booth and the phone agree) plus the two other axes as its "character". That way the flower stays the festival identity.
- Framing copy: it's for fun and self-discovery, never an assessment.

## 7. VENT — the experience

The core flow doesn't change: **tap the krathong → write → the AI listens → a unique reply → let it float → leave.** It's one turn, with at most **one** optional short follow-up and never a thread.

**Concepts** (all keep the core flow; mock them up before choosing):
1. **Echo (recommended base).** The student writes on a paper slab laid over the dimmed river. On send, their words stay; while it waits, the text slowly dims except the one phrase the AI "heard" (`heard`, verified to be a verbatim substring of what they wrote). The reply is built around that phrase and revealed a line at a time. There are no chat bubbles, their words stay in the room, and the proof of listening is visible.
2. **Vessel.** After the reply, the student's text folds into the krathong and floats down the river on the Home scene, and they can watch it drift away. The reply stays as a note. This is the Loy Krathong theme of "letting go" made literal, and it has natural counterparts for the other seasons (an ornament hung, a red envelope). Purely visual; the text never leaves the device except in the AI call.
3. **Object.** The AI picks one object from a small per-festival library, composed as cut paper beside the reply.
4. **Letter back.** The reply as a short handwritten-style card the student can save as an image. The vent text is never on it.

**Recommendation:** Echo → Vessel, with the reply card (concept 4) as the keepsake. **Waiting (2–8 s):** a deliberate reveal, not token streaming; the calm fallback appears at 12 s.

## 8. VENT AI response contract (a candidate)

```ts
// validated with zod on the server; provider-agnostic
{ heard: string,           // ≤ 60 chars, MUST be a verbatim substring of the vent (checked)
  reply: string[],         // 2–4 short Thai lines, specific to what was written
  feeling?: Enum,          // small fixed set → tint only, never shown as a label
  object?: FestivalObject, // optional, per concept 3
  nudge?: string,          // optional, one gentle concrete line; never "you should"
  risk: 'none' | 'concern' | 'urgent' }
```
- **Prompt rules:** Thai first, in a friend's voice (BRIEF §10); ground every line in the student's words; no diagnosis, clinical terms or generic self-help; no questions that pull the student into a thread; 60–120 Thai words; never imply that a human read it.
- **Failure:** retry once. If `heard` isn't a substring, drop the highlight. If the response is still invalid or times out, show an honest fallback ("ตอนนี้ระบบตอบกลับไม่ได้ ข้อความของคุณไม่ได้ถูกเก็บไว้"), with CUD Care and a retry that keeps the student's text.
- **Swappable provider:** `lib/vent/provider.ts` defines `respond(text, ctx) → raw`, with `providers/mock.ts` (deterministic, for dev and e2e). The real provider is added once you supply the API. The key lives only in the server environment.

## 9. VENT privacy and safety

- **Data path:** browser → `POST /api/vent` (same origin) → the provider → back. **Nothing is persisted:** no DB text, no request-body logging (strip it from error logs), no localStorage, and the text is cleared when the student leaves. The admin sees at most a **count** (decision D6).
- **PDPA:** emotional text may be sensitive health data (§26, explicit consent). The plan: a short plain consent line before writing ("ข้อความจะถูกส่งให้ AI อ่านเพื่อตอบกลับ แล้วไม่ถูกเก็บไว้ ไม่ต้องใส่ชื่อใคร"), a provider with zero retention and no training on the data, and minimal data.
- **Safety is deterministic first:** a server-side pattern check (Thai, English and teen slang for self-harm, suicide and abuse) runs **before** the AI call, and the AI's `risk` field is a second net. Either one switches to a **pre-written screen approved by CUD Care**: warm, not alarmed, with CUD Care's real channels and the 1323 hotline (24/7). The AI's reply isn't shown then.
- **Honesty:** say plainly that no one reads these messages and that the site can't reach out, because it's anonymous. CUD Care must accept that limit.
- **Sign-off needed from the school and CUD Care:** the reversal of the no-free-text rule, the safety screen and its contacts, the pattern list, the provider and its data terms, and any VENT statistic.

## 10. Event-theme system

- A festival stays **copy + scene pack + tokens**, extended with: the **Home world** (scene, touchable objects, which vessel stands for VENT), the MBTI skin (result set and art), and VENT accents (the invitation line, the vessel animation, the highlight ink).
- Loy Krathong comes first and in full; Christmas and CNY are later skins on the same system.
- **Selection (after Loy Krathong):** by date from the `event` table, with the admin switch as an override. **Between events:** the base paper world with no seasonal scene; VENT and MBTI stay open.

## 11. Current → target

| Area | Current | Target | Why |
|---|---|---|---|
| Home | A portal: a mental-state question, a CTA, sections | A touchable seasonal world; activities are objects in it | The first feeling is relief and "something's about to happen" |
| User Mode | The check-in only | VENT + MBTI inside the world; the check-in retired or reduced | The clinical core goes; expression and discovery come in |
| Booth | Flower quiz, hard-wired | The same kiosk/TV fed by the engine; a QR code to finish on the phone | Reuse, and a bridge to private continuation |
| Quizzes | Two hand-coded models | One axis engine + festival skins | A new festival means new content, not new code |
| Data | session + answer | + `activity`/`version`, namespaced IDs; a VENT count only, never text | Stats stay separable; privacy |
| Events | Manual admin switch | By date with an admin override (later) | Less to forget |
| Admin | Check-in + flower stats | Per-activity answer distributions, MBTI results, VENT count | "What students answered, anonymously": exactly what you need |

## 12. Decisions still open

- **D2 Festival on private screens:** yes, as atmosphere (recommended, and it follows from "one place").
- **D3 The check-in:** retire it (recommended, now that stats don't depend on it), or keep a 2–3 question "mood" moment somewhere lighter.
- **D4 Memory:** does the world remember your krathong/flower on this device (localStorage, as a per-viewer nicety) or forget everything on leaving? Shared school devices argue for forgetting.
- **D5 The MBTI ↔ flower mapping** described in section 6.
- **D6 VENT admin visibility:** nothing, a count, or a count plus a safety-routed count.
- **D7 The CUD Care sign-off path and dates** (VENT can't go live without it; is this realistic before 19 Nov?).
- **D8 The VENT concept** after seeing mockups.

---

## Next steps (after you approve)

Your process is: describe the direction, then **one rendered screen**, before any app code.

1. Save the analysis as `docs/redesign-plan.md` (the full 16-section doc with sources), and add the proposed BRIEF reversals and the stats correction to its decisions table.
2. **Mock up the Home world** for Loy Krathong as a static HTML page using the real tokens, fonts and River scene: the arrival, the touchable water, the three objects, one object → activity transition. Show 2–3 variants side by side. Then mock up one VENT reply moment (Echo → Vessel).
3. After your yes, build and verify in phases:
   1. **Axis engine** (`lib/activity/`), moving the flower quiz onto it. `check:booth` passes unchanged.
   2. **Schema:** `activity`/`activity_version`/namespaced IDs, a migration for existing rows, `test:db`, and admin labels that read from definitions.
   3. **The Home world** + the festival on the student side; update `check:theme`/`test:look` to the new rules.
   4. **MBTI** on the phone + the booth subset + the QR continuation.
   5. **VENT** with the mock provider, the safety layer and the no-storage/no-log guarantees.
   6. The real AI provider once supplied; CUD Care sign-off before going live.
   7. Retire the check-in (per D3); admin additions.

## Verification

- `check:booth`, `check:theme`, `test:scoring`, `test:db` and the existing e2e suites stay green, with the look rules updated deliberately.
- A new `test:vent` (mock provider): malformed JSON, a non-substring `heard`, a timeout, and a risk phrase routing to the safety screen **without** calling the AI. **Sabotage check:** after a vent run, grep the server logs and the DB for the text and confirm it appears nowhere.
- A browser pass at 390/360/320 px, on an iPhone and an iPad, and a 2019-class Android for scene performance (60 fps, transform/opacity only). With reduced motion, every experiential element is static but fully usable. Keyboard and screen-reader paths through the objects.
- Kiosk → QR → phone continuation gives the same flower and the same axes.

## Research basis (to be expanded in the doc)

- **Established:** expressive writing has small but real effects (adults d≈0.15, Frattaroli 2006; adolescents g≈0.13, Travagin et al. 2015), so VENT must not claim to heal. MBTI types are unstable on retest, and generic descriptions feel personal (the Barnum effect). The APA's 2025 advisories stress privacy, transparency about AI, and not replacing human support. Chatbot risk detection degrades with indirect teen language and over multiple turns, which supports a deterministic layer and a single turn. The honeypot effect: people engaging with a display draw in others, which supports the kiosk + TV design.
- **Design recommendations:** echo answers to beat Barnum; a reveal, not streaming; keepsakes, not verdicts; objects in a place, not buttons on a page.
- **Experimental:** the Vessel fold; the touchable Home world; the booth-to-phone QR continuation.

Sources: [APA AI & adolescent well-being](https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-ai-adolescent-well-being) · [APA chatbots & wellness apps](https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-chatbots-wellness-apps) · [Frattaroli 2006](https://bpb-us-e2.wpmucdn.com/faculty.sites.uci.edu/dist/c/602/files/2019/08/Frattaroli-psych-bulletin-2006.pdf) · [Travagin et al. 2015](https://pubmed.ncbi.nlm.nih.gov/25656314/) · [Thai PDPA (DLA Piper)](https://www.dlapiperdataprotection.com/index.html?t=law&c=TH) · [1323 hotline](https://findahelpline.com/organizations/1323) · [Honeypot effect, Wouters et al. 2016](https://dl.acm.org/doi/10.1145/2901790.2901796) · [MBTI limits](https://www.simplypsychology.org/the-myers-briggs-type-indicator.html) · [AI chatbots & youth suicide risk, npj Digital Medicine](https://www.nature.com/articles/s41746-026-03080-9)
