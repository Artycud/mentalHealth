'use client';

/* TEMPORARY — part of the phase 1 font smoke test. Delete together with the
   smoke-test page before phase 2 screens land.

   Note on the API: document.fonts.check() only reports whether a face is
   ALREADY downloaded — it never triggers a fetch. Checking alone therefore
   reports a false failure for any weight the page does not happen to render.
   document.fonts.load() forces the fetch, so this actually proves each file
   downloads and parses. */

import { useEffect, useState } from 'react';

const FACES: { label: string; spec: string; sample: string }[] = [
  { label: 'Mitr 400 · thai', spec: '400 42px Mitr', sample: 'ทดสอบ' },
  { label: 'Mitr 500 · thai', spec: '500 42px Mitr', sample: 'ทดสอบ' },
  { label: 'Mitr 600 · thai', spec: '600 42px Mitr', sample: 'ทดสอบ' },
  { label: 'Mitr 400 · latin', spec: '400 15px Mitr', sample: 'CUD 3/8' },
  { label: 'Mitr 500 · latin', spec: '500 15px Mitr', sample: 'CUD Mental Health Week' },
  { label: 'Mitr 600 · latin', spec: '600 15px Mitr', sample: 'CUD 3/8' },
  {
    label: 'IBM Plex Sans Thai Looped 400 · thai',
    spec: "400 17px 'IBM Plex Sans Thai Looped'",
    sample: 'ทดสอบ',
  },
  {
    label: 'IBM Plex Sans Thai Looped 500 · thai',
    spec: "500 17px 'IBM Plex Sans Thai Looped'",
    sample: 'ทดสอบ',
  },
  {
    label: 'IBM Plex Sans Thai Looped 600 · thai',
    spec: "600 17px 'IBM Plex Sans Thai Looped'",
    sample: 'ทดสอบ',
  },
  {
    label: 'IBM Plex Sans Thai Looped 400 · latin',
    spec: "400 17px 'IBM Plex Sans Thai Looped'",
    sample: 'CUD 15',
  },
  {
    label: 'IBM Plex Sans Thai Looped 500 · latin',
    spec: "500 17px 'IBM Plex Sans Thai Looped'",
    sample: 'CUD 15',
  },
  {
    label: 'IBM Plex Sans Thai Looped 600 · latin',
    spec: "600 17px 'IBM Plex Sans Thai Looped'",
    sample: 'CUD 15',
  },
  { label: 'Itim 400 · thai', spec: '400 18px Itim', sample: 'ทดสอบ' },
  { label: 'Itim 400 · latin', spec: '400 18px Itim', sample: 'CUD 15' },
];

type Result = { label: string; ok: boolean; note: string };

export function FontCheck() {
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const out: Result[] = [];
      for (const f of FACES) {
        try {
          // Forces the fetch, then confirms the face is genuinely available.
          const matched = await document.fonts.load(f.spec, f.sample);
          const ok = matched.length > 0 && document.fonts.check(f.spec, f.sample);
          out.push({
            label: f.label,
            ok,
            note: ok ? '' : matched.length === 0 ? 'no matching @font-face' : 'loaded but unavailable',
          });
        } catch (err) {
          out.push({ label: f.label, ok: false, note: String(err) });
        }
      }
      if (!cancelled) setResults(out);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (results.length === 0) {
    return <p style={{ color: 'var(--ink-soft)' }}>กำลังโหลด…</p>;
  }

  const failed = results.filter((r) => !r.ok);

  return (
    <div>
      <p
        style={{
          fontWeight: 600,
          color: failed.length === 0 ? 'var(--riso-blue)' : 'var(--note-pink)',
          marginBottom: 8,
        }}
      >
        {failed.length === 0
          ? `All ${results.length} faces downloaded and parsed.`
          : `${failed.length} of ${results.length} faces FAILED.`}
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
        {results.map((r) => (
          <li key={r.label} style={{ color: r.ok ? 'var(--ink-soft)' : 'var(--note-pink)' }}>
            {r.ok ? '✓' : '✗'} {r.label}
            {r.note && ` — ${r.note}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
