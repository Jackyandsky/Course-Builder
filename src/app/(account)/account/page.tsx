'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BookOpen, ShoppingBag, FileText, 
  Clock, CheckCircle, LogIn, LogOut, ShoppingCart,
  Library, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function AccountPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({
    courses: 0,
    orders: 0,
    totalSpent: 0,
    content: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalSubmissions: 0,
    completedSubmissions: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchRecentActivity();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/account/stats');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/account/activity');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform activities to include icon components
      const activities: RecentActivity[] = data.activities.map((activity: any) => ({
        ...activity,
        icon: getIconComponent(activity.icon)
      }));
      
      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Account Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user?.email}
        </p>
      </div>

      {/* Metrics Panel - Combined Stats and Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/account/courses">
          <Card className="p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-blue-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">My Courses</p>
                <p className="text-2xl font-semibold text-gray-900">{loading ? '...' : stats.courses}</p>
                {stats.inProgressCourses > 0 && (
                  <p className="text-xs text-blue-600 mt-1">{stats.inProgressCourses} in progress</p>
                )}
              </div>
              <BookOpen className="h-5 w-5 text-gray-400" />
            </div>
          </Card>
        </Link>

        <Link href="/account/orders">
          <Card className="p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-blue-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{loading ? '...' : stats.orders}</p>
                {stats.totalSpent > 0 && (
                  <p className="text-xs text-gray-600 mt-1">{formatCurrency(stats.totalSpent)} total</p>
                )}
              </div>
              <ShoppingBag className="h-5 w-5 text-gray-400" />
            </div>
          </Card>
        </Link>

        <Link href="/account/library">
          <Card className="p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-blue-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">My Library</p>
                <p className="text-2xl font-semibold text-gray-900">{loading ? '...' : stats.content}</p>
                <p className="text-xs text-gray-600 mt-1">Items available</p>
              </div>
              <Library className="h-5 w-5 text-gray-400" />
            </div>
          </Card>
        </Link>

        <Link href="/account/submissions">
          <Card className="p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:border-blue-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Submissions</p>
                <p className="text-2xl font-semibold text-gray-900">{loading ? '...' : stats.totalSubmissions}</p>
                {stats.completedSubmissions > 0 && (
                  <p className="text-xs text-green-600 mt-1">{stats.completedSubmissions} completed</p>
                )}
              </div>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
          </Card>
        </Link>
      </div>


      {/* Recent Activity - Minimal Style */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Recent Activity</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
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