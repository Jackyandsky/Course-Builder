'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BookOpen, ShoppingBag, Calendar, FileText, 
  User as UserIcon, CreditCard, Clock, CheckCircle 
} from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    courses: 0,
    orders: 0,
    bookings: 0,
    submissions: 0
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    getUser();
    // TODO: Fetch user stats
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user?.user_metadata?.first_name || 'Student'}!
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Courses</p>
              <p className="text-2xl font-bold">{stats.courses}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Orders</p>
              <p className="text-2xl font-bold">{stats.orders}</p>
            </div>
            <ShoppingBag className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bookings</p>
              <p className="text-2xl font-bold">{stats.bookings}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Submissions</p>
              <p className="text-2xl font-bold">{stats.submissions}</p>
            </div>
            <FileText className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/account/courses" className="block">
              <BookOpen className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="font-semibold mb-2">My Courses</h3>
              <p className="text-sm text-gray-600">
                View and manage your enrolled courses
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/account/bookings" className="block">
              <Calendar className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="font-semibold mb-2">Bookings</h3>
              <p className="text-sm text-gray-600">
                Manage your tutoring sessions and appointments
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/account/orders" className="block">
              <ShoppingBag className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="font-semibold mb-2">Order History</h3>
              <p className="text-sm text-gray-600">
                View your past purchases and downloads
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/account/submissions" className="block">
              <FileText className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="font-semibold mb-2">Submissions</h3>
              <p className="text-sm text-gray-600">
                Track your course assignments and feedback
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/account/settings" className="block">
              <UserIcon className="h-12 w-12 text-gray-600 mb-4" />
              <h3 className="font-semibold mb-2">Account Settings</h3>
              <p className="text-sm text-gray-600">
                Update your profile and preferences
              </p>
            </Link>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <div className="p-6">
            <p className="text-gray-600 text-center py-8">
              No recent activity to display
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}