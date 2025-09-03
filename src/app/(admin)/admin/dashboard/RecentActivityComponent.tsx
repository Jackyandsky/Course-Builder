'use client';

import { useState, useEffect } from 'react';
import { 
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  UserPlusIcon,
  UserMinusIcon,
  ClipboardDocumentCheckIcon,
  BellIcon,
  ChartBarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'enrollment' | 'user' | 'course' | 'payment' | 'schedule' | 'assignment' | 'system';
  action: string;
  description: string;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  metadata?: {
    course?: string;
    student?: string;
    amount?: number;
    status?: string;
    [key: string]: any;
  };
  importance: 'low' | 'medium' | 'high' | 'critical';
}

const activityIcons: Record<string, React.ComponentType<any>> = {
  enrollment: AcademicCapIcon,
  user: UserGroupIcon,
  course: BookOpenIcon,
  payment: CurrencyDollarIcon,
  schedule: CalendarIcon,
  assignment: ClipboardDocumentCheckIcon,
  system: BellIcon
};

const actionIcons: Record<string, React.ComponentType<any>> = {
  created: PlusIcon,
  updated: PencilIcon,
  deleted: TrashIcon,
  enrolled: UserPlusIcon,
  unenrolled: UserMinusIcon,
  completed: CheckCircleIcon,
  failed: XCircleIcon,
  published: DocumentTextIcon
};

// Mock data generator
const generateMockActivities = (): ActivityItem[] => {
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'enrollment',
      action: 'enrolled',
      description: 'John Smith enrolled in Advanced Writing Workshop',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      user: { id: '1', name: 'Admin User', role: 'admin' },
      metadata: { course: 'Advanced Writing Workshop', student: 'John Smith' },
      importance: 'high'
    },
    {
      id: '2',
      type: 'payment',
      action: 'completed',
      description: 'Payment received from Sarah Johnson',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      user: { id: '2', name: 'System', role: 'system' },
      metadata: { amount: 299, student: 'Sarah Johnson' },
      importance: 'high'
    },
    {
      id: '3',
      type: 'course',
      action: 'published',
      description: 'New course "Critical Reading Mastery" published',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      user: { id: '3', name: 'Dr. Thompson', role: 'teacher' },
      metadata: { course: 'Critical Reading Mastery' },
      importance: 'medium'
    },
    {
      id: '4',
      type: 'user',
      action: 'created',
      description: 'New student account created',
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      user: { id: '4', name: 'Michael Chen', role: 'student' },
      importance: 'low'
    },
    {
      id: '5',
      type: 'schedule',
      action: 'updated',
      description: 'Schedule updated for Reading Fundamentals',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      user: { id: '5', name: 'Ms. Davis', role: 'teacher' },
      metadata: { course: 'Reading Fundamentals' },
      importance: 'medium'
    },
    {
      id: '6',
      type: 'assignment',
      action: 'completed',
      description: 'Essay assignment submitted by 12 students',
      timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
      user: { id: '6', name: 'System', role: 'system' },
      metadata: { course: 'Creative Writing 101', count: 12 },
      importance: 'medium'
    },
    {
      id: '7',
      type: 'enrollment',
      action: 'unenrolled',
      description: 'Student dropped from inactive course',
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      user: { id: '7', name: 'Admin User', role: 'admin' },
      metadata: { student: 'Alex Wilson', course: 'Basic Grammar' },
      importance: 'low'
    },
    {
      id: '8',
      type: 'system',
      action: 'updated',
      description: 'System maintenance completed successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
      user: { id: '8', name: 'System', role: 'system' },
      importance: 'critical'
    }
  ];

  return activities;
};

interface RecentActivityComponentProps {
  maxItems?: number;
  showFilters?: boolean;
  compact?: boolean;
}

export default function RecentActivityComponent({ 
  maxItems = 10, 
  showFilters = true,
  compact = false 
}: RecentActivityComponentProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedImportance, setSelectedImportance] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Load initial activities
    loadActivities();

    // Set up auto-refresh
    const interval = autoRefresh ? setInterval(loadActivities, 30000) : null; // Refresh every 30 seconds

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    filterActivities();
  }, [activities, selectedType, selectedImportance]);

  const loadActivities = async () => {
    setLoading(true);
    // In real implementation, fetch from API
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    const mockData = generateMockActivities();
    setActivities(mockData);
    setLoading(false);
  };

  const filterActivities = () => {
    let filtered = [...activities];

    if (selectedType !== 'all') {
      filtered = filtered.filter(a => a.type === selectedType);
    }

    if (selectedImportance !== 'all') {
      filtered = filtered.filter(a => a.importance === selectedImportance);
    }

    filtered = filtered.slice(0, maxItems);
    setFilteredActivities(filtered);
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'enrolled':
      case 'created':
      case 'completed':
      case 'published':
        return 'text-green-600';
      case 'unenrolled':
      case 'deleted':
      case 'failed':
        return 'text-red-600';
      case 'updated':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading && activities.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            {!compact && (
              <Badge variant="secondary" className="ml-2">
                {activities.length} new
              </Badge>
            )}
          </div>
          {!compact && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={autoRefresh ? 'primary' : 'outline'}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={loadActivities}
              >
                Refresh
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        {showFilters && !compact && (
          <div className="flex gap-2 mb-4 pb-4 border-b">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1 text-sm border rounded-md"
            >
              <option value="all">All Types</option>
              <option value="enrollment">Enrollments</option>
              <option value="user">Users</option>
              <option value="course">Courses</option>
              <option value="payment">Payments</option>
              <option value="schedule">Schedules</option>
              <option value="assignment">Assignments</option>
              <option value="system">System</option>
            </select>
            <select
              value={selectedImportance}
              onChange={(e) => setSelectedImportance(e.target.value)}
              className="px-3 py-1 text-sm border rounded-md"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        )}

        {/* Activity List */}
        <div className="space-y-3">
          {filteredActivities.map((activity) => {
            const TypeIcon = activityIcons[activity.type];
            const ActionIcon = actionIcons[activity.action];

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Icon */}
                <div className={`p-2 rounded-full ${getImportanceColor(activity.importance)}`}>
                  <TypeIcon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </span>
                        {activity.user.name !== 'System' && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-600">
                              by {activity.user.name}
                            </span>
                          </>
                        )}
                        {ActionIcon && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <ActionIcon className={`h-3 w-3 ${getActionColor(activity.action)}`} />
                          </>
                        )}
                      </div>
                      
                      {/* Metadata */}
                      {activity.metadata && !compact && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {activity.metadata.course && (
                            <Badge variant="outline" className="text-xs">
                              <BookOpenIcon className="h-3 w-3 mr-1" />
                              {activity.metadata.course}
                            </Badge>
                          )}
                          {activity.metadata.student && (
                            <Badge variant="outline" className="text-xs">
                              <UserGroupIcon className="h-3 w-3 mr-1" />
                              {activity.metadata.student}
                            </Badge>
                          )}
                          {activity.metadata.amount && (
                            <Badge variant="success" className="text-xs">
                              ${activity.metadata.amount}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {!compact && (
                      <Button size="sm" variant="outline">
                        <ArrowRightIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Link */}
        {!compact && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full">
              View All Activity
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}