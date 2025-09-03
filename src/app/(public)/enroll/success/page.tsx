'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Phone, Mail, MessageCircle, Calendar, Clock, BookOpen, Target, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useEffect, useState } from 'react';

const LEVEL_LABELS = {
  basic: 'Basic Level',
  standard: 'Standard Level', 
  premium: 'Premium Level'
};

const BOOKS_LABELS = {
  light: '1-2 books per month',
  moderate: '3-4 books per month',
  intensive: '5+ books per month'
};

const DURATION_LABELS = {
  short: '1-2 months',
  standard: '3-4 months',
  extended: '5-6 months',
  longterm: '6+ months'
};

const TIME_LABELS = {
  casual: '2-4 hours/week',
  regular: '5-7 hours/week',
  dedicated: '8-10 hours/week',
  intensive: '10+ hours/week'
};

const CONTACT_ICONS = {
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle
};

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get all the submitted data
  const data = {
    level: searchParams.get('level') || '',
    booksPerPeriod: searchParams.get('booksPerPeriod') || '',
    studyDuration: searchParams.get('studyDuration') || '',
    weeklyTime: searchParams.get('weeklyTime') || '',
    fullName: searchParams.get('fullName') || '',
    email: searchParams.get('email') || '',
    phone: searchParams.get('phone') || '',
    preferredContact: searchParams.get('preferredContact') || '',
    bestTimeToCall: searchParams.get('bestTimeToCall') || '',
    specificGoals: searchParams.get('specificGoals') || '',
    experienceLevel: searchParams.get('experienceLevel') || '',
    preferredStartDate: searchParams.get('preferredStartDate') || '',
    questions: searchParams.get('questions') || ''
  };

  const ContactIcon = CONTACT_ICONS[data.preferredContact as keyof typeof CONTACT_ICONS] || Mail;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center text-white">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Interest Submitted Successfully!</h1>
            <p className="text-xl text-green-100">
              Thank you for your interest in our educational programs
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* What's Next */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-lg">
          <Card.Content className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Clock className="h-6 w-6 text-blue-600" />
              What Happens Next
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">1</div>
                <h3 className="font-semibold text-gray-900 mb-2">Within 24 Hours</h3>
                <p className="text-sm text-gray-600">Our education consultant will contact you via your preferred method</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">2</div>
                <h3 className="font-semibold text-gray-900 mb-2">Personalized Discussion</h3>
                <p className="text-sm text-gray-600">We'll review your preferences and design a custom learning plan</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">3</div>
                <h3 className="font-semibold text-gray-900 mb-2">Get Started</h3>
                <p className="text-sm text-gray-600">Receive program details, schedule, and begin your learning journey</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <Card.Content className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ContactIcon className="h-5 w-5 text-blue-600" />
              We'll Contact You
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Contact Details:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {data.fullName}</p>
                  <p><strong>Email:</strong> {data.email}</p>
                  <p><strong>Phone:</strong> {data.phone}</p>
                  <p><strong>Preferred Method:</strong> {data.preferredContact}</p>
                  {data.preferredContact === 'phone' && data.bestTimeToCall && (
                    <p><strong>Best Time:</strong> {data.bestTimeToCall}</p>
                  )}
                </div>
              </div>
              
              {data.preferredStartDate && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Timeline:</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Preferred Start:</strong> {new Date(data.preferredStartDate).toLocaleDateString()}</p>
                    <p><strong>Experience:</strong> {data.experienceLevel}</p>
                  </div>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Your Selections Summary */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <Card.Content className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Your Learning Plan Summary
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Program Level:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{LEVEL_LABELS[data.level as keyof typeof LEVEL_LABELS]}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Study Commitment:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Reading Volume:</span>
                    <span className="font-medium">{BOOKS_LABELS[data.booksPerPeriod as keyof typeof BOOKS_LABELS]}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{DURATION_LABELS[data.studyDuration as keyof typeof DURATION_LABELS]}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Weekly Time:</span>
                    <span className="font-medium">{TIME_LABELS[data.weeklyTime as keyof typeof TIME_LABELS]}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {data.specificGoals && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Your Goals:</h4>
                <p className="text-sm text-gray-600 p-3 bg-yellow-50 rounded-lg italic">
                  "{data.specificGoals}"
                </p>
              </div>
            )}
            
            {data.questions && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Questions/Requirements:</h4>
                <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  {data.questions}
                </p>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Emergency Contact */}
        <Card className="mb-8 bg-gradient-to-r from-orange-50 to-yellow-50 border-0 shadow-lg">
          <Card.Content className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Need Immediate Assistance?</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you have urgent questions or need to make changes to your submission, feel free to contact us directly:
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-orange-600" />
                <span className="font-medium">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-orange-600" />
                <span className="font-medium">admissions@education.com</span>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push('/courses')}
            variant="outline"
            size="lg"
            leftIcon={<ArrowRight className="h-5 w-5" />}
          >
            Explore Our Courses
          </Button>
          
          <Button
            onClick={() => router.push('/')}
            size="lg"
            leftIcon={<Home className="h-5 w-5" />}
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}