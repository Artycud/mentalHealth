import type { ComponentType } from 'react';

import type { FestivalId } from '@/lib/types';

import { LoyKrathongIcon } from './loykrathong/Icon';
import { LoyKrathongRiver } from './loykrathong/River';

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
  /** Water (or its equivalent) for the TV's bottom band and the kiosk's idle screen. */
  River?: ComponentType<{ moon?: boolean }>;
}

const packs: Partial<Record<FestivalId, Pack>> = {
  loykrathong: { Icon: LoyKrathongIcon, River: LoyKrathongRiver },
};

type Which = FestivalId | 'none' | undefined;

export function FestivalIcon({ id }: { id: Which }) {
  const Icon = id && id !== 'none' ? packs[id]?.Icon : undefined;
  return Icon ? <Icon /> : null;
}

export function FestivalRiver({ id, moon = true }: { id: Which; moon?: boolean }) {
  const River = id && id !== 'none' ? packs[id]?.River : undefined;
  return River ? <River moon={moon} /> : null;
}
