'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { scheduleService } from '@/lib/services/schedule-service';
import type { Lesson, Schedule } from '@/types/schedule';
import type { LessonStatus } from '@/types/database';
import { Plus, X } from 'lucide-react';

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
    notes: '',
    homework: '',
    resources: [] as string[],
};

export function LessonForm({ scheduleId, lesson, onSuccess }: LessonFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [formData, setFormData] = useState(initialFormData);
  
  const [newResource, setNewResource] = useState('');

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
        duration_minutes: lesson.duration_minutes,
        location: lesson.location || '',
        status: lesson.status,
        notes: lesson.notes || '',
        homework: lesson.homework || '',
        resources: lesson.resources || [],
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
      const lessonData = { ...formData, user_id: user.id };

      if (isEditing) {
        if (!lesson) throw new Error("Lesson to update is missing.");
        await scheduleService.updateLesson(lesson.id, lessonData);
      } else {
        await scheduleService.createLesson(lessonData);
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
  const handleAddResource = () => { if (newResource.trim()) { setFormData(prev => ({ ...prev, resources: [...(prev.resources || []), newResource.trim()] })); setNewResource(''); } };
  const handleRemoveResource = (index: number) => { setFormData(prev => ({ ...prev, resources: (prev.resources || []).filter((_, i) => i !== index) })); };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2">
            <Select
                label="Schedule"
                value={formData.schedule_id}
                onChange={(e) => setFormData({ ...formData, schedule_id: e.target.value })}
                required
                disabled={isEditing}
                options={schedules.map(s => ({ value: s.id, label: s.name }))}
            />
        </div>

        <div className="col-span-2"><Input label="Lesson Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
        <div className="col-span-2"><Textarea label="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
        <div><Input type="date" label="Date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
        <div><Select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} options={LESSON_STATUS_OPTIONS} /></div>
        <div><Input type="time" label="Start Time" value={formData.start_time} onChange={(e) => handleStartTimeChange(e.target.value)} required /></div>
        <div><Input type="number" label="Duration (minutes)" value={formData.duration_minutes} onChange={(e) => handleDurationChange(parseInt(e.target.value))} required /></div>
        <div><Input type="time" label="End Time" value={formData.end_time} readOnly disabled helperText="Auto-calculated" /></div>
        <div><Input label="Location" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></div>
        <div className="col-span-2"><Textarea label="Teaching Notes" value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
        <div className="col-span-2"><Textarea label="Homework Assignment" value={formData.homework || ''} onChange={(e) => setFormData({ ...formData, homework: e.target.value })} rows={3} /></div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Resources & Links</label>
          <div className="space-y-2">
            <div className="flex gap-2"><Input value={newResource} onChange={(e) => setNewResource(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddResource())} /><Button type="button" onClick={handleAddResource} size="sm"><Plus className="h-4 w-4"/></Button></div>
            <div className="flex flex-wrap gap-2">
              {(formData.resources || []).map((resource, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {resource}
                  <button type="button" onClick={() => handleRemoveResource(index)} className="ml-1 text-gray-500 hover:text-gray-700"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-4 mt-6">
        <Button type="button" variant="outline" onClick={onSuccess || (() => router.back())}>Cancel</Button>
        <Button type="submit" loading={loading}>{isEditing ? 'Update Lesson' : 'Create Lesson'}</Button>
      </div>
    </form>
  );
}