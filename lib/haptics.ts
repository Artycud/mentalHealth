/**
 * Tiny taps under the finger, on phones that have them (Android Chrome; iOS
 * Safari has no vibration API and simply does nothing). Never under reduced
 * motion, and only ever called from a real touch, so it never buzzes on its own.
 */

const PATTERN = {
  /** A button or card pressed. */
  tap: 8,
  /** A check-up step done, or a notch crossed while dragging. */
  step: 12,
  /** The result arrived, a message was sent. */
  done: [10, 40, 16],
} as const;

export type Haptic = keyof typeof PATTERN;

export function haptic(kind: Haptic = 'tap') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    navigator.vibrate(PATTERN[kind] as number | number[]);
  } catch {
    // Some browsers throw without a user gesture; a missing tap is fine.
  }
}
