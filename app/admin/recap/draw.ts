import { cudCare } from '@/content/th/common';
import { recap as t } from '@/content/th/recap';
import type { QrMatrix } from '@/lib/qr';
import type { Recap } from '@/lib/recap';

/**
 * The recap's two story cards, drawn on a canvas at Instagram's story size, so
 * what the admin sees is exactly the image that is saved or shared. The browser
 * shapes the Thai, so vowels and tone marks sit right.
 *
 * The look is the booth's own (the kiosk and the TV): the Loy Krathong night with
 * its glitter ribbons and stars, the poster's moon in its halo of moonlight,
 * lanterns, Wat Arun on the far bank, and the river with lit flowers on cream
 * plates. The art is the site's (RecapStudio loads it), not redrawn here.
 *
 * Instagram covers the top ~220px (the profile line) and the bottom ~250px (the
 * reply bar) of a story, so nothing to read sits there.
 */

export const W = 1080;
export const H = 1920;

/** Where the admin puts Instagram's link sticker on card 2 (outlined on the page only). */
export const STICKER = { x: 190, y: 1030, w: 700, h: 210 };

const C = {
  ink: '#1B2B5E',
  pink: '#FF48B0',
  blue: '#0078BF',
  sun: '#FFB511',
  paper: '#FCF1E6',
  note: '#FFB8DE',
  soft: 'rgba(252, 241, 230, 0.78)',
  faint: 'rgba(252, 241, 230, 0.13)',
  far: '#7f97cf',
  near: '#0e335f',
  live: '#1fae6a',
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
  /** The booth's flower drawings (components/booth/FlowerPortrait), by flower id. */
  flowers: Record<string, HTMLImageElement>;
}

// ---- small tools ----

/** A small seeded random, so every card's stars and river are the same each time. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * One line of text, centred on x (or aligned), shrunk to fit `max` if it would not.
 * Returns the width it took.
 */
function line(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  o: { font: (px: number) => string; size: number; color: string; max?: number; align?: CanvasTextAlign },
): number {
  let size = o.size;
  ctx.font = o.font(size);
  const max = o.max ?? W - 160;
  const width = ctx.measureText(str).width;
  if (width > max) {
    size = Math.floor((size * max) / width);
    ctx.font = o.font(size);
  }
  ctx.fillStyle = o.color;
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
  return Math.min(width, max);
}

const heading = (weight: number) => (px: number) => font.heading(weight, px);
const body = (weight: number) => (px: number) => font.body(weight, px);
const note = (px: number) => font.note(px);

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** A booth flower on its cream plate with the dotted ring, as on the TV. */
function plated(ctx: CanvasRenderingContext2D, art: Art, id: string, x: number, y: number, r: number, lit = true) {
  if (lit) glow(ctx, x, y, r * 2, [[0, 'rgba(255, 181, 17, 0.42)'], [0.5, 'rgba(255, 181, 17, 0.14)'], [1, 'rgba(255, 181, 17, 0)']]);
  ctx.save();
  ctx.shadowColor = 'rgba(4, 14, 40, 0.45)';
  ctx.shadowBlur = r * 0.25;
  ctx.shadowOffsetY = r * 0.06;
  ctx.fillStyle = C.paper;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const img = art.flowers[id];
  if (img) ctx.drawImage(img, x - r * 0.98, y - r * 0.98, r * 1.96, r * 1.96);
  ctx.save();
  ctx.setLineDash([Math.max(2, r * 0.035), Math.max(4, r * 0.075)]);
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, r * 0.035);
  ctx.strokeStyle = C.ink;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.93, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** A lantern (khom loi) with its warm light, as in the booth's sky. */
function lantern(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  glow(ctx, x, y, s * 2.6, [[0, 'rgba(255, 214, 140, 0.38)'], [1, 'rgba(255, 214, 140, 0)']]);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 16, s / 16);
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

/** The poster's moon in its halo (components/festival/loykrathong/Halo.tsx), with words on it. */
function moon(ctx: CanvasRenderingContext2D, art: Art, x: number, y: number, r: number) {
  // The wide cool wash, then the warm light close to the disc.
  glow(ctx, x, y, r * 3.6, [[0, 'rgba(214, 228, 255, 0.26)'], [0.38, 'rgba(170, 196, 240, 0.13)'], [0.66, 'rgba(140, 170, 225, 0.05)'], [1, 'rgba(140, 170, 225, 0)']]);
  glow(ctx, x, y, r * 1.9, [[0, 'rgba(255, 244, 210, 0.42)'], [0.5, 'rgba(255, 228, 170, 0.14)'], [1, 'rgba(255, 228, 170, 0)']]);
  if (art.moon) {
    // The disc is 79% of the art; the rest is its soft edge.
    const s = r * 2 * 1.26;
    ctx.drawImage(art.moon, x - s / 2, y - s / 2, s, s);
  } else {
    const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#fffbe6');
    g.addColorStop(1, '#ecd796');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A cream paper slip with a strip of tape, like the home's slips. */
function slip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tilt: number) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(tilt);
  ctx.shadowColor = 'rgba(4, 14, 40, 0.5)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = C.paper;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 22);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // The tape: translucent marigold across the top edge.
  ctx.rotate(-0.06);
  ctx.fillStyle = 'rgba(255, 181, 17, 0.72)';
  ctx.fillRect(-70, -h / 2 - 30, 140, 38);
  ctx.restore();
}

// ---- the night ----

/** The sky, ribbons, stars, lanterns, the far bank and the river with its flowers. */
function scene(ctx: CanvasRenderingContext2D, r: Recap, art: Art, seed: number, riverTop: number) {
  // The booth's sky (app/festivals/loykrathong.css --fest-sky), a step darker like the kiosk.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#12345f');
  sky.addColorStop(0.3, '#0e2e59');
  sky.addColorStop(0.65, '#0a2853');
  sky.addColorStop(1, '#0d2d59');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const rand = seeded(seed);

  // Two glitter ribbons swept across the sky (Sky.tsx): a soft band and fine dust.
  for (const [y0, amp, phase, thick] of [[300, 70, 0.4, 230], [1080, 60, 2.6, 190]]) {
    const at = (x: number) => y0 + amp * Math.sin((x / W) * Math.PI * 1.4 + phase);
    const g = ctx.createLinearGradient(0, y0 - thick / 2 - amp, 0, y0 + thick / 2 + amp);
    g.addColorStop(0, 'rgba(159, 182, 230, 0)');
    g.addColorStop(0.5, 'rgba(159, 182, 230, 0.12)');
    g.addColorStop(1, 'rgba(159, 182, 230, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, at(x) - thick / 2);
    for (let x = W; x >= 0; x -= 30) ctx.lineTo(x, at(x) + thick / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff6dc';
    for (let i = 0; i < 260; i += 1) {
      const x = rand() * W;
      ctx.globalAlpha = 0.18 + rand() * 0.45;
      ctx.beginPath();
      ctx.arc(x, at(x) + (rand() - 0.5) * thick * 0.8 * (0.4 + rand()), 0.7 + rand() * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Stars, a few big ones with a little light of their own.
  for (let i = 0; i < 120; i += 1) {
    const x = rand() * W;
    const y = rand() * riverTop * 0.95;
    const big = rand() < 0.08;
    if (big) glow(ctx, x, y, 14, [[0, 'rgba(255, 246, 220, 0.5)'], [1, 'rgba(255, 246, 220, 0)']]);
    ctx.fillStyle = `rgba(255, 246, 220, ${0.4 + rand() * 0.6})`;
    ctx.beginPath();
    ctx.arc(x, y, big ? 3.2 : 1 + rand() * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lanterns at the sides, clear of the words.
  for (const [x, y, s] of [[70, 640, 22], [1000, 560, 18], [1012, 820, 14], [50, 1000, 13], [985, 1330, 11]]) {
    lantern(ctx, x, y, s);
  }

  // Wat Arun on the far bank, its foot behind the far water.
  if (art.wat) {
    const h = 180;
    const w = (art.wat.width / art.wat.height) * h;
    ctx.drawImage(art.wat, W - w + 70, riverTop - h + 40, w, h);
  }

  // The river: the moonlit far water, then the near water (River.tsx).
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
  wave(riverTop, 10, 2, 0.6, C.far);
  wave(riverTop + 46, 12, 2.5, 2.1, C.near);
  ctx.strokeStyle = 'rgba(252, 241, 230, 0.16)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i += 1) {
    const x = rand() * (W - 160);
    const y = riverTop + 150 + rand() * (H - riverTop - 170);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 60, y - 10, x + 120, y);
    ctx.stroke();
  }
  // The day's flowers floating, in its own mix.
  const ids = r.flowers.filter((f) => f.count > 0).map((f) => f.id);
  const pick = ids.length ? ids : r.flowers.map((f) => f.id);
  const n = 5;
  for (let i = 0; i < n; i += 1) {
    const x = (W / n) * (i + 0.5) + (rand() - 0.5) * 50;
    const y = riverTop + 105 + (i % 2) * 34 + rand() * 16;
    plated(ctx, art, pick[i % pick.length], x, y, 40 + rand() * 12);
  }

  // The wordmark, and which booth and day. The inks add light on the night.
  const hy = 238;
  ctx.font = font.heading(500, 36);
  const tw = ctx.measureText(t.brand).width;
  const left = (W - (tw + 74)) / 2;
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = C.pink;
  ctx.beginPath();
  ctx.arc(left + 18, hy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(left + 40, hy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  line(ctx, t.brand, left + 74, hy, { font: heading(500), size: 36, color: C.paper, align: 'left' });
  line(ctx, t.day(r.festivalName, r.dateLabel), W / 2, hy + 62, { font: note, size: 38, color: C.note });

  if (r.sample) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 7);
    ctx.font = font.heading(600, 150);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.textAlign = 'center';
    ctx.fillText('ตัวอย่าง', 0, 0);
    ctx.restore();
  }
}

// ---- card 1: today's hearts ----

function today(ctx: CanvasRenderingContext2D, r: Recap, art: Art) {
  // Without the topic slip, everything sits a little lower, to stay centred.
  const dy = r.topic ? 0 : 70;
  scene(ctx, r, art, 3, 1640);

  // The count on the full moon.
  const my = 560 + dy;
  moon(ctx, art, W / 2, my, 170);
  const digits = String(r.players);
  line(ctx, digits, W / 2, my + 10, { font: heading(600), size: digits.length > 3 ? 150 : 190, color: C.ink, max: 290 });
  line(ctx, t.today.players, W / 2, my + 245, { font: heading(500), size: 54, color: C.paper });

  // How most people feel: the top three, as their flowers.
  line(ctx, t.today.feelings, W / 2, 935 + dy, { font: note, size: 46, color: C.note });
  const top = r.feelings;
  const spots =
    top.length === 1
      ? [{ x: W / 2, big: true }]
      : top.length === 2
        ? [{ x: 380, big: true }, { x: 760, big: false }]
        : [{ x: W / 2, big: true }, { x: 215, big: false }, { x: 865, big: false }];
  top.forEach((f, i) => {
    const { x, big } = spots[i];
    const fy = (big ? 1110 : 1140) + dy;
    plated(ctx, art, f.id, x, fy, big ? 128 : 86);
    line(ctx, f.word, x, 1295 + dy, { font: heading(big ? 600 : 500), size: big ? 60 : 38, color: C.paper, max: big ? 420 : 290 });
    line(ctx, `${f.pct}%`, x, (big ? 1365 : 1352) + dy, { font: heading(600), size: big ? 54 : 40, color: C.sun });
  });

  // What is on their minds, from the check-up on the web, on a taped slip.
  if (r.topic) {
    const w = 620;
    const h = 150;
    const x = (W - w) / 2;
    const y = 1462;
    slip(ctx, x, y, w, h, -0.025);
    ctx.save();
    ctx.translate(W / 2, y + h / 2);
    ctx.rotate(-0.025);
    line(ctx, t.today.topic, 0, -26, { font: heading(400), size: 30, color: '#5a6386' });
    line(ctx, r.topic.name, 0, 30, { font: heading(600), size: 62, color: C.ink, max: w - 60 });
    ctx.restore();
  }
}

// ---- card 2: "are you okay?", and the way in ----

function figure(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean) {
  if (on) glow(ctx, x, y + 26, 62, [[0, 'rgba(255, 72, 176, 0.35)'], [1, 'rgba(255, 72, 176, 0)']]);
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.moveTo(x - 26, y + 62);
  ctx.lineTo(x - 26, y + 48);
  ctx.arc(x, y + 48, 26, Math.PI, 0);
  ctx.lineTo(x + 26, y + 62);
  ctx.closePath();
  if (on) {
    ctx.fillStyle = C.pink;
    ctx.fill();
  } else {
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(252, 241, 230, 0.75)';
    ctx.stroke();
  }
}

function qrBox(ctx: CanvasRenderingContext2D, qr: QrMatrix, x: number, y: number, box: number) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x, y, box, box, 26);
  ctx.fill();
  const n = qr.length;
  // A quiet zone inside the white box; whole pixels, so no hairline shows.
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

function okay(ctx: CanvasRenderingContext2D, r: Recap, art: Art, qr: QrMatrix | null) {
  scene(ctx, r, art, 7, 1730);
  const o = r.okay;

  if (o) {
    line(ctx, t.okay.question, W / 2, 400, { font: heading(500), size: 54, color: C.paper });
    // Ten people: the pink ones said "okay" while not okay.
    const step = 88;
    const left = W / 2 - step * 4.5;
    for (let i = 0; i < 10; i += 1) figure(ctx, left + i * step, 482, i < o.hide);
    line(ctx, t.okay.stat(o.hide), W / 2, 680, { font: heading(600), size: 124, color: C.sun });
    line(ctx, t.okay.statLine, W / 2, 790, { font: heading(500), size: 52, color: C.paper });
    line(ctx, t.okay.tail, W / 2, 870, { font: note, size: 44, color: C.note });
  } else {
    const [head, tail] = t.okay.tail.split(' ');
    line(ctx, head, W / 2, 640, { font: heading(600), size: 96, color: C.paper });
    line(ctx, tail, W / 2, 760, { font: note, size: 56, color: C.note });
  }

  // The way in: Instagram's link sticker goes in the space below this line.
  line(ctx, t.okay.vent, W / 2, 975, { font: heading(600), size: 50, color: C.paper });
  ctx.strokeStyle = C.sun;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(W / 2 - 16, 1004);
  ctx.lineTo(W / 2, 1018);
  ctx.lineTo(W / 2 + 16, 1004);
  ctx.stroke();

  // ระบาย, in numbers, with the live dot; under it, how fast, when it is true.
  const v = r.vent;
  const fast = v && v.replied >= 5 && v.within3 / v.replied >= 0.5;
  const words = v ? t.okay.chats(v.chats, r.day !== null) : t.okay.promise;
  const py = 1290;
  let size = 38;
  ctx.font = font.heading(500, size);
  let tw = ctx.measureText(words).width;
  if (tw > W - 280) {
    size = Math.floor((size * (W - 280)) / tw);
    ctx.font = font.heading(500, size);
    tw = ctx.measureText(words).width;
  }
  const pw = tw + 112;
  const px = (W - pw) / 2;
  ctx.fillStyle = C.faint;
  ctx.beginPath();
  ctx.roundRect(px, py - 38, pw, 76, 38);
  ctx.fill();
  const dotX = px + 42;
  glow(ctx, dotX, py, 24, [[0, 'rgba(31, 174, 106, 0.6)'], [1, 'rgba(31, 174, 106, 0)']]);
  ctx.fillStyle = C.live;
  ctx.beginPath();
  ctx.arc(dotX, py, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.paper;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(words, dotX + 30, py + 1);
  if (fast) line(ctx, t.okay.fast, W / 2, py + 68, { font: body(500), size: 32, color: C.soft });

  // The QR, for anyone not tapping the sticker.
  if (qr) {
    const box = 230;
    const x = 250;
    const y = 1408;
    qrBox(ctx, qr, x, y, box);
    line(ctx, t.okay.scan, x + box + 40, y + box / 2 - 30, { font: heading(600), size: 48, color: C.paper, align: 'left', max: 380 });
    line(ctx, t.okay.scanSub, x + box + 40, y + box / 2 + 30, { font: body(400), size: 32, color: C.soft, align: 'left', max: 380 });
  }
  line(ctx, cudCare.result.body, W / 2, 1676, { font: body(400), size: 28, color: C.soft });
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
  { id: 'okay', label: t.cards[1], sticker: STICKER, draw: okay },
];

/** Paint one card onto a canvas at the story's size. */
export function paint(canvas: HTMLCanvasElement, r: Recap, card: CardSpec, art: Art, qr: QrMatrix | null) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  card.draw(ctx, r, art, qr);
}
