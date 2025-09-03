'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, Clock, User, ChevronLeft, Check, AlertCircle, MessageCircle, Users, Phone, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthWrapper from '../diagnosis/AuthWrapper';

interface TimeSlot {
  time: string;
  available: boolean;
  teacherId?: string;
  teacherName?: string;
}

interface Teacher {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  social_media?: {
    teams?: string;
    wechat?: string;
    whatsapp?: string;
    telegram?: string;
    linkedin?: string;
  };
  phone?: string;
}

function ScheduleBookingContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedContactMethod, setSelectedContactMethod] = useState<string>('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  
  const bookingType = searchParams.get('type') || 'diagnosis';
  const grade = searchParams.get('grade') || '';
  
  // For enrollment, get data from sessionStorage
  const [enrollmentData, setEnrollmentData] = useState<any>(null);

  // Generate exactly 14 days (2 weeks)
  const generateDateRange = () => {
    const dates = [];
    const today = new Date();
    
    // Generate exactly 14 days starting from today
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const allDates = generateDateRange();
  
  // Group dates by week for better display
  const getWeekGroups = () => {
    const weeks = [];
    for (let i = 0; i < allDates.length; i += 7) {
      const weekDates = allDates.slice(i, i + 7);
      if (weekDates.length > 0) {  // Only add week if it has dates
        weeks.push(weekDates);
      }
    }
    return weeks;
  };
  
  const weekGroups = getWeekGroups();

  // Fetch available time slots for selected date (all teachers)
  const fetchAvailableSlots = async (date: string) => {
    if (!date) {
      setTimeSlots([]);
      return;
    }

    setLoadingSlots(true);
    try {
      // Fetch general availability for the date
      const response = await fetch(`/api/bookings/availability?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        // Default time slots with availability
        const defaultSlots = [
          '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM'
        ];
        
        // If API returns specific slots, use them; otherwise use defaults
        if (data.slots && data.slots.length > 0) {
          setTimeSlots(data.slots);
        } else {
          // Create slots with general availability
          setTimeSlots(defaultSlots.map(time => ({
            time,
            available: true
          })));
        }
      } else {
        // Default slots all available
        setTimeSlots([
          { time: '10:00 AM', available: true },
          { time: '11:00 AM', available: true },
          { time: '12:00 PM', available: true },
          { time: '1:00 PM', available: true },
        ]);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      // Default slots all available on error
      setTimeSlots([
        { time: '10:00 AM', available: true },
        { time: '11:00 AM', available: true },
        { time: '12:00 PM', available: true },
        { time: '1:00 PM', available: true },
      ]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch available teachers for selected date and time
  const fetchAvailableTeachers = async (date: string, time: string) => {
    if (!date || !time) {
      setAvailableTeachers(teachers);
      return;
    }

    setLoadingTeachers(true);
    try {
      // Check which teachers are available for this date/time
      const response = await fetch(`/api/bookings/available-teachers?date=${date}&time=${encodeURIComponent(time)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.teachers && data.teachers.length > 0) {
          setAvailableTeachers(data.teachers);
        } else {
          // If no specific availability data, assume all teachers are available
          setAvailableTeachers(teachers);
        }
      } else {
        // On error, show all teachers
        setAvailableTeachers(teachers);
      }
    } catch (error) {
      console.error('Error fetching available teachers:', error);
      // On error, show all teachers
      setAvailableTeachers(teachers);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Fetch teachers on component mount and load enrollment data if applicable
  useEffect(() => {
    fetchTeachers();
    
    // Load enrollment data if this is an enrollment booking
    if (bookingType === 'enrollment') {
      const storedData = sessionStorage.getItem('enrollmentData');
      if (storedData) {
        const data = JSON.parse(storedData);
        setEnrollmentData(data);
        
        // If we have a courseId but no title, fetch course details
        if (data.courseId && !data.courseTitle) {
          fetchCourseDetails(data.courseId);
        }
      }
    }
  }, [bookingType]);
  
  const fetchCourseDetails = async (courseId: string) => {
    try {
      const response = await fetch(`/api/public/courses/${courseId}`);
      if (response.ok) {
        const course = await response.json();
        setEnrollmentData((prev: any) => ({
          ...prev,
          courseTitle: course.title || course.name
        }));
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
      // Reset selected time when date changes
      setSelectedTime('');
      setSelectedTeacher('');
      setSelectedContactMethod('');
    } else {
      setTimeSlots([]);
    }
  }, [selectedDate]);

  // Fetch available teachers when date and time are selected
  useEffect(() => {
    if (selectedDate && selectedTime) {
      fetchAvailableTeachers(selectedDate, selectedTime);
      // Reset teacher selection when time changes
      setSelectedTeacher('');
      setSelectedContactMethod('');
    } else {
      setAvailableTeachers(teachers);
    }
  }, [selectedDate, selectedTime, teachers]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([
        // Mock data for design purposes
        { id: '1', email: 'teacher1@example.com', full_name: 'John Smith', role: 'teacher' },
        { id: '2', email: 'teacher2@example.com', full_name: 'Jane Doe', role: 'teacher' },
        { id: '3', email: 'admin@example.com', full_name: 'Admin User', role: 'admin' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedTeacher || !selectedContactMethod) {
      setError('Please select all required fields including contact method');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Get stored test data if exists
      const testDataStr = sessionStorage.getItem('diagnosisTestData');
      const testData = testDataStr ? JSON.parse(testDataStr) : null;
      
      // Get stored progress review data if exists
      const reviewDataStr = sessionStorage.getItem('progressReviewData');
      const reviewData = reviewDataStr ? JSON.parse(reviewDataStr) : null;

      // Prepare booking data for API based on booking type
      const bookingPayload: any = {
        booking_type: bookingType,
        booking_date: selectedDate,
        booking_time: selectedTime,
        teacher_id: selectedTeacher,
        teacher_name: (availableTeachers.find(t => t.id === selectedTeacher) || teachers.find(t => t.id === selectedTeacher))?.full_name || 
                      (availableTeachers.find(t => t.id === selectedTeacher) || teachers.find(t => t.id === selectedTeacher))?.email || '',
        user_email: user?.email,
      };

      // Add type-specific data
      if (bookingType === 'diagnosis' && testData) {
        // Only add diagnosis data for diagnosis bookings
        bookingPayload.grade = grade || testData.grade;
        bookingPayload.diagnosis_answers = testData.answers;
        bookingPayload.diagnosis_test_date = testData.testDate;
      } else if (bookingType === 'progress-review' && reviewData) {
        // Only add progress review data for progress review bookings
        bookingPayload.grade = reviewData.currentGrade;
        bookingPayload.duration_since_enrollment = reviewData.duration;
        bookingPayload.review_type = reviewData.reviewType;
        bookingPayload.areas_of_concern = reviewData.concerns;
      } else if (bookingType === 'enrollment' && enrollmentData) {
        // Add enrollment specific data
        bookingPayload.course_id = enrollmentData.courseId;
        bookingPayload.course_title = enrollmentData.courseTitle;
        bookingPayload.level = enrollmentData.level;
        bookingPayload.books_per_period = enrollmentData.booksPerPeriod;
        bookingPayload.study_duration = enrollmentData.studyDuration;
        bookingPayload.weekly_time = enrollmentData.weeklyTime;
        bookingPayload.specific_goals = enrollmentData.specificGoals;
        bookingPayload.preferred_start_date = enrollmentData.preferredStartDate;
        bookingPayload.questions = enrollmentData.questions;
      } else {
        // Default grade if neither type has data
        bookingPayload.grade = grade;
      }

      // Add common metadata
      bookingPayload.metadata = {
          source: 'booking_schedule_page',
          type: bookingType,
          hasTestData: bookingType === 'diagnosis' && !!testData,
          hasReviewData: bookingType === 'progress-review' && !!reviewData,
          hasEnrollmentData: bookingType === 'enrollment' && !!enrollmentData,
          contact_method: selectedContactMethod,
          ...(bookingType === 'progress-review' && reviewData?.additionalComments && {
            additional_comments: reviewData.additionalComments
          }),
          ...(bookingType === 'enrollment' && enrollmentData && {
            course_id: enrollmentData.courseId,
            course_title: enrollmentData.courseTitle,
            level: enrollmentData.level,
            books_per_period: enrollmentData.booksPerPeriod,
            study_duration: enrollmentData.studyDuration,
            weekly_time: enrollmentData.weeklyTime,
            specific_goals: enrollmentData.specificGoals,
            preferred_start_date: enrollmentData.preferredStartDate,
            questions: enrollmentData.questions,
            study_time: enrollmentData.studyTime,
            preferred_days: enrollmentData.preferredDays,
            notes: enrollmentData.notes
          }),
          contact_details: (() => {
            const teacherData = availableTeachers.find(t => t.id === selectedTeacher) || teachers.find(t => t.id === selectedTeacher);
            if (!teacherData) return null;
            
            switch (selectedContactMethod) {
              case 'phone':
                return teacherData.phone;
              case 'wechat':
                return teacherData.social_media?.wechat;
              case 'teams':
                return teacherData.social_media?.teams;
              case 'whatsapp':
                return teacherData.social_media?.whatsapp;
              case 'telegram':
                return teacherData.social_media?.telegram;
              default:
                return null;
            }
          })()
      };

      // Save to database
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      // Store confirmation data for display
      const confirmationData = {
        id: result.booking.id,
        type: bookingType,
        grade: bookingPayload.grade,
        date: selectedDate,
        time: selectedTime,
        teacherId: selectedTeacher,
        teacherName: bookingPayload.teacher_name,
        userEmail: user?.email,
        createdAt: result.booking.created_at,
        // Add type-specific confirmation details
        ...(bookingType === 'diagnosis' && { hasTestData: true }),
        ...(bookingType === 'progress-review' && { 
          reviewType: reviewData?.reviewType,
          duration: reviewData?.duration 
        }),
        ...(bookingType === 'enrollment' && enrollmentData && {
          courseTitle: enrollmentData.courseTitle,
          courseId: enrollmentData.courseId,
          level: enrollmentData.level,
          booksPerPeriod: enrollmentData.booksPerPeriod,
          studyDuration: enrollmentData.studyDuration,
          weeklyTime: enrollmentData.weeklyTime,
          specificGoals: enrollmentData.specificGoals,
          questions: enrollmentData.questions,
          preferredStartDate: enrollmentData.preferredStartDate
        })
      };

      sessionStorage.setItem('bookingConfirmation', JSON.stringify(confirmationData));
      
      // Clear test/review/enrollment data
      sessionStorage.removeItem('diagnosisTestData');
      sessionStorage.removeItem('progressReviewData');
      sessionStorage.removeItem('enrollmentData');
      
      // Redirect to confirmation page
      router.push('/booking/confirmation');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to complete booking. Please try again.');
      console.error('Booking error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Your Appointment</h1>
          <p className="text-gray-600 mt-2">
            {bookingType === 'diagnosis' ? 'Diagnostic Assessment' : 
             bookingType === 'progress-review' ? 'Progress Review' :
             bookingType === 'enrollment' ? 'Course Enrollment Consultation' :
             bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} 
            {grade && ` - Grade ${grade}`}
            {bookingType === 'enrollment' && enrollmentData?.courseTitle && (
              <span className="block text-lg font-semibold text-blue-600 mt-1">
                {enrollmentData.courseTitle}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Date & Time Selection */}
          <div className="lg:col-span-2 space-y-8">
            {/* Date Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Select Date
                </span>
                <span className="text-sm text-gray-500">Next 14 days available</span>
              </h2>
              
              {/* Scrollable date container */}
              <div className="relative">
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-6">
                    {weekGroups.map((week, weekIndex) => {
                      // Only render week if it has dates
                      if (week.length === 0) return null;
                      
                      return (
                        <div key={weekIndex} className="flex-shrink-0">
                          <div className="text-xs font-medium text-gray-500 mb-2 text-center">
                            {weekIndex === 0 ? 'This Week' : 'Next Week'}
                          </div>
                          <div className="grid grid-cols-7 gap-2">
                            {week.map((date, dayIndex) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const isSelected = selectedDate === dateStr;
                            const isToday = date.toDateString() === new Date().toDateString();
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                            const dayNum = date.getDate();
                            const month = date.toLocaleDateString('en-US', { month: 'short' });
                            
                            return (
                              <button
                                key={`${weekIndex}-${dayIndex}`}
                                onClick={() => setSelectedDate(dateStr)}
                                className={`relative p-3 rounded-lg border-2 transition-all min-w-[70px] ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : isToday
                                    ? 'border-green-300 bg-green-50 hover:border-green-400'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="text-xs font-medium">{dayName}</div>
                                <div className="text-lg font-bold">{dayNum}</div>
                                <div className="text-xs text-gray-500">{month}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Quick jump buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setSelectedDate(tomorrow.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  onClick={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    setSelectedDate(nextWeek.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Next Week
                </button>
              </div>
            </div>

            {/* Time Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Select Time
                {loadingSlots && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
                )}
              </h2>
              
              {!selectedDate ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Please select a date first</p>
                  <p className="text-sm text-gray-500 mt-1">Available time slots will appear after selecting a date</p>
                </div>
              ) : loadingSlots ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-600">Checking availability...</p>
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No time slots available</p>
                  <p className="text-sm text-gray-500 mt-1">Please try a different date</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : slot.available
                            ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-medium">{slot.time}</div>
                        {!slot.available && (
                          <div className="text-xs mt-1">Unavailable</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Teacher Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Select Teacher
                {loadingTeachers && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
                )}
              </h2>
              
              {!selectedDate || !selectedTime ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Please select date and time first</p>
                  <p className="text-sm text-gray-500 mt-1">Available teachers will be shown based on your selected schedule</p>
                </div>
              ) : loadingTeachers ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Checking teacher availability...</p>
                </div>
              ) : loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading teachers...</p>
                </div>
              ) : availableTeachers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No teachers available for this time slot</p>
                  <p className="text-sm text-gray-500 mt-1">Please try a different date or time</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableTeachers.map((teacher) => {
                    const isSelected = selectedTeacher === teacher.id;
                    return (
                      <button
                        key={teacher.id}
                        onClick={() => setSelectedTeacher(teacher.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">
                              {teacher.full_name || teacher.email}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{teacher.email}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {teacher.role === 'admin' ? 'Admin/Teacher' : 'Teacher'}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Contact Method Selection */}
              {selectedTeacher && (() => {
                const selectedTeacherData = availableTeachers.find(t => t.id === selectedTeacher) || teachers.find(t => t.id === selectedTeacher);
                const hasSocialMedia = selectedTeacherData?.social_media && 
                  Object.values(selectedTeacherData.social_media).some(value => value);
                
                if (!selectedTeacherData || (!hasSocialMedia && !selectedTeacherData.phone)) {
                  return null;
                }
                
                // Build contact options array with WeChat first
                const contactOptions = [];
                
                if (selectedTeacherData.social_media?.wechat) {
                  contactOptions.push({
                    value: 'wechat',
                    label: 'WeChat',
                    contact: selectedTeacherData.social_media.wechat,
                    icon: MessageCircle
                  });
                }
                
                if (selectedTeacherData.social_media?.teams) {
                  contactOptions.push({
                    value: 'teams',
                    label: 'Teams',
                    contact: selectedTeacherData.social_media.teams,
                    icon: Users
                  });
                }
                
                if (selectedTeacherData.phone) {
                  contactOptions.push({
                    value: 'phone',
                    label: 'Phone',
                    contact: selectedTeacherData.phone,
                    icon: Phone
                  });
                }
                
                if (selectedTeacherData.social_media?.whatsapp) {
                  contactOptions.push({
                    value: 'whatsapp',
                    label: 'WhatsApp',
                    contact: selectedTeacherData.social_media.whatsapp,
                    icon: Phone
                  });
                }
                
                if (selectedTeacherData.social_media?.telegram) {
                  contactOptions.push({
                    value: 'telegram',
                    label: 'Telegram',
                    contact: selectedTeacherData.social_media.telegram,
                    icon: Send
                  });
                }
                
                return (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Select Contact Method</h3>
                    <p className="text-xs text-gray-600 mb-3">
                      Choose how you'd like the teacher to contact you after the session
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {contactOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = selectedContactMethod === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setSelectedContactMethod(option.value)}
                            className={`flex-1 min-w-0 p-2 rounded-lg border-2 text-center transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                              <div className={`text-xs font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'} truncate w-full`}>
                                {option.label}
                              </div>
                              {isSelected && (
                                <Check className="h-3 w-3 text-blue-600" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">
                    {bookingType === 'diagnosis' ? 'Diagnostic Assessment' :
                     bookingType === 'progress-review' ? 'Progress Review' :
                     bookingType === 'enrollment' ? 'Enrollment' :
                     bookingType}
                  </span>
                </div>
                {bookingType === 'enrollment' && enrollmentData?.courseTitle && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Course:</span>
                    <span className="font-medium text-blue-600">{enrollmentData.courseTitle}</span>
                  </div>
                )}
                {bookingType === 'enrollment' && enrollmentData?.level && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Level:</span>
                    <span className="font-medium capitalize">{enrollmentData.level}</span>
                  </div>
                )}
                {bookingType === 'enrollment' && enrollmentData?.booksPerPeriod && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Books:</span>
                    <span className="font-medium">{enrollmentData.booksPerPeriod}</span>
                  </div>
                )}
                {bookingType === 'enrollment' && enrollmentData?.studyDuration && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{enrollmentData.studyDuration}</span>
                  </div>
                )}
                {bookingType === 'enrollment' && enrollmentData?.weeklyTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Weekly:</span>
                    <span className="font-medium">{enrollmentData.weeklyTime}</span>
                  </div>
                )}
                {grade && bookingType !== 'enrollment' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Grade:</span>
                    <span className="font-medium">Grade {grade}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{selectedTime || 'Not selected'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Teacher:</span>
                  <span className="font-medium">
                    {selectedTeacher 
                      ? (availableTeachers.find(t => t.id === selectedTeacher) || teachers.find(t => t.id === selectedTeacher))?.full_name || 'Selected'
                      : 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Contact:</span>
                  <span className="font-medium">
                    {selectedContactMethod 
                      ? selectedContactMethod.charAt(0).toUpperCase() + selectedContactMethod.slice(1)
                      : 'Not selected'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedDate || !selectedTime || !selectedTeacher || !selectedContactMethod}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  submitting || !selectedDate || !selectedTime || !selectedTeacher || !selectedContactMethod
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {submitting ? 'Processing...' : 'Confirm Booking'}
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                You will receive a confirmation email after booking
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleBookingPage() {
  return (
    <AuthWrapper>
      <ScheduleBookingContent />
    </AuthWrapper>
  );
}