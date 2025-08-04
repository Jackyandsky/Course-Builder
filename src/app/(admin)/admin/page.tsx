'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui/Card';
import { 
  Users, BookOpen, Calendar, FileText, 
  ShoppingBag, Library, Briefcase, TrendingUp 
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCourses: 0,
    totalBookings: 0,
    pendingSubmissions: 0,
    totalOrders: 0,
    libraryItems: 0
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    // TODO: Load actual stats from database
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.user_metadata?.first_name || 'Admin'}! 
          Here's an overview of your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Courses</p>
              <p className="text-2xl font-bold">{stats.activeCourses}</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold">{stats.totalBookings}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Submissions</p>
              <p className="text-2xl font-bold">{stats.pendingSubmissions}</p>
            </div>
            <FileText className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Management Sections */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Management Areas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/courses" className="block">
              <BookOpen className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="font-semibold mb-2">Course Management</h3>
              <p className="text-sm text-gray-600">
                Create and manage courses, lessons, and objectives
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/schedules" className="block">
              <Calendar className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="font-semibold mb-2">Schedule Management</h3>
              <p className="text-sm text-gray-600">
                Manage class schedules and tutoring sessions
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/books" className="block">
              <Library className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="font-semibold mb-2">Library Management</h3>
              <p className="text-sm text-gray-600">
                Manage virtual and physical library resources
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/vocabulary" className="block">
              <FileText className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="font-semibold mb-2">Vocabulary & Content</h3>
              <p className="text-sm text-gray-600">
                Manage vocabulary lists and learning materials
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/decoders" className="block">
              <Briefcase className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="font-semibold mb-2">Store Products</h3>
              <p className="text-sm text-gray-600">
                Manage Decoder and LEX vocabulary products
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/users" className="block">
              <Users className="h-12 w-12 text-gray-600 mb-4" />
              <h3 className="font-semibold mb-2">User Management</h3>
              <p className="text-sm text-gray-600">
                Manage students, tutors, and administrators
              </p>
            </Link>
          </Card>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Recent Activity</Card.Title>
          </Card.Header>
          <Card.Content>
            <p className="text-gray-600 text-center py-8">
              No recent activity to display
            </p>
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
}