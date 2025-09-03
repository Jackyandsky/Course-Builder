'use client';

import { ScheduleForm } from '@/components/schedules/ScheduleForm';
import { useSearchParams } from 'next/navigation';

export default function NewSchedulePage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  return (
    <div className="max-w-4xl mx-auto py-8">
      <ScheduleForm courseId={courseId} />
    </div>
  );
}