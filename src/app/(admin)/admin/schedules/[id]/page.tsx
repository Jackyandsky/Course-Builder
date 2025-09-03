'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Calendar, Clock, Users } from 'lucide-react';
import { Schedule, Lesson } from '@/types/schedule';
import { scheduleService } from '@/lib/supabase/schedules';
import { Button, Card, Badge, Spinner, Modal } from '@/components/ui';
import { ScheduleCalendar } from '@/components/schedules/ScheduleCalendar';
import { LessonDetailModal } from '@/components/schedules/LessonDetailModal';
import { LessonForm } from '@/components/schedules/LessonForm'; // <-- Import LessonForm

export default function ScheduleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const scheduleId = params.id as string;

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null); // <-- State for editing modal

  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading schedule with ID:', scheduleId);
      const data = await scheduleService.getSchedule(scheduleId);
      if (!data) {
        console.error('No schedule found with ID:', scheduleId);
        router.push('/admin/schedules');
        return;
      }
      console.log('Schedule loaded:', data);
      setSchedule(data as Schedule);
    } catch (error) {
      console.error('Failed to load schedule:', error);
      // Show error message before redirecting
      alert(`Failed to load schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
      router.push('/admin/schedules');
    } finally {
      setLoading(false);
    }
  }, [scheduleId, router]);

  useEffect(() => {
    if (scheduleId) {
      loadSchedule();
    }
  }, [scheduleId, loadSchedule]);
  
  const handleBack = () => {
    const source = searchParams.get('source');
    const courseId = searchParams.get('courseId');
    const sourceView = searchParams.get('sourceView');
    const sourceTab = searchParams.get('sourceTab');
    
    if (source === 'course' && courseId) {
      let backUrl = `/courses/${courseId}`;
      if (sourceView === 'tabs') {
        backUrl += '?view=tabs';
        if (sourceTab) backUrl += `&tab=${sourceTab}`;
      }
      router.push(backUrl);
    } else {
      router.push('/admin/schedules');
    }
  };

  const handleDelete = async () => {
    if (!schedule) return;
    setDeleting(true);
    try {
      await scheduleService.deleteSchedule(schedule.id);
      handleBack();
      router.refresh();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleStartEditLesson = (lesson: Lesson) => {
    setSelectedLesson(null); // Close the detail modal
    setEditingLesson(lesson); // Open the edit modal
  };

  const handleFinishEdit = () => {
    setEditingLesson(null); // Close the edit modal
    loadSchedule(); // Refresh data to see changes
  };

  const handleRelationshipUpdate = () => {
    loadSchedule(); // Refresh data when books/tasks are updated
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
    <>
      <div className="p-6 space-y-6">
        {/* Header and Details Card... (code remains the same) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <Button variant="outline" size="sm" onClick={handleBack} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {searchParams.get('source') === 'course' && searchParams.get('courseId') 
                      ? `Back to ${schedule.course?.title || 'Course'}` 
                      : 'Back to Schedules'}
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">{schedule.name}</h1>
                <p className="mt-1 text-sm text-gray-600">
                    For course: <strong>{schedule.course?.title || 'N/A'}</strong>
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.push(`/admin/schedules/${scheduleId}/edit`)} leftIcon={<Edit className="h-4 w-4" />}>
                    Edit Schedule
                </Button>
                <Button variant="danger" onClick={() => setShowDeleteModal(true)} leftIcon={<Trash2 className="h-4 w-4" />}>
                    Delete Schedule
                </Button>
            </div>
        </div>
        <Card>
            <Card.Header><h2 className="text-lg font-semibold">Schedule Details</h2></Card.Header>
            <Card.Content>
                <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6 text-sm">
                    <div className="flex items-start gap-3"><Calendar className="h-5 w-5 text-gray-400 mt-0.5"/><div><dt className="font-medium text-gray-500">Duration</dt><dd>{new Date(schedule.start_date).toLocaleDateString()} - {schedule.end_date ? new Date(schedule.end_date).toLocaleDateString() : 'Ongoing'}</dd></div></div>
                    <div className="flex items-start gap-3"><Clock className="h-5 w-5 text-gray-400 mt-0.5"/><div><dt className="font-medium text-gray-500">Default Time</dt><dd>{schedule.default_start_time} ({schedule.default_duration_minutes} min)</dd></div></div>
                    <div className="flex items-start gap-3"><Users className="h-5 w-5 text-gray-400 mt-0.5"/><div><dt className="font-medium text-gray-500">Max Students</dt><dd>{schedule.max_students || 'Not set'}</dd></div></div>
                    <div className="col-span-full"><dt className="font-medium text-gray-500">Description</dt><dd className="mt-1 text-gray-700">{schedule.description || 'No description provided.'}</dd></div>
                </dl>
            </Card.Content>
        </Card>
      
        <Card>
          <Card.Header>
              <h2 className="text-lg font-semibold">Lesson Calendar</h2>
          </Card.Header>
          <Card.Content>
              <ScheduleCalendar schedule={schedule} onSelectLesson={(lesson) => setSelectedLesson(lesson as Lesson)} />
          </Card.Content>
        </Card>

        {/* Delete Schedule Modal */}
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Schedule" className="max-w-md">
            <p className="text-gray-600">Are you sure you want to delete &quot;{schedule.name}&quot;? This will also delete all associated lessons and cannot be undone.</p>
            <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete Schedule</Button>
            </div>
        </Modal>
      </div>

      {/* Lesson View/Edit Modals */}
      <LessonDetailModal 
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        lesson={selectedLesson}
        onEdit={handleStartEditLesson}
        onUpdate={handleRelationshipUpdate}
      />

      {editingLesson && (
        <Modal isOpen={!!editingLesson} onClose={() => setEditingLesson(null)} title={`Edit Lesson: ${editingLesson.title}`} size="xl">
            <LessonForm lesson={editingLesson} onSuccess={handleFinishEdit} />
        </Modal>
      )}
    </>
  );
}