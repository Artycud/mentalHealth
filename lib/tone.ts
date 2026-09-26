/**
 * The User Mode look comes in two tones:
 *
 *   warm    the light pink sky with a soft apricot warmth laid over it
 *   normal  the light pink sky as it was designed, with nothing added
 *
 * To go back to normal for everyone, change DEFAULT_TONE below; that is the
 * whole revert. To compare without changing anything, open any student page
 * with `?tone=normal` or `?tone=warm`: it sticks for that browser tab only.
 *
 * The warmth itself is one rule in app/globals.css (search "Warm tone"). It only
 * ever touches the User Mode pages; booth screens keep their own identity.
 */
export type Tone = 'warm' | 'normal';

export const DEFAULT_TONE: Tone = 'warm';

export const TONES: readonly Tone[] = ['warm', 'normal'];
