import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

// GET - Check available time slots for a teacher on a specific date
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json({ 
        error: 'Missing required parameter: date' 
      }, { status: 400 });
    }

    // Define all possible time slots (10 AM to 1 PM)
    const allTimeSlots = [
      '10:00 AM',
      '11:00 AM', 
      '12:00 PM',
      '1:00 PM'
    ];

    // Get existing bookings on this date (with or without specific teacher)
    let query = supabase
      .from('bookings')
      .select('booking_time, teacher_id')
      .eq('booking_date', date)
      .not('status', 'in', '(cancelled,no_show)'); // Exclude cancelled and no-show bookings
    
    // If teacher ID is provided, filter by teacher
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    
    const { data: existingBookings, error } = await query;

    if (error) {
      console.error('Error fetching existing bookings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If checking for a specific teacher, simple availability check
    if (teacherId) {
      const bookedTimes = new Set(existingBookings?.map(booking => booking.booking_time) || []);
      const availableSlots = allTimeSlots.map(time => ({
        time,
        available: !bookedTimes.has(time)
      }));

      return NextResponse.json({ 
        date,
        teacher_id: teacherId,
        slots: availableSlots,
        total_slots: allTimeSlots.length,
        available_count: availableSlots.filter(slot => slot.available).length
      });
    } else {
      // For general availability, just return all time slots as available
      // The actual teacher availability will be checked when selecting a teacher
      const availableSlots = allTimeSlots.map(time => ({
        time,
        available: true // All slots shown as available initially
      }));

      return NextResponse.json({ 
        date,
        slots: availableSlots,
        total_slots: allTimeSlots.length,
        available_count: availableSlots.length
      });
    }
    
  } catch (error) {
    console.error('Error in availability GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}