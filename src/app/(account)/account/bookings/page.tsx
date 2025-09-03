'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar, Clock, MapPin, User, 
  Search, Filter, Plus, Eye, Edit3, X,
  MessageCircle, Users, Phone, Send, ChevronDown, ChevronRight
} from 'lucide-react';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  metadata: {
    type: string;
    grade?: string;
    teacher_name?: string;
    student_name?: string;
    phone?: string;
    diagnosis_answers?: Record<string, string>;
    review_type?: string;
    areas_of_concern?: string;
    notes?: string;
    cancelled_reason?: string;
    contact_method?: string;
    contact_details?: string;
    // Enrollment specific fields
    course_id?: string;
    course_title?: string;
    level?: string;
    books_per_period?: string;
    study_duration?: string;
    weekly_time?: string;
    preferred_contact?: string;
    best_time_to_call?: string;
    specific_goals?: string;
    experience_level?: string;
    preferred_start_date?: string;
    questions?: string;
    additional_data?: {
      level?: string;
      startDate?: string;
      studyTime?: string;
      preferredDays?: string;
      notes?: string;
      booksPerPeriod?: string;
      studyDuration?: string;
      weeklyTime?: string;
    };
  };
  created_at: string;
  updated_at?: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
}

type FilterType = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterType>('confirmed');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [showDiagnosisResponses, setShowDiagnosisResponses] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancelling(bookingId);
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bookingId,
          status: 'cancelled',
          cancelled_reason: 'Cancelled by user'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel booking');
      }

      // Update the booking in the local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' as const, metadata: { ...booking.metadata, cancelled_reason: 'Cancelled by user' } }
          : booking
      ));

    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(error instanceof Error ? error.message : 'Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(null);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const bookingType = booking.metadata?.type || 'booking';
    const teacherName = booking.metadata?.teacher_name || '';
    const studentName = booking.metadata?.student_name || '';
    
    const matchesSearch = bookingType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         studentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="info" size="sm">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
      case 'no_show':
        return <Badge variant="secondary" size="sm">No Show</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'diagnosis':
        return <User className="h-4 w-4" />;
      case 'progress_review':
        return <Edit3 className="h-4 w-4" />;
      case 'enrollment':
        return <Users className="h-4 w-4" />;
      case 'consultation':
        return <User className="h-4 w-4" />;
      case 'tutoring':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getContactIcon = (contactMethod: string) => {
    switch (contactMethod) {
      case 'wechat':
        return <MessageCircle className="h-5 w-5 text-gray-400" />;
      case 'teams':
        return <Users className="h-5 w-5 text-gray-400" />;
      case 'phone':
        return <Phone className="h-5 w-5 text-gray-400" />;
      case 'whatsapp':
        return <Phone className="h-5 w-5 text-gray-400" />;
      case 'telegram':
        return <Send className="h-5 w-5 text-gray-400" />;
      default:
        return <MessageCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatContactMethod = (contactMethod: string) => {
    switch (contactMethod) {
      case 'wechat':
        return 'WeChat';
      case 'teams':
        return 'Microsoft Teams';
      case 'phone':
        return 'Phone';
      case 'whatsapp':
        return 'WhatsApp';
      case 'telegram':
        return 'Telegram';
      default:
        return contactMethod.charAt(0).toUpperCase() + contactMethod.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">My Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your scheduled consultations, tutoring sessions, and workshops
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterType)}
              className="border border-gray-300 rounded-lg px-4 py-2 min-w-[150px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <Button 
          variant="primary" 
          className="flex items-center gap-2"
          onClick={() => window.location.href = '/booking'}
        >
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{bookings.length}</p>
            </div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending/Confirmed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length}
              </p>
            </div>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {bookings.filter(b => b.status === 'completed').length}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">
                {bookings.filter(b => new Date(b.booking_date).getMonth() === new Date().getMonth()).length}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
        </Card>
      </div>

      {filteredBookings.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || (filterStatus !== 'confirmed' && filterStatus !== 'all') 
                ? 'No matching bookings' 
                : filterStatus === 'confirmed' 
                  ? 'No confirmed bookings yet' 
                  : 'No bookings yet'
              }
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || (filterStatus !== 'confirmed' && filterStatus !== 'all')
                ? 'Try adjusting your search or filter criteria'
                : filterStatus === 'confirmed'
                  ? 'Your confirmed bookings will appear here once scheduled'
                  : 'Book your first consultation or tutoring session'
              }
            </p>
            {!searchTerm && (filterStatus === 'all' || filterStatus === 'confirmed') && (
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Schedule a Booking
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const bookingType = booking.metadata?.type || 'booking';
            const teacherName = booking.metadata?.teacher_name;
            const studentName = booking.metadata?.student_name;
            const grade = booking.metadata?.grade;
            const notes = booking.metadata?.notes;
            const cancelledReason = booking.metadata?.cancelled_reason;
            
            const getTitle = () => {
              if (bookingType === 'diagnosis') {
                return `Diagnostic Assessment${grade ? ` - Grade ${grade}` : ''}`;
              } else if (bookingType === 'progress_review') {
                return `Progress Review${grade ? ` - Grade ${grade}` : ''}`;
              } else if (bookingType === 'enrollment') {
                return 'Course Enrollment Request';
              }
              return bookingType.charAt(0).toUpperCase() + bookingType.slice(1);
            };
            
            return (
              <Card key={booking.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(bookingType)}
                        <h3 className="text-lg font-medium text-gray-900">{getTitle()}</h3>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    {/* Display course info prominently for enrollment */}
                    {bookingType === 'enrollment' && booking.metadata?.course_title && (
                      <div className="mb-3">
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
                          <Users className="h-4 w-4" />
                          {booking.metadata.course_title}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(booking.booking_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{booking.booking_time}</span>
                      </div>
                      {teacherName && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Teacher: {teacherName}</span>
                        </div>
                      )}
                      {studentName && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Student: {studentName}</span>
                        </div>
                      )}
                      {bookingType === 'enrollment' && booking.metadata?.level && (
                        <div className="flex items-center gap-2">
                          <Edit3 className="h-4 w-4" />
                          <span>Level: {booking.metadata.level}</span>
                        </div>
                      )}
                      {bookingType === 'enrollment' && booking.metadata?.books_per_period && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Books: {booking.metadata.books_per_period}</span>
                        </div>
                      )}
                      {bookingType === 'enrollment' && booking.metadata?.study_duration && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Duration: {booking.metadata.study_duration}</span>
                        </div>
                      )}
                      {bookingType === 'enrollment' && booking.metadata?.preferred_start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Start: {new Date(booking.metadata.preferred_start_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {bookingType === 'enrollment' && booking.metadata?.specific_goals && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-700">
                          <strong>Goals:</strong> {booking.metadata.specific_goals}
                        </p>
                      </div>
                    )}
                    
                    {notes && (
                      <p className="text-sm text-gray-600 mb-4">{notes}</p>
                    )}
                    
                    {cancelledReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-700">
                          <strong>Cancellation reason:</strong> {cancelledReason}
                        </p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Created: {new Date(booking.created_at).toLocaleDateString()}
                      {booking.confirmed_at && (
                        <span className="ml-4">Confirmed: {new Date(booking.confirmed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                
                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setViewingBooking(booking)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancelling === booking.id}
                      >
                        {cancelling === booking.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-1"></div>
                        ) : (
                          <X className="h-4 w-4 mr-1" />
                        )}
                        {cancelling === booking.id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking Details Modal */}
      {viewingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                {getTypeIcon(viewingBooking.metadata?.type || 'booking')}
                Booking Details
              </h2>
              <button
                onClick={() => {
                  setViewingBooking(null);
                  setShowDiagnosisResponses(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status and Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(viewingBooking.metadata?.type || 'booking')}
                    <h3 className="text-lg font-medium text-gray-900">
                      {viewingBooking.metadata?.type === 'diagnosis' 
                        ? `Diagnostic Assessment${viewingBooking.metadata?.grade ? ` - Grade ${viewingBooking.metadata.grade}` : ''}`
                        : viewingBooking.metadata?.type === 'progress_review'
                        ? `Progress Review${viewingBooking.metadata?.grade ? ` - Grade ${viewingBooking.metadata.grade}` : ''}`
                        : viewingBooking.metadata?.type === 'enrollment'
                        ? `Course Enrollment${viewingBooking.metadata?.course_title ? ` - ${viewingBooking.metadata.course_title}` : ''}`
                        : (viewingBooking.metadata?.type || 'booking').charAt(0).toUpperCase() + (viewingBooking.metadata?.type || 'booking').slice(1)
                      }
                    </h3>
                  </div>
                </div>
                {getStatusBadge(viewingBooking.status)}
              </div>

              {/* Course Info for Enrollment */}
              {viewingBooking.metadata?.type === 'enrollment' && viewingBooking.metadata?.course_title && (
                <div className="mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-blue-600 font-medium mb-1">Enrolled Course</p>
                        <p className="text-lg font-semibold text-blue-900">{viewingBooking.metadata.course_title}</p>
                        {viewingBooking.metadata?.course_id && (
                          <p className="text-xs text-blue-600 mt-1">Course ID: {viewingBooking.metadata.course_id}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(viewingBooking.booking_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">{viewingBooking.booking_time}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {viewingBooking.metadata?.teacher_name && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Teacher</p>
                        <p className="font-medium">{viewingBooking.metadata.teacher_name}</p>
                      </div>
                    </div>
                  )}
                  {viewingBooking.metadata?.grade && (
                    <div className="flex items-center gap-3">
                      <Edit3 className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Grade Level</p>
                        <p className="font-medium">Grade {viewingBooking.metadata.grade}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    {viewingBooking.metadata?.contact_method ? (
                      <>
                        {getContactIcon(viewingBooking.metadata.contact_method)}
                        <div>
                          <p className="text-sm text-gray-500">Preferred Contact</p>
                          <p className="font-medium">
                            {formatContactMethod(viewingBooking.metadata.contact_method)}
                            {viewingBooking.metadata.contact_details && (
                              <span className="text-sm text-gray-600 ml-2">
                                ({viewingBooking.metadata.contact_details})
                              </span>
                            )}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-5 w-5 text-gray-300" />
                        <div>
                          <p className="text-sm text-gray-500">Preferred Contact</p>
                          <p className="text-gray-400 text-sm">Not specified</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Information */}
              {(viewingBooking.metadata?.student_name || viewingBooking.metadata?.phone) && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Student Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingBooking.metadata?.student_name && (
                      <div>
                        <p className="text-sm text-gray-500">Student Name</p>
                        <p className="font-medium">{viewingBooking.metadata.student_name}</p>
                      </div>
                    )}
                    {viewingBooking.metadata?.phone && (
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{viewingBooking.metadata.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Diagnosis Information */}
              {viewingBooking.metadata?.diagnosis_answers && (
                <div className="border-t border-gray-200 pt-6">
                  <button
                    onClick={() => setShowDiagnosisResponses(!showDiagnosisResponses)}
                    className="flex items-center gap-2 text-md font-medium text-gray-900 mb-3 hover:text-gray-700 transition-colors"
                  >
                    {showDiagnosisResponses ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Diagnostic Assessment Responses
                    <span className="text-sm text-gray-500 font-normal">
                      ({Object.keys(viewingBooking.metadata.diagnosis_answers).length} responses)
                    </span>
                  </button>
                  {showDiagnosisResponses && (
                    <div className="space-y-3">
                      {Object.entries(viewingBooking.metadata.diagnosis_answers).map(([question, answer]) => (
                        <div key={question} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">{question}:</p>
                          <p className="text-sm text-gray-600">{answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Progress Review Information */}
              {(viewingBooking.metadata?.review_type || viewingBooking.metadata?.areas_of_concern) && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Progress Review Details</h4>
                  <div className="space-y-3">
                    {viewingBooking.metadata?.review_type && (
                      <div>
                        <p className="text-sm text-gray-500">Review Type</p>
                        <p className="font-medium">{viewingBooking.metadata.review_type}</p>
                      </div>
                    )}
                    {viewingBooking.metadata?.areas_of_concern && (
                      <div>
                        <p className="text-sm text-gray-500">Areas of Concern</p>
                        <p className="font-medium">{viewingBooking.metadata.areas_of_concern}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enrollment Information */}
              {viewingBooking.metadata?.type === 'enrollment' && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Enrollment Preferences</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingBooking.metadata?.level && (
                        <div>
                          <p className="text-sm text-gray-500">Level</p>
                          <p className="font-medium capitalize">{viewingBooking.metadata.level}</p>
                        </div>
                      )}
                      {viewingBooking.metadata?.books_per_period && (
                        <div>
                          <p className="text-sm text-gray-500">Books per Period</p>
                          <p className="font-medium">{viewingBooking.metadata.books_per_period}</p>
                        </div>
                      )}
                      {viewingBooking.metadata?.study_duration && (
                        <div>
                          <p className="text-sm text-gray-500">Study Duration</p>
                          <p className="font-medium">{viewingBooking.metadata.study_duration}</p>
                        </div>
                      )}
                      {viewingBooking.metadata?.weekly_time && (
                        <div>
                          <p className="text-sm text-gray-500">Weekly Time Commitment</p>
                          <p className="font-medium">{viewingBooking.metadata.weekly_time}</p>
                        </div>
                      )}
                      {viewingBooking.metadata?.preferred_start_date && (
                        <div>
                          <p className="text-sm text-gray-500">Preferred Start Date</p>
                          <p className="font-medium">
                            {new Date(viewingBooking.metadata.preferred_start_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {viewingBooking.metadata?.additional_data?.studyTime && (
                        <div>
                          <p className="text-sm text-gray-500">Preferred Study Time</p>
                          <p className="font-medium capitalize">{viewingBooking.metadata.additional_data.studyTime}</p>
                        </div>
                      )}
                      {viewingBooking.metadata?.additional_data?.preferredDays && (
                        <div>
                          <p className="text-sm text-gray-500">Preferred Days</p>
                          <p className="font-medium">{viewingBooking.metadata.additional_data.preferredDays}</p>
                        </div>
                      )}
                    </div>
                    {viewingBooking.metadata?.specific_goals && (
                      <div>
                        <p className="text-sm text-gray-500">Learning Goals</p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-1">
                          <p className="text-sm text-green-800">{viewingBooking.metadata.specific_goals}</p>
                        </div>
                      </div>
                    )}
                    {viewingBooking.metadata?.questions && (
                      <div>
                        <p className="text-sm text-gray-500">Questions/Requirements</p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-1">
                          <p className="text-sm text-yellow-800">{viewingBooking.metadata.questions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewingBooking.metadata?.notes && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Notes</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">{viewingBooking.metadata.notes}</p>
                  </div>
                </div>
              )}

              {/* Cancellation Reason */}
              {viewingBooking.metadata?.cancelled_reason && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Cancellation</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">
                      <strong>Reason:</strong> {viewingBooking.metadata.cancelled_reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Timeline</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Created:</strong> {new Date(viewingBooking.created_at).toLocaleString()}</p>
                  {viewingBooking.confirmed_at && (
                    <p><strong>Confirmed:</strong> {new Date(viewingBooking.confirmed_at).toLocaleString()}</p>
                  )}
                  {viewingBooking.completed_at && (
                    <p><strong>Completed:</strong> {new Date(viewingBooking.completed_at).toLocaleString()}</p>
                  )}
                  {viewingBooking.cancelled_at && (
                    <p><strong>Cancelled:</strong> {new Date(viewingBooking.cancelled_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Booking ID: {viewingBooking.id.split('-')[0]}...
              </div>
              <div className="flex items-center gap-3">
                {(viewingBooking.status === 'pending' || viewingBooking.status === 'confirmed') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      handleCancelBooking(viewingBooking.id);
                      setViewingBooking(null);
                    }}
                    disabled={cancelling === viewingBooking.id}
                  >
                    {cancelling === viewingBooking.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-1"></div>
                    ) : (
                      <X className="h-4 w-4 mr-1" />
                    )}
                    Cancel Booking
                  </Button>
                )}
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => {
                    setViewingBooking(null);
                    setShowDiagnosisResponses(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}