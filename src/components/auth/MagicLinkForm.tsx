'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';

interface MagicLinkFormProps {
  onToggleMode?: () => void;
  showPasswordOption?: boolean;
}

export function MagicLinkForm({ onToggleMode, showPasswordOption = true }: MagicLinkFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const { signInWithMagicLink } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Send magic link with redirect URL preserved
      const { success, error } = await signInWithMagicLink(
        email,
        {
          // Can add metadata here if needed for new users
          signup_source: redirectTo?.includes('enroll') ? 'enrollment' : 'general',
        },
        redirectTo
      );

      if (success) {
        setIsSuccess(true);
      } else {
        setError(error?.message || 'Failed to send magic link');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Check Your Email!
        </h2>
        <p className="text-gray-600 mb-6">
          We've sent a magic link to <strong>{email}</strong>
        </p>
        <div className="space-y-3 text-sm text-gray-500">
          <p>
            Click the link in the email to sign in instantly.
          </p>
          <p>
            The link will expire in 1 hour for security reasons.
          </p>
          {redirectTo && (
            <p className="text-xs bg-blue-50 p-2 rounded">
              You'll be redirected to your requested page after signing in.
            </p>
          )}
        </div>
        <div className="mt-6 pt-6 border-t">
          <button
            onClick={() => {
              setIsSuccess(false);
              setEmail('');
            }}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
      <div className="text-center mb-6">
        <div className="mb-4">
          <Mail className="h-12 w-12 text-primary-600 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Sign In with Magic Link
        </h2>
        <p className="text-gray-600 mt-2">
          No password needed! We'll email you a secure link to sign in instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
          autoComplete="email"
          autoFocus
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full flex items-center justify-center gap-2"
          loading={isLoading}
          disabled={isLoading || !email}
        >
          {isLoading ? (
            'Sending magic link...'
          ) : (
            <>
              Send Magic Link
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {showPasswordOption && onToggleMode && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={onToggleMode}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Sign in with password instead
              </button>
            </div>
          </>
        )}
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
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
  );
}