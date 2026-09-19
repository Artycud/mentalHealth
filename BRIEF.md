# CUD Mental Health Week — build brief

Source of truth for scope, design and copy. Code comments reference these
section numbers (§4 = colour, §9 = motion, and so on).

---

## 0. How to work on this

- Build in the phases listed in section 14. Finish a phase, run it, and verify it before starting the next one.
- `reference/screens.html` in this repo is the **source of truth for the visual design**. It contains the four approved screens as plain HTML and CSS: exact colours, spacing, type sizes, radii, and SVG paths. Open it, copy those values, and match them. Improve only where this brief explicitly asks for more (motion, polish, the remaining screens). Do not redesign, re-theme, or "modernise" anything in it.
- Ask before adding any dependency that is not listed in section 2.
- Keep all Thai copy in content files under `content/`. Never hardcode Thai strings inside components.
- Never invent facts. Dates, CUD Care contact details, and booth items stay as the placeholders written here until the student council fills them in.
- When something in this brief is ambiguous, ask a short question rather than guessing.

## 1. What this is

**CUD Mental Health Week** is a student council campaign at CUD running from November 2026 to February 2027, with festival-themed canteen booths (Loy Krathong, Christmas, Chinese New Year / Valentine's) and a link to CUD Care, the school's support service.

The website has two student modes plus an admin area:

1. **Check-in mode** — 8 short questions about how the student has been lately, then a result screen. Used on the student's own phone.
2. **Booth mode** — a 3-question festival quiz. The result (a flower, for Loy Krathong) is shown at the booth to receive a real item for the activity, such as decorating a krathong.
3. **Admin** — one account for the student council. Shows every answer session, grouped and collapsible, plus the statistics the school needs for its report.

**Audience:** Thai students in Grades 7–10, arriving by QR code, often standing in a hallway, using one hand, on an older phone.

**Scale:** roughly 10–30 students per event and no more than about 5 devices at once. Design for correctness and feel, not for load.

**Language:** Thai only. Design for Thai first, including its line wrapping and the space tone marks need. No English beside Thai text and no language switcher, but keep copy in files structured so an English file can be added later without touching components.

**Visual concept:** a risograph-printed student zine turned into a website. Flat printed ink shapes that overlap, slightly misaligned outlines, hand-drawn lines. The target is "a genuinely good student-designed website": polished enough to impress teachers, natural enough for students to trust. It must not look like an AI wellness app or a startup landing page.

## 2. Stack and structure

- Next.js (App Router) with TypeScript.
- Plain CSS: one `globals.css` holding the design tokens as CSS custom properties, plus CSS Modules per component. No Tailwind, no UI kit, no animation library, no chart library.
- SQLite through the `@libsql/client` package, opened from `DATABASE_URL`: a `file:` URL (a single file) on a school server, a `libsql://` URL (hosted, e.g. Turso) on Vercel. **Not `better-sqlite3`** — it needs a persistent disk, and Vercel has none. Planned, to be confirmed before phase 4 starts; see *Hosting* below.
- `zod` for validating every request body.
- Password hashing with `@node-rs/argon2` or `bcryptjs`.
- Fonts self-hosted as woff2 in `public/fonts` (Mitr 400/500/600, IBM Plex Sans Thai Looped 400/500/600, Itim 400). Do not load Google Fonts at runtime.
- All illustrations are inline SVG components written by hand. No image files, no icon library.

```
app/
  (student)/page.tsx            หน้าแรก
  (student)/checkin/page.tsx    question flow
  (student)/result/page.tsx     check-in result
  (student)/booth/page.tsx      booth quiz + result
  admin/login/page.tsx
  admin/page.tsx
  api/session/route.ts
  api/session/[id]/answer/route.ts
  api/session/[id]/complete/route.ts
  api/admin/login/route.ts
  api/admin/logout/route.ts
  api/admin/sessions/route.ts
  api/admin/export/route.ts
  api/admin/session/[id]/route.ts   (DELETE)
content/
  th/common.ts questions.ts results.ts booth.ts admin.ts
lib/
  db.ts scoring.ts session.ts auth.ts
components/
  illustrations/ ui/ admin/
```

**Hosting check before you build:** this needs a Node runtime and a writable file for SQLite. If the school can only serve static files, stop and say so. The fallback is a static export for the student side plus a small hosted API, and that decision changes section 2 only.

## 3. Data model

Every completed or abandoned run is its own row. Pressing "เช็กอินอีกครั้ง" or reopening the QR link always creates a **new session** — never update an old one.

```sql
CREATE TABLE session (
  id              TEXT PRIMARY KEY,   -- uuid v4, generated on the server
  mode            TEXT NOT NULL,      -- 'checkin' | 'booth'
  festival        TEXT,               -- 'loykrathong' | 'christmas' | 'cny-valentine' | NULL
  started_at      TEXT NOT NULL,      -- ISO 8601, UTC
  completed_at    TEXT,               -- NULL while unfinished
  result_state    TEXT,               -- 'ok' | 'thinking' | 'drained' | 'heavy'
  primary_topic   TEXT,
  secondary_topic TEXT,
  booth_result    TEXT,               -- e.g. 'marigold'
  device_bucket   TEXT                -- 'mobile' | 'tablet' | 'desktop', from viewport width only
);

CREATE TABLE answer (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES session(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  choice_id   TEXT NOT NULL,
  answered_at TEXT NOT NULL,
  UNIQUE (session_id, question_id)
);

CREATE TABLE setting (
  key        TEXT PRIMARY KEY,   -- 'active_festival'
  value      TEXT NOT NULL,      -- 'loykrathong' | 'christmas' | 'cny-valentine' | 'none'
  updated_at TEXT NOT NULL
);
```

```sql
CREATE TABLE event (
  festival    TEXT PRIMARY KEY,   -- 'loykrathong' | 'christmas' | 'cny-valentine'
  start_date  TEXT NOT NULL,      -- 'YYYY-MM-DD', first booth day
  end_date    TEXT NOT NULL,      -- 'YYYY-MM-DD', last booth day, inclusive
  time_text   TEXT NOT NULL,      -- free text as on a school notice: '11.10–12.50 น.'
  place_text  TEXT NOT NULL,      -- 'โถงโรงอาหาร'
  updated_at  TEXT NOT NULL
);
```

`event` holds the booth schedule, one row per festival. A festival with no row
falls back to the defaults in `lib/events.ts`, so a fresh database still shows
sensible dates. Dates are stored as ISO calendar dates and formatted for display
(Buddhist Era, e.g. `19–20 พ.ย. 2569`) by `lib/thai-date.ts`.

`active_festival` defaults to `loykrathong`. It is read server-side on every student page load, and its value at that moment is written into `session.festival`, so statistics stay separable per booth.

Never store: names, student IDs, classes, IP addresses, user-agent strings, cookies that identify a student, or free text. `device_bucket` comes from viewport width, not fingerprinting, and it is optional.

API rules:
- `POST /api/session` takes `{ mode, festival? }`, returns `{ id }`.
- `POST /api/session/:id/answer` takes `{ questionId, choiceId }`. Reject any id that is not in the content files. Upsert on `(session_id, question_id)` so a changed answer does not duplicate.
- `POST /api/session/:id/complete` takes the computed `{ resultState, primaryTopic, secondaryTopic }` or `{ boothResult }`. Recompute it on the server from the stored answers and store the server's value, so the client cannot post nonsense.
- Validate everything with zod and cap body size (2 KB). New sessions are capped at **120 a minute across everyone**, counted from the `session` table itself. A per-IP limit counted in memory was the original idea, and it fails twice over: memory does nothing on Vercel, where each request can be a fresh instance, and counting per IP means storing IPs, which section 12 forbids. A single global ceiling needs neither, and at this scale (about 30 students, 5 devices) it is far above real use and far below a flood. The client-supplied festival is ignored; the server reads which one is live.
- **The student flow never waits on the network.** Fire the requests in the background. If one fails, retry once, then drop it silently. A student must never see a saving error or a spinner because of logging.

## 4. Visual system: color

Use only these. No gradients, no glassmorphism, no drop shadows, no glow.

| Token | Hex | Use |
|---|---|---|
| paper | `#F1F2F4` | Page background |
| ink | `#1B2B5E` | All main text, primary button fill, outlines, hand-drawn strokes |
| ink-soft | `#46507A` | Secondary text, dates, descriptions |
| ink-muted | `#5A6386` | Footer text |
| riso-pink | `#FF48B0` | Illustration shapes, current progress segment, focus ring |
| riso-blue | `#0078BF` | Illustration shapes, answer icons |
| sunflower | `#FFB511` | Loy Krathong only: moon and marigold |
| pink-tint | `#FFDDEC` | CUD Care block, selected answer background |
| sun-tint | `#FFF1CC` | Booth ticket |
| note-pink | `#B0155F` | Handwritten notes, link hover |
| line | `#C9CEDC` | Unselected answer border, dividers |
| track | `#D3D7E2` | Upcoming progress segments |
| pill-line | `#9AA2BE` | Small "next booth" pill borders |
| white | `#FFFFFF` | Answer cards, filled button text, booth label pill |

- riso-pink and riso-blue are shape colors and never body text.
- Text on pink-tint and sun-tint is always ink.
- Later festivals keep pink, blue, and ink; only the sunflower accent is swapped for one festival color.

## 5. Visual system: typography

Fallback stack for every font: `'Noto Sans Thai', 'Leelawadee UI', Thonburi, sans-serif`.

| Role | Font | Size / line-height / weight |
|---|---|---|
| Wordmark | Mitr | 15 / normal / 500 |
| Home headline | Mitr | 42 / 1.3 / 600 |
| Question headline | Mitr | 32 / 1.35 / 600 |
| Result headline | Mitr | 36 / 1.3 / 600 |
| Booth flower name | Mitr | 64 / 1.2 / 600 |
| Section heading | Mitr | 24–26 / 1.3 / 500 |
| Small block heading | Mitr | 19–21 / 1.4–1.5 / 500 |
| Primary button label | Mitr | 20 / 500 |
| Progress counter | Mitr | 15 / 500 |
| Body | IBM Plex Sans Thai Looped | 16–17 / 1.6–1.65 / 400 |
| Answer label | IBM Plex Sans Thai Looped | 17 / 500 |
| Suggestion title | IBM Plex Sans Thai Looped | 17 / 1.5 / 600 |
| Secondary text | IBM Plex Sans Thai Looped | 15 / 1.6 / 400 |
| Small text, dates, pills | IBM Plex Sans Thai Looped | 14 / 1.5 |
| Footer | IBM Plex Sans Thai Looped | 13 / 1.6 |
| Handwritten note | Itim | 17–20 / 1.5, color note-pink |

- Headings use Mitr. Body uses the looped Thai face, which is easier for younger students to read.
- At most **one** Itim note per screen.
- Never letter-space Thai. Never go below line-height 1.3 on Thai headings or 1.6 on body.
- No all-caps labels. No single coloured or italic word inside a headline.
- Everything is left-aligned except button labels and a text link sitting under a button.

## 6. Visual system: layout, shape, illustration

**Layout**
- Design width 390px, side padding 24px, top padding 16–20px.
- On screens wider than 480px, center one column at max-width 440px on the same paper background. There is no separate desktop layout for students. (Admin is different — see section 11.)
- Vertical rhythm: illustration → headline 12–20px, headline → body 10–12px, body → primary button 24px, between sections 36–44px.
- The main action sits at the bottom of the screen; the home footer is pinned to the bottom.
- Bottom padding uses `max(32px, env(safe-area-inset-bottom))`.

**Shape — the one-sharp-corner rule.** Large rounded elements get three round corners and one tight corner, like a speech bubble, and which corner is tight varies:
- Primary button `20px 20px 20px 6px`
- Secondary button `20px 20px 6px 20px`
- CUD Care block on home `26px 26px 8px 26px`
- CUD Care block on result `8px 26px 26px 26px`
- Answer cards keep an even 18px radius. Pills are fully round.
- Cards are used **only** for answer choices. Everything else is open sections, dividers, pills, tinted blocks, and illustrations.

**Illustration.** All illustrations and icons are inline SVG. No emoji anywhere, no stock photos, no 3D. (If the council later insists on emoji, at most one per screen inside an answer choice, and the screen must still read correctly without it.)
- **Ink overlap:** every fill uses `mix-blend-mode: multiply`, so overlaps make a third colour — pink over blue is purple, pink over yellow is orange. Two or three inks per illustration, maximum.
- **Misregistration:** draw a thin ink outline of a shape offset 4–6px from its fill, as if the print slipped.
- **Hand strokes:** ink, `fill: none`, round caps and joins, `stroke-width: 2.5` for main lines and `1.5` for thin ones.
- **Halftone:** dot pattern on a 7px grid, 1.4px ink dots, 45% opacity, over part of one shape.
- **Sparkles:** small "+" marks, 12–18px, two thin strokes.
- **Dotted ring:** `stroke-dasharray: 1 7`, 2px wide.
- Every screen's illustration has a different composition. Nothing is reused verbatim.

Per screen:
- **Home (342×230):** a large pink organic blob centre-left; a blue circle (r≈60) overlapping its bottom-right; a halftone patch upper-left; the blob's thin ink outline offset ≈5px up and right; one long wavy ink line crossing bottom-left to upper-right; two sparkles.
- **Result (342×180), a low battery:** a blue organic blob behind the left; a pink rounded-square charge level filling about a third; the navy battery outline (rounded rectangle r18 plus a small cap) offset from the fills; two short strokes top-right; one sparkle.
- **Booth (342×240), a marigold:** an outer ring of 12 overlapping yellow petals; an inner ring of 8 pink petals at 55% opacity multiplying to orange; three ink dots in the centre; a dotted ring around the flower; a hand-drawn stem with a blue leaf. Plus a 200px yellow moon sitting partly off the top-right corner of the screen, with its outline offset down-left.
- **Wordmark (28×20):** a pink and a blue circle (r8) overlapping, multiplied.
- **Home festival icon (64×64):** a yellow moon with an offset outline above a wavy ink water line.
- **Answer icons (32×32):** moon phases — full, half, crescent, and an empty circle with a wavy line. Blue fill, thin offset ink outline.
- **Line icons:** back chevron, speech bubble with three dots, location pin. Ink strokes only.

## 7. Components

- **Wordmark header:** the two-circle mark, 10px gap, then "CUD Mental Health Week".
- **Primary button:** full width, 60px tall, ink fill, white text, Mitr 20/500, one-sharp-corner radius, no icon, no arrow. Set the text colour inline so link hover styles can never make it unreadable.
- **Secondary button:** 56px, transparent, 2px ink border, ink text, Mitr 19/500.
- **Pill link:** 46px, 2px ink border, fully round, 20–22px horizontal padding, left-aligned rather than full width.
- **Text link:** ink, underlined, at least 44px tall, centred when it sits under a button.
- **Progress row:** a 44×44 back-chevron button with `aria-label`; 8 segments 8px tall, 4px radius, 5px gaps, filling the width — done segments ink, current riso-pink, upcoming track; counter "3/8" on the right.
- **Answer card:** a real `<button>` with `aria-pressed`. At least 68px tall, 18px radius, 2px border, 12/16px padding, 14px gap; 32px icon left, label, check badge right when selected. Unselected: white with a line-coloured border. Selected: pink-tint with an ink border and a 24px ink circle holding a white check. Stack with 12px gaps.
- **Topic pills (result):** 36px, fully round; strongest topic filled ink with white text, second topic 2px ink outline.
- **Suggestion rows:** not cards. 1.5px line-coloured top border on each, plus a bottom border on the last; 16px vertical padding; an 18px riso marker on the left that differs per row (pink circle, blue rounded rectangle, pink crescent with outline); title 17/600 above description 15/1.6 ink-soft. Never numbered — they are not steps.
- **CUD Care block:** pink-tint, 20px padding, one-sharp-corner radius; a 36px speech-bubble icon on the home version.
- **Festival section (home):** 2px **dashed** ink top border, 24px top padding; Itim note above an H2 with the festival icon right; body; date placeholder in ink-soft; a "เล่นเลย" pill link; then a row of "บูธถัดไป" plus small pills with 1.5px pill-line borders.
- **Booth ticket:** sun-tint, 2px **dashed** ink border, 22px radius, 20px padding; heading, one body line, pin icon with location and date.
- **Booth label pill:** white, 2px ink border, fully round, 4/14px padding, 14/600.

## 8. Screens and copy

### หน้าแรก (Home)
1. Wordmark header.
2. Home illustration.
3. H1 **วันนี้ใจเป็นยังไงบ้าง?**
4. Body (ink-soft): แวะมาเช็กอินกับตัวเองสักนิด ใช้เวลาแป๊บเดียว
5. Primary button **เช็กอินความรู้สึก**
6. Festival section: Itim ตอนนี้ที่โรงอาหาร / H2 บูธลอยกระทง / ตอบคำถามสั้น ๆ แล้วเอาผลไปรับดอกไม้มาแต่งกระทงที่บูธ / [วันที่จัดบูธ] / pill เล่นเลย / row บูธถัดไป with pills คริสต์มาส and ตรุษจีน & วาเลนไทน์
7. CUD Care block: อยากคุยกับใครสักคน? / CUD Care พร้อมรับฟังนะ / link ดูช่องทางติดต่อ (`#cud-care` placeholder)
8. One small ink-soft line about data — exact wording in section 12.
9. Footer pinned to the bottom: โปรเจกต์ของสภานักเรียน CUD

Keep the homepage this short. No feature explanations, statistics, testimonials, or extra sections. The student came from a QR code; get them into the experience.

### คำถาม (Check-in, 8 questions, one per screen)
1. Progress row with the back chevron and the counter.
2. Itim note: เลือกอันที่ใกล้เคียงกับคุณที่สุด
3. H1, the question.
4. Four answer cards.
5. Bottom button (see the auto-advance rule in section 9).

Question 3 is written for you as the reference:
- **ช่วงนี้นอนหลับเป็นยังไงบ้าง?** — หลับสบายดี (full moon) / หลับบ้าง ไม่หลับบ้าง (half) / นอนดึกเพราะงานเยอะ (crescent) / นอนไม่ค่อยหลับ (empty circle with wavy line)

Draft the other 7 in the same voice across the topics เรียน, การพักผ่อน, เพื่อน, ครอบครัว, เวลาว่าง, ความกดดัน, and ความรู้สึกโดยรวม. Mark them clearly in `content/th/questions.ts` as drafts awaiting council review. Each choice carries `{ topic, weight: 0–3 }`.

### ผลเช็กอิน (Result)
1. Wordmark header with the Itim note **เสร็จแล้ว** on the right.
2. Battery illustration.
3. H1, the result state.
4. Body naming the two strongest topics.
5. Topic pills: primary filled, secondary outlined.
6. H2 **ลองดูอันนี้** and three suggestion rows.
7. CUD Care block (`id="cud-care"`): ถ้าอยากคุยกับใครสักคน CUD Care ก็พร้อมช่วยนะ + pill ดูช่องทางติดต่อ CUD Care
8. Primary button **กลับหน้าแรก**, with the text link เช็กอินอีกครั้ง below.

Reference result, for the answer set that produces it:
- Title: **ช่วงนี้ใช้พลังงานไปเยอะ**
- Body: จากคำตอบเมื่อกี้ เรื่องเรียนดูจะเด่นที่สุด และการพักผ่อนก็น่าจะมีส่วนเหมือนกัน
- Suggestions: แบ่งงานเป็นชิ้นเล็ก ๆ — ทำให้เสร็จทีละชิ้น ดีกว่ามองทุกอย่างพร้อมกันแล้วไม่รู้จะเริ่มตรงไหน / หาเวลาพักจริง ๆ สักช่วง — ปิดแชตกลุ่มงานไปก่อนสัก 15 นาทีก็ยังดี / ลองเข้านอนเร็วขึ้นอีกนิด — เริ่มจากคืนนี้คืนเดียวก่อนก็ได้

**How results are produced.** Sum the weights of the chosen answers, then pick a state by the share of the maximum: under 30% ช่วงนี้ค่อนข้างโอเค, 30–55% มีอะไรให้คิดอยู่บ้าง, 55–78% ช่วงนี้ใช้พลังงานไปเยอะ, above 78% ช่วงนี้น่าจะหนักอยู่เหมือนกัน. The two highest topic totals become primary and secondary, with ties broken by question order. Sentences and suggestions are picked from a prewritten, reviewed phrase library keyed by `state + primaryTopic + secondaryTopic`. Never call an AI model inside the product, and never generate result text at runtime.

### บูธลอยกระทง (Booth)
Three short festival questions, then the result:
1. Yellow moon behind the top-right corner.
2. Wordmark header.
3. Booth label pill: บูธลอยกระทง
4. Itim note: ดอกไม้ของคุณคือ
5. H1 at 64px: **ดาวเรือง**
6. Marigold illustration.
7. Body: สีสด ทนแดด อยู่ได้นาน (the closing "เหมือนคำตอบเมื่อกี้ของคุณเลย" was removed at the council's request)
8. Booth ticket: เอาหน้านี้ไปโชว์ที่บูธ / รับดอกดาวเรืองไปแต่งกระทงของคุณได้เลย / pin ที่โรงอาหาร [วันที่จัดบูธ]
9. Secondary button **กลับหน้าแรก**, with the link ลองเช็กอินความรู้สึกด้วยไหม? below.

Map the three answers deterministically onto four flowers. ดาวเรือง is written; leave the other three as placeholders for the council, since the booth can only hand out what it actually has.

### Festival themes and the admin switch

Only one festival is active at a time, and the admin panel chooses it. **Loy Krathong is the one that matters now** — it is the upcoming booth, it is the one in the reference screens, and it must be complete and polished. The other two are structure only.

- Build the theme as a small record in `content/th/booth.ts`: id, Thai name, accent colour, festival icon component, booth illustration component, quiz questions, result set, and the ticket copy.
- **ลอยกระทง (build fully):** accent `#FFB511`, moon icon, marigold illustration, the flower results, and all copy from section 8. This is the default value of `active_festival`.
- **คริสต์มาส and ตรุษจีน & วาเลนไทน์ (stubs):** create the records with a placeholder accent and Thai name, and leave questions, results, and illustrations empty with a clear `TODO: awaiting council content` comment. If one of these is selected while empty, the booth route shows the "no booth running" state and the homepage festival section falls back to the บูธถัดไป pills only.
- **`none`:** the booth route shows the closed state and the homepage hides the booth block, keeping only the บูธถัดไป row.
- A theme changes **only** four things: the accent colour that replaces sunflower, the small home festival icon, the booth illustration, and the booth copy and result set. Paper, ink, pink, blue, typography, components, spacing, and motion are identical across every festival. A theme must never introduce a new font, a gradient, or snow or heart animations.
- Switching the theme must not touch past sessions. Old rows keep the festival they were recorded with.

### Error and empty states

Plain and short. No red alarm colours, warning triangles, or long apologies. Ink on paper, one small reused illustration, one button.
- Page not found: หน้านี้ไม่มีแล้ว / กลับไปหน้าแรกแล้วเริ่มใหม่ได้เลย + กลับหน้าแรก
- Refreshed mid check-in: เริ่มใหม่อีกรอบนะ คำตอบเมื่อกี้ไม่ได้เก็บไว้ + เริ่มเช็กอิน
- Booth page opened with no booth running: หน้านี้จะเปิดตอนมีบูธ / แล้วเจอกันที่โรงอาหาร [วันที่จัดบูธ]
- Slow connection: keep the layout and show at most กำลังโหลด… No skeletons on the student side.

## 9. Feel: motion and interaction

The site should feel fluid and quick, like a well-made app — not like a website showing off its animations. Motion exists to say "something changed because you touched it", plus exactly two moments of delight (the result reveal and the booth flower).

**Tokens**
- Durations: 90ms tap feedback, 140ms state colour change, 180ms check badge and collapse, 240ms question transition, 450ms one-time result reveal.
- Easing: `cubic-bezier(0.2, 0, 0, 1)` for nearly everything; `cubic-bezier(0.34, 1.4, 0.64, 1)` for the check badge's small overshoot.
- Animate `transform` and `opacity` only, plus cheap colour properties. Never animate width, height, top, or left. The progress segment fills with `scaleX` and `transform-origin: left`.
- Target a steady 60fps on a 2019 mid-range Android. No animated blur or box-shadow.

**Interactions**
- Tap feedback: every button scales to 0.98 on `:active` over 90ms. Set `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent`, and make sure the visible `:active` state replaces what the tap highlight was doing.
- Answer selection: border and background cross-fade over 140ms; the check badge scales in from 0.6 with the overshoot easing over 180ms.
- **Auto-advance:** selecting an answer moves to the next question 250ms later. The bottom button is therefore only on the final question, labelled **มาดูผลกัน**. If the council prefers explicit confirmation instead, keep **ไปต่อ** on every question and drop auto-advance — do not do both at once.
- Question transition: the question block (note, headline, cards) slides 24px and fades over 240ms — forward moves left, back moves right. The progress row stays put and only its segments animate. Cards may stagger by 30ms each, with three steps maximum.
- Result reveal, once on arrival: the battery's pink level grows with `scaleX` over 450ms, while the headline, body, and pills fade up 12px over 200ms staggered by 60ms. Nothing loops or floats afterwards.
- Booth reveal, once: petals scale in from 0.7 with a 25ms stagger, about 400ms total, then stop.
- No entrance animation on first paint of the homepage, no parallax, no scroll-triggered reveals, no moving gradients, no floating blobs.
- Browser back always works and steps back one question; push a history entry per question.
- Client-side navigation only; no full page reloads between screens.
- Move focus to the new question heading on each change, so screen readers and keyboards follow.
- `prefers-reduced-motion: reduce` turns movement off and keeps colour changes under 100ms. No exceptions for the reveals.
- Optional: `navigator.vibrate(10)` on selection where supported. Never rely on it.

**Fidelity to the reference screens.** The built site must look like `reference/screens.html`, then better — better meaning more precise, not more decorated.
- Copy the SVG paths rather than redrawing them by eye. The marigold's petal coordinates, the battery's offset outline, and the home blob's misregistered outline are all deliberate.
- Match every value: padding, gaps, radii, stroke widths, font sizes, and the exact hexes. If something has to change to fit a real question, change spacing before changing type or colour.
- Keep the one-sharp-corner variation. Do not normalise every radius to the same number, and do not make the illustrations symmetrical.

**Craft details that make it feel satisfying.** These are the difference between "fine" and "someone cared":
- Optical, not mathematical, alignment: an icon beside Thai text is centred on the text's visual middle, not its box. Round pills and circles usually need a pixel more top padding than the maths suggests.
- Stroke widths stay on the 2.5 / 1.5 system at every icon size. Never scale an SVG in a way that makes the strokes thinner.
- Hit areas extend past the visible shape where needed: a 24px chevron lives in a 44px target, and a text link keeps its 44px height without looking taller.
- Pressing something always shows a state within one frame: the scale, the colour, or the check badge. No dead taps.
- The check badge's slight overshoot is the single "bouncy" thing in the whole product. Nothing else overshoots.
- Colour transitions cross-fade both the border and the background together, so a selected card never flashes a mismatched edge.
- Text never shifts when a state changes. Reserve the check badge's space so the label does not reflow.
- Scroll is never hijacked, and the bottom button never covers content — pad the scroll container by the button's height.
- Thai wrapping is checked by hand on every screen at 390px, 360px, and 320px. Fix bad breaks with copy, not with `<br>`.

## 10. Copy voice

- Write the way a CUD student talks to a friend: short, plain, conversational. Some lines can be purely practical.
- Good: ไปต่อ / มาดูผลกัน / อีกนิดเดียว / อีกคำถามเดียว / เสร็จแล้ว / ขอบคุณที่แวะมา / จากคำตอบเมื่อกี้…
- Avoid wellness-app phrasing and its Thai translations: "take a moment to reconnect with yourself", "your wellbeing matters", "you are not alone on this journey".
- Avoid corporate UX words: assessment, insights, interventions, "results complete".
- Avoid personality-test titles like "The Resilient Mind" or "Emotional Explorer".
- No paragraph under every button, and not every sentence needs to be inspirational.
- Personalization must point at the actual answers. Too vague: จากคำตอบของคุณ เราเห็นว่าคุณมีหลายเรื่องที่ต้องรับมือ. Specific enough: จากคำตอบเมื่อกี้ เรื่องเรียนกับการพักผ่อนดูจะเป็นสองเรื่องที่เด่นที่สุด
- Campaign identity, not corporate and not official: the identity comes from the wordmark, the two-circle motif, festival context, and campaign wording. No school crest, no formal headers, no portal navigation.

## 11. Admin panel

One account, used by the student council to pull statistics for the school. Thai labels throughout.

**Access**
- `/admin/login` with a single account. Username in `ADMIN_USERNAME`, an argon2 or bcrypt hash in `ADMIN_PASSWORD_HASH`. Never store a plain password anywhere, including `.env.example`.
- On success, set a signed, `httpOnly`, `Secure`, `SameSite=Lax` cookie signed with `SESSION_SECRET`, expiring in 8 hours. Logout clears it.
- After 5 failed attempts, lock the login for 10 minutes. There is one admin account, so key the counter to the account and keep it in the database, not in memory: memory does not persist across serverless calls, so an in-memory lockout would never trigger on Vercel.
- Every `/api/admin/*` route and `/admin` page checks the cookie server-side. `noindex` on all admin pages.

**Look.** Same palette and fonts, denser layout: 8px radii, 13–15px text, real tables, tight rows. One small riso accent in the header and nothing else. No big illustrations. The only motion is the 180ms collapse and expand.

**Summary strip (top).** Total sessions, completed, completion rate, today's count, median time to complete, and the date range covered.

**Theme control (top of the panel, above the summary).** A single clear control showing which festival is live — ลอยกระทง / คริสต์มาส / ตรุษจีน & วาเลนไทน์ / ไม่มีบูธ — with the current one marked. Changing it asks for confirmation, writes `setting.active_festival`, and takes effect on the next student page load. If the chosen festival still has no content, show a plain warning beside it: ยังไม่มีเนื้อหาของบูธนี้ นักเรียนจะเห็นหน้า "ยังไม่มีบูธ". Only an authenticated admin can change it, and the change is never exposed through a public route.

**Events (กิจกรรม).** Where the council changes when and where each booth runs.
(Build note for phase 4: the student and booth pages are prerendered static
today. Once `getEvent()` reads the database they must render per request, or an
edit would not show until the next rebuild.)
One row per festival — ลอยกระทง, คริสต์มาส, ตรุษจีน & วาเลนไทน์ — each with a
start date, an end date, a time and a place, edited with plain date pickers and
text fields. Saving writes the `event` table and takes effect on the next page
load of the home screen, the kiosk, the TV and the booth ticket, all of which
read `getEvent()` in `lib/events.ts`. This is separate from the theme control:
changing a date does not switch which festival is live, and switching the live
festival does not touch any dates. Past sessions are never affected, because a
session records the festival it ran under and not its dates. An end date before
the start date is treated as a single day rather than rejected, so a typo can
never blank a public screen. Verified: changing the one source moves all four
screens.

**Charts.** Plain CSS bars built from divs, no chart library:
- sessions per day,
- result states,
- answer distribution per question, as horizontal bars with counts and percentages.

**Sessions list — grouped and collapsible.**
- Auto-grouping: group by day, newest first. If a day contains both modes, sub-group by mode. Group headers show the date, session count, and a one-line breakdown of result states. Today is expanded; older groups start collapsed.
- A grouping switcher for วันที่ / โหมด / ผลลัพธ์ / เทศกาล.
- A collapsed session row shows: time, mode chip, result state, primary and secondary topic, duration, and whether it was completed.
- Expanding a row reveals a small table of question → chosen answer in order, plus the short session id with a copy button.
- Filters for date range, mode, and completion status, plus a search box for session id. Buttons to expand or collapse everything.
- Each row is a real `<button>` for the toggle, with `aria-expanded` and `aria-controls`. Enter and Space work.
- Pressing "เช็กอินอีกครั้ง" produces a separate row, never an edit of the previous one. Unfinished sessions stay visible, marked ยังไม่จบ, because drop-off is useful information.

**Booth account (added after the project document was reviewed).**

The booth runs on two devices, neither of them a student's phone: a **kiosk**
(`/booth/kiosk`, landscape iPad or laptop) that students tap to answer, and a
**TV display** (`/booth/display`) cast to a screen showing live counts and a
river of everyone's flowers. Both are staff-operated fixtures, so both sit
behind a second account, separate from the admin one.

- One booth account: `booth_username` and `booth_password_hash` in the `setting`
  table, so the council can change them without touching the server.
- The admin panel shows a **บัญชีบูธ** card: the current username, an editable
  field for it, and a button that generates a new password. The generated
  password is easy to type on an iPad (no ambiguous characters) and is shown
  **once**, at the moment it is generated. It is stored only as a hash, so
  nobody can read it back later — not even an admin. Forgotten means reset, not
  recovered. This keeps §12's rule that no plain password is ever stored.
- The booth cookie is separate from the admin cookie and grants **only**
  `/booth/kiosk` and `/booth/display`. A booth device can never reach `/admin`
  or any `/api/admin/*` route. It lasts 12 hours, so one login covers a booth
  day without a staff member re-entering it mid-service.
- The kiosk writes sessions exactly as the phone does — anonymous, no student
  login, nothing that ties a flower to a person (§12). The TV shows counts and
  flowers only, never anything traceable, because it is a screen in a room full
  of people.
- The kiosk auto-resets to its idle screen 20 seconds after a result, so a
  student who walks off does not leave their answer up for the next person.

**Booth screens: look and motion.** The kiosk and TV follow the phone's riso-zine
language but are their own compositions, sized in `vh` so they fill an iPad or a
projector alike. The kiosk quiz is two columns — the question and a per-question
illustration on the left, big answers on the right — and the result is a poster:
the flower blooms in on a paper-cut disc, then the name, a description, a wish,
the ticket to show staff, and what to do next. Idle motion is deliberate here
and only here: section 9 keeps the *phone* still because there motion must mean
"you touched something", but a wall display that never changes reads as frozen.
All motion is transform, opacity or clip-path, and stops under
`prefers-reduced-motion`. The TV's river is one composited layer that slides, so
it is painted once rather than every frame — which matters on a low-end stick.

**Export and cleanup**
- Export two CSVs honouring the current filters: one row per session, and one row per answer. UTF-8 with a BOM so Excel opens Thai correctly. Filenames include the date.
- Delete a single session, and a "ลบข้อมูลทั้งหมด" action that requires typing a confirmation word. The council should wipe the data once the school report is done.

## 12. Privacy, security, hosting

At this scale, most of the safety comes from what is not collected. Storing sessions for the school report is fine — but only anonymously, and only if the site says so.

- **Anonymous by construction.** No name, student ID, class, email, phone, photo, or free text. No student login. Two students' sessions are indistinguishable except by time and answers.
- Because answers are now stored, **do not write "ไม่เก็บคำตอบ" anywhere.** Put one small ink-soft line on the home screen instead: ไม่ต้องใส่ชื่อ คำตอบจะถูกเก็บแบบไม่ระบุตัวตน เพื่อสรุปภาพรวมของกิจกรรม
- Admin sees aggregates and anonymous sessions. Never build a way to trace a session back to a person, and never add device fingerprinting to "improve" grouping.
- Serve over HTTPS, including the QR code URL. Point the QR at the school domain directly, never a third-party shortener that someone could re-point later.
- Self-host the fonts. No analytics, ad scripts, chat widgets, heatmaps, or tracking pixels of any kind. This is a mental health page.
- No API keys or secrets in client code. `.env` is git-ignored; commit only `.env.example`.
- Headers to ask school IT for (or set in `next.config`): `Content-Security-Policy` allowing only self, `img-src 'self' data:`, `frame-ancestors 'none'`, `base-uri 'self'`; plus `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`.
- Parameterised SQL everywhere (bound parameters through the database client, never string-built queries). Validate every input against the known question and choice ids.
- Back up the SQLite file before the event and after each booth day. It is one file; copying it is the whole backup plan.
- Booth mode runs on trust — staff just look at the screen. Do not build codes, tokens, or anti-cheat for 30 students.
- **Safety, which matters more here than security:** the site never diagnoses anyone and never tells a student they are fine. Every result keeps a visible route to CUD Care. Do not add a free-text box in this version, because someone would have to be responsible for reading whatever a student writes in it.

## 13. Accessibility

- `lang="th"` on the document.
- Every tap target is at least 44×44px.
- Text contrast at least 4.5:1. The palette already meets this, so do not lighten grey text.
- Real `<button>` and `<a href>` elements. Icon-only buttons get `aria-label`; decorative SVGs get `aria-hidden="true"`.
- Focus style: `outline: 3px solid #FF48B0; outline-offset: 3px`.
- The whole check-in is usable by keyboard, and focus is never trapped or lost during a transition.

## 14. Build order

1. **Scaffold:** Next.js, TypeScript, fonts self-hosted, `globals.css` with the tokens, empty content files. Verify the fonts render Thai correctly before anything else.
2. **Static screens:** home, one question, result, booth result — rebuilt from `reference/screens.html` with exact copy, spacing, and inline SVG. No state yet. Compare side by side at 390px before moving on.
3. **Flow and motion:** the 8-question flow, auto-advance, transitions, deterministic scoring, the phrase library, and both reveals. Check `prefers-reduced-motion`.
4. **Persistence:** SQLite, the settings table seeded with `loykrathong`, the three student API routes, background non-blocking writes, server-side recomputation of the result.
5. **Admin:** login, session guard, theme control, the grouped and collapsible list, summary strip, CSS bar charts, filters, CSV export, delete.
6. **Polish:** the craft list in section 9, accessibility pass, headers, an old-phone check, `.env.example`, and a short README covering how to run it, switch the theme, back it up, and wipe the data.

## 15. Do not

- Emoji, gradients, glassmorphism, drop shadows, or glow.
- A card around every paragraph, or identical cards repeated down a page.
- All-caps eyebrow labels, "→" inside buttons, or 01/02/03 numbering on things that are not steps.
- Inter, Roboto, Arial, or Kanit as the main font. No cream-and-terracotta, no dark-and-neon.
- Long landing pages, onboarding carousels, splash screens, or an animated intro.
- Names, student IDs, logins for students, or any identifying field.
- Analytics, third-party widgets, or an LLM call inside the product.
- Accounts, codes, or tokens for the booth.
- Invented statistics, phone numbers, or dates. Use the placeholders.

## 16. Final check

For every screen, ask: **"Would a CUD student believe another student designed and wrote this?"** If it sounds like an AI wellness app, rewrite it.

Also confirm:
- Each screen sits beside `reference/screens.html` and matches it — same colours, spacing, and illustrations.
- The site still looks good with every illustration removed.
- Every Thai line wraps cleanly at 390px, 360px, and 320px.
- The main action on each screen is reachable with one thumb.
- Tapping an answer feels instant, and nothing on the student side ever waits for the server.
- Turning on reduced motion leaves the site fully usable.
- A fresh session appears in the admin panel within one refresh, in the right group, tagged with the festival that was live.
- Switching the theme in admin changes only the accent, the festival icon, the booth illustration, and the booth copy.

---

## Decisions taken during the build

Recorded here so they are not re-litigated later.

| Question | Decision | Date |
|---|---|---|
| Hosting (§2 check) | **Vercel + GitHub first; a school server on the school domain is likely later** (the council put it at high chance). So everything must run in both places — see *Hosting* below. It rules out `better-sqlite3` and in-memory state. | 2026-09-19 |
| Node runtime | **22 LTS.** Node 20 is past end-of-life. Vercel and any school server should both run 22 or newer. | 2026-09-19 |
| Auto-advance vs ไปต่อ (§9) | **Auto-advance.** Bottom button appears only on Q8, labelled มาดูผลกัน. | 2026-09-19 |
| Devices | iPhone **and iPad** Safari must both look good — added to §6's layout rule. | 2026-09-19 |
| Booth devices | **Two**, not one: a kiosk for answering and a TV for live visualisation. Both landscape, both behind a booth account. See §11. | 2026-09-19 |
| Booth password | Set and reset from the admin panel, stored hashed, shown once on generation. | 2026-09-19 |
| Loy Krathong flowers | Six, given by the council: ดอกบัว ดอกรัก ดอกบานไม่รู้โรย ดาวเรือง กล้วยไม้ จำปี. **Names may still change.** ("จำไป" in the original message was confirmed a typo for จำปี.) | 2026-09-19 |
| Booth dates | Loy Krathong is **19–20 พ.ย. 2569** — the schedule section of the project document, which the council confirmed as "probably" right. The Gantt table's 19–24 พ.ย. is dropped. Dates are **editable later in the admin panel's Events section**, so a wrong guess is a two-minute fix, not a deploy. | 2026-09-19 |
| Booth quiz style | Easy to answer but telling: concrete things a student DOES (their morning, their money, an evening invitation), never how they feel, with two or three short answers and none better than another. Answer pictures are neutral shapes, not the check-in's full-to-empty moons, which read as better-to-worse. Every question can be undone with a back button, and a tapped answer stays highlighted for a beat so a tap always visibly lands. | 2026-09-19 |
| Booth result | A moment, not a label: the flower blooms in, with a wish from the flower, the ticket to show staff, and what to do next at the booth. Reset is 45 seconds, restarted by any touch, so nobody is cut off mid-read. | 2026-09-19 |
| Booth scoring | The quiz measures two real things — **energy** (calm / in between / lively, from two questions added) and **heart** (looks after self / others, from one) — and each flower is one cell of the 3x2 grid, so its description is earned. Exactly 3 of 18 answer sets per flower (16.7%), all three questions matter, no tie-break. Two earlier schemes were rejected after enumerating every answer set: plurality (62.5% decided by question 1 alone; two flowers at 6%, which matters because the booth hands out physical flowers) and sum-modulo-six (balanced, but arithmetic, so the result claiming to be "like your answers" was a small fib). `npm run check:booth` re-verifies all of this. | 2026-09-19 |
| Persistence (phase 4) | Built on `@libsql/client`: one `DATABASE_URL`, a `file:` path on a school server or a hosted URL on Vercel, same code and schema. Every server rule is in `lib/session.ts` and tested against a scratch database: answers must exist in the content, results are always recomputed from the stored answers, finished sessions are immutable, and completing twice returns the first result because the phone retries once. Nothing waits on the network — proven by blocking the API entirely and checking a student still gets their result with no error shown. The TV polls every 5 seconds (`router.refresh`), not WebSockets, so it works on Vercel. `?demo=1` shows invented TV numbers, outside production only. Device is a width bucket: under 700 mobile, under 1280 tablet (every iPad, either way up), else desktop. | 2026-09-19 |
| Booth screens | Riso illustration on every booth screen (idle, each question, result, TV), where they were plain white cards. The TV bars take their flower's own colour. Both devices have gentle idle motion — the kiosk's flower sways and its petals breathe, its button sends out a ring; the TV's river drifts, its water moves, its flowers bob — because a screen that never changes reads as broken from across a canteen. Everything stops under reduced motion (verified: zero running animations). | 2026-09-19 |

## Hosting: Vercel first, school server likely later

The council will launch on Vercel from a GitHub repo and expects to move to the
school's own server and domain (high chance). Building for one and porting later
is where this project would get hurt, so build for both from phase 4:

- **Database.** `@libsql/client`, `DATABASE_URL` from the environment. Same
  schema and queries everywhere; only the URL changes (`file:./data/app.db` on
  the school server, `libsql://...` on Vercel). `better-sqlite3` cannot work on
  Vercel: its filesystem is read-only and wiped between deploys.
- **No state in memory.** Serverless calls can each be a new instance, so rate
  limits, lockouts and caches held in a variable silently do nothing there.
  Anything that must persist goes in the database.
- **The TV polls.** Every 4-5 seconds, a plain request. WebSockets and
  server-sent events are unreliable on serverless.
- **Per-request rendering.** Any page that reads the database (home, booth,
  kiosk, TV) must not be prerendered — see the note in the Events section.
- **Config in the environment only.** No absolute paths, no committed secrets.
  `.env*` is git-ignored except `.env.example`, and a `.db` file is never
  committed. Keep the GitHub repo private.
- **The QR code points at the school's domain from day one**, never at a
  `*.vercel.app` address. A printed QR code cannot be changed. If the school
  domain points at Vercel now and at the school server later, every code already
  on a poster keeps working. Do not print codes until that domain exists.
- **Moving later.** On the school server: Node 22, `npm run build`,
  `npm start` behind a reverse proxy with HTTPS. The admin CSV export is the
  portable copy of the data, and a `file:` database is a single file to copy.
- Vercel's free tier is for non-commercial use, which a school project is.
  Choose a region near Thailand (Singapore) for the fewest milliseconds.

## Event facts

From the approved project document (โครงการ CUD Mental Health Week), at
โรงเรียนสาธิตจุฬาลงกรณ์มหาวิทยาลัย ฝ่ายมัธยม. All three booths run
**11.10–12.50 น.** in **โถงโรงอาหาร**.

| Booth | Dates | Wellbeing theme |
|---|---|---|
| ลอยกระทง | 19–20 พ.ย. 2569 | การปล่อยวางความทุกข์ และการจัดการความรู้สึกเชิงลบ |
| คริสต์มาส | 8–9 ธ.ค. 2569 | การสร้างความหวังในชีวิต และการจัดการความรู้สึกเมื่อเกิดความผิดหวัง |
| ตรุษจีน & วาเลนไทน์ | 10–11 ก.พ. 2570 | การให้ความรู้สึกรัก และการปรับตัวให้เข้ากับทุกรูปแบบความสัมพันธ์ |

The document also names the booth quiz — **"คุณเป็นดอกไม้แบบไหน?"** — and lists
the Loy Krathong activities it belongs to: a mini-krathong zone, a post-it wall,
the flower quiz, แปะดอกไม้แทนความรู้สึก, and an origami workshop. The TV river of
flowers is built to mirror แปะดอกไม้แทนความรู้สึก on screen.

**Dates.** The document's schedule section and its Gantt table disagree. The
council confirmed Loy Krathong as **19–20 พ.ย.** (the schedule section), so that
is settled, and every date is editable later in the admin panel's Events
section. ตรุษจีน & วาเลนไทน์ is still unconfirmed, but no longer blocks
anything — it is a one-field edit when the council decides:

| Booth | Schedule section | Gantt table |
|---|---|---|
| ลอยกระทง | 19–20 พ.ย. 2569 | 19–24 พ.ย. 2569 |
| ตรุษจีน & วาเลนไทน์ | 10–11 ก.พ. 2570 | 10–12 ก.พ. 2570 |

## Still needed from the student council

- ตรุษจีน & วาเลนไทน์ dates: 10–11 or 10–12 ก.พ. (editable in the admin Events section, so not a blocker).
- CUD Care's real contact channels (the `#cud-care` link).
- **Review of the five drafted flower descriptions.** Only ดาวเรือง's line is
  written in this brief. The other five each rest on one true fact about the
  flower (the meaning of its name, its scent, how long it lasts) — check them.
- **A real illustration for each of the five other flowers.** Only the marigold
  is hand-drawn. The rest use a tinted rosette as an interim stand-in, which
  must not be mistaken for a lotus or an orchid.
- Review of the 7 drafted check-in questions and the 3 drafted booth questions (rewritten this pass to be easier to answer).
- **Which booth activities run on which day.** The result screen's "ต่อไปที่บูธ" lists three things named in the project document — the mini krathong zone, แปะดอกไม้แทนความรู้สึก, and the origami-lotus workshop. The document names them but not their days or how they run, so nothing more is claimed; confirm before students rely on it.
- Quiz content for the Christmas and ตรุษจีน & วาเลนไทน์ booths. Their
  activities are known from the project document, but no quiz or results exist.
