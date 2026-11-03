'use client';

import { useRef, type ReactNode } from 'react';

import { useInView } from './useInView';

/**
 * A box whose looping CSS animations pause while it is off screen (it carries
 * `data-live`, see app/globals.css). For server components with little drawings
 * that loop forever, like the home's "ทุกรอบมี".
 */
export function Live({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useInView(ref, '0px');
  return (
    <div ref={ref} className={className} data-live="false">
      {children}
    </div>
  );
}
