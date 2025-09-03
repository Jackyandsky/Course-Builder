'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    // Only redirect if we're done loading and have a user
    if (!loading && user && userProfile) {
      // Check if there's a redirect parameter
      const redirectTo = searchParams.get('redirect');
      
      if (redirectTo) {
        // Respect the redirect parameter
        router.push(redirectTo);
      } else {
        // Default behavior: redirect based on role
        const isAdminOrTeacher = userProfile?.role === 'admin' || userProfile?.role === 'teacher';
        if (isAdminOrTeacher) {
          router.push('/admin');
        } else {
          router.push('/account');
        }
      }
    }
  }, [user, userProfile, loading, router, searchParams]);

  // Don't wait for auth check to show the login page
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">
            Course Builder
          </h1>
          <p className="text-gray-600">
            Modular Course Design & Management Platform
          </p>
        </div>
        
        <LoginForm 
          isSignUp={isSignUp}
          onToggleMode={() => setIsSignUp(!isSignUp)}
        />
        
        <div className="text-center text-sm text-gray-500">
          <p>
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-primary-600 hover:text-primary-700">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary-600 hover:text-primary-700">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
