'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { scheduleService } from '@/lib/supabase/schedules'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  ChevronRight,
  Plus 
} from 'lucide-react'

interface CourseScheduleListProps {
  courseId: string
  preloadedData?: any // Pre-loaded course data
}

export function CourseScheduleList({ courseId, preloadedData }: CourseScheduleListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(!preloadedData)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Build source URL for navigation back to this course
  const buildSourceParams = () => {
    const currentView = searchParams.get('view')
    const currentTab = searchParams.get('tab')
    
    const params = new URLSearchParams()
    params.set('source', 'course')
    params.set('courseId', courseId)
    
    if (currentView === 'tabs' || currentTab) {
      params.set('sourceView', 'tabs')
      if (currentTab) params.set('sourceTab', currentTab)
    } else {
      params.set('sourceView', 'accordion')
    }
    
    return params.toString()
  }

  useEffect(() => {
    loadSchedules()
  }, [courseId, preloadedData])

  const loadSchedules = async () => {
    if (preloadedData && !dataLoaded) {
      console.log('[CourseSchedule] Using preloaded data - NO API calls needed');
      
      // Use preloaded course schedules immediately
      setSchedules(preloadedData.schedules || []);
      setDataLoaded(true);
      setLoading(false);
      
    } else if (!preloadedData && !dataLoaded) {
      // Fallback to original loading method if no preloaded data
      console.log('[CourseSchedule] No preloaded data, using API calls');
      setLoading(true)
      try {
        const courseSchedules = await scheduleService.getSchedules({ course_id: courseId })
        setSchedules(courseSchedules)
        setDataLoaded(true);
      } catch (error) {
        console.error('Failed to load schedules:', error)
      } finally {
        setLoading(false)
      }
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
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return date
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'cancelled': return 'danger'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
      </div>
    )
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          No schedules yet
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Create a teaching schedule for this course
        </p>
        <Button 
          className="mt-4" 
          size="sm"
          onClick={() => router.push(`/admin/schedules/new?courseId=${courseId}`)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Schedule Summary */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Course Schedules</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} for this course
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/schedules?courseId=${courseId}&action=attach`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Attach Existing
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/schedules/new?courseId=${courseId}`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Schedules List */}
      {schedules.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Active Schedules</h4>
          <div className="grid gap-4">
            {schedules.map((schedule) => (
              <Card
                key={schedule.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/schedules/${schedule.id}?${buildSourceParams()}`)}
              >
                <Card.Content className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-medium">{schedule.name}</h5>
                        <Badge variant={schedule.is_active ? 'success' : 'secondary'} size="sm">
                          {schedule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      {schedule.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {schedule.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(schedule.start_date).toLocaleDateString()} - 
                            {schedule.end_date ? new Date(schedule.end_date).toLocaleDateString() : 'Ongoing'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(schedule.default_start_time)}</span>
                        </div>
                        
                        {schedule.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{schedule.location}</span>
                          </div>
                        )}
                        
                        {schedule.max_students && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>Max {schedule.max_students}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
