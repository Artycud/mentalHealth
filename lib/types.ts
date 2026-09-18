/**
 * Domain types shared by the content files, the scoring logic and the API.
 *
 * Ids here are stable machine keys; every Thai label lives in content/th.
 * The API validates incoming ids against these sets, so an id is never
 * free-form text (BRIEF §3, §12).
 */

/** The seven things the check-in asks about (§8). */
export type Topic =
  | 'study'
  | 'rest'
  | 'friends'
  | 'family'
  | 'freetime'
  | 'pressure'
  | 'overall';

/**
 * Result bands, chosen by share of the maximum possible weight (§8):
 * ok < 30% · thinking 30–55% · drained 55–78% · heavy > 78%
 */
export type ResultState = 'ok' | 'thinking' | 'drained' | 'heavy';

export type Mode = 'checkin' | 'booth';

export type FestivalId = 'loykrathong' | 'christmas' | 'cny-valentine';

/** What `setting.active_festival` may hold — a festival, or no booth running. */
export type ActiveFestival = FestivalId | 'none';

/** Which moon the answer card shows (§6). */
export type AnswerIcon = 'full' | 'half' | 'crescent' | 'empty';

export interface Choice {
  id: string;
  label: string;
  topic: Topic;
  /** 0 = nothing going on, 3 = weighing heavily. */
  weight: 0 | 1 | 2 | 3;
  icon: AnswerIcon;
}

export interface Question {
  id: string;
  /** The topic this question mainly probes. A choice may still count toward a
   *  different topic — "นอนดึกเพราะงานเยอะ" sits in a sleep question but is
   *  about study — so scoring reads each choice's own topic. */
  topic: Topic;
  headline: string;
  choices: Choice[];
  /** 'reference' = written in the brief. 'draft' = ours, awaiting council review. */
  status: 'reference' | 'draft';
}
