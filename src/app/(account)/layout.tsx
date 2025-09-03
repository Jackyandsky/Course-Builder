'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui';
import Link from 'next/link';
import { UserProfile } from '@/components/auth';
import { 
  Home, BookOpen, ShoppingBag, Calendar, 
  FileText, Settings, LogOut, Library, Users, Shield, Crown, CreditCard 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userProfile, loading: authLoading, signOut } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Non-blocking auth check - only redirect if definitely no user after auth completes
  useEffect(() => {
    // Don't block - let page render immediately
    if (!authLoading && !user && !hasRedirected) {
      // Only redirect once, and only if auth is complete
      setHasRedirected(true);
      router.push('/login?redirect=' + pathname);
    }
  }, [authLoading, user, hasRedirected, pathname]);

  const handleSignOut = async () => {
    await signOut();
  };

  // Don't block rendering - show layout immediately
  // If user is not authenticated, they'll be redirected after auth check completes
  // But continue to show the UI while checking

  const navigation = [
    { name: 'Overview', href: '/account', icon: Home },
    // { name: 'Teams', href: '/account/teams', icon: Users },
    { name: 'My Courses', href: '/account/courses', icon: BookOpen },
    { name: 'My Library', href: '/account/library', icon: Library },
    { name: 'Orders', href: '/account/orders', icon: ShoppingBag },
    { name: 'Bookings', href: '/account/bookings', icon: Calendar },
    { name: 'Submissions', href: '/account/submissions', icon: FileText },
    { name: 'Premium Tools', href: '/account/premium', icon: Crown },
    // { name: 'Pricing', href: '/account/pricing', icon: CreditCard },  // Hidden - access via Premium Tools page
    // { name: 'Settings', href: '/account/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation - Made sticky */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">IGPS</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {/* Admin Dashboard Link for Admins/Teachers */}
              {(userProfile?.role === 'admin' || userProfile?.role === 'teacher') && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2"
                  title="Switch to Admin Dashboard"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin Dashboard</span>
                </Link>
              )}
              <UserProfile />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar - Sticky with adjusted top position */}
        <div className="w-72 sticky top-16 h-[calc(100vh-4rem)] bg-gray-50 border-r border-gray-200 overflow-y-auto">
          {/* Account Dashboard Title in Sidebar */}
          <div className="flex h-16 shrink-0 items-center px-6">
            <h1 className="text-xl font-bold text-blue-600">Account Dashboard</h1>
          </div>
          <nav className="px-6">
            {navigation.map((item) => {
              // Check if this is the active route
              const isActive = item.href === '/account' 
                ? pathname === '/account'
                : pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors mb-1",
                    isActive 
                      ? "bg-blue-100 text-blue-700" 
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
                  )} />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors mt-4 text-left"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" />
              Sign Out
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}