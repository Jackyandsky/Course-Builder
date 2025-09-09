'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { UserRole } from '@/types/user-management';

interface LoginFormProps {
  onToggleMode: () => void;
  isSignUp?: boolean;
}

export function LoginForm({ onToggleMode, isSignUp = false }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('student'); // Default to student
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        // Validate required fields
        if (!firstName.trim()) {
          setError('First name is required');
          return;
        }
        if (!lastName.trim()) {
          setError('Last name is required');
          return;
        }

        const { user, error } = await signUp(
          email, 
          password, 
          {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
              role: role,
              needs_verification: role !== 'student' && role !== 'parent', // Auto-approve students and parents
            },
          },
          redirectTo // Pass the redirect parameter
        );

        if (error) {
          // Handle error object structure from API
          const errorMessage = error.message || error;
          
          // The API now returns properly formatted error messages
          // Just display them directly
          setError(errorMessage);
        } else if (user) {
          // Check if email confirmation is required (user exists but no session)
          const needsEmailConfirmation = user && !user.email_confirmed_at;
          
          if (needsEmailConfirmation) {
            // Email confirmation required
            setSuccessMessage('Account created! Please check your email and click the confirmation link to complete your registration.');
            // Clear the form after successful registration
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setFirstName('');
            setLastName('');
            setRole('student');
          } else if (role === 'student' || role === 'parent') {
            // Auto-approved roles with immediate access
            setSuccessMessage('Account created successfully! Signing you in...');
            // Clear form and redirect quickly
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setFirstName('');
            setLastName('');
            setTimeout(() => {
              // User will be redirected by auth state change
            }, 1000);
          } else {
            // Roles that need admin verification
            setSuccessMessage('Your account has been created successfully! Please wait for an administrator to verify your account. You will receive an email once approved.');
            // Clear the form after successful registration
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setFirstName('');
            setLastName('');
            setRole('student');
          }
        }
      } else {
        const { user, error } = await signIn(email, password);

        if (error) {
          setError(error.message);
        } else if (user) {
          // Success - user will be redirected by auth state change
          // AuthGuard and layouts will handle role-based redirection and verification
          console.log('LoginForm - Login successful, redirecting...');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show success state instead of form after successful registration
  if (isSignUp && successMessage && !error) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <svg className="h-6 w-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-md text-sm mb-6">
            {successMessage}
          </div>
          {successMessage.includes('Signing you in') && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
          )}
          {successMessage.includes('check your email') && (
            <button
              onClick={() => onToggleMode()}
              className="text-gray-900 hover:text-gray-700 text-sm font-medium"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isSignUp 
            ? 'Join IGPS to start amazing courses' 
            : 'Welcome back! Please sign in to your account'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="John"
              />
              <Input
                label="Last Name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Doe"
              />
            </div>
            
            <Select
              label="I am a..."
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              required
            >
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Administrator</option>
            </Select>
            
            {role !== 'student' && role !== 'parent' && (
              <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-md text-sm">
                <strong>Note:</strong> Teacher and Administrator accounts require verification. You'll receive an email once your account is approved.
              </div>
            )}
          </>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="john@example.com"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />

        {isSignUp && (
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        )}

        {error && (
          <div className="bg-gray-50 border border-gray-300 text-gray-900 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-md text-sm">
            <div className="flex items-center">
              {successMessage.includes('Signing you in') && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              )}
              {successMessage.includes('check your email') && (
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                </svg>
              )}
              {successMessage}
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading || successMessage}
        >
          {successMessage && successMessage.includes('Signing you in') 
            ? 'Signing you in...' 
            : isSignUp ? 'Create Account' : 'Sign In'
          }
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onToggleMode}
            disabled={loading || successMessage}
            className={`text-sm font-medium ${
              loading || successMessage 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-primary-600 hover:text-primary-700'
            }`}
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>
      </form>
    </div>
  );
}
