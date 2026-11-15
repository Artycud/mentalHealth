/**
 * The six booth flowers, each drawn as itself: flat paper shapes in the flower's
 * real colours, in a 0 0 100 100 box whose dotted ring (WALL_FLOWER_RING, r 44)
 * the result draws on its own layer (components/booth/FlowerArt). Nothing here
 * reaches past that ring.
 *
 * Plain shapes only, no filters or gradients, so an old iPad draws it once and
 * the bloom (FlowerArt.module.css) only scales them.
 */

const GREEN = '#3f8a57';
const GREEN_DARK = '#2c6a42';

const around = (n: number, r: number, cx = 50, cy = 50, turn = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + turn;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, deg: (a * 180) / Math.PI + 90 };
  });

function Sunflower() {
  return (
    <>
      {around(16, 24).map((p, i) => (
        <ellipse key={`o${i}`} cx={p.x} cy={p.y} rx="6.5" ry="13" fill="#ffb511" transform={`rotate(${p.deg} ${p.x} ${p.y})`} />
      ))}
      {around(16, 20, 50, 50, Math.PI / 16).map((p, i) => (
        <ellipse key={`i${i}`} cx={p.x} cy={p.y} rx="5" ry="10" fill="#ffd25a" transform={`rotate(${p.deg} ${p.x} ${p.y})`} />
      ))}
      <circle cx="50" cy="50" r="15" fill="#6b3f1d" />
      <circle cx="50" cy="50" r="10.5" fill="#83532a" />
      {around(10, 6).map((p, i) => (
        <circle key={`s${i}`} cx={p.x} cy={p.y} r="1.3" fill="#4a2a10" />
      ))}
    </>
  );
}

function Hydrangea() {
  // A dome of small four-petal florets, darker at the edge.
  const florets = [
    ...around(9, 27, 50, 50, 0.2).map((p) => ({ ...p, c: '#3f7fd6' })),
    ...around(6, 14, 50, 50, 0.6).map((p) => ({ ...p, c: '#5b98e6' })),
    { x: 50, y: 50, deg: 0, c: '#7fb0ee' },
  ];
  return (
    <>
      {florets.map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${(i * 37) % 90})`}>
          <circle cx="-5" cy="0" r="6" fill={f.c} />
          <circle cx="5" cy="0" r="6" fill={f.c} />
          <circle cx="0" cy="-5" r="6" fill={f.c} />
          <circle cx="0" cy="5" r="6" fill={f.c} />
          <circle cx="0" cy="0" r="2" fill="#e8f1fc" />
        </g>
      ))}
    </>
  );
}

function RedRose() {
  return (
    <>
      <path d="M22 72 Q14 58 26 54 Q32 66 22 72 Z" fill={GREEN} />
      <path d="M78 72 Q86 58 74 54 Q68 66 78 72 Z" fill={GREEN_DARK} />
      {around(5, 17, 50, 48, -Math.PI / 2).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="15" fill="#7d1529" />
      ))}
      <circle cx="50" cy="48" r="18" fill="#9b2238" />
      <circle cx="50" cy="47" r="12" fill="#b32d45" />
      <path
        d="M50 47 m-1 0 a3 3 0 1 1 4 2 a6 6 0 1 1 -9 -4 a9 9 0 1 1 13 7"
        fill="none"
        stroke="#5e0d1e"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  );
}

function Gerbera() {
  return (
    <>
      {around(20, 25).map((p, i) => (
        <ellipse key={`o${i}`} cx={p.x} cy={p.y} rx="4.2" ry="14" fill="#ff7a1a" transform={`rotate(${p.deg} ${p.x} ${p.y})`} />
      ))}
      {around(20, 17, 50, 50, Math.PI / 20).map((p, i) => (
        <ellipse key={`i${i}`} cx={p.x} cy={p.y} rx="3.2" ry="8" fill="#ffa03c" transform={`rotate(${p.deg} ${p.x} ${p.y})`} />
      ))}
      <circle cx="50" cy="50" r="10" fill="#ffc94d" />
      <circle cx="50" cy="50" r="6.5" fill="#5a2a0e" />
    </>
  );
}

function Lavender() {
  // Three stems, each with stacked buds narrowing to the tip.
  const stems = [
    { x: 36, top: 22, lean: -5 },
    { x: 50, top: 14, lean: 0 },
    { x: 64, top: 24, lean: 5 },
  ];
  return (
    <>
      {stems.map((s, i) => (
        <g key={i}>
          <path d={`M50 88 Q${50 + s.lean} 66 ${s.x} ${s.top + 34}`} stroke={GREEN} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          {Array.from({ length: 7 }, (_, k) => {
            const y = s.top + k * 5.2;
            const w = 3.2 + k * 0.45;
            return (
              <g key={k}>
                <ellipse cx={s.x - w * 0.55} cy={y} rx={w * 0.62} ry="3.1" fill={k % 2 ? '#7f4fc0' : '#9467d1'} />
                <ellipse cx={s.x + w * 0.55} cy={y + 1.4} rx={w * 0.62} ry="3.1" fill={k % 2 ? '#9467d1' : '#7f4fc0'} />
              </g>
            );
          })}
        </g>
      ))}
      <path d="M50 88 Q38 82 34 72 Q46 76 50 88 Z" fill={GREEN_DARK} />
    </>
  );
}

function PinkTulip() {
  return (
    <>
      <path d="M50 90 L50 56" stroke={GREEN} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M50 86 Q30 80 28 58 Q44 66 50 86 Z" fill={GREEN} />
      <path d="M50 82 Q68 76 72 60 Q56 66 50 82 Z" fill={GREEN_DARK} />
      {/* back petal, then the two front petals overlapping it */}
      <path d="M50 18 Q66 26 64 44 Q60 58 50 58 Q40 58 36 44 Q34 26 50 18 Z" fill="#ff8fc0" />
      <path d="M34 26 Q50 34 52 58 Q38 58 34 46 Q30 36 34 26 Z" fill="#ff6fae" />
      <path d="M66 26 Q50 34 48 58 Q62 58 66 46 Q70 36 66 26 Z" fill="#f45a9e" />
    </>
  );
}

const ART: Record<string, () => React.ReactElement> = {
  sunflower: Sunflower,
  hydrangea: Hydrangea,
  'red-rose': RedRose,
  gerbera: Gerbera,
  lavender: Lavender,
  'pink-tulip': PinkTulip,
};

/** Whether a flower has its own drawing here. */
export const hasPortrait = (id: string) => id in ART;

export function FlowerPortrait({ id, size }: { id: string; size?: number }) {
  const Art = ART[id];
  if (!Art) return null;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" data-portrait="">
      <Art />
    </svg>
  );
}
