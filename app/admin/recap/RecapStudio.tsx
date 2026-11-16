'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { FlowerPortrait } from '@/components/booth/FlowerPortrait';
import moonArt from '@/components/festival/loykrathong/art/moon.webp';
import watArt from '@/components/festival/loykrathong/art/wat.webp';
import { loykrathongFlowers } from '@/content/th/booth';
import { recap as t } from '@/content/th/recap';
import { encodeQr } from '@/lib/qr';
import type { Recap } from '@/lib/recap';

import { CARDS, H, loadFonts, paint, W, type Art } from './draw';
import styles from './recap.module.css';

const image = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

/**
 * The booth's art for the canvas: the moon and Wat Arun as they are, and each
 * flower's drawing turned into an image. The flowers are drawn into a detached
 * element in the browser only (never server-rendered: their decimals round
 * differently on the server, which would not hydrate).
 */
async function loadArt(): Promise<Art> {
  const flowers: Record<string, HTMLImageElement> = {};
  const host = document.createElement('div');
  const root = createRoot(host);
  root.render(
    loykrathongFlowers.map((f) => (
      <span key={f.id} data-flower={f.id}>
        <FlowerPortrait id={f.id} size={320} />
      </span>
    )),
  );
  // A root renders on its own schedule: wait for it (a few frames at most).
  for (let i = 0; i < 20 && !host.querySelector('svg'); i += 1) await new Promise((r) => setTimeout(r, 16));
  const svgs = [...host.querySelectorAll<SVGSVGElement>('[data-flower] svg')];
  const [moon, wat, ...drawn] = await Promise.all([
    image(moonArt.src),
    image(watArt.src),
    ...svgs.map((svg) => image(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`)),
  ]);
  svgs.forEach((svg, i) => {
    const id = svg.parentElement?.dataset.flower;
    const img = drawn[i];
    if (id && img) flowers[id] = img;
  });
  root.unmount();
  return { moon, wat, flowers };
}

/**
 * The recap's story cards, drawn in the browser and ready to post: "แชร์" opens the
 * phone's share sheet (Instagram is in it), "บันทึกรูป" downloads the PNG. Every
 * card is the exact image that leaves. The dotted box on card 2 marks where the
 * link sticker goes; it is drawn over the canvas, so it never leaves with it.
 */
export function RecapStudio({ data, qrUrl }: { data: Recap; qrUrl: string }) {
  const [ready, setReady] = useState(false);
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const qr = useMemo(() => {
    try {
      return encodeQr(qrUrl);
    } catch {
      return null;
    }
  }, [qrUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [art] = await Promise.all([loadArt(), loadFonts()]);
      if (cancelled) return;
      CARDS.forEach((card, i) => {
        const canvas = canvases.current[i];
        if (canvas) paint(canvas, data, card, art, qr);
      });
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [data, qr]);

  const fileFor = (i: number) => `recap-${data.festival}-${data.day ?? 'all'}-${i + 1}-${CARDS[i].id}.png`;

  const blobOf = (i: number) =>
    new Promise<Blob | null>((resolve) => canvases.current[i]?.toBlob(resolve, 'image/png') ?? resolve(null));

  async function save(i: number) {
    const blob = await blobOf(i);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileFor(i);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function share(i: number) {
    const blob = await blobOf(i);
    if (!blob) return;
    const file = new File([blob], fileFor(i), { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
      } catch {
        /* the person closed the share sheet */
      }
    } else {
      await save(i);
    }
  }

  const pct = (n: number, of: number) => `${(n / of) * 100}%`;

  return (
    <>
      {data.sample && <p className={styles.sample}>{t.sample}</p>}

      <div className={styles.grid}>
        {CARDS.map((card, i) => (
          <figure key={card.id} className={styles.card}>
            <div className={styles.frame}>
              <canvas
                ref={(el) => {
                  canvases.current[i] = el;
                }}
                width={W}
                height={H}
                className={styles.canvas}
                style={{ aspectRatio: `${W} / ${H}` }}
                aria-label={card.label}
              />
              {card.sticker && (
                <span
                  className={styles.sticker}
                  style={{
                    left: pct(card.sticker.x, W),
                    top: pct(card.sticker.y, H),
                    width: pct(card.sticker.w, W),
                    height: pct(card.sticker.h, H),
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
            <figcaption className={styles.caption}>
              <span className={styles.cardName}>
                {i + 1}. {card.label}
              </span>
              <span className={styles.actions}>
                <button type="button" className={styles.share} disabled={!ready} onClick={() => share(i)}>
                  {t.share}
                </button>
                <button type="button" className={styles.save} disabled={!ready} onClick={() => save(i)}>
                  {t.save}
                </button>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      {!ready && <p className={styles.loading}>{t.loading}</p>}
      <p className={styles.loading}>{t.sticker}</p>
    </>
  );
}
