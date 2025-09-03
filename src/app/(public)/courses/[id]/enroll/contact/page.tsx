'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, Phone, Mail, MessageCircle, Clock, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { courseService } from '@/lib/supabase/courses';

interface Course {
  id: string;
  title: string;
  category?: { name: string };
}

interface ContactForm {
  fullName: string;
  email: string;
  phone: string;
  preferredContact: string;
  bestTimeToCall: string;
  specificGoals: string;
  experienceLevel: string;
  preferredStartDate: string;
  questions: string;
}

const CONTACT_METHODS = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone Call', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle }
];

const CALL_TIMES = [
  { value: 'morning', label: 'Morning (9 AM - 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)' },
  { value: 'evening', label: 'Evening (5 PM - 8 PM)' },
  { value: 'flexible', label: 'I\'m flexible' }
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Complete Beginner' },
  { value: 'some', label: 'Some Experience' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

export default function ContactPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ContactForm>({
    fullName: '',
    email: '',
    phone: '',
    preferredContact: 'email',
    bestTimeToCall: 'flexible',
    specificGoals: '',
    experienceLevel: 'beginner',
    preferredStartDate: '',
    questions: ''
  });

  // Get selections from previous steps
  const selections = {
    level: searchParams.get('level') || '',
    booksPerPeriod: searchParams.get('booksPerPeriod') || '',
    studyDuration: searchParams.get('studyDuration') || '',
    weeklyTime: searchParams.get('weeklyTime') || ''
  };

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

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Here you would typically submit to your backend
      // For now, we'll just simulate the submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to success page with all data
      const queryParams = new URLSearchParams({
        ...selections,
        ...form,
        courseId,
        courseTitle: course?.title || ''
      });
      
      router.push(`/courses/${courseId}/enroll/success?${queryParams}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your information. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    const queryParams = new URLSearchParams(selections);
    router.push(`/courses/${courseId}/enroll/commitment?${queryParams}`);
  };

  const isFormValid = form.fullName && form.email && form.phone;

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
              <User className="h-4 w-4" />
              Step 3 of 3: Contact Information
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Let's Connect With You</h1>
            <p className="text-gray-600 text-lg">
              Provide your details so our education consultant can reach out
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <Card.Content className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Contact Method
                  </label>
                  <Select
                    value={form.preferredContact}
                    onChange={(e) => handleInputChange('preferredContact', e.target.value)}
                  >
                    {CONTACT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              
              {form.preferredContact === 'phone' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Best Time to Call
                  </label>
                  <Select
                    value={form.bestTimeToCall}
                    onChange={(e) => handleInputChange('bestTimeToCall', e.target.value)}
                  >
                    {CALL_TIMES.map((time) => (
                      <option key={time.value} value={time.value}>
                        {time.label}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Additional Preferences */}
          <Card>
            <Card.Content className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Learning Preferences
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What are your specific goals or focus areas?
                  </label>
                  <Textarea
                    value={form.specificGoals}
                    onChange={(e) => handleInputChange('specificGoals', e.target.value)}
                    placeholder="e.g., Improve reading comprehension, prepare for exams, develop critical thinking skills..."
                    rows={3}
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Experience Level
                    </label>
                    <Select
                      value={form.experienceLevel}
                      onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                    >
                      {EXPERIENCE_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Start Date
                    </label>
                    <Input
                      type="date"
                      value={form.preferredStartDate}
                      onChange={(e) => handleInputChange('preferredStartDate', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Questions or Special Requirements
                  </label>
                  <Textarea
                    value={form.questions}
                    onChange={(e) => handleInputChange('questions', e.target.value)}
                    placeholder="Any questions about the program or special accommodations needed..."
                    rows={4}
                  />
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* What Happens Next */}
          <Card className="bg-blue-50 border-blue-200">
            <Card.Content className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                What Happens Next?
              </h3>
              
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                  <p><strong>Within 24 hours:</strong> One of our education consultants will contact you</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <p><strong>Personalized Discussion:</strong> We'll review your preferences and create a customized plan</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                  <p><strong>Program Details:</strong> Receive detailed information about curriculum, schedule, and next steps</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t">
            <Button
              type="button"
              onClick={handleBack}
              variant="outline"
              leftIcon={<ArrowLeft className="h-5 w-5" />}
            >
              Back to Study Planning
            </Button>
            
            <Button
              type="submit"
              disabled={!isFormValid || submitting}
              size="lg"
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              {submitting ? 'Submitting...' : 'Submit Interest'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}