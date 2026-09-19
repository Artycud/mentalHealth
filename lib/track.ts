/**
 * The browser's side of persistence: tell the server about a run as it happens.
 *
 * THE RULE (BRIEF §3): the student flow never waits on the network. Every call
 * here is fire-and-forget. If one fails it is retried once and then dropped
 * silently, and a student must never see a saving error or a spinner because of
 * logging. Nothing in the quiz awaits anything in this file.
 *
 * What it sends is anonymous by construction: a mode, a viewport bucket, and
 * choice ids from our own content. No name, no identifier, nothing typed (§12).
 */

export type TrackMode = 'checkin' | 'booth';

export interface Tracker {
  /** Begin a run. Safe to call twice: only the first does anything. */
  start(): void;
  /** Record an answer, or a changed one. */
  answer(questionId: string, choiceId: string): void;
  /** Finish the run. The server works out the result itself. */
  complete(): void;
}

const RETRY_AFTER_MS = 800;

/**
 * The viewport bucket, and nothing finer: never a fingerprint (BRIEF §3, §12).
 *
 * The lines are drawn where the real devices fall. Phones run to about 430 wide;
 * every iPad from the mini to the Air and the 10th generation is 744 to 1180
 * across in either orientation; laptops start at 1280. So a landscape iPad at the
 * booth is a "tablet", which is what the report should say. (The largest iPad Pro,
 * at 1366 landscape, lands in "desktop": width alone cannot tell it from a laptop,
 * and a coarser answer is better than sniffing for more.)
 */
function deviceBucket(): 'mobile' | 'tablet' | 'desktop' {
  const w = window.innerWidth;
  return w < 700 ? 'mobile' : w < 1280 ? 'tablet' : 'desktop';
}

/** POST once, and once more if the network or the server had a hiccup. Never throws. */
async function post(url: string, body: unknown): Promise<unknown | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        // Lets the request finish even if the page is being left as it is sent.
        keepalive: true,
      });
      if (response.ok) return await response.json();
      // A 4xx will not improve on a second try (except "busy", which might).
      if (response.status < 500 && response.status !== 429) return null;
    } catch {
      /* offline or dropped: fall through to the retry */
    }
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, RETRY_AFTER_MS));
  }
  return null;
}

/**
 * One tracker per run. Everything after `start` is queued on a single chain, so
 * an answer can never overtake the session it belongs to, and a completion never
 * overtakes the last answer.
 */
export function createTracker(mode: TrackMode): Tracker {
  let sessionId: Promise<string | null> | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  const enqueue = (send: (id: string) => Promise<unknown>) => {
    queue = queue
      .then(async () => {
        const id = await sessionId;
        if (id) await send(id);
      })
      .catch(() => {
        /* dropped, by design */
      });
  };

  return {
    start() {
      if (sessionId) return;
      sessionId = post('/api/session', { mode, device: deviceBucket() }).then(
        (result) => (result as { id?: string } | null)?.id ?? null,
      );
    },
    answer(questionId, choiceId) {
      enqueue((id) => post(`/api/session/${id}/answer`, { questionId, choiceId }));
    },
    complete() {
      enqueue((id) => post(`/api/session/${id}/complete`, {}));
    },
  };
}
