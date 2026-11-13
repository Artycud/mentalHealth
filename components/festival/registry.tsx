import type { ComponentType, ReactNode } from 'react';

import type { FestivalId } from '@/lib/types';

import { LoyKrathongHero } from './loykrathong/Hero';
import { LoyKrathongIcon } from './loykrathong/Icon';
import { LoyKrathongMoon } from './loykrathong/Moon';
import { LoyKrathongOffering } from './loykrathong/Offering';
import { LoyKrathongRiver } from './loykrathong/River';
import { LoyKrathongSky } from './loykrathong/Sky';

/**
 * The festival layer's registry: what each festival draws, by slot.
 *
 * A festival is a scene on top of the base identity, and this is the only place
 * that knows which festival owns which scene. Everything else asks for a slot and
 * gets either that festival's art or nothing, so a screen with no festival (the
 * private check-in, a booth that is closed, a festival with no art yet) draws no
 * scene at all, without any of them having to check.
 *
 * To add a festival: a folder next to loykrathong/ with the same slots, a token file
 * in app/festivals/, and one line here. Nothing in the base changes.
 */

interface Pack {
  /** The small mark beside the booth's name on the home page. */
  Icon?: ComponentType;
  /** Water (or its equivalent) for the TV's bottom band and the kiosk's idle screen;
   *  `bank` adds what stands on the far side of it. */
  River?: ComponentType<{ moon?: boolean; bank?: boolean }>;
  /** What fills the booth screens' sky, behind everything: texture, and on request
   *  the moon and things rising through it. */
  Sky?: ComponentType<{ moon?: boolean; lanterns?: boolean }>;
  /** The kiosk's idle picture, standing on the water. */
  Hero?: ComponentType;
  /** The festival's moon, laid over a round thing the screen already has. */
  Moon?: ComponentType;
  /** How the result's flower is handed back (it is passed as children). */
  Offering?: ComponentType<{ children: ReactNode }>;
}

const packs: Partial<Record<FestivalId, Pack>> = {
  loykrathong: {
    Icon: LoyKrathongIcon,
    River: LoyKrathongRiver,
    Sky: LoyKrathongSky,
    Hero: LoyKrathongHero,
    Moon: LoyKrathongMoon,
    Offering: LoyKrathongOffering,
  },
};

type Which = FestivalId | 'none' | undefined;

const pack = (id: Which) => (id && id !== 'none' ? packs[id] : undefined);

/** Whether the festival draws its own idle picture (else the screen keeps its own). */
export function hasFestivalHero(id: Which): boolean {
  return Boolean(pack(id)?.Hero);
}

export function FestivalSky({ id, moon = false, lanterns = false }: { id: Which; moon?: boolean; lanterns?: boolean }) {
  const Sky = pack(id)?.Sky;
  return Sky ? <Sky moon={moon} lanterns={lanterns} /> : null;
}

export function FestivalHero({ id }: { id: Which }) {
  const Hero = pack(id)?.Hero;
  return Hero ? <Hero /> : null;
}

export function FestivalMoon({ id }: { id: Which }) {
  const Moon = pack(id)?.Moon;
  return Moon ? <Moon /> : null;
}

/** The result's flower in the festival's setting, or just the flower. */
export function FestivalOffering({ id, children }: { id: Which; children: ReactNode }) {
  const Offering = pack(id)?.Offering;
  return Offering ? <Offering>{children}</Offering> : <>{children}</>;
}

export function FestivalIcon({ id }: { id: Which }) {
  const Icon = id && id !== 'none' ? packs[id]?.Icon : undefined;
  return Icon ? <Icon /> : null;
}

export function FestivalRiver({ id, moon = true, bank = false }: { id: Which; moon?: boolean; bank?: boolean }) {
  const River = pack(id)?.River;
  return River ? <River moon={moon} bank={bank} /> : null;
}
