'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Calendar, Copy, ArrowLeft, CheckCircle } from 'lucide-react';
import { Schedule } from '@/types/schedule';
import { scheduleService } from '@/lib/supabase/schedules';
import { 
  Button, Card, Badge, SearchBox, Spinner, Modal 
} from '@/components/ui';

export default function SchedulesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(new Set());
  const [attaching, setAttaching] = useState(false);
  
  const courseId = searchParams.get('courseId');
  const action = searchParams.get('action');
  const isAttachMode = action === 'attach' && courseId;

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = useCallback(async (search?: string) => {
    try {
      const isInitialLoad = !search && !searchQuery;
      
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      
      // Build filters
      const filters: any = {};
      if (search) {
        filters.search = search;
      }
      
      // Get schedules with search
      const data = await scheduleService.getSchedules(filters);
      
      // If in attach mode, filter out schedules that already belong to this course
      if (isAttachMode && courseId) {
        const filteredSchedules = data.filter(schedule => schedule.course_id !== courseId);
        setSchedules(filteredSchedules as Schedule[]);
      } else {
        setSchedules(data as Schedule[]);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [isAttachMode, courseId, searchQuery]);

  const handleSearch = useCallback((search: string) => {
    setSearchQuery(search);
    loadSchedules(search);
  }, [loadSchedules]);

  const toggleScheduleSelection = (scheduleId: string) => {
    const newSelection = new Set(selectedSchedules);
    if (newSelection.has(scheduleId)) {
      newSelection.delete(scheduleId);
    } else {
      newSelection.add(scheduleId);
    }
    setSelectedSchedules(newSelection);
  };

  const handleAttachSchedules = async () => {
    if (!courseId || selectedSchedules.size === 0) return;
    
    setAttaching(true);
    try {
      let successCount = 0;
      
      for (const scheduleId of Array.from(selectedSchedules)) {
        const originalSchedule = schedules.find(s => s.id === scheduleId);
        if (!originalSchedule) continue;
        
        // Clone the schedule for the new course
        const clonedScheduleData = {
          ...originalSchedule,
          course_id: courseId,
          name: `${originalSchedule.name} (Copy)`,
          // Remove fields that shouldn't be copied
          id: undefined,
          created_at: undefined,
          updated_at: undefined,
          course: undefined,
          lessons: undefined,
        };
        
        await scheduleService.createSchedule(clonedScheduleData);
        successCount++;
      }
      
      // Navigate back to the course with success message
      router.push(`/courses/${courseId}?tab=schedule&attached=${successCount}`);
    } catch (error) {
      console.error('Failed to attach schedules:', error);
    } finally {
      setAttaching(false);
    }
  };

  const handleScheduleClick = (schedule: Schedule) => {
    if (isAttachMode) {
      toggleScheduleSelection(schedule.id);
    } else {
      router.push(`/schedules/${schedule.id}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {isAttachMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/courses/${courseId}?tab=schedule`)}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              className="mb-2"
            >
              Back to Course
            </Button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isAttachMode ? 'Attach Existing Schedules' : 'Schedules'}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isAttachMode 
              ? `Select schedules to attach to your course. Selected schedules will be cloned.`
              : 'Manage your course schedules and lesson plans.'
            }
          </p>
        </div>
        <div className="flex gap-2">
          {isAttachMode ? (
            <Button
              onClick={handleAttachSchedules}
              disabled={selectedSchedules.size === 0 || attaching}
              leftIcon={attaching ? <Spinner size="sm" /> : <Copy className="h-4 w-4" />}
            >
              {attaching ? 'Attaching...' : `Attach ${selectedSchedules.size} Schedule${selectedSchedules.size !== 1 ? 's' : ''}`}
            </Button>
          ) : (
            <Button
              onClick={() => router.push('/schedules/new')}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Schedule
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex-1 relative">
        <SearchBox
          placeholder="Search schedules..."
          onSearch={handleSearch}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          debounceDelay={300}
          showClearButton={!searching}
        />
        {searching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Spinner size="sm" />
          </div>
        )}
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
          {schedules.map((schedule) => {
            const isSelected = selectedSchedules.has(schedule.id);
            return (
              <Card
                key={schedule.id}
                className={`transition-all cursor-pointer ${
                  isAttachMode 
                    ? isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:ring-1 hover:ring-gray-300'
                    : 'hover:shadow-lg'
                }`}
                onClick={() => handleScheduleClick(schedule)}
              >
                <Card.Content className="p-4">
                  {isAttachMode && (
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleScheduleSelection(schedule.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {isSelected ? 'Selected' : 'Select to attach'}
                      </span>
                    </div>
                  )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}