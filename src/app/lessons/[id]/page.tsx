'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { LessonContentManager } from '@/components/relationships'
import { lessonService } from '@/lib/supabase/lessons'
import { scheduleService } from '@/lib/supabase/schedules'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  MapPin,
  Edit,
  Trash2
} from 'lucide-react'

interface LessonWithSchedule {
  id: string
  schedule_id: string
  lesson_number: number
  date: string
  start_time: string
  end_time: string
  topic: string
  description?: string
  location?: string
  max_students?: number
  homework?: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  schedule?: {
    id: string
    course: {
      id: string
      title: string
    }
  }
}

export default function LessonDetailPage() {
  const router = useRouter()
  const params = useParams()
  const lessonId = params.id as string
  
  const [lesson, setLesson] = useState<LessonWithSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (lessonId) {
      loadLesson()
    }
  }, [lessonId])

  const loadLesson = async () => {
    try {
      setLoading(true)
      const data = await lessonService.getLesson(lessonId)
      
      // Also load schedule details to get course info
      if (data.schedule_id) {
        const schedule = await scheduleService.getSchedule(data.schedule_id)
        setLesson({
          ...data,
          schedule: schedule
        } as LessonWithSchedule)
      } else {
        setLesson(data as LessonWithSchedule)
      }
    } catch (error) {
      console.error('Failed to load lesson:', error)
      router.push('/schedules')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lesson?')) return

    try {
      setDeleting(true)
      await lessonService.deleteLesson(lessonId)
      router.push(lesson?.schedule_id ? `/schedules/${lesson.schedule_id}` : '/schedules')
    } catch (error) {
      console.error('Failed to delete lesson:', error)
    } finally {
      setDeleting(false)
    }
  }

  const formatTime = (time: string) => {
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return time
    }
  }

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return date
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!lesson) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(lesson.schedule_id ? `/schedules/${lesson.schedule_id}` : '/schedules')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-4"
        >
          Back to Schedule
        </Button>
        
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Lesson {lesson.lesson_number}: {lesson.topic}
              </h1>
              <Badge variant={
                lesson.status === 'completed' ? 'success' :
                lesson.status === 'cancelled' ? 'danger' :
                'default'
              }>
                {lesson.status}
              </Badge>
            </div>
            
            {lesson.schedule?.course && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                {lesson.schedule.course.title}
              </p>
            )}

            {lesson.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {lesson.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(lesson.date)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}</span>
              </div>
              
              {lesson.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{lesson.location}</span>
                </div>
              )}
              
              {lesson.max_students && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Max {lesson.max_students} students</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/lessons/${lessonId}/edit`)}
              leftIcon={<Edit className="h-4 w-4" />}
            >
              Edit
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDelete}
              loading={deleting}
              leftIcon={<Trash2 className="h-4 w-4" />}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Lesson Content Manager */}
          <Card>
            <Card.Content>
              <LessonContentManager 
                lessonId={lessonId} 
                onUpdate={loadLesson}
              />
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Homework */}
          {lesson.homework && (
            <Card>
              <Card.Header>
                <h3 className="text-sm font-semibold">Homework</h3>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lesson.homework}
                </p>
              </Card.Content>
            </Card>
          )}

          {/* Notes */}
          {lesson.notes && (
            <Card>
              <Card.Header>
                <h3 className="text-sm font-semibold">Notes</h3>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lesson.notes}
                </p>
              </Card.Content>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold">Lesson Information</h3>
            </Card.Header>
            <Card.Content>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                  <dd className="font-medium">
                    {new Date(lesson.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Last Updated</dt>
                  <dd className="font-medium">
                    {new Date(lesson.updated_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Lesson ID</dt>
                  <dd className="font-mono text-xs">{lesson.id}</dd>
                </div>
              </dl>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  )
}
