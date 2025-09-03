'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth' 
}: AuthGuardProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('AuthGuard Effect - loading:', loading, 'user:', user?.email, 'userProfile:', userProfile);
    
    // Wait for loading to complete
    if (!loading) {
      if (requireAuth && !user) {
        console.log('AuthGuard - Redirecting to login (no user)');
        router.push(redirectTo);
      } else if (!requireAuth && user && userProfile) {
        // Only redirect after profile is loaded (userProfile is not null)
        console.log('AuthGuard - User:', user.email);
        console.log('AuthGuard - UserProfile:', userProfile);
        console.log('AuthGuard - Role:', userProfile?.role);
        // console.log('AuthGuard - verified_at:', userProfile?.verified_at);
        console.log('AuthGuard - Loading:', loading);
        // console.log('AuthGuard - Profile Loading:', profileLoading);
        
        const isAdminOrTeacher = userProfile?.role === 'admin' || userProfile?.role === 'teacher';
        // For existing users, assume they are verified
        const isVerified = true;
        
        console.log('Is Admin/Teacher:', isAdminOrTeacher);
        console.log('Is Verified:', isVerified);
        
        // Redirect teachers and admins to /admin if verified
        if (isAdminOrTeacher && isVerified) {
          console.log('Redirecting to /admin');
          router.push('/admin');
        } else {
          // Students and parents go to /account
          console.log('Redirecting to /account');
          router.push('/account');
        }
      } else if (!requireAuth && user && !userProfile) {
        // If profile failed to load, default to /account
        console.log('AuthGuard - Profile failed to load, defaulting to /account');
        router.push('/account');
      }
    }
  }, [user, userProfile, loading, requireAuth, redirectTo, router]);

  // Only show loading spinner if we require auth
  // For public pages (!requireAuth), show content immediately
  if (loading && requireAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If we require auth but user is not logged in, show nothing (will redirect)
  if (requireAuth && !user && !loading) {
    return null;
  }

  // If we don't require auth but user is logged in AND loading is complete, show nothing (will redirect)
  if (!requireAuth && user && !loading) {
    return null;
  }

  return <>{children}</>;
}
