'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Clock, User, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';

interface ContactForm {
  course_id: string;
  specificGoals: string;
  preferredStartDate: string;
  questions: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
}

export default function ContactPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Get course ID from URL params
  const courseId = searchParams.get('courseId') || searchParams.get('course_id') || '';
  
  const [form, setForm] = useState<ContactForm>({
    course_id: courseId,
    specificGoals: '',
    preferredStartDate: '',
    questions: ''
  });

  // Track selected predefined goals separately
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoals, setCustomGoals] = useState<string>('');
  const [showOtherGoals, setShowOtherGoals] = useState(false);

  // Get selections from previous steps including level and plan customizations
  const selections = {
    level: searchParams.get('level') || '',
    startDate: searchParams.get('startDate') || '',
    studyTime: searchParams.get('studyTime') || '',
    preferredDays: searchParams.get('preferredDays') || '',
    notes: searchParams.get('notes') || '',
    booksPerPeriod: searchParams.get('booksPerPeriod') || '',
    studyDuration: searchParams.get('studyDuration') || '',
    weeklyTime: searchParams.get('weeklyTime') || ''
  };

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      // Check authentication
      const authResponse = await fetch('/api/auth/session');
      const authData = await authResponse.json();
      
      if (!authData.user) {
        // Redirect to login with return URL, preserving all parameters
        const currentUrl = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }
      
      setUser(authData.user);
      
      // If we have a course ID, load that specific course
      if (courseId) {
        try {
          const courseResponse = await fetch(`/api/public/courses/${courseId}`);
          if (courseResponse.ok) {
            const courseData = await courseResponse.json();
            setSelectedCourse(courseData);
          } else {
            // If course not found, redirect to courses page
            alert('Course not found. Please select a course.');
            router.push('/courses');
            return;
          }
        } catch (error) {
          console.error('Error loading course:', error);
        }
      } else {
        // No course selected, redirect to courses page
        alert('Please select a course first.');
        router.push('/courses');
        return;
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
    
    if (!form.course_id) {
      alert('Please select a course');
      return;
    }
    
    setSubmitting(true);

    try {
      // Store enrollment data in sessionStorage for the schedule page
      const enrollmentData = {
        type: 'enrollment',
        courseId: form.course_id,
        courseTitle: selectedCourse?.title || '',
        level: selections.level || '',
        specificGoals: form.specificGoals || '',
        preferredStartDate: form.preferredStartDate || '',
        questions: form.questions || '',
        studyTime: selections.studyTime || '',
        preferredDays: selections.preferredDays || '',
        notes: selections.notes || '',
        booksPerPeriod: selections.booksPerPeriod || '',
        studyDuration: selections.studyDuration || '',
        weeklyTime: selections.weeklyTime || ''
      };
      
      sessionStorage.setItem('enrollmentData', JSON.stringify(enrollmentData));
      
      // Navigate to the unified booking/schedule page with enrollment type
      router.push('/booking/schedule?type=enrollment');
    } catch (error) {
      console.error('Error processing enrollment:', error);
      alert('There was an error processing your enrollment request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    // Navigate back to plan page with course and level
    const queryParams = new URLSearchParams({
      courseId: courseId,
      level: selections.level || 'beginner'
    });
    router.push(`/enroll/plan?${queryParams}`);
  };

  const isFormValid = form.course_id && user;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-[var(--igps-landing-background)]" style={{ fontFamily: 'var(--igps-landing-font-family)' }}>
      <div className="max-w-[1000px] mx-auto px-[20px] py-[60px]">
        <div className="text-center mb-[50px]">
          <h1 className="text-[40px] font-bold mb-[15px] text-[var(--igps-landing-text-color)] tracking-[-0.022em] leading-[1.08]" style={{ fontWeight: 700 }}>
            Complete Your <em className="text-[var(--igps-landing-btn-color)] not-italic">Enrollment</em>
          </h1>
          <p className="text-[18px] font-medium max-w-[700px] mx-auto text-[var(--igps-landing-text-color)] leading-[1.23536]" style={{ fontWeight: 500 }}>
            {selectedCourse ? (
              <>Enrolling in: <strong>{selectedCourse.title}</strong></>
            ) : (
              <>Share your preferences so our <strong>education consultant</strong> can finalize your enrollment</>
            )}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-[40px]">
          {/* User Info and Course Selection */}
          <div className="bg-white rounded-[18px] shadow-[0_4px_15px_rgba(0,0,0,0.1)] overflow-hidden">
            <div className="p-[40px]">
              <h3 className="text-[24px] font-bold text-[var(--igps-landing-text-color)] mb-[30px] flex items-center gap-[10px] leading-[1.125]" style={{ fontWeight: 700 }}>
                <User className="h-[20px] w-[20px] text-[var(--igps-landing-btn-color)]" />
                Enrollment <em className="text-[var(--igps-landing-btn-color)] not-italic">Information</em>
              </h3>
              
              {/* User Info Display (Read-only) */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">Enrolling as:</p>
                <p className="font-semibold text-blue-900">{user.full_name}</p>
                <p className="text-sm text-blue-700">{user.email}</p>
                {user.phone && <p className="text-sm text-blue-700">{user.phone}</p>}
              </div>
              
              <div className="space-y-[25px]">
                {/* Selected Course Display */}
                {selectedCourse && (
                  <div>
                    <label className="block text-[15px] font-medium text-[var(--igps-landing-text-color)] mb-[8px] leading-[1.47059]" style={{ fontWeight: 500 }}>
                      Selected Course
                    </label>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 text-lg">{selectedCourse.title}</h4>
                      {selectedCourse.description && (
                        <p className="text-sm text-green-700 mt-1">{selectedCourse.description}</p>
                      )}
                      {selections.level && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm text-green-600">Level:</span>
                          <span className="text-sm font-semibold text-green-800 capitalize">{selections.level}</span>
                        </div>
                      )}
                      {selections.startDate && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-600">Preferred Start:</span>
                          <span className="text-sm font-semibold text-green-800">{selections.startDate}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => router.push('/courses')}
                        className="text-sm text-green-600 hover:text-green-800 underline mt-2"
                      >
                        Change course selection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Learning Preferences */}
          <div className="bg-white rounded-[18px] shadow-[0_4px_15px_rgba(0,0,0,0.1)] overflow-hidden">
            <div className="p-[40px]">
              <h3 className="text-[24px] font-bold text-[var(--igps-landing-text-color)] mb-[30px] flex items-center gap-[10px] leading-[1.125]" style={{ fontWeight: 700 }}>
                <Target className="h-[20px] w-[20px] text-[#28a745]" />
                Learning <em className="text-[var(--igps-landing-btn-color)] not-italic">Preferences</em>
              </h3>
              
              <div className="space-y-[30px]">
                <div>
                  <label className="block text-[18px] font-medium text-[var(--igps-landing-text-color)] mb-[15px] leading-[1.23536]" style={{ fontWeight: 500 }}>
                    What are your <strong>educational goals</strong>? (Select all that apply)
                  </label>
                  <div className="grid md:grid-cols-2 gap-[8px] mb-[20px]">
                    {[
                      'Improve reading comprehension',
                      'Develop critical thinking skills',
                      'Academic excellence',
                      'College preparation',
                      'Professional development',
                      'Personal enrichment'
                    ].map((goal) => (
                      <label key={goal} className="flex items-center gap-[8px] cursor-pointer p-[8px] hover:bg-[#f8f8f8] rounded-[6px] transition-colors duration-200">
                        <input
                          type="checkbox"
                          className="w-[16px] h-[16px] rounded border-[#e5e5e7] text-[var(--igps-landing-btn-color)] focus:ring-[var(--igps-landing-btn-color)]"
                          checked={selectedGoals.includes(goal)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGoals([...selectedGoals, goal]);
                            } else {
                              setSelectedGoals(selectedGoals.filter(g => g !== goal));
                            }
                            // Update form with combined goals
                            const newGoals = e.target.checked 
                              ? [...selectedGoals, goal]
                              : selectedGoals.filter(g => g !== goal);
                            const allGoals = customGoals 
                              ? [...newGoals, customGoals].join(', ')
                              : newGoals.join(', ');
                            handleInputChange('specificGoals', allGoals);
                          }}
                        />
                        <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.4]" style={{ fontWeight: 400 }}>{goal}</span>
                      </label>
                    ))}
                    {/* Other checkbox */}
                    <label className="flex items-center gap-[8px] cursor-pointer p-[8px] hover:bg-[#f8f8f8] rounded-[6px] transition-colors duration-200">
                      <input
                        type="checkbox"
                        className="w-[16px] h-[16px] rounded border-[#e5e5e7] text-[var(--igps-landing-btn-color)] focus:ring-[var(--igps-landing-btn-color)]"
                        checked={showOtherGoals}
                        onChange={(e) => {
                          setShowOtherGoals(e.target.checked);
                          if (!e.target.checked) {
                            setCustomGoals('');
                            // Update form without custom goals
                            handleInputChange('specificGoals', selectedGoals.join(', '));
                          }
                        }}
                      />
                      <span className="text-[13px] text-[var(--igps-landing-text-color)] leading-[1.4]" style={{ fontWeight: 400 }}>Other</span>
                    </label>
                  </div>
                  {/* Show textarea only when "Other" is checked */}
                  {showOtherGoals && (
                    <div>
                      <label className="block text-[15px] font-medium text-[var(--igps-landing-text-color)] mb-[8px] leading-[1.47059]" style={{ fontWeight: 500 }}>
                        Other specific goals or focus areas:
                      </label>
                      <Textarea
                        value={customGoals}
                        onChange={(e) => {
                          setCustomGoals(e.target.value);
                          // Update form with combined goals
                          const allGoals = e.target.value 
                            ? [...selectedGoals, e.target.value].join(', ')
                            : selectedGoals.join(', ');
                          handleInputChange('specificGoals', allGoals);
                        }}
                        placeholder="Please describe your other specific goals or requirements..."
                        rows={3}
                        className="w-full px-[15px] py-[12px] border border-[#e5e5e7] rounded-[8px] text-[15px] focus:border-[var(--igps-landing-btn-color)] focus:outline-none transition-colors duration-200 resize-none"
                        style={{ fontFamily: 'var(--igps-landing-font-family)', fontWeight: 400 }}
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-[15px] font-medium text-[var(--igps-landing-text-color)] mb-[8px] leading-[1.47059]" style={{ fontWeight: 500 }}>
                    <strong>Preferred Start Date</strong>
                  </label>
                  <Input
                    type="date"
                    value={form.preferredStartDate}
                    onChange={(e) => handleInputChange('preferredStartDate', e.target.value)}
                    className="max-w-[300px] px-[15px] py-[12px] border border-[#e5e5e7] rounded-[8px] text-[15px] focus:border-[var(--igps-landing-btn-color)] focus:outline-none transition-colors duration-200"
                    style={{ fontFamily: 'var(--igps-landing-font-family)', fontWeight: 400 }}
                  />
                </div>
                
                <div>
                  <label className="block text-[15px] font-medium text-[var(--igps-landing-text-color)] mb-[8px] leading-[1.47059]" style={{ fontWeight: 500 }}>
                    Questions or Special Requirements
                  </label>
                  <Textarea
                    value={form.questions}
                    onChange={(e) => handleInputChange('questions', e.target.value)}
                    placeholder="Any questions about our programs or special accommodations needed..."
                    rows={4}
                    className="w-full px-[15px] py-[12px] border border-[#e5e5e7] rounded-[8px] text-[15px] focus:border-[var(--igps-landing-btn-color)] focus:outline-none transition-colors duration-200 resize-none"
                    style={{ fontFamily: 'var(--igps-landing-font-family)', fontWeight: 400 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-gradient-to-r from-[#f3f3f3] to-[#e8e8ed] rounded-[18px] shadow-[0_4px_15px_rgba(0,0,0,0.1)] overflow-hidden">
            <div className="p-[40px]">
              <h3 className="text-[24px] font-bold text-[var(--igps-landing-text-color)] mb-[25px] flex items-center gap-[10px] leading-[1.125]" style={{ fontWeight: 700 }}>
                <Clock className="h-[20px] w-[20px] text-[var(--igps-landing-btn-color)]" />
                What Happens <em className="text-[var(--igps-landing-btn-color)] not-italic">Next</em>?
              </h3>
              
              <div className="space-y-[20px]">
                <div className="flex items-start gap-[15px]">
                  <div className="w-[30px] h-[30px] bg-[var(--igps-landing-btn-color)] text-white rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0" style={{ fontWeight: 700 }}>1</div>
                  <p className="text-[15px] text-[var(--igps-landing-text-color)] leading-[1.47059]" style={{ fontWeight: 400 }}>
                    <strong>Within 24 hours:</strong> One of our education consultants will contact you via your <em>preferred method</em>
                  </p>
                </div>
                <div className="flex items-start gap-[15px]">
                  <div className="w-[30px] h-[30px] bg-[var(--igps-landing-btn-color)] text-white rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0" style={{ fontWeight: 700 }}>2</div>
                  <p className="text-[15px] text-[var(--igps-landing-text-color)] leading-[1.47059]" style={{ fontWeight: 400 }}>
                    <strong>Personalized Discussion:</strong> We'll review your preferences and create a <em>customized learning plan</em> tailored to your goals
                  </p>
                </div>
                <div className="flex items-start gap-[15px]">
                  <div className="w-[30px] h-[30px] bg-[var(--igps-landing-btn-color)] text-white rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0" style={{ fontWeight: 700 }}>3</div>
                  <p className="text-[15px] text-[var(--igps-landing-text-color)] leading-[1.47059]" style={{ fontWeight: 400 }}>
                    <strong>Program Details:</strong> Receive detailed information about <em>curriculum, schedule, materials,</em> and enrollment steps
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-[40px] border-t border-[#e5e5e7]">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-[8px] text-[var(--igps-landing-link-color)] text-[17px] font-normal transition-colors duration-300 hover:text-[var(--igps-landing-btn-color)] no-underline"
              style={{ fontWeight: 400 }}
            >
              <ArrowLeft className="h-[16px] w-[16px]" />
              Back to Study Planning
            </button>
            
            <div className="text-center">
              <button
                type="submit"
                disabled={!isFormValid || submitting}
                className={`inline-block px-[30px] py-[12px] rounded-[980px] text-[17px] font-normal transition-all duration-300 no-underline ${
                  isFormValid && !submitting
                    ? 'bg-[var(--igps-landing-btn-color)] text-white hover:bg-[#0077ed] cursor-pointer'
                    : 'bg-[#e5e5e7] text-[#86868b] cursor-not-allowed'
                }`}
                style={{ fontWeight: 400 }}
              >
                {submitting ? (
                  'Processing...'
                ) : isFormValid ? (
                  <span className="flex items-center gap-[8px]">
                    <strong>Continue to Schedule</strong>
                    <ArrowRight className="h-[16px] w-[16px]" />
                  </span>
                ) : (
                  'Please select a course'
                )}
              </button>
              {isFormValid && !submitting && (
                <p className="text-[13px] text-[#86868b] mt-[15px] leading-[1.5]" style={{ fontWeight: 400 }}>
                  Your journey to <em>educational excellence</em> begins here
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}