'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Calendar } from 'lucide-react';
import { Schedule } from '@/types/schedule';
import { scheduleService } from '@/lib/supabase/schedules';
import { 
  Button, Card, Badge, SearchBox, Spinner 
} from '@/components/ui';

export default function SchedulesPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      // Assuming getSchedules can be called with an empty filter object
      const data = await scheduleService.getSchedules({});
      setSchedules(data as Schedule[]);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    // For now, re-fetches all. Can be optimized with search filter later.
    loadSchedules(); 
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Schedules</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your course schedules and lesson plans.
          </p>
        </div>
        <Button
          onClick={() => router.push('/schedules/new')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Schedule
        </Button>
      </div>

      {/* Search and Filters Placeholder */}
      <div className="flex-1">
        <SearchBox
          placeholder="Search schedules..."
          onSearch={handleSearch}
          fullWidth
        />
      </div>

      {/* Schedules Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : schedules.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No schedules found</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Get started by creating your first schedule.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push('/schedules/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Schedule
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <Card
              key={schedule.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/schedules/${schedule.id}`)}
            >
              <Card.Content className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{schedule.name}</h3>
                {schedule.description && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{schedule.description}</p>}
                <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
                  {/* The course relation might not be populated, so we add a fallback */}
                  <span>{schedule.course?.title || 'No Course'}</span>
                  <Badge variant={schedule.is_active ? 'success' : 'secondary'}>
                    {schedule.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}