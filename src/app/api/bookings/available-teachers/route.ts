import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (!date || !time) {
      return NextResponse.json({ 
        error: 'Date and time are required' 
      }, { status: 400 });
    }

    // First, get all teachers
    const { data: allTeachers, error: teachersError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('role', ['teacher', 'admin'])
      .order('full_name', { ascending: true });

    if (teachersError) {
      console.error('Error fetching teachers:', teachersError);
      return NextResponse.json({ 
        teachers: [] 
      });
    }

    // Check which teachers already have bookings at this date/time
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('teacher_id')
      .eq('booking_date', date)
      .eq('booking_time', time)
      .eq('status', 'confirmed');

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      // If we can't check bookings, return all teachers
      return NextResponse.json({ 
        teachers: allTeachers || [] 
      });
    }

    // Filter out teachers who are already booked
    const bookedTeacherIds = existingBookings?.map(b => b.teacher_id) || [];
    const availableTeachers = allTeachers?.filter(
      teacher => !bookedTeacherIds.includes(teacher.id)
    ) || [];

    return NextResponse.json({ 
      teachers: availableTeachers,
      totalTeachers: allTeachers?.length || 0,
      availableCount: availableTeachers.length,
      bookedCount: bookedTeacherIds.length
    });

  } catch (error) {
    console.error('Error in available-teachers API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch available teachers',
      teachers: [] 
    }, { status: 500 });
  }
}