'use client';

/* TEMPORARY — part of the phase 1 font smoke test. Delete together with the
   smoke-test page before phase 2 screens land. */

import { useEffect, useState } from 'react';

const FACES: { label: string; spec: string; sample: string }[] = [
  { label: 'Mitr 400 · thai', spec: '400 42px Mitr', sample: 'ทดสอบ' },
  { label: 'Mitr 500 · thai', spec: '500 42px Mitr', sample: 'ทดสอบ' },
  { label: 'Mitr 600 · thai', spec: '600 42px Mitr', sample: 'ทดสอบ' },
  { label: 'Mitr 500 · latin', spec: '500 15px Mitr', sample: 'CUD Mental Health Week' },
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
  { label: 'Itim 400 · thai', spec: "400 18px Itim", sample: 'ทดสอบ' },
];

export function FontCheck() {
  const [results, setResults] = useState<{ label: string; ok: boolean }[]>([]);

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      setResults(
        FACES.map((f) => ({
          label: f.label,
          ok: document.fonts.check(f.spec, f.sample),
        })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (results.length === 0) {
    return <p style={{ color: '#46507A' }}>กำลังโหลด…</p>;
  }

  const failed = results.filter((r) => !r.ok);

  return (
    <div>
      <p
        style={{
          fontWeight: 600,
          color: failed.length === 0 ? '#0078BF' : '#B0155F',
          marginBottom: 8,
        }}
      >
        {failed.length === 0
          ? `All ${results.length} faces loaded.`
          : `${failed.length} of ${results.length} faces FAILED to load.`}
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
        {results.map((r) => (
          <li key={r.label} style={{ color: r.ok ? '#46507A' : '#B0155F' }}>
            {r.ok ? '✓' : '✗'} {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
