'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { CheckCircle, Calendar, Clock, User, BookOpen, CreditCard, ArrowLeft } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

interface Course {
  id: string;
  title: string;
  description?: string;
  price?: number;
}

interface BookingDetails {
  course: Course;
  level: string;
  startDate: string;
  studyTime: string;
  preferredDays: string[];
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndLoadDetails();
  }, [searchParams]);

  const checkAuthAndLoadDetails = async () => {
    try {
      // Check authentication
      const authResponse = await fetch('/api/auth/session');
      const authData = await authResponse.json();
      
      if (!authData.user) {
        const currentUrl = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }
      
      setUser(authData.user);

      // Parse booking details from URL params
      const courseId = searchParams.get('courseId');
      const level = searchParams.get('level');
      const startDate = searchParams.get('startDate');
      const studyTime = searchParams.get('studyTime');
      const preferredDays = searchParams.get('preferredDays');
      const notes = searchParams.get('notes');
      const contactName = searchParams.get('contactName');
      const contactEmail = searchParams.get('contactEmail');
      const contactPhone = searchParams.get('contactPhone');

      if (!courseId || !level) {
        alert('Missing booking information');
        router.push('/courses');
        return;
      }

      // Load course details
      const courseResponse = await fetch(`/api/public/courses/${courseId}`);
      if (!courseResponse.ok) {
        alert('Course not found');
        router.push('/courses');
        return;
      }
      
      const courseData = await courseResponse.json();
      
      setBookingDetails({
        course: courseData,
        level: level || 'beginner',
        startDate: startDate || '',
        studyTime: studyTime || 'flexible',
        preferredDays: preferredDays ? preferredDays.split(',') : [],
        notes: notes || '',
        contactName: contactName || authData.user.email,
        contactEmail: contactEmail || authData.user.email,
        contactPhone: contactPhone || ''
      });
    } catch (error) {
      console.error('Error loading booking details:', error);
      alert('Error loading booking details');
      router.push('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!bookingDetails || !user) return;
    
    setSubmitting(true);
    
    try {
      const bookingData = {
        type: 'enrollment',
        course_id: bookingDetails.course.id,
        user_id: user.id,
        status: 'confirmed',
        booking_date: new Date().toISOString(),
        preferences: {
          level: bookingDetails.level,
          startDate: bookingDetails.startDate,
          studyTime: bookingDetails.studyTime,
          preferredDays: bookingDetails.preferredDays,
          notes: bookingDetails.notes
        },
        contact_info: {
          name: bookingDetails.contactName,
          email: bookingDetails.contactEmail,
          phone: bookingDetails.contactPhone
        }
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create booking');
      }

      const result = await response.json();
      
      // Show success and redirect
      router.push(`/booking/success?id=${result.booking.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatStudyTime = (time: string) => {
    const times = {
      morning: 'Morning (6 AM - 12 PM)',
      afternoon: 'Afternoon (12 PM - 6 PM)',
      evening: 'Evening (6 PM - 10 PM)',
      flexible: 'Flexible'
    };
    return times[time as keyof typeof times] || time;
  };

  const getStudyPlanDuration = (level: string) => {
    const durations = {
      beginner: '12 weeks',
      intermediate: '10 weeks',
      advanced: '8 weeks',
      custom: 'Tailored to you'
    };
    return durations[level as keyof typeof durations] || 'To be determined';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No booking details found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Confirm Your Enrollment
          </h1>
          <p className="text-gray-600">
            Review your enrollment details before confirming
          </p>
        </div>

        {/* Booking Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Enrollment Summary</h2>
          
          {/* Course Details */}
          <div className="border-b pb-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Course</h3>
                <p className="text-lg text-gray-800">{bookingDetails.course.title}</p>
                {bookingDetails.course.description && (
                  <p className="text-sm text-gray-600 mt-1">{bookingDetails.course.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Study Plan */}
          <div className="border-b pb-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Study Plan Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Level</p>
                <p className="font-medium capitalize">{bookingDetails.level}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Duration</p>
                <p className="font-medium">{getStudyPlanDuration(bookingDetails.level)}</p>
              </div>
              {bookingDetails.startDate && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Start Date</p>
                  <p className="font-medium">
                    {new Date(bookingDetails.startDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">Study Time</p>
                <p className="font-medium">{formatStudyTime(bookingDetails.studyTime)}</p>
              </div>
            </div>
            
            {bookingDetails.preferredDays.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Preferred Study Days</p>
                <div className="flex flex-wrap gap-2">
                  {bookingDetails.preferredDays.map(day => (
                    <span key={day} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {bookingDetails.notes && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-1">Additional Notes</p>
                <p className="text-gray-800">{bookingDetails.notes}</p>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="pb-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{bookingDetails.contactName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{bookingDetails.contactEmail}</p>
                </div>
              </div>
              {bookingDetails.contactPhone && (
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{bookingDetails.contactPhone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing (if available) */}
          {bookingDetails.course.price && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-gray-400" />
                  <span className="text-lg font-semibold">Total Amount</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  ${bookingDetails.course.price}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Contact Details
          </button>

          <button
            onClick={handleConfirmBooking}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Spinner size="sm" />
                Processing...
              </>
            ) : (
              <>
                Confirm Enrollment
                <CheckCircle className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}