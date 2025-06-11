'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button, Card, Spinner } from '@/components/ui';
import { ScheduleForm } from '@/components/schedules/ScheduleForm';
import { scheduleService } from '@/lib/services/schedule-service';
import { Schedule } from '@/types/schedule';

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.id as string;
  
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (scheduleId) {
      loadSchedule();
    }
  }, [scheduleId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getSchedule(scheduleId);
      setSchedule(data as Schedule);
    } catch (error) {
      console.error('Failed to load schedule:', error);
      router.push('/schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push(`/schedules/${scheduleId}`);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!schedule) {
    return <div className="p-8 text-center text-gray-500">Schedule not found.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/schedules/${scheduleId}`)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Schedule
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Schedule</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update the schedule details for "{schedule.name}"
        </p>
      </div>

      <Card>
        <Card.Content className="p-6">
          <ScheduleForm schedule={schedule} onSuccess={handleSuccess} />
        </Card.Content>
      </Card>
    </div>
  );
}
