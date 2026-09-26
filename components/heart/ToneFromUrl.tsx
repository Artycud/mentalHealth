'use client';

import { useEffect } from 'react';

import { TONES, type Tone } from '@/lib/tone';

const KEY = 'cud-tone-preview';

/**
 * Lets the council compare the two tones on a real phone: `?tone=normal` or
 * `?tone=warm` on any page switches it for this tab (sessionStorage, a
 * per-viewer preview only; nothing is sent anywhere). Without it, the tone the
 * server set on <html> from lib/tone.ts stands.
 */
export function ToneFromUrl() {
  useEffect(() => {
    try {
      const asked = new URLSearchParams(window.location.search).get('tone') as Tone | null;
      if (asked && TONES.includes(asked)) sessionStorage.setItem(KEY, asked);
      const tone = sessionStorage.getItem(KEY) as Tone | null;
      if (tone && TONES.includes(tone)) document.documentElement.dataset.tone = tone;
    } catch {
      // Storage blocked (private mode): the default tone simply stays.
    }
  }, []);
  return null;
}
