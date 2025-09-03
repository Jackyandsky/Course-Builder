'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, BookOpen, Calendar, FileText, 
  ShoppingBag, Library, Briefcase, TrendingUp,
  RefreshCw, LogIn, LogOut, Plus, Edit, Trash,
  Check, Upload, Download, User, Package
} from 'lucide-react';
import Link from 'next/link';

interface DashboardUser {
  id: string;
  email?: string;
  metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

interface ActivityItem {
  id: string;
  type: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  description: string;
  userEmail?: string;
  createdAt: string;
  metadata?: any;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCourses: 0,
    libraryItems: 0,
    proprietaryProducts: { total: 0, content: 0, products: 0, categories: 0, contentCategories: 0 },
    vocabulary: { total: 0, groups: 0 },
    enrollments: { total: 0 }
  });

  useEffect(() => {
    if (!dataLoaded) {
      loadDashboardData();
    }
  }, [dataLoaded]); // Prevent double loading

  const loadDashboardData = async () => {
    if (dataLoaded) return; // Prevent duplicate calls
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setUser(data.user);
        setRecentActivity(data.recentActivity || []);
        setDataLoaded(true);
      } else {
        console.error('Failed to load dashboard stats');
        // Set default values on error
        setStats({
          totalUsers: 0,
          activeCourses: 0,
          libraryItems: 0,
          proprietaryProducts: { total: 0, content: 0, products: 0, categories: 0, contentCategories: 0 },
          vocabulary: { total: 0, groups: 0 },
          enrollments: { total: 0 }
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Set default values on error
      setStats({
        totalUsers: 0,
        activeCourses: 0,
        libraryItems: 0,
        proprietaryProducts: { total: 0, content: 0, products: 0, categories: 0, contentCategories: 0 },
        vocabulary: { total: 0, groups: 0 },
        enrollments: { total: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.metadata?.first_name || 'Admin'}! 
            Here's an overview of your platform.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={loadDashboardData}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Link href="/admin/users" className="block">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                )}
              </div>
              <Users className="h-8 w-8 text-blue-600 ml-4" />
            </div>
          </Card>
        </Link>

        <Link href="/admin/courses" className="block">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Active Courses</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold">{stats.activeCourses}</p>
                )}
              </div>
              <BookOpen className="h-8 w-8 text-green-600 ml-4" />
            </div>
          </Card>
        </Link>

        <div className="block">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Enrollments</p>
                {loading ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold">{stats.enrollments.total} <span className="text-sm font-normal text-gray-500">courses enrolled</span></p>
                )}
              </div>
              <Calendar className="h-8 w-8 text-purple-600 ml-4" />
            </div>
          </Card>
        </div>

        <Link href="/admin/content" className="block">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Proprietary Products</p>
                {loading ? (
                  <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold">
                    {stats.proprietaryProducts.content}
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      content / {stats.proprietaryProducts.categories} categories
                    </span>
                  </p>
                )}
              </div>
              <ShoppingBag className="h-8 w-8 text-indigo-600 ml-4" />
            </div>
          </Card>
        </Link>

        <Link href="/admin/books" className="block">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Library Books</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold">{stats.libraryItems}</p>
                )}
              </div>
              <Library className="h-8 w-8 text-teal-600 ml-4" />
            </div>
          </Card>
        </Link>

        <Link href="/admin/vocabulary" className="block">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Vocabulary</p>
                {loading ? (
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold">
                    {stats.vocabulary.total} 
                    <span className="text-sm font-normal text-gray-500 ml-2">{stats.vocabulary.groups} groups</span>
                  </p>
                )}
              </div>
              <FileText className="h-8 w-8 text-pink-600 ml-4" />
            </div>
          </Card>
        </Link>
      </div>


      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Recent Activity</Card.Title>
          </Card.Header>
          <Card.Content>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        {activity.userEmail && (
                          <>
                            <span>{activity.userEmail}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{formatActivityTime(activity.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">
                No recent activity to display
              </p>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Platform Health</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">System Status</span>
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Backup</span>
                <span className="text-sm font-medium">2 hours ago</span>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
  
  // Helper functions
  function getActivityIcon(type: string) {
    const iconClass = "h-5 w-5";
    const iconMap: Record<string, JSX.Element> = {
      'login': <LogIn className={`${iconClass} text-green-500`} />,
      'logout': <LogOut className={`${iconClass} text-gray-500`} />,
      'course_created': <Plus className={`${iconClass} text-blue-500`} />,
      'course_updated': <Edit className={`${iconClass} text-blue-500`} />,
      'course_deleted': <Trash className={`${iconClass} text-red-500`} />,
      'course_enrolled': <BookOpen className={`${iconClass} text-purple-500`} />,
      'course_completed': <Check className={`${iconClass} text-green-500`} />,
      'lesson_created': <Plus className={`${iconClass} text-indigo-500`} />,
      'lesson_updated': <Edit className={`${iconClass} text-indigo-500`} />,
      'lesson_completed': <Check className={`${iconClass} text-green-500`} />,
      'task_submitted': <Upload className={`${iconClass} text-orange-500`} />,
      'task_reviewed': <Check className={`${iconClass} text-teal-500`} />,
      'order_placed': <ShoppingBag className={`${iconClass} text-pink-500`} />,
      'order_completed': <Check className={`${iconClass} text-green-500`} />,
      'content_created': <Plus className={`${iconClass} text-purple-500`} />,
      'content_updated': <Edit className={`${iconClass} text-purple-500`} />,
      'content_accessed': <Download className={`${iconClass} text-gray-500`} />,
      'book_added': <Library className={`${iconClass} text-cyan-500`} />,
      'book_updated': <Edit className={`${iconClass} text-cyan-500`} />,
      'user_registered': <User className={`${iconClass} text-green-500`} />,
      'user_updated': <Edit className={`${iconClass} text-gray-500`} />,
      'file_uploaded': <Upload className={`${iconClass} text-blue-500`} />,
      'file_deleted': <Trash className={`${iconClass} text-red-500`} />
    };
    
    return iconMap[type] || <Package className={`${iconClass} text-gray-400`} />;
  }
  
  function formatActivityTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}