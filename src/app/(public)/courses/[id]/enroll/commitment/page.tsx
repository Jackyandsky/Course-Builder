'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, BookOpen, Clock, Calendar, Target, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { courseService } from '@/lib/supabase/courses';

interface Course {
  id: string;
  title: string;
  description?: string;
  category?: { name: string };
}

const STUDY_OPTIONS = {
  booksPerPeriod: [
    {
      id: 'light',
      name: 'Light Reading',
      value: '1-2 books',
      description: 'Perfect for busy schedules or beginners',
      icon: '📖',
      timeCommitment: '2-4 hours/week',
      color: 'green'
    },
    {
      id: 'moderate',
      name: 'Moderate Pace',
      value: '3-4 books', 
      description: 'Balanced approach for steady progress',
      icon: '📚',
      timeCommitment: '5-7 hours/week',
      color: 'blue'
    },
    {
      id: 'intensive',
      name: 'Intensive Study',
      value: '5+ books',
      description: 'Accelerated learning for dedicated students',
      icon: '📑',
      timeCommitment: '8+ hours/week',
      color: 'purple'
    }
  ],
  studyDuration: [
    {
      id: 'short',
      name: 'Short-term',
      value: '1-2 months',
      description: 'Quick intensive program',
      icon: '⚡',
      color: 'red'
    },
    {
      id: 'standard',
      name: 'Standard',
      value: '3-4 months',
      description: 'Most popular timeframe',
      icon: '📅',
      color: 'blue'
    },
    {
      id: 'extended',
      name: 'Extended',
      value: '5-6 months',
      description: 'Thorough deep-dive approach',
      icon: '📆',
      color: 'green'
    },
    {
      id: 'longterm',
      name: 'Long-term',
      value: '6+ months',
      description: 'Comprehensive mastery program',
      icon: '🗓️',
      color: 'purple'
    }
  ],
  weeklyTime: [
    {
      id: 'casual',
      name: 'Casual',
      value: '2-4 hours/week',
      description: 'Light commitment, flexible schedule',
      icon: '🌱',
      color: 'green'
    },
    {
      id: 'regular',
      name: 'Regular',
      value: '5-7 hours/week',
      description: 'Steady progress with good balance',
      icon: '⚖️',
      color: 'blue'
    },
    {
      id: 'dedicated',
      name: 'Dedicated',
      value: '8-10 hours/week',
      description: 'Serious commitment for faster results',
      icon: '🎯',
      color: 'orange'
    },
    {
      id: 'intensive',
      name: 'Intensive',
      value: '10+ hours/week',
      description: 'Maximum commitment for rapid mastery',
      icon: '🚀',
      color: 'purple'
    }
  ]
};

export default function CommitmentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params.id as string;
  const selectedLevel = searchParams.get('level') || '';
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState({
    booksPerPeriod: '',
    studyDuration: '',
    weeklyTime: ''
  });

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const data = await courseService.getCourse(courseId);
      setCourse(data);
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelection = (category: string, value: string) => {
    setSelections(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleContinue = () => {
    const allSelected = Object.values(selections).every(value => value !== '');
    if (allSelected) {
      const queryParams = new URLSearchParams({
        level: selectedLevel,
        ...selections
      });
      router.push(`/courses/${courseId}/enroll/contact?${queryParams}`);
    }
  };

  const handleBack = () => {
    router.push(`/courses/${courseId}/enroll`);
  };

  const canContinue = Object.values(selections).every(value => value !== '');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              <Target className="h-4 w-4" />
              Step 2 of 3: Study Planning
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Plan Your Study Journey</h1>
            <p className="text-gray-600 text-lg">
              Help us understand your availability and learning goals
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Books per Period */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            How many books would you like to study per month?
          </h3>
          <p className="text-gray-600 mb-6">Choose based on your reading speed and available time</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {STUDY_OPTIONS.booksPerPeriod.map((option) => (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-300 ${
                  selections.booksPerPeriod === option.id
                    ? 'ring-2 ring-blue-500 shadow-lg transform scale-105'
                    : 'hover:shadow-md hover:transform hover:scale-102'
                }`}
                onClick={() => handleSelection('booksPerPeriod', option.id)}
              >
                <Card.Content className="p-6 text-center">
                  <div className="text-3xl mb-3">{option.icon}</div>
                  <h4 className="font-bold text-gray-900 mb-1">{option.name}</h4>
                  <p className="text-lg text-blue-600 font-semibold mb-2">{option.value}</p>
                  <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                  <div className="text-xs text-gray-500">
                    Suggested: {option.timeCommitment}
                  </div>
                  {selections.booksPerPeriod === option.id && (
                    <div className="mt-3 flex items-center justify-center gap-1 text-blue-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </Card.Content>
              </Card>
            ))}
          </div>
        </div>

        {/* Study Duration */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            What's your preferred study duration?
          </h3>
          <p className="text-gray-600 mb-6">Choose the timeframe that fits your goals</p>
          
          <div className="grid md:grid-cols-4 gap-6">
            {STUDY_OPTIONS.studyDuration.map((option) => (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-300 ${
                  selections.studyDuration === option.id
                    ? 'ring-2 ring-blue-500 shadow-lg transform scale-105'
                    : 'hover:shadow-md hover:transform hover:scale-102'
                }`}
                onClick={() => handleSelection('studyDuration', option.id)}
              >
                <Card.Content className="p-6 text-center">
                  <div className="text-3xl mb-3">{option.icon}</div>
                  <h4 className="font-bold text-gray-900 mb-1">{option.name}</h4>
                  <p className="text-lg text-green-600 font-semibold mb-2">{option.value}</p>
                  <p className="text-sm text-gray-600">{option.description}</p>
                  {selections.studyDuration === option.id && (
                    <div className="mt-3 flex items-center justify-center gap-1 text-blue-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </Card.Content>
              </Card>
            ))}
          </div>
        </div>

        {/* Weekly Time Commitment */}
        <div className="mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            How much time can you dedicate weekly?
          </h3>
          <p className="text-gray-600 mb-6">Be realistic about your schedule for the best experience</p>
          
          <div className="grid md:grid-cols-4 gap-6">
            {STUDY_OPTIONS.weeklyTime.map((option) => (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-300 ${
                  selections.weeklyTime === option.id
                    ? 'ring-2 ring-blue-500 shadow-lg transform scale-105'
                    : 'hover:shadow-md hover:transform hover:scale-102'
                }`}
                onClick={() => handleSelection('weeklyTime', option.id)}
              >
                <Card.Content className="p-6 text-center">
                  <div className="text-3xl mb-3">{option.icon}</div>
                  <h4 className="font-bold text-gray-900 mb-1">{option.name}</h4>
                  <p className="text-lg text-purple-600 font-semibold mb-2">{option.value}</p>
                  <p className="text-sm text-gray-600">{option.description}</p>
                  {selections.weeklyTime === option.id && (
                    <div className="mt-3 flex items-center justify-center gap-1 text-blue-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </Card.Content>
              </Card>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t">
          <Button
            onClick={handleBack}
            variant="outline"
            leftIcon={<ArrowLeft className="h-5 w-5" />}
          >
            Back to Level Selection
          </Button>
          
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            size="lg"
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            Continue to Contact Info
          </Button>
        </div>
      </div>
    </div>
  );
}