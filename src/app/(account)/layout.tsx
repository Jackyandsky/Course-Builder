'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Spinner } from '@/components/ui';
import Link from 'next/link';
import { UserProfile } from '@/components/auth';
import { 
  Home, BookOpen, ShoppingBag, Calendar, 
  FileText, Settings, LogOut 
} from 'lucide-react';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login?redirect=/account');
        return;
      }

      setUser(session.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation = [
    { name: 'Overview', href: '/account', icon: Home },
    { name: 'My Courses', href: '/account/courses', icon: BookOpen },
    { name: 'Orders', href: '/account/orders', icon: ShoppingBag },
    { name: 'Bookings', href: '/account/bookings', icon: Calendar },
    { name: 'Submissions', href: '/account/submissions', icon: FileText },
    { name: 'Settings', href: '/account/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
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
        {/* Sidebar */}
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
              onClick={handleSignOut}
              className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 hover:text-red-600 transition-colors mt-4 text-left"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}