import { cudCare } from '@/content/th/common';
import { recap as t } from '@/content/th/recap';
import type { QrMatrix } from '@/lib/qr';
import type { Recap } from '@/lib/recap';

/**
 * The recap's two story cards, drawn on a canvas at Instagram's story size, so
 * what the admin sees is exactly the image that is saved or shared. The browser
 * shapes the Thai, so vowels and tone marks sit right.
 *
 * The look is the website's: the night with its stars and the moon in the
 * corner, the river only at the foot, and everything to read on taped, slightly
 * tilted slips in ink (marigold for the check-up, paper, pink for ระบาย), as on
 * the home page. The art is the site's own (RecapStudio loads it).
 *
 * Instagram covers the top ~200px (the profile line) and the bottom ~250px (the
 * reply bar) of a story, so nothing to read sits there.
 */

export const W = 1080;
export const H = 1920;

/** Where the admin puts Instagram's link sticker on card 2 (outlined on the page only). */
export const STICKER = { x: 150, y: 1150, w: 780, h: 200 };

const C = {
  ink: '#1B2B5E',
  inkSoft: 'rgba(27, 43, 94, 0.72)',
  pink: '#FF48B0',
  pinkInk: '#6b2a4a',
  blue: '#0078BF',
  sun: '#FFB511',
  paper: '#FCF1E6',
  pinkTint: '#FFE3F0',
  note: '#FFB8DE',
  soft: 'rgba(252, 241, 230, 0.78)',
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
  o: { font: Face; size: number; color: string; max?: number; align?: CanvasTextAlign },
): number {
  let size = o.size;
  ctx.font = o.font(size);
  const max = o.max ?? W - 160;
  let width = ctx.measureText(str).width;
  if (width > max) {
    size = Math.floor((size * max) / width);
    ctx.font = o.font(size);
    width = ctx.measureText(str).width;
  }
  ctx.fillStyle = o.color;
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
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

/** A booth flower on a disc (cream on the night, white on a slip) with the dotted ring. */
function plated(ctx: CanvasRenderingContext2D, art: Art, id: string, x: number, y: number, r: number, o: { lit?: boolean; plate?: string } = {}) {
  if (o.lit) glow(ctx, x, y, r * 2, [[0, 'rgba(255, 181, 17, 0.4)'], [0.5, 'rgba(255, 181, 17, 0.12)'], [1, 'rgba(255, 181, 17, 0)']]);
  ctx.save();
  ctx.shadowColor = 'rgba(4, 14, 40, 0.3)';
  ctx.shadowBlur = r * 0.2;
  ctx.shadowOffsetY = r * 0.05;
  ctx.fillStyle = o.plate ?? C.paper;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const img = art.flowers[id];
  if (img) ctx.drawImage(img, x - r * 0.98, y - r * 0.98, r * 1.96, r * 1.96);
  ctx.save();
  ctx.setLineDash([Math.max(2, r * 0.035), Math.max(4, r * 0.075)]);
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, r * 0.03);
  ctx.strokeStyle = C.ink;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.93, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** The poster's moon in its halo (components/festival/loykrathong/Halo.tsx). */
function moon(ctx: CanvasRenderingContext2D, art: Art, x: number, y: number, r: number) {
  glow(ctx, x, y, r * 3.4, [[0, 'rgba(214, 228, 255, 0.24)'], [0.4, 'rgba(170, 196, 240, 0.11)'], [1, 'rgba(140, 170, 225, 0)']]);
  glow(ctx, x, y, r * 1.8, [[0, 'rgba(255, 244, 210, 0.4)'], [1, 'rgba(255, 228, 170, 0)']]);
  if (!art.moon) return;
  const s = r * 2 * 1.26;
  ctx.drawImage(art.moon, x - s / 2, y - s / 2, s, s);
}

/**
 * A slip like the home's: a soft shadow, a tilt, a strip of tape, and whatever
 * `draw` puts on it in the slip's own coordinates (0,0 at its top left).
 */
function slip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  o: { fill: string; tilt: number; tape?: boolean; radii?: number[] },
  draw: () => void,
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(o.tilt);
  ctx.translate(-w / 2, -h / 2);
  ctx.save();
  ctx.shadowColor = 'rgba(2, 10, 30, 0.55)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = o.fill;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, o.radii ?? [26]);
  ctx.fill();
  ctx.restore();
  draw();
  if (o.tape !== false) {
    ctx.save();
    ctx.translate(w / 2, 0);
    ctx.rotate(-0.04);
    ctx.fillStyle = 'rgba(252, 241, 230, 0.78)';
    ctx.fillRect(-80, -22, 160, 44);
    ctx.restore();
  }
  ctx.restore();
}

// ---- the night ----

/** The sky and stars, the moon in the corner, the river at the foot, and the header. */
function scene(ctx: CanvasRenderingContext2D, r: Recap, art: Art, seed: number, riverTop: number) {
  // The booth's sky (app/festivals/loykrathong.css --fest-sky), a step darker like the kiosk.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#12345f');
  sky.addColorStop(0.35, '#0e2e59');
  sky.addColorStop(0.7, '#0a2853');
  sky.addColorStop(1, '#0d2d59');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const rand = seeded(seed);
  // One soft glitter ribbon across the top (Sky.tsx), and stars.
  {
    const at = (x: number) => 330 + 60 * Math.sin((x / W) * Math.PI * 1.4 + 0.4);
    const g = ctx.createLinearGradient(0, 160, 0, 500);
    g.addColorStop(0, 'rgba(159, 182, 230, 0)');
    g.addColorStop(0.5, 'rgba(159, 182, 230, 0.1)');
    g.addColorStop(1, 'rgba(159, 182, 230, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, at(x) - 110);
    for (let x = W; x >= 0; x -= 30) ctx.lineTo(x, at(x) + 110);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 130; i += 1) {
    const x = rand() * W;
    const y = rand() * riverTop * 0.97;
    const big = rand() < 0.07;
    if (big) glow(ctx, x, y, 12, [[0, 'rgba(255, 246, 220, 0.5)'], [1, 'rgba(255, 246, 220, 0)']]);
    ctx.fillStyle = `rgba(255, 246, 220, ${0.35 + rand() * 0.55})`;
    ctx.beginPath();
    ctx.arc(x, y, big ? 3 : 0.9 + rand() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // The moon in the top corner, as on the home page.
  moon(ctx, art, W - 120, 300, 62);

  // Wat Arun on the far bank, then the river (River.tsx) with a few lit flowers.
  if (art.wat) {
    const h = 170;
    const w = (art.wat.width / art.wat.height) * h;
    ctx.drawImage(art.wat, W - w + 70, riverTop - h + 38, w, h);
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
  wave(riverTop, 10, 2, 0.6, C.far);
  wave(riverTop + 44, 12, 2.5, 2.1, C.near);
  const ids = r.flowers.filter((f) => f.count > 0).map((f) => f.id);
  const pick = ids.length ? ids : r.flowers.map((f) => f.id);
  for (let i = 0; i < 4; i += 1) {
    const x = (W / 4) * (i + 0.5) + (rand() - 0.5) * 40;
    plated(ctx, art, pick[i % pick.length], x, riverTop + 110 + (i % 2) * 28, 38, { lit: true });
  }

  // The wordmark on a paper tag, as at the top of the home page; then which booth and day.
  ctx.font = font.heading(500, 34);
  const tw = ctx.measureText(t.brand).width;
  const pw = tw + 120;
  const px = (W - pw) / 2;
  ctx.fillStyle = 'rgba(252, 241, 230, 0.94)';
  ctx.beginPath();
  ctx.roundRect(px, 196, pw, 68, 14);
  ctx.fill();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = C.pink;
  ctx.beginPath();
  ctx.arc(px + 40, 230, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.blue;
  ctx.beginPath();
  ctx.arc(px + 60, 230, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  line(ctx, t.brand, px + 90, 231, { font: heading(500), size: 34, color: C.ink, align: 'left' });
  line(ctx, t.day(r.festivalName, r.dateLabel), W / 2, 312, { font: note, size: 38, color: C.note });

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
  scene(ctx, r, art, 3, 1720);
  const oneDay = r.day !== null;

  const [top, ...rest] = r.feelings;
  // On a quiet day there is less to show: keep what there is centred between the header and the water.
  const tall =
    300 + (top ? 290 + rest.length * 78 + 70 : 0) + (r.quotes.length ? 40 + r.quotes.length * 160 + 50 : 0) + (r.topic ? 60 : 0);
  const dy = Math.min(140, Math.max(0, (1320 - tall) / 2));

  // The count, big, as the home's headline.
  const digits = String(r.players);
  line(ctx, digits, W / 2, 440 + dy, { font: heading(600), size: 190, color: C.sun, max: 600 });
  line(ctx, t.today.players(oneDay), W / 2, 570 + dy, { font: heading(500), size: 48, color: C.paper });

  // The marigold slip: how most hearts are, the top one with its flower, the next two as bars.
  let y = 660 + dy;
  if (top) {
    const h = 290 + rest.length * 78;
    slip(ctx, 70, y, 940, h, { fill: C.sun, tilt: -0.012 }, () => {
      line(ctx, t.today.feelings, 60, 70, { font: heading(500), size: 34, color: C.inkSoft, align: 'left' });
      line(ctx, top.word, 60, 148, { font: heading(600), size: 82, color: C.ink, align: 'left', max: 560 });
      line(ctx, t.today.share(top.pct), 60, 226, { font: heading(500), size: 36, color: C.ink, align: 'left' });
      plated(ctx, art, top.id, 940 - 170, 158, 118, { plate: '#ffffff' });
      rest.forEach((f, i) => {
        const ry = 318 + i * 78;
        plated(ctx, art, f.id, 88, ry, 28, { plate: '#ffffff' });
        line(ctx, f.word, 134, ry + 1, { font: heading(500), size: 34, color: C.ink, align: 'left', max: 250 });
        const bx = 400;
        const bw = 400;
        ctx.fillStyle = 'rgba(27, 43, 94, 0.16)';
        ctx.beginPath();
        ctx.roundRect(bx, ry - 9, bw, 18, 9);
        ctx.fill();
        ctx.fillStyle = C.ink;
        ctx.beginPath();
        ctx.roundRect(bx, ry - 9, Math.max(18, (bw * f.pct) / Math.max(1, top.pct)), 18, 9);
        ctx.fill();
        line(ctx, `${f.pct}%`, 880, ry + 1, { font: heading(600), size: 34, color: C.ink, align: 'right' });
      });
    });
    y += h + 70;
  }

  // The paper slip: what they would float away, and what they would change.
  if (r.quotes.length) {
    const block = 160;
    const h = 40 + r.quotes.length * block;
    slip(ctx, 90, y, 900, h, { fill: C.paper, tilt: 0.01 }, () => {
      r.quotes.forEach((q, i) => {
        const by = 40 + i * block;
        if (i > 0) {
          ctx.save();
          ctx.setLineDash([6, 10]);
          ctx.strokeStyle = 'rgba(27, 43, 94, 0.25)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(60, by - 4);
          ctx.lineTo(840, by - 4);
          ctx.stroke();
          ctx.restore();
        }
        line(ctx, t.today.quotes[q.id] ?? '', 60, by + 40, { font: heading(400), size: 32, color: C.inkSoft, align: 'left', max: 600 });
        line(ctx, `${q.pct}%`, 840, by + 40, { font: heading(600), size: 40, color: C.pink, align: 'right' });
        line(ctx, `“${q.label}”`, 60, by + 106, { font: heading(600), size: 54, color: C.ink, align: 'left', max: 780 });
      });
    });
    y += h + 50;
  }

  // From the check-up on the web, when there are enough: one quiet line.
  if (r.topic && y < 1640) line(ctx, t.today.topic(r.topic.name), W / 2, y + 10, { font: heading(400), size: 34, color: C.soft });
}

// ---- card 2: hearts carrying something, and ระบาย ----

function figure(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean) {
  if (on) glow(ctx, x, y + 26, 58, [[0, 'rgba(255, 72, 176, 0.32)'], [1, 'rgba(255, 72, 176, 0)']]);
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.moveTo(x - 25, y + 58);
  ctx.lineTo(x - 25, y + 45);
  ctx.arc(x, y + 45, 25, Math.PI, 0);
  ctx.lineTo(x + 25, y + 58);
  ctx.closePath();
  if (on) {
    ctx.fillStyle = C.pink;
    ctx.fill();
  } else {
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(252, 241, 230, 0.7)';
    ctx.stroke();
  }
}

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
  ctx.roundRect(x, y, box, box, 20);
  ctx.fill();
  const n = qr.length;
  const cell = Math.floor((box - 24) / n);
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
  scene(ctx, r, art, 7, 1740);
  const hv = r.heavy;

  if (hv) {
    // Ten people: the pink ones got a flower of worry, sadness or anger.
    const step = 86;
    const left = W / 2 - step * 4.5;
    for (let i = 0; i < 10; i += 1) figure(ctx, left + i * step, 400, i < hv.tenths);
    line(ctx, t.heavy.stat(hv.tenths), W / 2, 560, { font: heading(600), size: 120, color: C.sun });
    line(ctx, t.heavy.line, W / 2, 666, { font: heading(500), size: 48, color: C.paper });
    line(ctx, t.heavy.which, W / 2, 726, { font: body(400), size: 30, color: C.soft });
  }
  line(ctx, t.heavy.tail, W / 2, 806, { font: note, size: 44, color: C.note });

  // The pink slip, as the home's ระบาย slip: the way in, the sticker, the QR.
  const sx = 60;
  const sy = 880;
  const sw = 960;
  const sh = 790;
  slip(ctx, sx, sy, sw, sh, { fill: C.pinkTint, tilt: 0.006, radii: [26, 26, 8, 26] }, () => {
    line(ctx, t.vent.title, 56, 82, { font: heading(600), size: 62, color: C.ink, align: 'left', max: 700 });
    line(ctx, t.vent.sub, 56, 150, { font: body(400), size: 32, color: C.pinkInk, align: 'left', max: 700 });
    heartBubble(ctx, sw - 110, 110, 62);

    // The numbers, with the live dot.
    const v = r.vent;
    const words = v
      ? [t.vent.chats(v.chats, r.day !== null), v.medianMin !== null ? t.vent.reply(v.medianMin) : ''].filter(Boolean).join(' · ')
      : t.vent.promise;
    glow(ctx, 70, 222, 22, [[0, 'rgba(31, 174, 106, 0.55)'], [1, 'rgba(31, 174, 106, 0)']]);
    ctx.fillStyle = C.live;
    ctx.beginPath();
    ctx.arc(70, 222, 9, 0, Math.PI * 2);
    ctx.fill();
    line(ctx, words, 96, 223, { font: body(500), size: 32, color: C.ink, align: 'left', max: sw - 150 });

    // The home's message bar. Instagram's link sticker goes over it (STICKER);
    // without one it still says "write here".
    const by = 300;
    const bh = 124;
    ctx.save();
    ctx.shadowColor = 'rgba(255, 72, 176, 0.35)';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(56, by, sw - 112, bh, bh / 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 72, 176, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(56, by, sw - 112, bh, bh / 2);
    ctx.stroke();
    line(ctx, 'เรื่องเรียน… เพื่อน… ที่บ้าน…', 110, by + bh / 2 + 1, { font: body(400), size: 34, color: 'rgba(107, 42, 74, 0.5)', align: 'left', max: 560 });
    const bx = sw - 56 - bh / 2;
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.arc(bx, by + bh / 2, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.paper;
    ctx.beginPath();
    ctx.moveTo(bx - 18, by + bh / 2 - 16);
    ctx.lineTo(bx + 22, by + bh / 2);
    ctx.lineTo(bx - 18, by + bh / 2 + 16);
    ctx.lineTo(bx - 10, by + bh / 2);
    ctx.closePath();
    ctx.fill();

    if (qr) {
      const box = 180;
      const qy = 500;
      qrBox(ctx, qr, 56, qy, box);
      line(ctx, t.vent.scan, 56 + box + 36, qy + 60, { font: heading(600), size: 46, color: C.ink, align: 'left', max: 560 });
      line(ctx, t.vent.scanSub, 56 + box + 36, qy + 120, { font: body(400), size: 32, color: C.pinkInk, align: 'left', max: 560 });
    }
    line(ctx, cudCare.result.body, sw / 2, sh - 44, { font: body(400), size: 27, color: C.pinkInk, max: sw - 100 });
  });
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
