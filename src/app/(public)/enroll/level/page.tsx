'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, BookOpen, Target, Trophy, Zap } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

const LEVELS = [
  {
    id: 'beginner',
    title: 'Beginner',
    icon: BookOpen,
    color: 'from-green-400 to-green-600',
    description: 'New to this subject or just starting your learning journey',
    features: ['Foundation concepts', 'Step-by-step guidance', 'Basic exercises', 'Supportive pace']
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    icon: Target,
    color: 'from-blue-400 to-blue-600',
    description: 'Some experience and ready to deepen your understanding',
    features: ['Advanced concepts', 'Critical thinking', 'Complex problems', 'Moderate pace']
  },
  {
    id: 'advanced',
    title: 'Advanced',
    icon: Trophy,
    color: 'from-purple-400 to-purple-600',
    description: 'Experienced and looking for mastery-level challenges',
    features: ['Expert topics', 'Independent work', 'Research projects', 'Fast pace']
  },
  {
    id: 'custom',
    title: 'Custom Path',
    icon: Zap,
    color: 'from-orange-400 to-orange-600',
    description: 'Let us create a personalized learning path based on your specific needs',
    features: ['Tailored content', 'Flexible schedule', 'Mixed difficulty', 'Your pace']
  }
];

interface Course {
  id: string;
  title: string;
  description?: string;
}

export default function LevelSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  useEffect(() => {
    if (courseId) {
      loadCourse();
    } else {
      router.push('/courses');
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const response = await fetch(`/api/public/courses/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      } else {
        alert('Course not found');
        router.push('/courses');
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
  };

  const handleContinue = () => {
    if (selectedLevel) {
      router.push(`/enroll/plan?courseId=${courseId}&level=${selectedLevel}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Learning Level
          </h1>
          {course && (
            <p className="text-lg text-gray-600">
              For: <span className="font-semibold">{course.title}</span>
            </p>
          )}
        </div>

        {/* Level Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {LEVELS.map((level) => {
            const Icon = level.icon;
            const isSelected = selectedLevel === level.id;
            
            return (
              <button
                key={level.id}
                onClick={() => handleLevelSelect(level.id)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-white shadow-xl scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${level.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {level.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {level.description}
                    </p>
                    <ul className="space-y-1">
                      {level.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Course
          </button>

          <button
            onClick={handleContinue}
            disabled={!selectedLevel}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              selectedLevel
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue to Study Plan
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}