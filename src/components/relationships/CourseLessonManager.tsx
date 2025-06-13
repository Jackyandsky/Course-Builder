'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { lessonService } from '@/lib/supabase/lessons';
import { bookService } from '@/lib/supabase/books';
import { vocabularyService } from '@/lib/supabase/vocabulary';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen,
  Languages,
  Target,
  Wrench,
  FileText,
  Plus,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import type { Lesson } from '@/types/schedule';
import type { Book } from '@/types/database';

interface CourseLessonManagerProps {
  courseId: string;
}

export function CourseLessonManager({ courseId }: CourseLessonManagerProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [availableVocabGroups, setAvailableVocabGroups] = useState<any[]>([]);

  useEffect(() => {
    loadLessons();
    loadCourseContent();
  }, [courseId]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const data = await lessonService.getCourseLessons(courseId);
      setLessons(data);
    } catch (error) {
      console.error('Failed to load course lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseContent = async () => {
    try {
      // Load books and vocabulary groups that could be assigned to lessons
      const [books, vocabGroups] = await Promise.all([
        bookService.getBooks({ limit: 100 }),
        vocabularyService.getVocabularyGroups({})
      ]);
      setAvailableBooks(books);
      setAvailableVocabGroups(vocabGroups);
    } catch (error) {
      console.error('Failed to load course content:', error);
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowLessonModal(true);
  };

  const formatTime = (time: string) => {
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return time;
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'scheduled': return 'info';
      default: return 'default';
    }
  };

  const addBookToLesson = async (lessonId: string, bookId: string) => {
    try {
      await lessonService.addBookToLesson(lessonId, bookId, {
        position: 0,
        is_required: true
      });
      await loadLessons();
    } catch (error) {
      console.error('Failed to add book to lesson:', error);
    }
  };

  const removeBookFromLesson = async (lessonId: string, bookId: string) => {
    try {
      await lessonService.removeBookFromLesson(lessonId, bookId);
      await loadLessons();
    } catch (error) {
      console.error('Failed to remove book from lesson:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          No lessons yet
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Lessons will be automatically created when you add schedules to this course
        </p>
        <Button 
          className="mt-4" 
          variant="outline"
          onClick={() => router.push(`/courses/${courseId}?tab=schedule`)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Go to Schedules
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Course Lessons</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} from course schedules
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {lessons.map((lesson) => (
          <Card
            key={lesson.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleLessonClick(lesson)}
          >
            <Card.Content className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-lg">
                      {lesson.title || `Lesson ${lesson.lesson_number || ''}`}
                    </h4>
                    <Badge variant={getStatusColor(lesson.status)} size="sm">
                      {lesson.status}
                    </Badge>
                  </div>
                  
                  {lesson.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {lesson.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(lesson.date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}</span>
                    </div>
                    
                    {lesson.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{lesson.location}</span>
                      </div>
                    )}
                    
                    {lesson.schedule && (
                      <div className="flex items-center gap-1">
                        <span>Schedule: {lesson.schedule.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Content indicators */}
                  <div className="flex flex-wrap gap-2">
                    {(lesson as any).lesson_books && (lesson as any).lesson_books.length > 0 && (
                      <Badge variant="outline" size="sm">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {(lesson as any).lesson_books.length} book{(lesson as any).lesson_books.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {(lesson as any).lesson_vocabulary_groups && (lesson as any).lesson_vocabulary_groups.length > 0 && (
                      <Badge variant="outline" size="sm">
                        <Languages className="h-3 w-3 mr-1" />
                        {(lesson as any).lesson_vocabulary_groups.length} vocab group{(lesson as any).lesson_vocabulary_groups.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {(lesson as any).lesson_objectives && (lesson as any).lesson_objectives.length > 0 && (
                      <Badge variant="outline" size="sm">
                        <Target className="h-3 w-3 mr-1" />
                        {(lesson as any).lesson_objectives.length} objective{(lesson as any).lesson_objectives.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {(lesson as any).lesson_methods && (lesson as any).lesson_methods.length > 0 && (
                      <Badge variant="outline" size="sm">
                        <Wrench className="h-3 w-3 mr-1" />
                        {(lesson as any).lesson_methods.length} method{(lesson as any).lesson_methods.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {(lesson as any).lesson_tasks && (lesson as any).lesson_tasks.length > 0 && (
                      <Badge variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        {(lesson as any).lesson_tasks.length} task{(lesson as any).lesson_tasks.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Lesson Detail Modal */}
      <Modal
        isOpen={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        title={selectedLesson?.title || `Lesson ${selectedLesson?.lesson_number || ''}`}
        size="lg"
      >
        {selectedLesson && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Lesson Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-2">{formatDate(selectedLesson.date)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Time:</span>
                  <span className="ml-2">{formatTime(selectedLesson.start_time)} - {formatTime(selectedLesson.end_time)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <Badge variant={getStatusColor(selectedLesson.status)} size="sm" className="ml-2">
                    {selectedLesson.status}
                  </Badge>
                </div>
                {selectedLesson.location && (
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <span className="ml-2">{selectedLesson.location}</span>
                  </div>
                )}
              </div>
              {selectedLesson.description && (
                <div className="mt-4">
                  <span className="text-gray-500">Description:</span>
                  <p className="mt-1">{selectedLesson.description}</p>
                </div>
              )}
            </div>

            {/* Content sections will be added here */}
            <div className="text-center py-8 text-gray-500">
              Lesson content management interface coming soon...
              <br />
              <span className="text-sm">This will allow you to assign books, vocabulary groups, objectives, methods, and tasks to lessons.</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setShowLessonModal(false)}>
            Close
          </Button>
          <Button onClick={() => router.push(`/lessons/${selectedLesson?.id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Lesson
          </Button>
        </div>
      </Modal>
    </div>
  );
}