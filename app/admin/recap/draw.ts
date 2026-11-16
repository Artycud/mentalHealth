import { TINTS } from '@/components/booth/flower-marks';
import { cudCare } from '@/content/th/common';
import { recap as t } from '@/content/th/recap';
import type { QrMatrix } from '@/lib/qr';
import type { Recap } from '@/lib/recap';
import type { Tint } from '@/lib/types';

/**
 * The recap's two story cards, drawn on a canvas at Instagram's story size, so
 * what the admin sees is exactly the image that is saved or shared. The browser
 * shapes the Thai, so vowels and tone marks sit right.
 *
 * The look is the booth TV's (app/booth/display): its night with the glitter
 * ribbons and lanterns, the count on the moon, the flower bars in each flower's
 * own ink, dark glass cards, and the river along the foot with the flowers
 * floating on it. Every flower is the TV's mark (components/booth/WallFlower),
 * drawn here from the same tints.
 *
 * Instagram covers the top ~200px (the profile line) and the bottom ~250px (the
 * reply bar) of a story, so nothing to read sits there.
 */

export const W = 1080;
export const H = 1920;

/** Where the admin puts Instagram's link sticker on card 2 (outlined on the page only). */
export const STICKER = { x: 150, y: 1090, w: 780, h: 180 };

/** Nothing to read below this: Instagram's reply bar. */
const SAFE_BOTTOM = 1600;
const RIVER_TOP = 1705;
const PAD = 70;

const C = {
  ink: '#1B2B5E',
  paper: '#FCF1E6',
  plate: '#FEF9F5',
  soft: 'rgba(252, 241, 230, 0.8)',
  line: 'rgba(252, 241, 230, 0.2)',
  glass: 'rgba(252, 241, 230, 0.08)',
  track: 'rgba(252, 241, 230, 0.16)',
  note: '#FFB8DE',
  pink: '#FF48B0',
  blue: '#0078BF',
  sun: '#FFB511',
  far: '#7f97cf',
  near: '#0e335f',
};

const STACK = '"Noto Sans Thai", "Leelawadee UI", Thonburi, sans-serif';
const font = {
  heading: (weight: number, px: number) => `${weight} ${px}px Mitr, ${STACK}`,
  body: (weight: number, px: number) => `${weight} ${px}px "IBM Plex Sans Thai Looped", ${STACK}`,
  note: (px: number) => `400 ${px}px Itim, ${STACK}`,
};

/** Wait for the site's fonts (their Thai and Latin halves), so the canvas uses them. */
export async function loadFonts(): Promise<void> {
  const sample = 'กขคูปอง ABC 123';
  const faces = [font.heading(400, 40), font.heading(500, 40), font.heading(600, 40), font.body(400, 40), font.body(500, 40), font.note(40)];
  try {
    await Promise.all(faces.map((f) => document.fonts.load(f, sample)));
  } catch {
    /* the fallbacks still draw */
  }
}

/** The site's art, loaded by RecapStudio. Anything missing is simply left out. */
export interface Art {
  moon: HTMLImageElement | null;
  wat: HTMLImageElement | null;
  /** The print's ink flecks, laid over a bar's fill as on the TV. */
  speckle: HTMLImageElement | null;
}

// ---- small tools ----

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

type Face = (px: number) => string;
const heading = (weight: number): Face => (px) => font.heading(weight, px);
const body = (weight: number): Face => (px) => font.body(weight, px);
const note: Face = (px) => font.note(px);

/** One line of text, shrunk to fit `max` if it would not. Returns the width it took. */
function line(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  o: { font: Face; size: number; color: string; max?: number; align?: CanvasTextAlign; shadow?: boolean },
): number {
  let size = o.size;
  ctx.font = o.font(size);
  const max = o.max ?? W - PAD * 2;
  let width = ctx.measureText(str).width;
  if (width > max) {
    size = Math.floor((size * max) / width);
    ctx.font = o.font(size);
    width = ctx.measureText(str).width;
  }
  ctx.save();
  if (o.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 8;
  }
  ctx.fillStyle = o.color;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
  ctx.restore();
  return width;
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** The TV's dark glass: a faint paper wash with a thin paper edge. */
function glass(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 40) {
  ctx.fillStyle = C.glass;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 3;
  ctx.stroke();
}

/**
 * The TV's flower mark (components/booth/WallFlower) on its cream plate: eight
 * petals and six inner ones multiplied onto the plate, the dotted ring, three dots.
 */
function flower(ctx: CanvasRenderingContext2D, tint: Tint, x: number, y: number, size: number, lit = false) {
  const { outer, inner } = TINTS[tint] ?? TINTS[0];
  if (lit) glow(ctx, x, y, size * 0.95, [[0, 'rgba(255, 181, 17, 0.42)'], [0.55, 'rgba(255, 181, 17, 0.12)'], [1, 'rgba(255, 181, 17, 0)']]);
  const s = size / 100;
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  ctx.scale(s, s);
  ctx.save();
  ctx.shadowColor = 'rgba(4, 14, 40, 0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = C.plate;
  ctx.beginPath();
  ctx.arc(50, 50, 47, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = outer;
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(50 + Math.cos(a) * 26, 50 + Math.sin(a) * 26, 17, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = inner;
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    ctx.beginPath();
    ctx.arc(50 + Math.cos(a) * 14, 50 + Math.sin(a) * 14, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = C.ink;
  ctx.lineCap = 'round';
  const px = Math.max(1.6, size * 0.024) / s;
  ctx.lineWidth = px;
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([px * 0.5, px * 3.5]);
  ctx.beginPath();
  ctx.arc(50, 50, 44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.lineWidth = px * 1.3;
  for (const [dx, dy] of [[46, 48], [52, 53], [54, 45]]) {
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx + 0.1, dy);
    ctx.stroke();
  }
  ctx.restore();
}

/** The TV's moon (display.module.css .moon) with the poster's moon over it, and its light. */
function moon(ctx: CanvasRenderingContext2D, art: Art, x: number, y: number, r: number) {
  glow(ctx, x, y, r * 2.1, [[0, 'rgba(246, 230, 168, 0.36)'], [0.55, 'rgba(246, 230, 168, 0.12)'], [1, 'rgba(246, 230, 168, 0)']]);
  const g = ctx.createRadialGradient(x - r * 0.24, y - r * 0.28, 0, x, y, r);
  g.addColorStop(0, '#fffbe6');
  g.addColorStop(0.6, '#f6e6a8');
  g.addColorStop(1, '#e8cf86');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (art.moon) {
    const s = r * 2 * 1.26;
    ctx.drawImage(art.moon, x - s / 2, y - s / 2, s, s);
  }
}

/** A khom loi, as in the festival sky (components/festival/loykrathong/Sky.tsx). */
function lantern(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
  glow(ctx, x, y, h * 1.3, [[0, 'rgba(255, 196, 110, 0.4)'], [1, 'rgba(255, 196, 110, 0)']]);
  const s = h / 32;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const g = ctx.createLinearGradient(0, -16, 0, 16);
  g.addColorStop(0, '#fffbe4');
  g.addColorStop(0.55, '#fbe2a0');
  g.addColorStop(1, '#f0a04a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-9, -13);
  ctx.quadraticCurveTo(0, -16.5, 9, -13);
  ctx.quadraticCurveTo(11.5, 0, 7, 12.5);
  ctx.quadraticCurveTo(0, 14.5, -7, 12.5);
  ctx.quadraticCurveTo(-11.5, 0, -9, -13);
  ctx.fill();
  ctx.fillStyle = '#d9772c';
  ctx.beginPath();
  ctx.ellipse(0, 12.6, 6, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A bar as on the TV: the track, and the fill in the flower's ink with the print's flecks, ends round. */
function bar(ctx: CanvasRenderingContext2D, art: Art, x: number, y: number, w: number, h: number, share: number, ink: string) {
  ctx.fillStyle = C.track;
  ctx.beginPath();
  ctx.roundRect(x, y - h / 2, w, h, h / 2);
  ctx.fill();
  const fw = Math.max(h, w * share);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y - h / 2, fw, h, h / 2);
  ctx.clip();
  ctx.fillStyle = ink;
  ctx.fillRect(x, y - h / 2, fw, h);
  if (art.speckle) {
    const p = ctx.createPattern(art.speckle, 'repeat');
    if (p) {
      ctx.fillStyle = p;
      ctx.fillRect(x, y - h / 2, fw, h);
    }
  }
  ctx.restore();
}

// ---- the night ----

/**
 * The TV's night: the sky with its glitter ribbons and stars, lanterns, the river
 * along the foot with the far bank's Wat and the day's flowers floating, lit, and
 * the TV's header (the wordmark left, which booth and day right).
 */
function scene(ctx: CanvasRenderingContext2D, r: Recap, art: Art, seed: number, lanterns: [number, number, number][]) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#163e74');
  sky.addColorStop(0.2, '#10366a');
  sky.addColorStop(0.5, '#0d3162');
  sky.addColorStop(0.8, '#0f3466');
  sky.addColorStop(1, '#163e74');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const rand = seeded(seed);
  // Two glitter ribbons swept across the sky, with fine dust thick along them.
  for (const { y0, amp, phase, thick, dust } of [
    { y0: 300, amp: 90, phase: 0.4, thick: 260, dust: 520 },
    { y0: 1180, amp: 80, phase: 2.6, thick: 220, dust: 340 },
  ]) {
    const at = (x: number) => y0 + amp * Math.sin((x / W) * Math.PI * 1.4 + phase);
    const g = ctx.createLinearGradient(0, y0 - thick, 0, y0 + thick);
    g.addColorStop(0, 'rgba(159, 182, 230, 0)');
    g.addColorStop(0.5, 'rgba(159, 182, 230, 0.13)');
    g.addColorStop(1, 'rgba(159, 182, 230, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, at(x) - thick / 2);
    for (let x = W; x >= 0; x -= 30) ctx.lineTo(x, at(x) + thick / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 246, 220, 0.5)';
    for (let i = 0; i < dust; i += 1) {
      const x = rand() * W;
      const spread = (rand() + rand() + rand() - 1.5) / 1.5;
      ctx.globalAlpha = 0.15 + rand() * 0.45;
      ctx.beginPath();
      ctx.arc(x, at(x) + spread * thick * 0.5, 0.6 + rand() * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  for (let i = 0; i < 150; i += 1) {
    const x = rand() * W;
    const y = rand() * RIVER_TOP * 0.97;
    const big = rand() < 0.08;
    if (big) glow(ctx, x, y, 12, [[0, 'rgba(255, 246, 220, 0.5)'], [1, 'rgba(255, 246, 220, 0)']]);
    ctx.fillStyle = `rgba(255, 246, 220, ${0.4 + rand() * 0.6})`;
    ctx.beginPath();
    ctx.arc(x, y, big ? 3 : 0.9 + rand() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [x, y, h] of lanterns) lantern(ctx, x, y, h);

  // The far bank's Wat, the water, and the day's flowers floating on it, nearest biggest.
  if (art.wat) {
    // Low enough that it stands under the cards, never behind them.
    const h = 150;
    const w = (art.wat.width / art.wat.height) * h;
    ctx.drawImage(art.wat, W - w + 40, RIVER_TOP - h + 50, w, h);
  }
  const wave = (base: number, amp: number, k: number, phase: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 12) {
      const tt = (x / W) * Math.PI * 2;
      ctx.lineTo(x, base + amp * Math.sin(k * tt + phase) + (amp / 2.2) * Math.sin(k * 2.3 * tt + phase * 2.3));
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  };
  wave(RIVER_TOP, 10, 2, 0.6, C.far);
  wave(RIVER_TOP + 40, 12, 2.5, 2.1, C.near);
  // Each flower as often as it was given, so the river is the day.
  const given = r.flowers.filter((f) => f.count > 0).sort((a, b) => b.count - a.count);
  const pool = given.length ? given : r.flowers;
  const floats = [
    { x: 80, y: 1770, s: 60 },
    { x: 250, y: 1755, s: 52 },
    { x: 420, y: 1800, s: 104 },
    { x: 600, y: 1765, s: 56 },
    { x: 760, y: 1815, s: 112 },
    { x: 930, y: 1775, s: 66 },
    { x: 1040, y: 1830, s: 84 },
  ];
  floats.forEach((f, i) => {
    const pick = pool[(i + seed) % pool.length];
    if (pick) flower(ctx, pick.tint, f.x, f.y, f.s, true);
  });

  // The TV's header: the wordmark (its inks add light on the night) and the day.
  const hy = 238;
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = C.pink;
  ctx.beginPath();
  ctx.arc(PAD + 18, hy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(PAD + 40, hy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  const bw = line(ctx, t.brand, PAD + 74, hy + 1, { font: heading(500), size: 32, color: C.paper, max: 420 });
  line(ctx, t.day(r.festivalName, r.dateLabel), W - PAD, hy + 1, { font: heading(500), size: 30, color: C.soft, align: 'right', max: W - PAD * 2 - bw - 120 });

  if (r.sample) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 7);
    ctx.font = font.heading(600, 150);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.textAlign = 'center';
    ctx.fillText('ตัวอย่าง', 0, 0);
    ctx.restore();
  }
}

// ---- card 1: how hearts are today ----

function today(ctx: CanvasRenderingContext2D, r: Recap, art: Art) {
  scene(ctx, r, art, 3, [
    [1000, 330, 46],
    [880, 380, 30],
    [960, 700, 36],
    [1010, 790, 24],
  ]);
  const oneDay = r.day !== null;

  // The count on the moon, as on the TV.
  const mx = PAD + 170;
  const my = 520;
  moon(ctx, art, mx, my, 170);
  line(ctx, String(r.players), mx, my + 8, { font: heading(600), size: r.players > 999 ? 120 : 150, color: C.ink, align: 'center', max: 300 });
  line(ctx, t.today.players(oneDay), mx, my + 230, { font: heading(500), size: 38, color: C.paper, align: 'center', max: 400 });

  // Beside it, the hook: how most hearts are.
  const top = r.feelings[0];
  const tx = 470;
  if (top) {
    const fl = r.flowers.find((f) => f.id === top.id);
    line(ctx, t.today.feelings, tx, 400, { font: heading(500), size: 38, color: C.note });
    line(ctx, top.word, tx, 494, { font: heading(600), size: 92, color: C.paper, max: W - PAD - tx, shadow: true });
    const pw = line(ctx, `${top.pct}%`, tx, 616, { font: heading(600), size: 120, color: C.sun, shadow: true });
    line(ctx, t.today.of, tx + pw + 18, 640, { font: heading(500), size: 32, color: C.soft, max: W - PAD - tx - pw - 18 });
    if (fl) line(ctx, t.today.flower(fl.name), tx, 712, { font: body(400), size: 30, color: C.soft, max: W - PAD - tx });
  }

  // Every flower of the day, as the TV's bars.
  const quotes = r.quotes;
  const cardH = quotes.length || r.topic ? 56 + quotes.length * 128 + (r.topic ? 76 : 0) : 0;
  const barsTop = 836;
  const rows = r.flowers.length || 1;
  const room = SAFE_BOTTOM - barsTop - (cardH ? cardH + 40 : 0);
  const rowH = Math.min(96, room / rows);
  const max = Math.max(1, ...r.flowers.map((f) => f.count));
  const nameEnd = 352;
  r.flowers.forEach((f, i) => {
    const y = barsTop + rowH * (i + 0.5);
    line(ctx, f.name, nameEnd, y, { font: heading(600), size: 34, color: C.paper, align: 'right', max: nameEnd - PAD + 10 });
    flower(ctx, f.tint, nameEnd + 46, y, Math.min(64, rowH * 0.78));
    bar(ctx, art, nameEnd + 94, y, 920 - nameEnd - 94, Math.min(40, rowH * 0.44), f.count / max, TINTS[f.tint]?.outer ?? C.paper);
    line(ctx, String(f.count), W - PAD, y + 2, { font: heading(600), size: 46, color: C.paper, align: 'right', max: 120 });
  });

  // What they would float away and what they would change, then the web's topic, on glass.
  if (cardH) {
    const y0 = SAFE_BOTTOM - cardH;
    glass(ctx, PAD - 10, y0, W - (PAD - 10) * 2, cardH);
    let y = y0 + 28;
    quotes.forEach((q) => {
      line(ctx, t.today.quotes[q.id] ?? '', PAD + 34, y + 30, { font: note, size: 32, color: C.note, max: 640 });
      line(ctx, `${q.pct}%`, W - PAD - 34, y + 30, { font: heading(600), size: 38, color: C.sun, align: 'right' });
      line(ctx, `“${q.label}”`, PAD + 34, y + 88, { font: heading(600), size: 48, color: C.paper, max: W - PAD * 2 - 68 });
      y += 128;
    });
    if (r.topic) {
      if (quotes.length) {
        ctx.fillStyle = C.line;
        ctx.fillRect(PAD + 34, y + 4, W - PAD * 2 - 68, 2);
      }
      line(ctx, t.today.topic(r.topic.name), PAD + 34, y + 42, { font: heading(500), size: 34, color: C.soft, max: W - PAD * 2 - 68 });
    }
  }
}

// ---- card 2: hearts carrying something, and ระบาย ----

/** The home's heart in its white speech bubble, small. */
function heartBubble(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.moveTo(x - r * 0.55, y + r * 0.8);
  ctx.lineTo(x - r * 0.9, y + r * 1.15);
  ctx.lineTo(x - r * 0.15, y + r * 0.95);
  ctx.fill();
  const s = r * 0.5;
  ctx.fillStyle = 'rgb(255, 143, 181)';
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.6, y - s * 0.1, x - s * 0.7, y - s * 1.3, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.3, x + s * 1.6, y - s * 0.1, x, y + s * 0.9);
  ctx.fill();
}

function qrBox(ctx: CanvasRenderingContext2D, qr: QrMatrix, x: number, y: number, box: number) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x, y, box, box, 24);
  ctx.fill();
  const n = qr.length;
  const cell = Math.floor((box - 28) / n);
  const ox = Math.round(x + (box - cell * n) / 2);
  const oy = Math.round(y + (box - cell * n) / 2);
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  for (let yy = 0; yy < n; yy += 1) {
    for (let xx = 0; xx < n; xx += 1) if (qr[yy][xx]) ctx.rect(ox + xx * cell, oy + yy * cell, cell, cell);
  }
  ctx.fill('nonzero');
}

function carrying(ctx: CanvasRenderingContext2D, r: Recap, art: Art, qr: QrMatrix | null) {
  scene(ctx, r, art, 7, [
    [990, 330, 44],
    [900, 560, 28],
    [1000, 700, 34],
  ]);
  const hv = r.heavy;

  // The TV's "n in 10": ten people as ten rings, the ones carrying something filled.
  let y = 360;
  line(ctx, t.heavy.note, PAD, y, { font: note, size: 40, color: C.note });
  if (hv) {
    y += 82;
    const d = 62;
    const gap = 22;
    for (let i = 0; i < 10; i += 1) {
      const cx = PAD + d / 2 + i * (d + gap);
      ctx.beginPath();
      ctx.arc(cx, y, d / 2 - 4, 0, Math.PI * 2);
      if (i < hv.tenths) {
        ctx.fillStyle = C.pink;
        ctx.fill();
      }
      ctx.lineWidth = 8;
      ctx.strokeStyle = i < hv.tenths ? C.pink : C.paper;
      ctx.stroke();
    }
    y += 132;
    line(ctx, t.heavy.stat(hv.tenths), PAD, y, { font: heading(600), size: 120, color: C.sun, shadow: true });
    y += 104;
    line(ctx, t.heavy.line, PAD, y, { font: heading(500), size: 52, color: C.paper });
    y += 58;
    line(ctx, t.heavy.which, PAD, y, { font: body(400), size: 30, color: C.soft });
  }
  y += 70;
  line(ctx, t.heavy.tail, PAD, y, { font: note, size: 44, color: C.paper });

  // ระบาย on the TV's glass: the way in, the sticker's place, and the QR.
  const gx = PAD - 10;
  const gy = 850;
  const gw = W - gx * 2;
  const gh = SAFE_BOTTOM - gy;
  glass(ctx, gx, gy, gw, gh);
  const ix = gx + 44;
  line(ctx, t.vent.title, ix, gy + 80, { font: heading(600), size: 62, color: C.paper, max: 680, shadow: true });
  line(ctx, t.vent.sub, ix, gy + 146, { font: body(400), size: 32, color: C.soft, max: 680 });
  heartBubble(ctx, gx + gw - 100, gy + 96, 58);

  // The numbers, after the pink dot of the TV's "สด".
  const v = r.vent;
  const words = v
    ? [t.vent.chats(v.chats, r.day !== null), v.medianMin !== null ? t.vent.reply(v.medianMin) : ''].filter(Boolean).join(' · ')
    : t.vent.promise;
  glow(ctx, ix + 10, gy + 206, 24, [[0, 'rgba(255, 72, 176, 0.5)'], [1, 'rgba(255, 72, 176, 0)']]);
  ctx.fillStyle = C.pink;
  ctx.beginPath();
  ctx.arc(ix + 10, gy + 206, 10, 0, Math.PI * 2);
  ctx.fill();
  line(ctx, words, ix + 36, gy + 207, { font: heading(500), size: 32, color: C.paper, max: gw - 120 });

  // The home's message bar, where Instagram's link sticker goes (STICKER); without
  // one it still says "write here".
  const bh = 120;
  const by = STICKER.y + (STICKER.h - bh) / 2;
  const bx0 = ix;
  const bw = gw - 88;
  ctx.save();
  ctx.shadowColor = 'rgba(255, 72, 176, 0.4)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = C.paper;
  ctx.beginPath();
  ctx.roundRect(bx0, by, bw, bh, bh / 2);
  ctx.fill();
  ctx.restore();
  line(ctx, 'เรื่องเรียน… เพื่อน… ที่บ้าน…', bx0 + 54, by + bh / 2 + 1, { font: body(400), size: 34, color: 'rgba(27, 43, 94, 0.5)', max: 560 });
  const sx = bx0 + bw - bh / 2;
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(sx, by + bh / 2, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.paper;
  ctx.beginPath();
  ctx.moveTo(sx - 17, by + bh / 2 - 15);
  ctx.lineTo(sx + 21, by + bh / 2);
  ctx.lineTo(sx - 17, by + bh / 2 + 15);
  ctx.lineTo(sx - 9, by + bh / 2);
  ctx.closePath();
  ctx.fill();

  if (qr) {
    const box = 180;
    const qy = STICKER.y + STICKER.h + 24;
    qrBox(ctx, qr, ix, qy, box);
    line(ctx, t.vent.scan, ix + box + 40, qy + 58, { font: heading(600), size: 50, color: C.paper, max: gw - box - 130 });
    line(ctx, t.vent.scanSub, ix + box + 40, qy + 122, { font: body(400), size: 32, color: C.soft, max: gw - box - 130 });
  }
  line(ctx, cudCare.result.body, W / 2, gy + gh - 40, { font: body(400), size: 27, color: C.soft, align: 'center', max: gw - 80 });
}

// ---- the cards ----

export interface CardSpec {
  id: string;
  label: string;
  /** Where the link sticker goes, if this card has a place for one. */
  sticker?: typeof STICKER;
  draw: (ctx: CanvasRenderingContext2D, r: Recap, art: Art, qr: QrMatrix | null) => void;
}

/** The two cards, in posting order. */
export const CARDS: CardSpec[] = [
  { id: 'today', label: t.cards[0], draw: (ctx, r, art) => today(ctx, r, art) },
  { id: 'carrying', label: t.cards[1], sticker: STICKER, draw: carrying },
];

/** Paint one card onto a canvas at the story's size. */
export function paint(canvas: HTMLCanvasElement, r: Recap, card: CardSpec, art: Art, qr: QrMatrix | null) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  card.draw(ctx, r, art, qr);
}
