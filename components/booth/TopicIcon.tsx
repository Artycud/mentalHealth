import type { TopicIcon as Icon } from '@/content/th/booth';

/**
 * A picture for each "what fills your head" topic on the kiosk: a filled shape in
 * one of the booth's inks with a navy line over it, read before the word is.
 * Drawn for paper (the kiosk's answer tiles).
 */
export function TopicIcon({ icon }: { icon: Icon }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      {SHAPES[icon]}
    </svg>
  );
}

const PINK = 'var(--riso-pink)';
const BLUE = 'var(--riso-blue)';
const SUN = 'var(--sunflower)';

const SHAPES: Record<Icon, React.ReactNode> = {
  study: (
    <>
      <path d="M6 12 C14 8 20 9 24 13 C28 9 34 8 42 12 V38 C34 34 28 35 24 39 C20 35 14 34 6 38 Z" fill={BLUE} fillOpacity="0.85" />
      <path d="M24 13 V39" />
    </>
  ),
  friends: (
    <>
      <circle cx="17" cy="17" r="6" fill={SUN} />
      <circle cx="31" cy="17" r="6" fill={PINK} fillOpacity="0.9" />
      <path d="M6 38 C6 29 28 29 28 38" />
      <path d="M20 38 C20 29 42 29 42 38" />
    </>
  ),
  family: (
    <>
      <path d="M8 22 L24 9 L40 22 V40 H8 Z" fill={SUN} fillOpacity="0.9" />
      <path d="M20 40 V29 H28 V40" />
    </>
  ),
  love: <path d="M24 40 C10 30 6 22 10 15 C14 9 21 10 24 16 C27 10 34 9 38 15 C42 22 38 30 24 40 Z" fill={PINK} />,
  sleep: (
    <>
      <path d="M28 8 A16 16 0 1 0 40 32 A13 13 0 0 1 28 8 Z" fill={BLUE} fillOpacity="0.85" />
      <path d="M34 8 H41 L34 15 H41" strokeWidth="2.2" />
    </>
  ),
  social: (
    <>
      <rect x="14" y="5" width="20" height="38" rx="5" fill={PINK} fillOpacity="0.85" />
      <path d="M21 37 H27" />
      <circle cx="35" cy="12" r="5" fill={SUN} />
    </>
  ),
  future: (
    <path
      d="M24 6 L29 18 L42 19 L32 27 L35 40 L24 33 L13 40 L16 27 L6 19 L19 18 Z"
      fill={SUN}
    />
  ),
  self: (
    <>
      <circle cx="24" cy="16" r="8" fill={BLUE} fillOpacity="0.85" />
      <path d="M9 41 C9 29 39 29 39 41" />
    </>
  ),
  none: (
    <>
      <circle cx="24" cy="24" r="17" fill={SUN} fillOpacity="0.9" />
      <circle cx="18" cy="21" r="1.6" fill="var(--ink)" />
      <circle cx="30" cy="21" r="1.6" fill="var(--ink)" />
      <path d="M17 29 C20 33 28 33 31 29" />
    </>
  ),
};
