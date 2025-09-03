'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Clock, User, Search, Filter, 
  Eye, Edit, X, Check, AlertTriangle,
  UserCheck, Mail, Phone, ChevronDown, ChevronRight,
  MessageCircle, Users, Send, ArrowLeft, BookOpen,
  TrendingUp, GraduationCap
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';

interface AdminBooking {
  id: string;
  user_id: string;
  teacher_id: string;
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
    level?: string;
    books_per_period?: string;
    study_duration?: string;
    weekly_time?: string;
    course_id?: string;
    course_title?: string;
    source?: string;
    hasTestData?: boolean;
    hasReviewData?: boolean;
    hasEnrollmentData?: boolean;
  };
  created_at: string;
  updated_at?: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  // User info
  user_email?: string;
  user_name?: string;
}

type FilterType = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
type BookingType = 'all' | 'diagnosis' | 'progress_review' | 'enrollment';

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterType>('confirmed');
  const [filterType, setFilterType] = useState<BookingType>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [viewingBooking, setViewingBooking] = useState<AdminBooking | null>(null);
  const [showDiagnosisResponses, setShowDiagnosisResponses] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAllBookings();
    }
  }, [user]);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/bookings');
      
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

  const updateBookingStatus = async (bookingId: string, newStatus: AdminBooking['status'], reason?: string) => {
    setUpdating(bookingId);
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bookingId,
          status: newStatus,
          ...(reason && { cancelled_reason: reason }),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update booking');
      }

      // Update the booking in local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { 
              ...booking, 
              status: newStatus, 
              ...(newStatus === 'cancelled' && { cancelled_at: new Date().toISOString() }),
              ...(newStatus === 'confirmed' && { confirmed_at: new Date().toISOString() }),
              ...(newStatus === 'completed' && { completed_at: new Date().toISOString() }),
              metadata: { 
                ...booking.metadata, 
                ...(reason && { cancelled_reason: reason })
              }
            }
          : booking
      ));

    } catch (error) {
      console.error('Error updating booking:', error);
      alert(error instanceof Error ? error.message : 'Failed to update booking');
    } finally {
      setUpdating(null);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const bookingType = booking.metadata?.type || 'booking';
    const teacherName = booking.metadata?.teacher_name || '';
    const studentName = booking.metadata?.student_name || '';
    const userEmail = booking.user_email || '';
    const userName = booking.user_name || '';
    
    const matchesSearch = 
      bookingType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatusFilter = filterStatus === 'all' || booking.status === filterStatus;
    const matchesTypeFilter = filterType === 'all' || booking.metadata?.type === filterType;
    
    return matchesSearch && matchesStatusFilter && matchesTypeFilter;
  });

  const getStatusBadge = (status: AdminBooking['status']) => {
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
        return <Edit className="h-4 w-4" />;
      case 'enrollment':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  const formatEnrollmentPreference = (key: string, value: string) => {
    const labels: Record<string, string> = {
      level: 'Level',
      books_per_period: 'Books per Period',
      study_duration: 'Study Duration',
      weekly_time: 'Weekly Time Commitment'
    };
    
    const valueFormatting: Record<string, Record<string, string>> = {
      level: {
        basic: 'Basic',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
        custom: 'Custom'
      },
      books_per_period: {
        intensive: 'Intensive',
        moderate: 'Moderate',
        light: 'Light'
      },
      study_duration: {
        standard: 'Standard',
        extended: 'Extended',
        accelerated: 'Accelerated'
      },
      weekly_time: {
        dedicated: 'Dedicated',
        regular: 'Regular',
        flexible: 'Flexible'
      }
    };
    
    const label = labels[key] || key;
    const formattedValue = valueFormatting[key]?.[value] || value.charAt(0).toUpperCase() + value.slice(1);
    
    return { label, value: formattedValue };
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/users')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Users
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Bookings Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage all user bookings across the platform
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings, users, teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterType)}
              className="border border-gray-300 rounded-lg px-4 py-2 min-w-[150px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as BookingType)}
            className="border border-gray-300 rounded-lg px-4 py-2 min-w-[150px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="diagnosis">Diagnosis</option>
            <option value="progress_review">Progress Review</option>
            <option value="enrollment">Enrollment</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Confirmed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {bookings.filter(b => b.status === 'confirmed').length}
              </p>
            </div>
            <UserCheck className="h-5 w-5 text-blue-400" />
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
            <Check className="h-5 w-5 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {bookings.filter(b => new Date(b.booking_date).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all' ? 'No matching bookings' : 'No bookings yet'}
            </h3>
            <p className="text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Bookings will appear here as users create them'
              }
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const bookingType = booking.metadata?.type || 'booking';
            const teacherName = booking.metadata?.teacher_name;
            const studentName = booking.metadata?.student_name;
            const grade = booking.metadata?.grade;
            const phone = booking.metadata?.phone;
            const notes = booking.metadata?.notes;
            const areasOfConcern = booking.metadata?.areas_of_concern;
            const reviewType = booking.metadata?.review_type;
            
            const getTitle = () => {
              if (bookingType === 'diagnosis') {
                return `Diagnostic Assessment${grade ? ` - Grade ${grade}` : ''}`;
              } else if (bookingType === 'progress_review') {
                const reviewLabel = reviewType ? ` (${reviewType})` : '';
                return `Progress Review${grade ? ` - Grade ${grade}` : ''}${reviewLabel}`;
              } else if (bookingType === 'enrollment') {
                return `Course Enrollment${booking.metadata?.course_title ? ` - ${booking.metadata.course_title}` : ''}`;
              }
              return bookingType.charAt(0).toUpperCase() + bookingType.slice(1);
            };
            
            return (
              <Card key={booking.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(bookingType)}
                        <h3 className="text-lg font-medium text-gray-900">{getTitle()}</h3>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(booking.booking_date)} at {booking.booking_time}</span>
                      </div>
                      
                      {(booking.user_name || booking.user_email) && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>User: {booking.user_name || booking.user_email}</span>
                        </div>
                      )}
                      
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
                      
                      {phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Created: {new Date(booking.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Additional details row */}
                    {(areasOfConcern || notes || reviewType) && (
                      <div className="border-t pt-3 mt-3 space-y-2">
                        {areasOfConcern && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Areas of Concern:</span>
                            <span className="text-gray-600 ml-2">{areasOfConcern}</span>
                          </div>
                        )}
                        {reviewType && bookingType === 'progress_review' && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Review Type:</span>
                            <span className="text-gray-600 ml-2">{reviewType}</span>
                          </div>
                        )}
                        {notes && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Notes:</span>
                            <span className="text-gray-600 ml-2">{notes}</span>
                          </div>
                        )}
                      </div>
                    )}
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
                    
                    {booking.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        disabled={updating === booking.id}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                    )}
                    
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const reason = prompt('Cancellation reason (optional):') || 'Cancelled by admin';
                          updateBookingStatus(booking.id, 'cancelled', reason);
                        }}
                        disabled={updating === booking.id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                        disabled={updating === booking.id}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Booking Modal (similar to user bookings page) */}
      {viewingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                {getTypeIcon(viewingBooking.metadata?.type || 'booking')}
                Admin - Booking Details
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
            
            <div className="p-6 space-y-4">
              {/* User & Booking Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">User Information</h4>
                  <div className="space-y-1 text-sm">
                    {viewingBooking.user_name && (
                      <p><strong>Name:</strong> {viewingBooking.user_name}</p>
                    )}
                    <p><strong>Email:</strong> {viewingBooking.user_email || 'N/A'}</p>
                    {viewingBooking.metadata?.phone && (
                      <p><strong>Phone:</strong> {viewingBooking.metadata.phone}</p>
                    )}
                    {viewingBooking.metadata?.student_name && (
                      <p><strong>Student:</strong> {viewingBooking.metadata.student_name}</p>
                    )}
                    <p className="text-xs text-gray-500"><strong>User ID:</strong> {viewingBooking.user_id.slice(0, 8)}...</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Booking Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Date:</strong> {formatDate(viewingBooking.booking_date)}</p>
                    <p><strong>Time:</strong> {viewingBooking.booking_time}</p>
                    <p><strong>Type:</strong> {viewingBooking.metadata?.type || 'N/A'}</p>
                    {viewingBooking.metadata?.review_type && (
                      <p><strong>Review Type:</strong> {viewingBooking.metadata.review_type}</p>
                    )}
                    <p><strong>Grade:</strong> {viewingBooking.metadata?.grade || 'N/A'}</p>
                    <p><strong>Teacher:</strong> {viewingBooking.metadata?.teacher_name || 'N/A'}</p>
                    <p className="text-xs text-gray-500"><strong>Teacher ID:</strong> {viewingBooking.teacher_id.slice(0, 8)}...</p>
                    <div><strong>Status:</strong> {getStatusBadge(viewingBooking.status)}</div>
                    {viewingBooking.metadata?.contact_method ? (
                      <p>
                        <strong>Preferred Contact:</strong> {formatContactMethod(viewingBooking.metadata.contact_method)}
                        {viewingBooking.metadata.contact_details && (
                          <span className="text-gray-600 ml-1">({viewingBooking.metadata.contact_details})</span>
                        )}
                      </p>
                    ) : (
                      <p><strong>Preferred Contact:</strong> <span className="text-gray-400">Not specified</span></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional details based on booking type */}
              {viewingBooking.metadata?.diagnosis_answers && (
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => setShowDiagnosisResponses(!showDiagnosisResponses)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2 hover:text-gray-700 transition-colors"
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
                    <div className="space-y-2">
                      {Object.entries(viewingBooking.metadata.diagnosis_answers).map(([question, answer]) => (
                        <div key={question} className="bg-gray-50 rounded p-2">
                          <p className="text-sm font-medium text-gray-700">{question}:</p>
                          <p className="text-sm text-gray-600 mt-1">{answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Enrollment Details - Compact */}
              {viewingBooking.metadata?.type === 'enrollment' && viewingBooking.metadata?.hasEnrollmentData && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {viewingBooking.metadata?.course_title && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Course:</span>
                        <span className="ml-2 text-gray-600">{viewingBooking.metadata.course_title}</span>
                      </div>
                    )}
                    {viewingBooking.metadata?.level && (
                      <div>
                        <span className="font-medium text-gray-700">Level:</span>
                        <span className="ml-2 text-gray-600">
                          {formatEnrollmentPreference('level', viewingBooking.metadata.level).value}
                        </span>
                      </div>
                    )}
                    {viewingBooking.metadata?.books_per_period && (
                      <div>
                        <span className="font-medium text-gray-700">Books/Period:</span>
                        <span className="ml-2 text-gray-600">
                          {formatEnrollmentPreference('books_per_period', viewingBooking.metadata.books_per_period).value}
                        </span>
                      </div>
                    )}
                    {viewingBooking.metadata?.study_duration && (
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <span className="ml-2 text-gray-600">
                          {formatEnrollmentPreference('study_duration', viewingBooking.metadata.study_duration).value}
                        </span>
                      </div>
                    )}
                    {viewingBooking.metadata?.weekly_time && (
                      <div>
                        <span className="font-medium text-gray-700">Weekly Time:</span>
                        <span className="ml-2 text-gray-600">
                          {formatEnrollmentPreference('weekly_time', viewingBooking.metadata.weekly_time).value}
                        </span>
                      </div>
                    )}
                    {viewingBooking.metadata?.source && (
                      <div className="col-span-2 text-xs text-gray-500 mt-1">
                        Source: {viewingBooking.metadata.source.replace(/_/g, ' ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information - Compact */}
              {(viewingBooking.metadata?.areas_of_concern || viewingBooking.metadata?.notes || viewingBooking.metadata?.cancelled_reason) && (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  {viewingBooking.metadata?.areas_of_concern && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Areas of Concern:</span>
                      <p className="text-gray-600 mt-1">{viewingBooking.metadata.areas_of_concern}</p>
                    </div>
                  )}
                  {viewingBooking.metadata?.notes && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Notes:</span>
                      <p className="text-gray-600 mt-1">{viewingBooking.metadata.notes}</p>
                    </div>
                  )}
                  {viewingBooking.metadata?.cancelled_reason && viewingBooking.status === 'cancelled' && (
                    <div className="text-sm">
                      <span className="font-medium text-red-700">Cancellation Reason:</span>
                      <p className="text-red-600 mt-1">{viewingBooking.metadata.cancelled_reason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline - Compact */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Created:</strong> {new Date(viewingBooking.created_at).toLocaleString()}</p>
                  {viewingBooking.updated_at && (
                    <p><strong>Last Updated:</strong> {new Date(viewingBooking.updated_at).toLocaleString()}</p>
                  )}
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
      )}
    </div>
  );
}