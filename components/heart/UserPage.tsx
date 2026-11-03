import { ViewTransition, type ReactNode } from 'react';

import { Press } from './Press';
import { Sky } from './Sky';
import palette from './palette.module.css';

/**
 * The frame every User Mode page (home, check-up, VENT) sits in: the shared sky,
 * the palette, press feedback, and the slide between pages.
 *
 * The sky stays outside the transition, so only the content slides: forward
 * (deeper into the site) comes in from the right, back from the left. Links say
 * which they are with `transitionTypes`; a browser back/forward has no type and
 * simply swaps. See node_modules/next/dist/docs/01-app/02-guides/view-transitions.md.
 */
export function UserPage({ children }: { children: ReactNode }) {
  return (
    <main data-home="heart" className={palette.palette}>
      <Sky />
      <Press />
      <ViewTransition
        enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
        exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
        default="none"
      >
        <div>{children}</div>
      </ViewTransition>
    </main>
  );
}
