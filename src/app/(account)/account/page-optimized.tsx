'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { 
  BookOpen, ShoppingBag, FileText, 
  Clock, CheckCircle, LogIn, LogOut, ShoppingCart,
  Library, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { fetchWithTimeout } from '@/lib/utils/api-timeout';

interface UserStats {
  courses: number;
  orders: number;
  totalSpent: number;
  content: number;
  completedCourses: number;
  inProgressCourses: number;
  totalSubmissions: number;
  completedSubmissions: number;
}

interface RecentActivity {
  id: string;
  type: 'login' | 'logout' | 'order' | 'course_start' | 'course_complete' | 'content_access' | 'booking';
  title: string;
  description: string;
  date: string;
  icon: any;
  color: string;
}

// Cache for stats data
const STATS_CACHE_KEY = 'account_stats_cache';
const STATS_CACHE_TTL = 30000; // 30 seconds
const ACTIVITY_CACHE_KEY = 'account_activity_cache';
const ACTIVITY_CACHE_TTL = 60000; // 1 minute

function getCachedData<T>(key: string, ttl: number): T | null {
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < ttl) {
        return data.value;
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
}

function setCachedData<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      value,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

export default function OptimizedAccountPage() {
  const { user, userProfile } = useAuth();
  
  // Initialize with cached data immediately for instant UI
  const [stats, setStats] = useState<UserStats>(() => 
    getCachedData<UserStats>(STATS_CACHE_KEY, STATS_CACHE_TTL) || {
      courses: 0,
      orders: 0,
      totalSpent: 0,
      content: 0,
      completedCourses: 0,
      inProgressCourses: 0,
      totalSubmissions: 0,
      completedSubmissions: 0
    }
  );
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>(() =>
    getCachedData<RecentActivity[]>(ACTIVITY_CACHE_KEY, ACTIVITY_CACHE_TTL) || []
  );
  
  const [statsLoading, setStatsLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (user && !fetchingRef.current) {
      fetchingRef.current = true;
      
      // Fetch both in parallel
      Promise.all([
        fetchUserStats(),
        fetchRecentActivity()
      ]).finally(() => {
        fetchingRef.current = false;
      });
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;
    
    // Use cached data if fresh enough
    const cached = getCachedData<UserStats>(STATS_CACHE_KEY, STATS_CACHE_TTL);
    if (cached) {
      setStats(cached);
      return;
    }
    
    setStatsLoading(true);
    
    try {
      const response = await fetchWithTimeout('/api/account/stats-optimized', {
        timeout: 3000,
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setCachedData(STATS_CACHE_KEY, data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Keep using cached or default data on error
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    if (!user) return;
    
    // Use cached data if fresh enough
    const cached = getCachedData<RecentActivity[]>(ACTIVITY_CACHE_KEY, ACTIVITY_CACHE_TTL);
    if (cached) {
      setRecentActivity(cached);
      return;
    }
    
    setActivityLoading(true);
    
    try {
      const response = await fetchWithTimeout('/api/account/activity', {
        timeout: 3000,
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform activities to include icon components
        const activities: RecentActivity[] = data.activities.map((activity: any) => ({
          ...activity,
          icon: getIconComponent(activity.icon)
        }));
        
        setRecentActivity(activities);
        setCachedData(ACTIVITY_CACHE_KEY, activities);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Keep using cached or empty data on error
    } finally {
      setActivityLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return BookOpen;
      case 'ShoppingBag': return ShoppingBag;
      case 'ShoppingCart': return ShoppingCart;
      case 'FileText': return FileText;
      case 'CheckCircle': return CheckCircle;
      case 'LogIn': return LogIn;
      case 'LogOut': return LogOut;
      case 'Calendar': return Calendar;
      default: return FileText;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Show skeleton loader for stats cards
  const StatCard = ({ href, title, value, subtext, icon: Icon, loading }: any) => (
    <Link href={href}>
      <Card className="p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-blue-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">
              {loading ? (
                <span className="inline-block h-7 w-12 bg-gray-200 rounded animate-pulse" />
              ) : (
                value
              )}
            </p>
            {subtext && !loading && (
              <p className="text-xs text-blue-600 mt-1">{subtext}</p>
            )}
          </div>
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Account Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user?.email}
        </p>
      </div>

      {/* Metrics Panel - Show immediately with loading states */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          href="/account/courses"
          title="My Courses"
          value={stats.courses}
          subtext={stats.inProgressCourses > 0 ? `${stats.inProgressCourses} in progress` : null}
          icon={BookOpen}
          loading={statsLoading && stats.courses === 0}
        />

        <StatCard
          href="/account/orders"
          title="Orders"
          value={stats.orders}
          subtext={stats.totalSpent > 0 ? formatCurrency(stats.totalSpent) + ' total' : null}
          icon={ShoppingBag}
          loading={statsLoading && stats.orders === 0}
        />

        <StatCard
          href="/account/library"
          title="My Library"
          value={stats.content}
          subtext="Items available"
          icon={Library}
          loading={statsLoading && stats.content === 0}
        />

        <StatCard
          href="/account/submissions"
          title="Submissions"
          value={stats.totalSubmissions}
          subtext={stats.completedSubmissions > 0 ? `${stats.completedSubmissions} completed` : null}
          icon={FileText}
          loading={statsLoading && stats.totalSubmissions === 0}
        />
      </div>

      {/* Recent Activity - Show immediately, update when loaded */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Recent Activity</h2>
        {activityLoading && recentActivity.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-gray-200 rounded" />
                </div>
              </Card>
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-2">
            {recentActivity.slice(0, 5).map((activity) => {
              const Icon = activity.icon;
              return (
                <Card key={activity.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${activity.color || 'text-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8">
            <div className="text-center">
              <Clock className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600">No recent activity</p>
              <p className="text-xs text-gray-500 mt-1">Your activity will appear here</p>
            </div>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {stats.orders > 0 && (
        <div className="pt-6 border-t border-gray-200">
          <div className="flex gap-6 text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-900">{stats.inProgressCourses}</span> in progress
            </div>
            <div>
              <span className="font-medium text-gray-900">{stats.completedCourses}</span> completed
            </div>
            <div>
              Total spent: <span className="font-medium text-gray-900">{formatCurrency(stats.totalSpent)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}