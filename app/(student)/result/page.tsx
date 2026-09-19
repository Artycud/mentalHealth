import { ResultView } from './ResultView';

/**
 * The check-in result. All the work happens in ResultView, in the browser,
 * because the answers live in that tab's session storage and nowhere else.
 */
export default function ResultPage() {
  return <ResultView />;
}
