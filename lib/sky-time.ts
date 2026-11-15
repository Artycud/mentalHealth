/**
 * The student pages' sky follows the time of day in Bangkok: morning, day, dusk
 * or night. It is set as `data-time` on <html>, so every page's colours can read
 * it and it survives moving between pages.
 *
 * It must be set before the first paint (or the sky would flash from one mood to
 * another), and some pages are built ahead of time, so the server cannot choose:
 * a few lines run in <head> (`SKY_TIME_SCRIPT`, from app/layout.tsx), and
 * components/heart/SkyClock keeps it right while a page stays open.
 *
 * `?sky=night` (or morning, day, dusk) forces a mood, for looking at each one.
 */

export const SKY_TIMES = ['morning', 'day', 'dusk', 'night'] as const;
export type SkyTime = (typeof SKY_TIMES)[number];

/** Sunrise and sunset are both a little after 6 in Bangkok, all year. */
export function skyTimeFor(hour: number): SkyTime {
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}

/** Bangkok's hour now, 0–23. */
export const bangkokHour = () =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));

/** The mood a `?sky=` in the address asks for, if any. */
export function askedSkyTime(search: string): SkyTime | undefined {
  const q = new URLSearchParams(search).get('sky');
  return SKY_TIMES.find((t) => t === q);
}

/** What `data-time` should be right now. */
export const skyTimeNow = (search = ''): SkyTime => askedSkyTime(search) ?? skyTimeFor(bangkokHour());

/** Set (sessionStorage) once the home's opening scene has played: a return
    visit in the same tab starts on the home (components/landing/IntroStory). */
export const INTRO_SEEN_KEY = 'cud-intro-seen';

/** skyTimeNow() as plain script for <head>, run before the first paint, and the
    intro's "already seen". Written out by hand (a minifier renames functions, so
    their source cannot be reused): keep the hours the same as skyTimeFor above. */
export const SKY_TIME_SCRIPT = `(function(){var d=document.documentElement;try{var q=/[?&]sky=(morning|day|dusk|night)(&|$)/.exec(location.search),h=+new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',hour:'2-digit',hourCycle:'h23'}).format(new Date());d.dataset.time=q?q[1]:h>=5&&h<10?'morning':h>=10&&h<17?'day':h>=17&&h<19?'dusk':'night'}catch(e){}try{if(sessionStorage.getItem('${INTRO_SEEN_KEY}'))d.dataset.intro='done'}catch(e){}})();`;
