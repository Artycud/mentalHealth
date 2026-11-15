import { UserPage } from '@/components/heart/UserPage';
import { Mbti } from '@/components/mbti/Mbti';

// The status bar takes the sky's colour: components/heart/SkyClock.

/** "รู้จักตัวเองอีกนิด": twelve quick questions, then a type. Nothing is stored. */
export default function SelfPage() {
  return (
    <UserPage town={false}>
      <Mbti />
    </UserPage>
  );
}
