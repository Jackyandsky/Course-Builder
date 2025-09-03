'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AdminDashboardLayout } from '@/components/layout/AdminDashboardLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  // Non-blocking auth check - only redirect if definitely no user/wrong role after auth completes
  useEffect(() => {
    // Don't block - let page render immediately
    if (!authLoading) {
      if (!user && !hasRedirected) {
        // Only redirect once, and only if auth is complete
        setHasRedirected(true);
        router.push('/login?redirect=' + pathname);
      } else if (user && userProfile && !roleChecked) {
        // Check role only after we have both user and profile
        const userRole = userProfile.role || user.user_metadata?.role || 'student';
        
        if (userRole !== 'admin' && userRole !== 'teacher') {
          setRoleChecked(true);
          router.push('/account');
        } else {
          setRoleChecked(true);
        }
      }
    }
  }, [authLoading, user, userProfile, hasRedirected, roleChecked, pathname]);

  // Don't block rendering - show layout immediately
  // If user is not authenticated or authorized, they'll be redirected after auth check completes
  // But continue to show the UI while checking
  return (
    <ToastProvider>
      <AdminDashboardLayout>{children}</AdminDashboardLayout>
    </ToastProvider>
  );
}