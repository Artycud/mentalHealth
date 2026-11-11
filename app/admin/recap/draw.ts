import { cudCare } from '@/content/th/common';
import { recap as t } from '@/content/th/recap';
import type { QrMatrix } from '@/lib/qr';
import type { Recap } from '@/lib/recap';
import type { Tint } from '@/lib/types';

/**
 * The recap cards, drawn on a canvas at Instagram's own sizes, so what the admin
 * sees is exactly the image that is saved or shared (no screenshot, no library).
 * The browser shapes the Thai, so vowels and tone marks sit right.
 *
 * The look is the booth TV's: the Loy Krathong night sky, paper and marigold text,
 * a river with lit flowers along the bottom. Each card lays itself out top to bottom
 * twice: once to measure, once to draw, centred in the space between the header and
 * the water (and scaled down a touch if it would not fit).
 */

export type Format = 'story' | 'post';
export const SIZES: Record<Format, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  post: { w: 1080, h: 1350 },
};

const C = {
  ink: '#1B2B5E',
  pink: '#FF48B0',
  blue: '#0078BF',
  sun: '#FFB511',
  paper: '#FCF1E6',
  note: '#FFB8DE',
  soft: 'rgba(252, 241, 230, 0.8)',
  faint: 'rgba(252, 241, 230, 0.16)',
};

/** The six flower inks, in the same order as components/booth/WallFlower.tsx. */
const TINTS: { outer: string; inner: string }[] = [
  { outer: C.sun, inner: C.pink },
  { outer: C.pink, inner: C.blue },
  { outer: C.blue, inner: C.sun },
  { outer: C.pink, inner: C.sun },
  { outer: C.sun, inner: C.blue },
  { outer: C.blue, inner: C.pink },
];

const STACK = '"Noto Sans Thai", "Leelawadee UI", Thonburi, sans-serif';
const font = {
  heading: (weight: number, px: number) => `${weight} ${px}px Mitr, ${STACK}`,
  body: (weight: number, px: number) => `${weight} ${px}px "IBM Plex Sans Thai Looped", ${STACK}`,
  note: (px: number) => `400 ${px}px Itim, ${STACK}`,
};

/** Wait for the site's fonts (their Thai and Latin halves), so the canvas uses them. */
export async function loadFonts(): Promise<void> {
  const sample = 'กขคูปอง ABC 123';
  const faces = [
    font.heading(400, 40),
    font.heading(500, 40),
    font.heading(600, 40),
    font.body(400, 40),
    font.body(500, 40),
    font.note(40),
  ];
  try {
    await Promise.all(faces.map((f) => document.fonts.load(f, sample)));
  } catch {
    /* the fallbacks still draw */
  }
}

// ---- layout ----

interface Pen {
  ctx: CanvasRenderingContext2D;
  w: number;
  /** Measuring only: nothing is painted. */
  dry: boolean;
  y: number;
  /** Side margin. */
  m: number;
}

const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('th', { granularity: 'word' }) : null;

/** Thai has no spaces between words: break at word boundaries the browser knows. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const parts = segmenter ? [...segmenter.segment(text)].map((s) => s.segment) : text.split(/(?<= )/);
  const lines: string[] = [];
  let line = '';
  for (const part of parts) {
    const next = line + part;
    // Never start a line with punctuation or ๆ: "เป็นยังไง?" stays whole.
    const clings = /^\s*[?!.,:;"”’)…ๆ%]+\s*$/.test(part);
    if (line && !clings && ctx.measureText(next).width > max) {
      lines.push(line.trimEnd());
      line = part.trimStart();
    } else {
      line = next;
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

function text(
  p: Pen,
  str: string,
  o: { font: string; color: string; size: number; lh?: number; max?: number; align?: CanvasTextAlign; x?: number },
) {
  const { ctx } = p;
  ctx.font = o.font;
  const max = o.max ?? p.w - p.m * 2;
  const lines = wrap(ctx, str, max);
  const lh = o.size * (o.lh ?? 1.45);
  const align = o.align ?? 'center';
  const x = o.x ?? (align === 'center' ? p.w / 2 : align === 'left' ? p.m : p.w - p.m);
  for (const line of lines) {
    if (!p.dry) {
      ctx.fillStyle = o.color;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.fillText(line, x, p.y + lh / 2);
    }
    p.y += lh;
  }
}

const gap = (p: Pen, n: number) => {
  p.y += n;
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** A soft pill behind a line of text. */
function pill(p: Pen, str: string, o: { font: string; size: number; color: string; fill: string }) {
  const { ctx } = p;
  ctx.font = o.font;
  const h = o.size * 1.9;
  const w = Math.min(ctx.measureText(str).width + o.size * 1.6, p.w - p.m * 2);
  if (!p.dry) {
    ctx.fillStyle = o.fill;
    roundRect(ctx, (p.w - w) / 2, p.y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = o.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, p.w / 2, p.y + h / 2);
  }
  p.y += h;
}

// ---- pictures ----

/** A lit flower on a cream plate, like the TV's river and bars. */
function flower(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tint: Tint, glow = true) {
  const { outer, inner } = TINTS[tint];
  ctx.save();
  if (glow) {
    const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.2);
    g.addColorStop(0, 'rgba(255, 181, 17, 0.45)');
    g.addColorStop(1, 'rgba(255, 181, 17, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = C.paper;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // Petals multiply onto the plate, so where they overlap they make a third colour.
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = outer;
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = inner;
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2, r * 0.17, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.ink;
  for (const [dx, dy] of [[-0.05, -0.04], [0.06, -0.02], [0, 0.06]]) {
    ctx.beginPath();
    ctx.arc(x + dx * r, y + dy * r, r * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.setLineDash([r * 0.03, r * 0.07]);
  ctx.lineWidth = Math.max(1.5, r * 0.03);
  ctx.strokeStyle = C.ink;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.86, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** A small seeded random, so every card's stars and river are the same each time. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** The sky, the stars, the river with its flowers, and the header and footer. */
function scene(ctx: CanvasRenderingContext2D, w: number, h: number, format: Format, r: Recap, seed: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0b1536');
  sky.addColorStop(0.45, '#26307f');
  sky.addColorStop(0.74, '#b8358f');
  sky.addColorStop(0.86, '#ff8a4d');
  sky.addColorStop(0.9, '#ffc36b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const rand = seeded(seed);
  for (let i = 0; i < 46; i += 1) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + rand() * 0.55})`;
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h * 0.5, 1.2 + rand() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // The river: a far layer and a near one, each a hand-cut wave.
  const top = h - (format === 'story' ? 330 : 230);
  const wave = (base: number, amp: number, k: number, phase: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 12) {
      const y = base + amp * Math.sin((x / w) * Math.PI * 2 * k + phase) + (amp / 2) * Math.sin((x / w) * Math.PI * 2 * k * 2.3 + phase * 2);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  };
  wave(top, 12, 2, seed, C.blue);
  wave(top + 70, 14, 2.5, seed * 1.7, C.ink);
  ctx.strokeStyle = 'rgba(252, 241, 230, 0.18)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i += 1) {
    const x = rand() * (w - 160);
    const y = top + 110 + rand() * (h - top - 150);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 60, y - 10, x + 120, y);
    ctx.stroke();
  }
  // A few lit flowers floating, in the day's own mix of colours.
  const tints = r.flowers.filter((f) => f.count > 0).map((f) => f.tint);
  const pick = tints.length ? tints : ([0, 1, 2, 3, 4, 5] as Tint[]);
  const n = 5;
  for (let i = 0; i < n; i += 1) {
    const x = (w / n) * (i + 0.5) + (rand() - 0.5) * 60;
    const y = top + 60 + rand() * 40;
    flower(ctx, x, y, 34 + rand() * 18, pick[i % pick.length]);
  }

  // Header: the wordmark. The inks add light on the night sky.
  const hy = format === 'story' ? 170 : 86;
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = C.pink;
  ctx.beginPath();
  ctx.arc(w / 2 - 238, hy, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(w / 2 - 214, hy, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.font = font.heading(500, 38);
  ctx.fillStyle = C.paper;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(t.brand, w / 2 - 180, hy);

  // Footer on the water: which booth, which day.
  ctx.font = font.heading(500, 32);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.paper;
  ctx.fillText(`บูธ${r.festivalName} · ${r.dateLabel}`, w / 2, h - (format === 'story' ? 150 : 70));

  if (r.sample) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 7);
    ctx.font = font.heading(600, 150);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.textAlign = 'center';
    ctx.fillText('ตัวอย่าง', 0, 0);
    ctx.restore();
  }
}

// ---- the cards ----

type Body = (p: Pen, r: Recap, qr: QrMatrix | null) => void;

const note = (p: Pen, str: string) => text(p, str, { font: font.note(46), color: C.note, size: 46 });

const cover: Body = (p, r) => {
  note(p, t.cover.note(r.festivalName));
  text(p, r.dateLabel, { font: font.heading(500, 42), color: C.paper, size: 42 });
  gap(p, 40);
  // The count on a full moon.
  const d = 440;
  if (!p.dry) {
    const { ctx } = p;
    const cx = p.w / 2;
    const cy = p.y + d / 2;
    const halo = ctx.createRadialGradient(cx, cy, d * 0.4, cx, cy, d * 0.85);
    halo.addColorStop(0, 'rgba(246, 230, 168, 0.4)');
    halo.addColorStop(1, 'rgba(246, 230, 168, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, d * 0.85, 0, Math.PI * 2);
    ctx.fill();
    const moon = ctx.createRadialGradient(cx - d * 0.12, cy - d * 0.14, d * 0.05, cx, cy, d / 2);
    moon.addColorStop(0, '#fffbe6');
    moon.addColorStop(0.6, '#f6e6a8');
    moon.addColorStop(1, '#e8cf86');
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
    ctx.fill();
    const digits = String(r.players);
    ctx.font = font.heading(600, digits.length > 3 ? 160 : 210);
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(digits, cx, cy + 8);
  }
  p.y += d;
  gap(p, 34);
  text(p, t.cover.players, { font: font.heading(600, 68), color: C.paper, size: 68 });
  gap(p, 30);
  const chip = { font: font.body(500, 36), size: 36, color: C.paper, fill: C.faint };
  if (r.medianSeconds !== null) {
    pill(p, t.cover.time(r.medianSeconds), chip);
    gap(p, 18);
  }
  if (r.peak) {
    pill(p, t.cover.peak(r.peak.from, r.peak.to), chip);
    gap(p, 18);
  }
  gap(p, 16);
  text(p, t.cover.thanks, { font: font.note(42), color: C.note, size: 42 });
};

const flowers: Body = (p, r) => {
  const top = r.flowers[0];
  note(p, t.flowers.note);
  gap(p, 8);
  text(p, t.flowers.top, { font: font.heading(500, 40), color: C.soft, size: 40 });
  gap(p, 30);
  const big = 150;
  if (!p.dry) flower(p.ctx, p.w / 2, p.y + big, big, top.tint);
  p.y += big * 2;
  gap(p, 26);
  text(p, top.name, { font: font.heading(600, 104), color: C.paper, size: 104, lh: 1.25 });
  text(p, t.flowers.share(top.pct), { font: font.heading(600, 46), color: C.sun, size: 46 });
  gap(p, 44);
  // Every flower, as bars.
  const { ctx } = p;
  const max = Math.max(1, ...r.flowers.map((f) => f.count));
  const nameW = 290;
  const row = 64;
  for (const f of r.flowers) {
    if (!p.dry) {
      const y = p.y + row / 2;
      ctx.font = font.heading(500, 34);
      ctx.fillStyle = C.paper;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.name, p.m + nameW, y);
      flower(ctx, p.m + nameW + 44, y, 24, f.tint, false);
      const tx = p.m + nameW + 86;
      const tw = p.w - p.m - tx - 90;
      ctx.fillStyle = C.faint;
      roundRect(ctx, tx, y - 15, tw, 30, 15);
      ctx.fill();
      ctx.fillStyle = TINTS[f.tint].outer;
      roundRect(ctx, tx, y - 15, Math.max(30, (tw * f.count) / max), 30, 15);
      ctx.fill();
      ctx.font = font.heading(600, 38);
      ctx.fillStyle = C.paper;
      ctx.textAlign = 'left';
      ctx.fillText(String(f.count), tx + tw + 20, y);
    }
    p.y += row;
  }
};

const answers: Body = (p, r) => {
  note(p, t.answers.note);
  gap(p, 30);
  const segColors = [C.sun, C.pink, C.blue];
  for (const q of r.questions) {
    if (q.answered === 0) continue;
    const topChoice = [...q.choices].sort((a, b) => b.count - a.count)[0];
    text(p, q.headline, { font: font.body(500, 34), color: C.soft, size: 34 });
    gap(p, 6);
    text(p, `“${topChoice.label}”`, { font: font.heading(600, 58), color: C.paper, size: 58, lh: 1.3 });
    text(p, `${topChoice.pct}%`, { font: font.heading(600, 64), color: C.sun, size: 64, lh: 1.2 });
    gap(p, 14);
    // All the answers as one bar; the winner at full strength.
    const bw = p.w - p.m * 2;
    if (!p.dry) {
      const { ctx } = p;
      let x = p.m;
      ctx.save();
      roundRect(ctx, p.m, p.y, bw, 22, 11);
      ctx.clip();
      ctx.fillStyle = C.faint;
      ctx.fillRect(p.m, p.y, bw, 22);
      q.choices.forEach((ch, i) => {
        const cw = (bw * ch.count) / Math.max(1, q.answered);
        ctx.globalAlpha = ch.id === topChoice.id ? 1 : 0.45;
        ctx.fillStyle = segColors[i % segColors.length];
        ctx.fillRect(x, p.y, cw, 22);
        x += cw;
      });
      ctx.restore();
    }
    p.y += 22;
    gap(p, 54);
  }
};

const okay: Body = (p, r) => {
  const o = r.okay;
  if (!o) return;
  note(p, t.okay.note);
  gap(p, 10);
  text(p, t.okay.question, { font: font.heading(500, 58), color: C.paper, size: 58 });
  gap(p, 40);
  // Ten people as ten dots: the filled ones said "okay" while not okay.
  const dot = 70;
  const g = 18;
  const total = dot * 10 + g * 9;
  if (!p.dry) {
    const { ctx } = p;
    for (let i = 0; i < 10; i += 1) {
      const cx = (p.w - total) / 2 + i * (dot + g) + dot / 2;
      const cy = p.y + dot / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, dot / 2 - 4, 0, Math.PI * 2);
      if (i < o.hide) {
        ctx.fillStyle = C.pink;
        ctx.fill();
      } else {
        ctx.lineWidth = 6;
        ctx.strokeStyle = C.paper;
        ctx.stroke();
      }
    }
  }
  p.y += dot;
  gap(p, 40);
  text(p, t.okay.stat(o.hide), { font: font.heading(600, 112), color: C.sun, size: 112, lh: 1.25 });
  text(p, t.okay.statLine, { font: font.heading(500, 54), color: C.paper, size: 54, lh: 1.35 });
  if (o.depends > 0) {
    gap(p, 22);
    text(p, t.okay.depends(o.depends), { font: font.body(500, 36), color: C.soft, size: 36 });
  }
  gap(p, 40);
  text(p, t.okay.tail, { font: font.note(50), color: C.note, size: 50 });
  gap(p, 30);
  pill(p, cudCare.result.body, { font: font.body(500, 32), size: 32, color: C.paper, fill: C.faint });
  gap(p, 22);
  text(p, t.okay.base(o.answered), { font: font.body(400, 26), color: C.soft, size: 26 });
};

const invite: Body = (p, r, qr) => {
  note(p, t.invite.note);
  gap(p, 10);
  text(p, t.invite.title, { font: font.heading(600, 76), color: C.paper, size: 76, lh: 1.3 });
  gap(p, 40);
  if (qr) {
    const box = 470;
    if (!p.dry) {
      const { ctx } = p;
      const x = (p.w - box) / 2;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, x, p.y, box, box, 36);
      ctx.fill();
      // A four-module quiet zone, inside the white box.
      const n = qr.length;
      const cell = Math.floor((box - 40) / (n + 8));
      // Whole pixels, so no hairline shows between modules.
      const off = Math.round(x + (box - cell * n) / 2);
      const offY = Math.round(p.y + (box - cell * n) / 2);
      // One path for every module, filled once, so neighbours never show a seam
      // even when the card is scaled.
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      for (let yy = 0; yy < n; yy += 1) {
        for (let xx = 0; xx < n; xx += 1) {
          if (qr[yy][xx]) ctx.rect(off + xx * cell, offY + yy * cell, cell, cell);
        }
      }
      ctx.fill('nonzero');
    }
    p.y += box;
    gap(p, 30);
  }
  text(p, t.invite.body, { font: font.body(500, 38), color: C.soft, size: 38 });
  if (r.next) {
    gap(p, 40);
    pill(p, t.invite.next(r.next.name, r.next.date), { font: font.heading(500, 36), size: 36, color: C.ink, fill: C.sun });
  }
};

export interface CardSpec {
  id: string;
  label: string;
  body: Body;
}

/** The cards for a recap, in posting order. The honest-question card only once its guard allows. */
export function cardsFor(r: Recap): CardSpec[] {
  const cards: CardSpec[] = [
    { id: 'cover', label: 'ภาพรวม', body: cover },
    { id: 'flowers', label: 'ดอกไม้', body: flowers },
    { id: 'answers', label: 'คำตอบยอดฮิต', body: answers },
  ];
  if (r.okay) cards.push({ id: 'okay', label: 'เรื่องโอเคไหม', body: okay });
  cards.push({ id: 'invite', label: 'ชวนไปเว็บ', body: invite });
  return cards;
}

/** Paint one card onto a canvas of the format's size. */
export function paint(canvas: HTMLCanvasElement, format: Format, r: Recap, card: CardSpec, qr: QrMatrix | null, seed: number) {
  const { w, h } = SIZES[format];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  scene(ctx, w, h, format, r, seed);

  // The space between the header and the water.
  const areaTop = format === 'story' ? 250 : 140;
  const areaBottom = h - (format === 'story' ? 360 : 250);
  const area = areaBottom - areaTop;

  const measure: Pen = { ctx, w, dry: true, y: 0, m: 88 };
  card.body(measure, r, qr);
  const height = measure.y;
  const scale = height > area ? area / height : 1;

  ctx.save();
  const top = areaTop + Math.max(0, (area - height * scale) / 2);
  ctx.translate(w / 2, top);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, 0);
  card.body({ ctx, w, dry: false, y: 0, m: 88 }, r, qr);
  ctx.restore();
}
