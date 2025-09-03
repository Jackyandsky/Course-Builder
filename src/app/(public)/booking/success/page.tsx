'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Calendar, Clock, User, Mail, Phone, MessageCircle, ArrowRight, Home, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useEffect, useState } from 'react';

interface BookingDetails {
  id: string;
  type: string;
  courseTitle?: string;
  bookingDate?: string;
  bookingTime?: string;
  status?: string;
  teacherName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  preferredContact?: string;
  level?: string;
  specificGoals?: string;
  questions?: string;
}

const CONTACT_ICONS = {
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle
};

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);

  useEffect(() => {
    loadBookingDetails();
  }, []);

  const loadBookingDetails = async () => {
    try {
      const bookingId = searchParams.get('id');
      
      if (!bookingId) {
        // If no ID, try to get details from URL params
        const details: BookingDetails = {
          id: 'pending',
          type: searchParams.get('type') || 'enrollment',
          courseTitle: searchParams.get('courseTitle') || '',
          bookingDate: searchParams.get('date') || '',
          bookingTime: searchParams.get('time') || '',
          status: 'confirmed',
          contactName: searchParams.get('contactName') || '',
          contactEmail: searchParams.get('contactEmail') || '',
          contactPhone: searchParams.get('contactPhone') || '',
          preferredContact: searchParams.get('preferredContact') || 'email',
          level: searchParams.get('level') || '',
          specificGoals: searchParams.get('goals') || '',
          questions: searchParams.get('notes') || ''
        };
        setBooking(details);
      } else {
        // Try to fetch booking details from API
        try {
          const response = await fetch(`/api/bookings/${bookingId}`);
          if (response.ok) {
            const data = await response.json();
            setBooking(data);
          } else {
            // Fallback to URL params if API fails
            setBooking({
              id: bookingId,
              type: 'enrollment',
              status: 'confirmed',
              courseTitle: searchParams.get('courseTitle') || 'Course',
              contactName: searchParams.get('contactName') || '',
              contactEmail: searchParams.get('contactEmail') || '',
              preferredContact: searchParams.get('preferredContact') || 'email'
            });
          }
        } catch (error) {
          console.error('Error fetching booking:', error);
          // Use URL params as fallback
          setBooking({
            id: bookingId,
            type: 'enrollment',
            status: 'confirmed',
            courseTitle: searchParams.get('courseTitle') || 'Course'
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="max-w-md w-full">
          <Card.Content className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
            <p className="text-gray-600 mb-6">We couldn't find your booking details.</p>
            <Button onClick={() => router.push('/')} size="lg">
              Return to Home
            </Button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const ContactIcon = CONTACT_ICONS[booking.preferredContact as keyof typeof CONTACT_ICONS] || Mail;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center text-white">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              {booking.type === 'enrollment' ? 'Enrollment Request Submitted!' : 'Booking Confirmed!'}
            </h1>
            <p className="text-xl text-green-100">
              {booking.type === 'enrollment' 
                ? 'Thank you for enrolling in our educational program'
                : 'Your booking has been successfully confirmed'}
            </p>
            {booking.id !== 'pending' && (
              <p className="text-lg text-green-200 mt-2">
                Booking ID: <span className="font-mono">{booking.id}</span>
              </p>
            )}
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
                <h3 className="font-semibold text-gray-900 mb-2">Confirmation Email</h3>
                <p className="text-sm text-gray-600">
                  You'll receive a confirmation email with all booking details shortly
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">2</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {booking.type === 'enrollment' ? 'Consultant Contact' : 'Teacher Assignment'}
                </h3>
                <p className="text-sm text-gray-600">
                  {booking.type === 'enrollment' 
                    ? 'Our education consultant will contact you within 24 hours'
                    : 'A qualified teacher will be assigned to your session'}
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">3</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {booking.type === 'enrollment' ? 'Program Start' : 'Session Day'}
                </h3>
                <p className="text-sm text-gray-600">
                  {booking.type === 'enrollment'
                    ? 'Begin your personalized learning journey'
                    : 'Join your scheduled session at the appointed time'}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Booking Details */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <Card.Content className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Booking Details
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Program Information:</h4>
                <div className="space-y-2 text-sm">
                  {booking.courseTitle && (
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-gray-600">Course:</span>
                        <p className="font-medium">{booking.courseTitle}</p>
                      </div>
                    </div>
                  )}
                  {booking.level && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Level:</span>
                      <span className="font-medium capitalize">{booking.level}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{booking.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {booking.status || 'Confirmed'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Contact Information:</h4>
                <div className="space-y-2 text-sm">
                  {booking.contactName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{booking.contactName}</span>
                    </div>
                  )}
                  {booking.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{booking.contactEmail}</span>
                    </div>
                  )}
                  {booking.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{booking.contactPhone}</span>
                    </div>
                  )}
                  {booking.preferredContact && (
                    <div className="flex items-center gap-2">
                      <ContactIcon className="h-4 w-4 text-gray-400" />
                      <span>Preferred: {booking.preferredContact}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {booking.specificGoals && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Learning Goals:</h4>
                <p className="text-sm text-gray-600 p-3 bg-yellow-50 rounded-lg">
                  {booking.specificGoals}
                </p>
              </div>
            )}
            
            {booking.questions && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Additional Notes:</h4>
                <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  {booking.questions}
                </p>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Need Help */}
        <Card className="mb-8 bg-gradient-to-r from-orange-50 to-yellow-50 border-0 shadow-lg">
          <Card.Content className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Need to Make Changes?</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you need to reschedule or have any questions about your booking, please contact us:
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => router.push('/account/bookings')}
                variant="outline"
                size="sm"
                leftIcon={<Calendar className="h-4 w-4" />}
              >
                Manage Bookings
              </Button>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-orange-600" />
                <span className="font-medium">support@igpsedu.com</span>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push('/account')}
            variant="outline"
            size="lg"
            leftIcon={<User className="h-5 w-5" />}
          >
            Go to Dashboard
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