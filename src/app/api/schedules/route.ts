import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');
    
    let query = supabase
      .from('schedules')
      .select(`
        id,
        name,
        course_id,
        start_date,
        end_date,
        description,
        is_active
      `)
      .order('start_date', { ascending: false });
    
    // Filter by course_id if provided
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    
    // Only get active schedules
    query = query.eq('is_active', true);
    
    const { data: schedules, error } = await query;
    
    if (error) {
      console.error('Error fetching schedules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      schedules: schedules || [],
      total: schedules?.length || 0 
    });
  } catch (error) {
    console.error('Error in schedules API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}