'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { recap as t } from '@/content/th/recap';
import { encodeQr } from '@/lib/qr';
import type { Recap } from '@/lib/recap';

import { cardsFor, loadFonts, paint, SIZES, type Format } from './draw';
import styles from './recap.module.css';

/**
 * The recap cards, drawn in the browser and ready to post: "แชร์" opens the phone's
 * share sheet (Instagram is in it), "บันทึกรูป" downloads the PNG. Every card is the
 * exact image that leaves, at Instagram's size.
 */
export function RecapStudio({ data, qrUrl }: { data: Recap; qrUrl: string }) {
  const [format, setFormat] = useState<Format>('story');
  const [ready, setReady] = useState(false);
  const cards = useMemo(() => cardsFor(data), [data]);
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
      await loadFonts();
      if (cancelled) return;
      cards.forEach((card, i) => {
        const canvas = canvases.current[i];
        if (canvas) paint(canvas, format, data, card, qr, i + 3);
      });
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [cards, format, data, qr]);

  const fileFor = (i: number) => `recap-${data.festival}-${data.day ?? 'all'}-${i + 1}-${cards[i].id}-${format}.png`;

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

  const { w, h } = SIZES[format];

  return (
    <>
      <div className={styles.controls} role="radiogroup" aria-label={t.formatLabel}>
        <span className={styles.label}>{t.formatLabel}</span>
        {(['story', 'post'] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={format === f}
            className={`${styles.toggle} ${format === f ? styles.toggleOn : ''}`}
            onClick={() => setFormat(f)}
          >
            {f === 'story' ? t.story : t.post}
          </button>
        ))}
      </div>

      {data.sample && <p className={styles.sample}>{t.sample}</p>}

      <div className={styles.grid} data-format={format}>
        {cards.map((card, i) => (
          <figure key={card.id} className={styles.card}>
            <canvas
              ref={(el) => {
                canvases.current[i] = el;
              }}
              width={w}
              height={h}
              className={styles.canvas}
              style={{ aspectRatio: `${w} / ${h}` }}
              aria-label={card.label}
            />
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
    </>
  );
}
