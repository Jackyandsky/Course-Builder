'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Calendar, Clock, BookOpen, Target } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

const STUDY_PLANS = {
  beginner: {
    duration: '12 weeks',
    hoursPerWeek: '5-7 hours',
    schedule: 'Flexible with guided milestones',
    approach: 'Foundation-first learning with plenty of practice',
    milestones: [
      { week: '1-3', focus: 'Core concepts and terminology' },
      { week: '4-6', focus: 'Basic application and exercises' },
      { week: '7-9', focus: 'Building confidence with guided projects' },
      { week: '10-12', focus: 'Review and assessment preparation' }
    ]
  },
  intermediate: {
    duration: '10 weeks',
    hoursPerWeek: '7-10 hours',
    schedule: 'Structured with flexibility',
    approach: 'Balanced theory and practical application',
    milestones: [
      { week: '1-2', focus: 'Review fundamentals and assessment' },
      { week: '3-5', focus: 'Advanced concepts and analysis' },
      { week: '6-8', focus: 'Complex problem-solving' },
      { week: '9-10', focus: 'Final projects and mastery' }
    ]
  },
  advanced: {
    duration: '8 weeks',
    hoursPerWeek: '10-15 hours',
    schedule: 'Intensive and self-directed',
    approach: 'Deep dive with research and independent work',
    milestones: [
      { week: '1-2', focus: 'Advanced theory and frameworks' },
      { week: '3-4', focus: 'Research and critical analysis' },
      { week: '5-6', focus: 'Complex project development' },
      { week: '7-8', focus: 'Presentation and peer review' }
    ]
  },
  custom: {
    duration: 'Tailored to you',
    hoursPerWeek: 'Based on availability',
    schedule: 'Completely flexible',
    approach: 'Personalized learning path',
    milestones: [
      { week: 'Initial', focus: 'Assessment and goal setting' },
      { week: 'Ongoing', focus: 'Adaptive curriculum based on progress' },
      { week: 'Regular', focus: 'Checkpoint assessments' },
      { week: 'Final', focus: 'Achievement of personal goals' }
    ]
  }
};

interface Course {
  id: string;
  title: string;
  description?: string;
}

export default function StudyPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const level = searchParams.get('level') || 'beginner';
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [customizations, setCustomizations] = useState({
    startDate: '',
    preferredDays: [] as string[],
    studyTime: 'morning',
    additionalNotes: ''
  });

  const plan = STUDY_PLANS[level as keyof typeof STUDY_PLANS];

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

  const handleDayToggle = (day: string) => {
    setCustomizations(prev => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter(d => d !== day)
        : [...prev.preferredDays, day]
    }));
  };

  const handleConfirm = () => {
    // Pass all the plan details to the contact/enrollment page
    const params = new URLSearchParams();
    params.append('courseId', courseId!);
    params.append('level', level);
    if (customizations.startDate) params.append('startDate', customizations.startDate);
    params.append('studyTime', customizations.studyTime);
    if (customizations.preferredDays.length > 0) {
      params.append('preferredDays', customizations.preferredDays.join(','));
    }
    if (customizations.additionalNotes) params.append('notes', customizations.additionalNotes);
    
    router.push(`/enroll/contact?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Perfect Study Plan
          </h1>
          {course && (
            <div className="space-y-2">
              <p className="text-lg text-gray-600">
                Course: <span className="font-semibold">{course.title}</span>
              </p>
              <p className="text-lg text-gray-600">
                Level: <span className="font-semibold capitalize">{level}</span>
              </p>
            </div>
          )}
        </div>

        {/* Plan Overview */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Plan Overview</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-start gap-3">
              <Calendar className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <p className="font-medium text-gray-900">Duration</p>
                <p className="text-gray-600">{plan.duration}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <p className="font-medium text-gray-900">Time Commitment</p>
                <p className="text-gray-600">{plan.hoursPerWeek}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <BookOpen className="w-6 h-6 text-purple-600 mt-1" />
              <div>
                <p className="font-medium text-gray-900">Schedule Type</p>
                <p className="text-gray-600">{plan.schedule}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Target className="w-6 h-6 text-orange-600 mt-1" />
              <div>
                <p className="font-medium text-gray-900">Learning Approach</p>
                <p className="text-gray-600">{plan.approach}</p>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Milestones</h3>
            <div className="space-y-3">
              {plan.milestones.map((milestone, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Week {milestone.week}</p>
                    <p className="text-gray-600">{milestone.focus}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customization */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customize Your Schedule</h2>
          
          <div className="space-y-6">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Start Date
              </label>
              <input
                type="date"
                value={customizations.startDate}
                onChange={(e) => setCustomizations({ ...customizations, startDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Preferred Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Study Days
              </label>
              <div className="flex flex-wrap gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <button
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      customizations.preferredDays.includes(day)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Study Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Study Time
              </label>
              <select
                value={customizations.studyTime}
                onChange={(e) => setCustomizations({ ...customizations, studyTime: e.target.value })}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="morning">Morning (6 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 6 PM)</option>
                <option value="evening">Evening (6 PM - 10 PM)</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Preferences or Notes
              </label>
              <textarea
                value={customizations.additionalNotes}
                onChange={(e) => setCustomizations({ ...customizations, additionalNotes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any specific requirements or preferences..."
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/enroll/level?courseId=${courseId}`)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Level Selection
          </button>

          <button
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all"
          >
            Confirm & Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}