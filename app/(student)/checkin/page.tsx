import { CheckinFlow } from './CheckinFlow';

/**
 * The check-in: 8 questions, one per screen. A refresh mid-way starts again from
 * the first question, which is the behaviour the brief asks for (§8, "เริ่มใหม่
 * อีกรอบนะ") — nothing is kept between page loads.
 */
export default function CheckinPage() {
  return <CheckinFlow />;
}
