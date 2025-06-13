'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SHARED_USER_ID } from '@/lib/constants/shared';
import { scheduleService } from '@/lib/supabase/schedules';
import { courseService } from '@/lib/supabase/courses';
import type { Schedule, RecurrenceType, DayOfWeek } from '@/types/schedule';
import type { Course } from '@/types/database';
import { Save, Calendar, Clock, BookOpen } from 'lucide-react';

interface ScheduleFormProps {
  schedule?: Schedule;
  onSuccess?: () => void;
}

const RECURRENCE_TYPES: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'No Recurrence (One-time)' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

export function ScheduleForm({ schedule, onSuccess }: ScheduleFormProps) {
  const router = useRouter();
  const isEditing = !!schedule;
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState({
    course_id: schedule?.course_id || '',
    name: schedule?.name || '',
    description: schedule?.description || '',
    start_date: schedule?.start_date || new Date().toISOString().split('T')[0],
    end_date: schedule?.end_date || '',
    recurrence_type: schedule?.recurrence_type || 'weekly' as RecurrenceType,
    recurrence_days: schedule?.recurrence_days || ['monday', 'wednesday', 'friday'] as DayOfWeek[],
    default_start_time: schedule?.default_start_time || '09:00',
    default_duration_minutes: schedule?.default_duration_minutes || 60,
    timezone: schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    location: schedule?.location || '',
    max_students: schedule?.max_students || 20,
    is_active: schedule?.is_active !== false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await courseService.getCourses({});
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Schedule name is required';
    if (!formData.course_id) newErrors.course_id = 'A course must be selected';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const scheduleData = {
        ...formData,
        user_id: SHARED_USER_ID,
        // Explicitly set max_students to number | undefined to match Partial<Schedule>
        max_students: formData.max_students === null ? undefined : formData.max_students,
        default_duration_minutes: formData.default_duration_minutes,
      };

      if (isEditing) {
        await scheduleService.updateSchedule(schedule!.id, scheduleData);
      } else {
        await scheduleService.createSchedule(scheduleData);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/schedules');
        router.refresh();
      }
    } catch (error: any) {
      console.error('Failed to save schedule:', error);
      setErrors({ submit: error.message || 'Failed to save schedule. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: DayOfWeek) => {
    setFormData(prev => ({
      ...prev,
      recurrence_days: prev.recurrence_days.includes(day)
        ? prev.recurrence_days.filter(d => d !== day)
        : [...prev.recurrence_days, day]
    }));
  };

  // Calculate lesson preview
  const lessonPreview = useMemo(() => {
    if (formData.recurrence_type === 'none' || !formData.start_date || !formData.recurrence_days.length) {
      return { count: formData.recurrence_type === 'none' ? 1 : 0, totalDuration: formData.default_duration_minutes };
    }

    const startDate = new Date(`${formData.start_date}T00:00:00Z`);
    const endDate = formData.end_date 
      ? new Date(`${formData.end_date}T00:00:00Z`)
      : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());

    let currentDate = new Date(startDate);
    let lessonCount = 0;
    
    const dayMap: DayOfWeek[] = [
      'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
    ];

    while (currentDate <= endDate) {
      const dayOfWeek = dayMap[currentDate.getUTCDay()];
      if (formData.recurrence_days.includes(dayOfWeek)) {
        lessonCount++;
      }
      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return {
      count: lessonCount,
      totalDuration: lessonCount * formData.default_duration_minutes
    };
  }, [formData.start_date, formData.end_date, formData.recurrence_days, formData.recurrence_type, formData.default_duration_minutes]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEditing ? 'Edit Schedule' : 'Create New Schedule'}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {isEditing ? 'Update your schedule details' : 'Set up a recurring schedule that will automatically generate lessons'}
        </p>
      </div>

      {/* Lesson Preview Card */}
      {formData.start_date && (formData.recurrence_type === 'none' || formData.recurrence_days.length > 0) && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <Card.Content className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Lesson Preview</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">Lessons to be created:</span>
                </div>
                <Badge variant="info" size="sm">
                  {lessonPreview.count} lesson{lessonPreview.count !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">Total duration:</span>
                </div>
                <Badge variant="info" size="sm">
                  {formatDuration(lessonPreview.totalDuration)}
                </Badge>
              </div>
            </div>
            {formData.recurrence_type !== 'none' && (
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                Based on {formData.start_date} to {formData.end_date || 'one year from start'} • {formData.recurrence_days.length} day{formData.recurrence_days.length !== 1 ? 's' : ''} per week • {formData.default_duration_minutes} minutes each
              </p>
            )}
          </Card.Content>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            {errors.submit}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2">
          <Select
            label="Course"
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
            required
            error={errors.course_id}
            options={courses.map(c => ({ value: c.id, label: c.title }))}
            placeholder="Select a course..."
          />
        </div>
        <div className="col-span-2">
          <Input
            label="Schedule Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Morning Classes, Evening Sessions"
            required
            error={errors.name}
          />
        </div>
        <div className="col-span-2">
          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe this schedule..."
            rows={3}
          />
        </div>
        <div>
          <Input
            type="date"
            label="Start Date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
            error={errors.start_date}
          />
        </div>
        <div>
          <Input
            type="date"
            label="End Date (Optional)"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            helperText="Leave empty for ongoing schedule"
          />
        </div>
        <div>
          <Select
            label="Recurrence"
            value={formData.recurrence_type}
            onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value as RecurrenceType })}
            options={RECURRENCE_TYPES}
          />
        </div>
        {formData.recurrence_type !== 'none' && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Class Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleDayToggle(day.value)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    formData.recurrence_days?.includes(day.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <Input
            type="time"
            label="Default Start Time"
            value={formData.default_start_time}
            onChange={(e) => setFormData({ ...formData, default_start_time: e.target.value })}
            required
          />
        </div>
        <div>
          <Input
            type="number"
            label="Duration (minutes)"
            value={formData.default_duration_minutes}
            onChange={(e) => setFormData({ ...formData, default_duration_minutes: parseInt(e.target.value) })}
            min="15"
            max="480"
            required
          />
        </div>
        <div>
          <Select
            label="Timezone"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            options={TIMEZONES}
          />
        </div>
        <div>
          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Room 101, Online, etc."
          />
        </div>
        <div>
          <Input
            type="number"
            label="Maximum Students"
            value={formData.max_students}
            onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
            min="1"
            max="1000"
          />
        </div>
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Active Schedule</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end space-x-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push('/schedules')}>Cancel</Button>
          <Button type="submit" loading={loading} leftIcon={<Save className="h-4 w-4" />}>
            {isEditing ? 'Update Schedule' : 'Create Schedule'}
          </Button>
        </div>
      </form>
    </div>
  );
}