/**
 * The first words a student types into the home's VENT bar, carried to /vent so
 * the conversation starts the moment the page opens (components/landing/VentStart
 * → components/vent/Vent).
 *
 * Held in memory only, for the length of one client-side navigation: never in
 * the address (it would sit in the browser's history and the server's logs) and
 * never in storage, so VENT's promise that nothing is kept still holds. A reload
 * simply loses it.
 */

let pending: string | undefined;

export const handOff = (text: string) => {
  pending = text;
};

/** What was handed over, without taking it (safe to call more than once). */
export const peekHandOff = () => pending;

export const clearHandOff = () => {
  pending = undefined;
};
