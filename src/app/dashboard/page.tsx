'use client';

import { useEffect, useState } from 'react';
import { 
  AcademicCapIcon, BookOpenIcon, CalendarIcon, ClockIcon, 
  CheckCircleIcon, DocumentTextIcon, CogIcon, LanguageIcon, 
  KeyIcon, UsersIcon
} from '@heroicons/react/24/outline';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, Spinner } from '@/components/ui';

// Import all the services
import { courseService } from '@/lib/supabase/courses';
import { bookService } from '@/lib/supabase/books';
import { scheduleService } from '@/lib/supabase/schedules';
import { lessonService } from '@/lib/supabase/lessons';
import { taskService } from '@/lib/supabase/tasks';
import { vocabularyService } from '@/lib/supabase/vocabulary';

// Import additional services
import { objectiveService } from '@/lib/supabase/objectives';
import { methodService } from '@/lib/supabase/methods';
// import { decoderService } from '@/lib/supabase/decoders'; // This might not exist yet

interface DashboardStats {
  courses: number;
  schedules: number;
  lessons: number;
  tasks: number;
  books: number;
  vocabulary: number;
  vocabularyGroups: number;
  objectives: number;
  methods: number;
  decoders: number;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400'
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400'
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400'
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400'
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/20',
    text: 'text-indigo-600 dark:text-indigo-400'
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/20',
    text: 'text-pink-600 dark:text-pink-400'
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/20',
    text: 'text-teal-600 dark:text-teal-400'
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-600 dark:text-yellow-400'
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400'
  },
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-900/20',
    text: 'text-gray-600 dark:text-gray-400'
  }
} as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    courses: 0,
    schedules: 0,
    lessons: 0,
    tasks: 0,
    books: 0,
    vocabulary: 0,
    vocabularyGroups: 0,
    objectives: 0,
    methods: 0,
    decoders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Load statistics with error handling for each service
      const [
        courses,
        books,
        schedules,
        lessons,
        tasks,
        vocabularyStats,
      ] = await Promise.all([
        courseService.getCourses({}).then(data => data.length).catch(() => 0),
        bookService.getBooks({}).then(data => data.length).catch(() => 0),
        scheduleService.getSchedules({}).then(data => data.length).catch(() => 0),
        lessonService.getLessons({}).then(data => data.length).catch(() => 0),
        taskService.getTasks({}).then(data => data.length).catch(() => 0),
        vocabularyService.getVocabularyStats().catch(() => ({
          vocabulary: { total: 0, beginner: 0, intermediate: 0, advanced: 0, expert: 0 },
          groups: { total: 0, beginner: 0, intermediate: 0, advanced: 0, expert: 0 }
        })),
      ]);

      // Load objectives and methods separately with fallbacks
      let objectives = 0;
      let methods = 0;
      
      try {
        objectives = await objectiveService.getObjectives({}).then(data => data.length);
      } catch (error) {
        console.warn('Failed to load objectives:', error);
      }
      
      try {
        methods = await methodService.getMethods({}).then(data => data.length);
      } catch (error) {
        console.warn('Failed to load methods:', error);
      }

      setStats({
        courses,
        schedules,
        lessons,
        tasks,
        objectives,
        methods,
        books,
        vocabulary: vocabularyStats.vocabulary.total,
        vocabularyGroups: vocabularyStats.groups.total,
        decoders: 3,  // Placeholder - using mock data count from decoders page
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      // Set default stats if everything fails
      setStats({
        courses: 0,
        schedules: 0,
        lessons: 0,
        tasks: 0,
        objectives: 0,
        methods: 0,
        books: 0,
        vocabulary: 0,
        vocabularyGroups: 0,
        decoders: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Courses',
      value: stats.courses,
      icon: AcademicCapIcon,
      color: 'blue' as keyof typeof colorClasses,
      href: '/courses'
    },
    {
      title: 'Schedules', 
      value: stats.schedules,
      icon: CalendarIcon,
      color: 'purple' as keyof typeof colorClasses,
      href: '/schedules'
    },
    {
      title: 'Lessons',
      value: stats.lessons,
      icon: ClockIcon,
      color: 'green' as keyof typeof colorClasses,
      href: '/lessons'
    },
    {
      title: 'Tasks',
      value: stats.tasks,
      icon: CheckCircleIcon,
      color: 'orange' as keyof typeof colorClasses,
      href: '/tasks'
    },
    {
      title: 'Books',
      value: stats.books,
      icon: BookOpenIcon,
      color: 'indigo' as keyof typeof colorClasses,
      href: '/books'
    },
    {
      title: 'Vocabulary',
      value: stats.vocabulary,
      icon: LanguageIcon,
      color: 'pink' as keyof typeof colorClasses,
      href: '/vocabulary'
    },
    {
      title: 'Vocab Groups',
      value: stats.vocabularyGroups,
      icon: UsersIcon,
      color: 'teal' as keyof typeof colorClasses,
      href: '/vocabulary/groups'
    },
    {
      title: 'Objectives',
      value: stats.objectives,
      icon: DocumentTextIcon,
      color: 'yellow' as keyof typeof colorClasses,
      href: '/objectives'
    },
    {
      title: 'Methods',
      value: stats.methods,
      icon: CogIcon,
      color: 'red' as keyof typeof colorClasses,
      href: '/methods'
    },
    {
      title: 'Decoders',
      value: stats.decoders,
      icon: KeyIcon,
      color: 'gray' as keyof typeof colorClasses,
      href: '/decoders'
    }
  ];

  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayout>
        <div className="p-6 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome to Course Builder. Manage your courses, books, and educational content.
            </p>
          </div>

          {/* Comprehensive Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((card) => {
              const IconComponent = card.icon;
              const colors = colorClasses[card.color];
              return (
                <Card key={card.title} className="hover:shadow-md transition-shadow cursor-pointer">
                  <Card.Content className="p-4">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 p-2 ${colors.bg} rounded-lg`}>
                        <IconComponent className={`h-6 w-6 ${colors.text}`} />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          {card.title}
                        </p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {loading ? <Spinner size="sm" /> : card.value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Activity</h2>
            </Card.Header>
            <Card.Content>
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-xl">📊</span>
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No activity yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Start by creating your first course or importing educational materials.
                </p>
              </div>
            </Card.Content>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
