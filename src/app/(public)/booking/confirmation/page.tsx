'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Calendar, Clock, User, Home, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface BookingData {
  id?: string;
  type: string;
  grade?: string;
  courseTitle?: string;
  courseId?: string;
  date: string;
  time: string;
  teacherId: string;
  teacherName: string;
  userEmail: string;
  createdAt: string;
  // Enrollment specific fields
  level?: string;
  booksPerPeriod?: string;
  studyDuration?: string;
  weeklyTime?: string;
  preferredContact?: string;
  bestTimeToCall?: string;
  specificGoals?: string;
  experienceLevel?: string;
  questions?: string;
  contactName?: string;
  contactPhone?: string;
  studyTime?: string;
  preferredDays?: string;
  notes?: string;
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  useEffect(() => {
    // Get booking data from sessionStorage
    const dataStr = sessionStorage.getItem('bookingConfirmation');
    if (dataStr) {
      const data = JSON.parse(dataStr);
      setBookingData(data);
      
      // Send confirmation email (in real implementation)
      sendConfirmationEmail(data);
      
      // Clear the booking data after displaying
      // Delay clearing to ensure user can see the confirmation
      setTimeout(() => {
        sessionStorage.removeItem('bookingConfirmation');
      }, 2000);
    }
    // Remove automatic redirect - let user manually navigate
  }, []);

  const sendConfirmationEmail = async (data: BookingData) => {
    // This would be an API call in production
    console.log('Sending confirmation email for:', data);
    
    // Format email content
    const getBookingTypeName = (type: string) => {
      switch(type) {
        case 'diagnosis': return 'Diagnostic Assessment';
        case 'progress': return 'Progress Review';
        case 'enrollment': return 'Course Enrollment';
        default: return type;
      }
    };

    const emailSubject = `Booking Confirmation - ${getBookingTypeName(data.type)}`;
    const emailBody = `
Dear ${data.contactName || 'User'},

Your ${getBookingTypeName(data.type)} has been confirmed!

Details:
- Type: ${getBookingTypeName(data.type)}
${data.courseTitle ? `- Course: ${data.courseTitle}` : ''}
${data.grade ? `- Grade: ${data.grade}` : ''}
${data.level ? `- Level: ${data.level}` : ''}
- Date: ${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${data.time}
- ${data.type === 'enrollment' ? 'Consultant' : 'Teacher'}: ${data.teacherName}
${data.preferredContact ? `- Preferred Contact: ${data.preferredContact}` : ''}
${data.specificGoals ? `- Goals: ${data.specificGoals}` : ''}

${data.type === 'enrollment' ? 
  'Our education consultant will contact you within 24 hours to finalize your enrollment.' : 
  'We\'ll send you a reminder email before your appointment.'}

Best regards,
IGPS Team
    `;
    
    // In production, this would be an API call
    // For now, we'll just log it
    console.log('Email Subject:', emailSubject);
    console.log('Email Body:', emailBody);
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Booking Found</h2>
            <p className="text-gray-600 mb-6">
              It looks like you haven't made a booking yet or the booking data has expired.
            </p>
            <div className="space-y-3">
              <Link 
                href="/booking"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Make a New Booking
              </Link>
              <Link 
                href="/"
                className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">
            {bookingData.type === 'enrollment' ? 'Enrollment Submitted!' : 'Booking Confirmed!'}
          </h1>
          <p className="text-green-100">
            {bookingData.type === 'enrollment' 
              ? 'Your enrollment request has been successfully submitted'
              : 'Your appointment has been successfully scheduled'}
          </p>
        </div>
      </div>

      {/* Booking Details */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Appointment Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Service Type</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {bookingData.type === 'diagnosis' ? 'Diagnostic Assessment' : 
                     bookingData.type === 'progress' ? 'Progress Review' :
                     bookingData.type === 'enrollment' ? 'Course Enrollment' : bookingData.type}
                  </p>
                  {bookingData.courseTitle && (
                    <p className="text-sm text-gray-700 mt-1">{bookingData.courseTitle}</p>
                  )}
                  {bookingData.grade && (
                    <p className="text-sm text-gray-700 mt-1">Grade {bookingData.grade}</p>
                  )}
                  {bookingData.level && (
                    <p className="text-sm text-gray-700 mt-1">Level: {bookingData.level}</p>
                  )}
                  {bookingData.id && (
                    <p className="text-xs text-gray-400 mt-1">Reference: {bookingData.id.slice(0, 12)}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(bookingData.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium text-gray-900">{bookingData.time}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Teacher</p>
                  <p className="font-medium text-gray-900">{bookingData.teacherName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enrollment-specific details */}
          {bookingData.type === 'enrollment' && (
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Study Plan</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {bookingData.booksPerPeriod && (
                  <div>
                    <span className="text-gray-600">Books per Period: </span>
                    <span className="font-medium text-gray-900">{bookingData.booksPerPeriod}</span>
                  </div>
                )}
                {bookingData.studyDuration && (
                  <div>
                    <span className="text-gray-600">Study Duration: </span>
                    <span className="font-medium text-gray-900">{bookingData.studyDuration}</span>
                  </div>
                )}
                {bookingData.weeklyTime && (
                  <div>
                    <span className="text-gray-600">Weekly Commitment: </span>
                    <span className="font-medium text-gray-900">{bookingData.weeklyTime}</span>
                  </div>
                )}
                {bookingData.preferredContact && (
                  <div>
                    <span className="text-gray-600">Preferred Contact: </span>
                    <span className="font-medium text-gray-900">{bookingData.preferredContact}</span>
                  </div>
                )}
                {bookingData.experienceLevel && (
                  <div>
                    <span className="text-gray-600">Experience Level: </span>
                    <span className="font-medium text-gray-900">{bookingData.experienceLevel}</span>
                  </div>
                )}
                {bookingData.studyTime && (
                  <div>
                    <span className="text-gray-600">Study Time: </span>
                    <span className="font-medium text-gray-900">{bookingData.studyTime}</span>
                  </div>
                )}
                {bookingData.preferredDays && (
                  <div>
                    <span className="text-gray-600">Preferred Days: </span>
                    <span className="font-medium text-gray-900">{bookingData.preferredDays}</span>
                  </div>
                )}
              </div>
              {bookingData.specificGoals && (
                <div className="mt-4">
                  <p className="text-gray-600 mb-2">Learning Goals:</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">{bookingData.specificGoals}</p>
                </div>
              )}
              {bookingData.questions && (
                <div className="mt-4">
                  <p className="text-gray-600 mb-2">Additional Notes:</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">{bookingData.questions}</p>
                </div>
              )}
            </div>
          )}

          {/* Next Steps */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">What's Next?</h3>
            <ul className="space-y-3 text-gray-600">
              {bookingData.type === 'enrollment' ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>An education consultant will contact you within 24 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>They'll discuss your goals and create a personalized learning plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>You'll receive course materials and schedule details</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>You'll receive a reminder email 24 hours before your appointment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>The teacher will review your submitted materials before the session</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Join the session 5 minutes early to ensure everything is set up</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link 
              href="/account/bookings"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <User className="h-5 w-5" />
              <span>View My Bookings</span>
            </Link>
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}