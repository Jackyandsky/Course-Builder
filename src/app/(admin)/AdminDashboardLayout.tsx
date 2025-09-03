'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui';
import Link from 'next/link';
import { UserProfile } from '@/components/auth';
import { 
  LayoutDashboard, Users, Book, FileText, GraduationCap, 
  Target, Calendar, SpellCheck, LogOut, Settings
} from 'lucide-react';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, userProfile, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/admin');
      } else if (userProfile && userProfile.role !== 'admin') {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, userProfile, router]);

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Courses', href: '/admin/courses', icon: GraduationCap },
    { name: 'Books', href: '/admin/books', icon: Book },
    { name: 'Content', href: '/admin/content', icon: FileText },
    { name: 'Objectives', href: '/admin/objectives', icon: Target },
    { name: 'Schedules', href: '/admin/schedules', icon: Calendar },
    { name: 'Vocabulary', href: '/admin/vocabulary', icon: SpellCheck },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">IGPS</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <UserProfile />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <div className="w-64 bg-white shadow-md h-[calc(100vh-4rem)]">
          <nav className="mt-5 px-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 hover:text-blue-600 transition-colors mb-1"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
            <button
              onClick={signOut}
              className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 hover:text-red-600 transition-colors mt-4 text-left"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </nav>
        </div>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
