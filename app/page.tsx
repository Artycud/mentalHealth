/* TEMPORARY font smoke test (BRIEF §14 step 1: "Verify the fonts render Thai
   correctly before anything else").

   Delete this file and app/font-check.tsx when the real home screen lands in
   phase 2.

   What to check:
   1. The green line below reports all 8 faces loaded.
   2. Tone marks and vowels stack correctly — see the stress row. Watch ที่ (three
      levels), น้ำ (tone mark beside sara am) and ผู้ใหญ่ (lower vowel + descender).
   3. DevTools Network shows ZERO requests to fonts.googleapis.com or
      fonts.gstatic.com. Everything comes from /fonts/.
   4. Headings are Mitr, body is the looped face, notes are Itim — three
      visibly different shapes. */

import { FontCheck } from './font-check';

const HEAD = "var(--font-heading)";
const BODY = "var(--font-body)";
const NOTE = "var(--font-note)";

/* Strings chosen to stress Thai rendering: upper vowels, tone marks stacked
   above upper vowels, lower vowels, descenders, and sara am + mai tho. */
const STRESS = ['ที่', 'น้ำ', 'ครั้ง', 'ผู้ใหญ่', 'ญี่ปุ่น', 'เปี๊ยก', 'กำลัง', 'ไม่ได้', 'โอ่ง'];

export default function FontSmokeTest() {
  return (
    <main style={{ maxWidth: 440, margin: '0 auto', padding: '24px 24px 64px' }}>
      <p style={{ fontFamily: BODY, fontSize: 13, color: 'var(--ink-muted)' }}>
        phase 1 smoke test — delete before phase 2
      </p>

      <section style={{ margin: '20px 0 32px' }}>
        <FontCheck />
      </section>

      <section
        style={{
          padding: 16,
          border: '2px dashed var(--ink)',
          borderRadius: 'var(--r-ticket)',
          marginBottom: 32,
        }}
      >
        <p style={{ fontFamily: BODY, fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>
          tone marks &amp; vowel stacking
        </p>
        <p style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 32, lineHeight: 1.35 }}>
          {STRESS.join(' ')}
        </p>
        <p style={{ fontFamily: BODY, fontSize: 17, lineHeight: 1.6 }}>{STRESS.join(' ')}</p>
        <p style={{ fontFamily: NOTE, fontSize: 18, lineHeight: 1.5, color: 'var(--note-pink)' }}>
          {STRESS.join(' ')}
        </p>
      </section>

      {/* Real copy at the real sizes from §5, so the scale is verified too. */}
      <h1 style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 64, lineHeight: 1.2 }}>ดาวเรือง</h1>
      <h1 style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 42, lineHeight: 1.3, marginTop: 20 }}>
        วันนี้ใจเป็นยังไงบ้าง?
      </h1>
      <h1 style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 36, lineHeight: 1.3, marginTop: 20 }}>
        ช่วงนี้ใช้พลังงานไปเยอะ
      </h1>
      <h1 style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 32, lineHeight: 1.35, marginTop: 20 }}>
        ช่วงนี้นอนหลับเป็นยังไงบ้าง?
      </h1>
      <h2 style={{ fontFamily: HEAD, fontWeight: 500, fontSize: 26, lineHeight: 1.3, marginTop: 20 }}>
        บูธลอยกระทง
      </h2>
      <h2 style={{ fontFamily: HEAD, fontWeight: 500, fontSize: 19, lineHeight: 1.4, marginTop: 16 }}>
        อยากคุยกับใครสักคน?
      </h2>

      <p style={{ fontFamily: NOTE, fontSize: 18, lineHeight: 1.5, color: 'var(--note-pink)', marginTop: 24 }}>
        เลือกอันที่ใกล้เคียงกับคุณที่สุด
      </p>

      <p style={{ fontFamily: BODY, fontSize: 17, lineHeight: 1.6, marginTop: 16 }}>
        แวะมาเช็กอินกับตัวเองสักนิด ใช้เวลาแป๊บเดียว
      </p>
      <p style={{ fontFamily: BODY, fontSize: 17, fontWeight: 500, lineHeight: 1.5, marginTop: 12 }}>
        หลับบ้าง ไม่หลับบ้าง
      </p>
      <p style={{ fontFamily: BODY, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-soft)', marginTop: 12 }}>
        ทำให้เสร็จทีละชิ้น ดีกว่ามองทุกอย่างพร้อมกันแล้วไม่รู้จะเริ่มตรงไหน
      </p>
      <p style={{ fontFamily: BODY, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-muted)', marginTop: 12 }}>
        โปรเจกต์ของสภานักเรียน CUD
      </p>

      {/* Latin + digits: these come from the *-latin.woff2 subsets. */}
      <p style={{ fontFamily: HEAD, fontWeight: 500, fontSize: 15, marginTop: 24 }}>
        CUD Mental Health Week — 3/8
      </p>
    </main>
  );
}
