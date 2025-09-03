'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, Check, Star, BookOpen, Users, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { courseService } from '@/lib/supabase/courses';

interface Course {
  id: string;
  title: string;
  description?: string;
  category?: { name: string };
  difficulty?: string;
}

const LEARNING_LEVELS = [
  {
    id: 'basic',
    name: 'Basic Level',
    description: 'Foundation curriculum with core materials',
    features: [
      'Core curriculum access',
      'Essential reading materials',
      'Email support',
      'Standard learning pace',
      'Progress tracking',
      'Community access'
    ],
    icon: '🟢',
    popularity: 'Perfect for beginners',
    color: 'green'
  },
  {
    id: 'standard', 
    name: 'Standard Level',
    description: 'Comprehensive curriculum with extended resources',
    features: [
      'Full curriculum access',
      'Extended materials library',
      'Priority email support',
      'Flexible pacing options',
      'Advanced progress tracking',
      'Discussion forums',
      'Study guides & supplements'
    ],
    icon: '🟡',
    popularity: 'Most popular choice',
    color: 'yellow'
  },
  {
    id: 'premium',
    name: 'Premium Level', 
    description: 'Complete curriculum with personalized guidance',
    features: [
      'Complete curriculum + advanced materials',
      'One-on-one guidance sessions',
      'Custom learning path design',
      'Priority support (24hr response)',
      'Advanced analytics & insights',
      'Exclusive resources & tools',
      'Direct instructor access',
      'Personalized feedback'
    ],
    icon: '🟟',
    popularity: 'For serious learners',
    color: 'purple'
  }
];

export default function EnrollmentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('');

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

  const handleContinue = () => {
    if (selectedLevel) {
      router.push(`/courses/${courseId}/enroll/commitment?level=${selectedLevel}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Course Not Found</h1>
          <p className="text-gray-600 mt-2">The course you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              <BookOpen className="h-4 w-4" />
              {course.category?.name || 'Course'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {course.description || 'Choose your learning level to begin your educational journey'}
            </p>
          </div>
        </div>
      </div>

      {/* Level Selection */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Choose Your Learning Path</h2>
          <p className="text-gray-600 text-lg">
            Select the level that best matches your goals and availability
          </p>
        </div>

        {/* Level Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {LEARNING_LEVELS.map((level) => (
            <Card
              key={level.id}
              className={`cursor-pointer transition-all duration-300 ${
                selectedLevel === level.id
                  ? 'ring-2 ring-blue-500 shadow-lg transform scale-105'
                  : 'hover:shadow-lg hover:transform hover:scale-102'
              }`}
              onClick={() => setSelectedLevel(level.id)}
            >
              <Card.Content className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">{level.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{level.name}</h3>
                  <p className="text-gray-600 text-sm">{level.description}</p>
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      level.color === 'green' ? 'bg-green-100 text-green-800' :
                      level.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      <Star className="h-3 w-3" />
                      {level.popularity}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {level.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Selection Indicator */}
                {selectedLevel === level.id && (
                  <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                      <Check className="h-4 w-4" />
                      Selected - Ready to continue
                    </div>
                  </div>
                )}
              </Card.Content>
            </Card>
          ))}
        </div>

        {/* Next Steps Info */}
        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>Step 1 of 3: Choose Level</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Next: Study Commitment</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Final: Contact Details</span>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedLevel}
            size="lg"
            className="px-8 py-3"
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            Continue to Study Planning
          </Button>
        </div>
      </div>
    </div>
  );
}