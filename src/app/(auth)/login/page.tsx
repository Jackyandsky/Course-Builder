'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { MagicLinkForm } from '@/components/auth/MagicLinkForm';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<'magic-link' | 'password' | 'signup'>('password');
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
        // Always redirect to account page after login/registration
        // Users can navigate to admin from there if they have permissions
        router.push('/account');
      }
    }
  }, [user, userProfile, loading, router, searchParams]);

  // Don't wait for auth check to show the login page
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">
            IGPS
          </h1>
          {/* <p className="text-gray-600">
            Modular Course Design & Management Platform
          </p> */}
        </div>
        
        {/* Show magic link form by default */}
        {authMode === 'magic-link' ? (
          <MagicLinkForm 
            onToggleMode={() => setAuthMode('password')}
            showPasswordOption={true}
          />
        ) : authMode === 'password' ? (
          <LoginForm 
            isSignUp={false}
            onToggleMode={() => setAuthMode('signup')}
          />
        ) : (
          <LoginForm 
            isSignUp={true}
            onToggleMode={() => setAuthMode('password')}
          />
        )}
        
        {/* Show different options based on current mode */}
        {authMode === 'password' && (
          <div className="text-center space-y-2">
            <button
              onClick={() => setAuthMode('magic-link')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium block w-full"
            >
              ← Back to magic link sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
