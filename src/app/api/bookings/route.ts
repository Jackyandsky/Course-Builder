import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

// GET - Fetch user's bookings
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const upcoming = searchParams.get('upcoming') === 'true';

    // Build query with metadata filtering
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        status,
        metadata,
        created_at,
        updated_at,
        confirmed_at,
        completed_at,
        cancelled_at
      `)
      .eq('user_id', session.user.id);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (type) {
      // Filter by metadata type
      query = query.eq('metadata->>type', type);
    }
    
    if (upcoming) {
      query = query.gte('booking_date', new Date().toISOString().split('T')[0])
        .in('status', ['pending', 'confirmed']);
    }

    // Order by booking date and time
    query = query.order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      bookings: bookings || [],
      count: bookings?.length || 0
    });
    
  } catch (error) {
    console.error('Error in bookings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new booking
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Handle enrollment bookings differently
    if (body.type === 'enrollment' || body.booking_type === 'enrollment') {
      // For enrollment bookings, we need the consultant and time
      const enrollmentData = {
        user_id: session.user.id,
        teacher_id: body.teacher_id || null,
        booking_date: body.booking_date || new Date().toISOString().split('T')[0],
        booking_time: body.booking_time || '00:00',
        status: body.status || 'confirmed',
        metadata: {
          type: 'enrollment',
          teacher_name: body.teacher_name,
          course_id: body.course_id,
          course_title: body.course_title,
          level: body.level,
          books_per_period: body.books_per_period,
          study_duration: body.study_duration,
          weekly_time: body.weekly_time,
          preferred_contact: body.preferred_contact,
          best_time_to_call: body.best_time_to_call,
          specific_goals: body.specific_goals,
          experience_level: body.experience_level,
          preferred_start_date: body.preferred_start_date,
          questions: body.questions,
          additional_data: body.additional_data,
          contact_info: body.contact_info,
          preferences: body.preferences,
          ...body.metadata // Include any additional metadata
        }
      };
      
      // Create the enrollment booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert(enrollmentData)
        .select()
        .single();

      if (error) {
        console.error('Error creating enrollment booking:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        booking,
        message: 'Enrollment booking created successfully'
      }, { status: 201 });
    }
    
    // Validate required fields for regular bookings
    if (!body.booking_date || !body.booking_time || !body.teacher_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: booking_date, booking_time, teacher_id' 
      }, { status: 400 });
    }

    // Build metadata object with all business data
    const metadata: any = {
      type: body.booking_type || 'diagnosis',
      grade: body.grade || null,
      teacher_name: body.teacher_name || null,
    };

    // Add diagnosis specific data to metadata
    if (body.diagnosis_answers) {
      metadata.diagnosis_answers = body.diagnosis_answers;
    }
    if (body.diagnosis_test_date) {
      metadata.diagnosis_test_date = body.diagnosis_test_date;
    }

    // Add progress review specific data to metadata
    if (body.student_name) metadata.student_name = body.student_name;
    if (body.parent_name) metadata.parent_name = body.parent_name;
    if (body.phone) metadata.phone = body.phone;
    if (body.duration_since_enrollment) metadata.duration_since_enrollment = body.duration_since_enrollment;
    if (body.review_type) metadata.review_type = body.review_type;
    if (body.areas_of_concern) metadata.areas_of_concern = body.areas_of_concern;
    
    // Add any additional notes
    if (body.notes) metadata.notes = body.notes;
    
    // Merge with any existing metadata passed
    if (body.metadata) {
      metadata.source = body.metadata.source || 'api';
      metadata.hasTestData = body.metadata.hasTestData || false;
      metadata.hasReviewData = body.metadata.hasReviewData || false;
      metadata.contact_method = body.metadata.contact_method || null;
      metadata.contact_details = body.metadata.contact_details || null;
    }

    // Prepare simplified booking data
    const bookingData = {
      user_id: session.user.id,
      teacher_id: body.teacher_id,
      booking_date: body.booking_date,
      booking_time: body.booking_time,
      status: 'confirmed',
      metadata: metadata
    };

    // Check if the time slot is already taken
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_date', body.booking_date)
      .eq('booking_time', body.booking_time)
      .eq('teacher_id', body.teacher_id)
      .in('status', ['pending', 'confirmed'])
      .single();

    if (existingBooking) {
      return NextResponse.json({ 
        error: 'This time slot is already booked. Please choose another time.' 
      }, { status: 409 });
    }

    // Create the booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send confirmation email (you can implement this later)
    // await sendBookingConfirmationEmail(booking);

    return NextResponse.json({ 
      booking,
      message: 'Booking created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in bookings POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a booking
export async function PATCH(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Check if user owns this booking or is an admin/teacher
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', body.id)
      .single();

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check permissions
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';
    const isTeacher = existingBooking.teacher_id === session.user.id;
    const isOwner = existingBooking.user_id === session.user.id;

    if (!isOwner && !isTeacher && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    
    // Only allow certain fields to be updated based on role
    if (isAdmin || isTeacher) {
      // Admin and teacher can update more fields
      if (body.status !== undefined) updateData.status = body.status;
      if (body.teacher_id !== undefined) updateData.teacher_id = body.teacher_id;
      
      // Update metadata for internal notes
      if (body.internal_notes !== undefined) {
        const currentMetadata = existingBooking.metadata || {};
        updateData.metadata = {
          ...currentMetadata,
          internal_notes: body.internal_notes
        };
      }
    }
    
    // Owner can only update certain fields if booking is pending
    if (isOwner && existingBooking.status === 'pending') {
      if (body.booking_date !== undefined) updateData.booking_date = body.booking_date;
      if (body.booking_time !== undefined) updateData.booking_time = body.booking_time;
      
      // Update metadata for notes
      if (body.notes !== undefined) {
        const currentMetadata = existingBooking.metadata || {};
        updateData.metadata = {
          ...currentMetadata,
          notes: body.notes
        };
      }
    }
    
    // Anyone can cancel their own booking
    if (body.status === 'cancelled' && isOwner) {
      updateData.status = 'cancelled';
      
      // Add cancellation reason to metadata
      if (body.cancelled_reason) {
        const currentMetadata = existingBooking.metadata || {};
        updateData.metadata = {
          ...currentMetadata,
          cancelled_reason: body.cancelled_reason
        };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update or insufficient permissions' 
      }, { status: 400 });
    }

    // Update the booking
    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      booking: updatedBooking,
      message: 'Booking updated successfully'
    });
    
  } catch (error) {
    console.error('Error in bookings PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}