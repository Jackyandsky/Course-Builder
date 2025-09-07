'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MagicLinkForm } from '@/components/auth/MagicLinkForm';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EnrollmentAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, loading } = useAuth();
  
  // Get the original enrollment URL from search params
  const redirectTo = searchParams.get('redirect');
  const courseId = searchParams.get('courseId');

  useEffect(() => {
    // If user is already logged in, redirect to enrollment
    if (!loading && user && userProfile) {
      if (redirectTo) {
        router.push(redirectTo);
      } else if (courseId) {
        router.push(`/enroll?courseId=${courseId}`);
      } else {
        router.push('/enroll');
      }
    }
  }, [user, userProfile, loading, router, redirectTo, courseId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back to enrollment link */}
        <Link
          href={redirectTo || `/enroll${courseId ? `?courseId=${courseId}` : ''}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to enrollment
        </Link>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Enrollment
          </h1>
          <p className="text-gray-600">
            Sign in or create an account to continue with your course enrollment.
          </p>
        </div>
        
        {/* Magic Link Form - No password option for streamlined flow */}
        <MagicLinkForm 
          showPasswordOption={false}
        />
        
        {/* Alternative option */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Prefer using a password?{' '}
            <Link
              href={`/login?redirect=${encodeURIComponent(redirectTo || `/enroll${courseId ? `?courseId=${courseId}` : ''}`)}`}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in with password
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}