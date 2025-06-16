'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import { scheduleService } from '@/lib/supabase/schedules';
import { lessonService } from '@/lib/supabase/lessons';
import type { Lesson, Schedule } from '@/types/schedule';
import type { LessonStatus } from '@/types/database';

interface LessonFormProps {
  scheduleId?: string;
  lesson?: Lesson | null;
  onSuccess?: () => void;
}

const LESSON_STATUS_OPTIONS: { value: LessonStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const initialFormData = {
    schedule_id: '',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    duration_minutes: 60,
    location: '',
    status: 'scheduled' as LessonStatus,
};

export function LessonForm({ scheduleId, lesson, onSuccess }: LessonFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [formData, setFormData] = useState(initialFormData);
  

  const isEditing = !!(lesson && lesson.id);

  useEffect(() => {
    loadSchedules();
  }, []);

  // *** THIS IS THE CORE FIX ***
  // This useEffect now reliably populates the form when a lesson is passed for editing.
  useEffect(() => {
    if (lesson && isEditing) {
      setFormData({
        schedule_id: lesson.schedule_id,
        title: lesson.title || '',
        description: lesson.description || '',
        date: lesson.date,
        start_time: lesson.start_time,
        end_time: lesson.end_time,
        duration_minutes: lesson.duration_minutes || 60,
        location: lesson.location || '',
        status: lesson.status,
      });
    } else {
      setFormData({ ...initialFormData, schedule_id: scheduleId || '' });
    }
  }, [lesson]);

  const loadSchedules = async () => {
    if (user) {
      try {
        const data = await scheduleService.getSchedules({ user_id: user.id });
        setSchedules(data || []);
      } catch (error) {
        console.error('Error loading schedules:', error);
      }
    }
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    if(!startTime || !duration) return;
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + duration);
    
    const endTime = startDate.toTimeString().slice(0, 5);
    setFormData(prev => ({ ...prev, end_time: endTime }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      let lessonData;
      
      if (isEditing) {
        if (!lesson) throw new Error("Lesson to update is missing.");
        // For editing, use existing course_id and don't validate schedule
        lessonData = { 
          ...formData, 
          user_id: user.id,
          course_id: lesson.course_id
        };
        await lessonService.updateLesson(lesson.id, lessonData);
      } else {
        // For creating new lessons, validate schedule selection
        const selectedSchedule = schedules.find(s => s.id === formData.schedule_id);
        if (!selectedSchedule) {
          throw new Error("Please select a valid schedule");
        }
        lessonData = { 
          ...formData, 
          user_id: user.id,
          course_id: selectedSchedule.course_id
        };
        await lessonService.createLesson(lessonData);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      alert('Error saving lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // ... (Other handlers like handleStartTimeChange remain the same)
  const handleStartTimeChange = (value: string) => { setFormData(prev => ({ ...prev, start_time: value })); calculateEndTime(value, formData.duration_minutes); };
  const handleDurationChange = (value: number) => { setFormData(prev => ({ ...prev, duration_minutes: value })); calculateEndTime(formData.start_time, value); };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!isEditing && (
          <div className="col-span-2">
            <Select
                label="Schedule"
                value={formData.schedule_id}
                onChange={(e) => setFormData({ ...formData, schedule_id: e.target.value })}
                required
                options={schedules.map(s => ({ 
                    value: s.id, 
                    label: `${s.name}${s.course ? ` (${s.course.title})` : ''}` 
                }))}
            />
          </div>
        )}

        <div className="col-span-2"><Input label="Lesson Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
        <div className="col-span-2"><Textarea label="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
        <div><Input type="date" label="Date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
        <div><Select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} options={LESSON_STATUS_OPTIONS} /></div>
        <div><Input type="time" label="Start Time" value={formData.start_time} onChange={(e) => handleStartTimeChange(e.target.value)} required /></div>
        <div><Input type="number" label="Duration (minutes)" value={formData.duration_minutes} onChange={(e) => handleDurationChange(parseInt(e.target.value))} required /></div>
        <div><Input type="time" label="End Time" value={formData.end_time} readOnly disabled helperText="Auto-calculated" /></div>
        <div><Input label="Location" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></div>
      </div>
      <div className="flex justify-end space-x-4 mt-6">
        <Button type="button" variant="outline" onClick={onSuccess || (() => router.back())}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEditing ? 'Update Lesson' : 'Create Lesson'}</Button>
      </div>
    </form>
  );
}