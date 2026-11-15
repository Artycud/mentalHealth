import type { ReactNode } from 'react';

import { PerfProbe } from '@/components/booth/PerfProbe';

/** The booth screens. The probe stays put while the kiosk moves between its screens;
    it shows only when the address ends in ?perf (components/booth/PerfProbe). */
export default function BoothLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PerfProbe />
    </>
  );
}
