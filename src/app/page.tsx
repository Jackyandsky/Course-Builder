'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary-600">
                  Course Builder
                </h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              {user ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/courses" 
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                  >
                    Courses
                  </Link>
                  <Link 
                    href="/books" 
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                  >
                    Books
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth" 
                    className="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Modular Course Design & Management Platform
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            A highly flexible, customizable online course construction tool. 
            Empower educators, trainers, and content creators to efficiently design, 
            combine, manage, and share structured, modular educational content.
          </p>
          
          <div className="mt-10 flex justify-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="primary">Go to Dashboard</Button>
                </Link>
                <Link href="/courses">
                  <Button variant="outline">View Courses</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="primary">Get Started</Button>
                </Link>
                <Link href="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="card p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Course Builder. Built for educators and content creators.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: '📚',
    title: 'Course Management',
    description: 'Create and manage courses by combining books, schedules, objectives, and methods into complete educational experiences.',
  },
  {
    icon: '📖',
    title: 'Book Library',
    description: 'Centralized library of reusable educational materials and books that can be associated with multiple courses.',
  },
  {
    icon: '📝',
    title: 'Vocabulary System',
    description: 'Organize vocabulary into groups with CEFR levels, part of speech, and definitions for language learning.',
  },
  {
    icon: '📅',
    title: 'Schedule Design',
    description: 'Create flexible teaching schedules with calendar views, lesson planning, and attendance tracking.',
  },
  {
    icon: '🎯',
    title: 'Learning Objectives',
    description: 'Build a library of reusable teaching objectives to ensure consistency and continuity across courses.',
  },
  {
    icon: '🔧',
    title: 'Teaching Methods',
    description: 'Manage various teaching strategies including PBL, flipped classroom, and group discussions.',
  },
];
