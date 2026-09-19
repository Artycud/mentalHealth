import { StatusScreen } from '@/components/ui/StatusScreen';
import { errors } from '@/content/th/common';

/** BRIEF §8: "หน้านี้ไม่มีแล้ว". Plain and short. */
export default function NotFound() {
  return (
    <StatusScreen
      title={errors.notFound.title}
      body={errors.notFound.body}
      action={{ label: errors.notFound.action, href: '/' }}
    />
  );
}
