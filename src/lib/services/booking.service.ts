import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseService } from './base.service';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

export class BookingService extends BaseService<Booking> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'bookings');
  }

  /**
   * Get available teachers
   */
  async getAvailableTeachers() {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'teacher')
      .eq('available_for_booking', true)
      .order('full_name');

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Check teacher availability
   */
  async checkAvailability(teacherId: string, startTime: string, endTime: string) {
    const { data, error } = await this.supabase
      .from('bookings')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('status', 'confirmed')
      .or(`start_time.gte.${startTime},start_time.lt.${endTime}`)
      .or(`end_time.gt.${startTime},end_time.lte.${endTime}`);

    if (error) throw error;
    return { isAvailable: !data || data.length === 0, conflictingBookings: data };
  }

  /**
   * Get user's bookings
   */
  async getUserBookings(userId: string, status?: string) {
    let query = this.supabase
      .from('bookings')
      .select(`
        *,
        teacher:teacher_id (
          id,
          full_name,
          email,
          profile_image_url
        ),
        course:course_id (
          id,
          title
        )
      `)
      .eq('student_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('start_time', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Get teacher's bookings
   */
  async getTeacherBookings(teacherId: string, status?: string) {
    let query = this.supabase
      .from('bookings')
      .select(`
        *,
        student:student_id (
          id,
          full_name,
          email,
          profile_image_url
        ),
        course:course_id (
          id,
          title
        )
      `)
      .eq('teacher_id', teacherId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('start_time', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Create a booking
   */
  async createBooking(booking: BookingInsert) {
    // Check availability first
    const { isAvailable } = await this.checkAvailability(
      booking.teacher_id,
      booking.start_time,
      booking.end_time
    );

    if (!isAvailable) {
      throw new Error('Teacher is not available at this time');
    }

    const { data, error } = await this.supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId: string, status: string, notes?: string) {
    const { data, error } = await this.supabase
      .from('bookings')
      .update({ 
        status, 
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason: string) {
    return this.updateBookingStatus(bookingId, 'cancelled', reason);
  }

  /**
   * Get upcoming bookings
   */
  async getUpcomingBookings(userId: string, role: 'student' | 'teacher') {
    const now = new Date().toISOString();
    const column = role === 'student' ? 'student_id' : 'teacher_id';

    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        teacher:teacher_id (
          id,
          full_name,
          email
        ),
        student:student_id (
          id,
          full_name,
          email
        ),
        course:course_id (
          id,
          title
        )
      `)
      .eq(column, userId)
      .eq('status', 'confirmed')
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(10);

    if (error) throw error;
    return { data, error: null };
  }
}