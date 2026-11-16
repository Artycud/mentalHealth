# ระบายให้พี่ๆ สภาฟัง — setting up the พี่สภา team

Students write in ระบาย (`/vent`, or the bar on the home page). A พี่ from the student
council answers, in the inbox at **`/sapa`** or straight from Discord. No AI is involved.

## What is kept, and for how long

- What the student writes, and the พี่'s answers, are kept **only until the student
  presses "จบการคุย"**. A conversation nobody has touched for 30 days is deleted too.
- No name, class, IP address or device is kept with it. The student's phone remembers
  its own conversation (a key in the browser), and the student gets a **chat code**
  (like `K7QM-42XB`) to open it from another phone.
- This is the one exception to the project's "no free text" rule (BRIEF §3, §12),
  agreed for ระบาย. `npm run test:db` allows exactly one column of student words,
  `vent_message.body`, and nothing else.

**Before students use it**, CUD Care and the council's teacher must approve:
- the safety copy in `content/th/vent.ts` (`care`);
- the answering guide in `content/th/sapa.ts`;
- who on the council answers, and what a พี่ does when a message means danger.

## 1. The team's password

Admin panel → **พี่สภา (ตอบระบาย)** → **สร้างรหัสทีมใหม่**. The password is shown once;
send it to the team. They sign in at `/sapa/login`. Making a new one signs everyone out.
Admins can open `/sapa` with their own login.

## 2. Discord pings (choose one)

A ping never contains what the student wrote, only that someone wrote. Urgent
messages (the safety words in `lib/vent/safety.ts`) are marked **ด่วน**.

### A. Ping with a link to `/sapa` (5 minutes)

1. In the staff Discord server, open the channel → **Edit Channel → Integrations →
   Webhooks → New Webhook** → **Copy Webhook URL**.
2. In Vercel → Settings → Environment Variables, add `DISCORD_WEBHOOK_URL` with that URL.
3. Redeploy.

### B. Ping, and answer inside Discord (15 minutes)

The ping gets an **อ่านและตอบ** button. Tapping it shows the conversation privately,
to that one พี่ only (it is never posted in the channel). **ตอบ** opens a box, and the
answer goes straight to the student.

1. <https://discord.com/developers/applications> → **New Application** (e.g. "พี่สภา").
2. **Bot** → **Reset Token** → copy it: this is `DISCORD_BOT_TOKEN`.
3. **General Information** → copy **Public Key**: this is `DISCORD_PUBLIC_KEY`.
4. **OAuth2 → URL Generator** → scope `bot`, permissions *View Channel* and
   *Send Messages* → open the URL → add the bot to the staff server.
5. In Discord: User Settings → Advanced → **Developer Mode** on. Right-click the staff
   channel → **Copy Channel ID**: this is `DISCORD_CHANNEL_ID`.
6. In Vercel, add the three variables above, then **redeploy**.
7. Back in the developer portal → **General Information → Interactions Endpoint URL** →
   `https://<your site>/api/discord` → Save. (Discord checks it at once, which only
   works after the redeploy.)
8. Optional: `DISCORD_ROLE_ID` (right-click a role → Copy Role ID) mentions that role
   on each ping, so its members get a phone notification.

**How the pings behave.** Every student message pings, with one short summary of the
queue: how many chats wait (and how many are urgent), the longest wait and the
average. A burst is merged: messages within a minute of a ping edit that ping
("ข้อความใหม่ 4 ข้อความ") instead of posting new ones. An urgent message always posts
its own ping. When anyone has waited 30 minutes, the ping tags the people in
`DISCORD_OVERDUE_USER_IDS` (at most once every 30 minutes; never @everyone). Set it in
Vercel to their Discord user IDs, comma separated: with Developer Mode on (step 5),
right-click the person → **Copy User ID**. A typed name like "@name" would not notify
anyone; Discord needs the ID. Unset, it mentions `DISCORD_ROLE_ID` instead.

**The 30-minute check when the site is quiet.** The check also runs while a waiting
student has the chat open. To cover everything, set `CRON_SECRET` in Vercel (any long
random string) and have a scheduler call `GET https://<your site>/api/cron/sapa-queue`
every 10 minutes with the header `Authorization: Bearer <CRON_SECRET>`. Vercel Cron
can do this on the Pro plan; on Hobby (daily only), use a free scheduler such as
cron-job.org.

**Keep the staff channel to the team only.** Anyone who can see the channel can press
the buttons.

The admin panel's พี่สภา card shows which mode is active.
