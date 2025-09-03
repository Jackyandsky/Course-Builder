import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service layer
    const userService = new UserService(supabase);
    
    // Fetch teachers
    const teachersResult = await userService.getTeachers();
    if (teachersResult.error) {
      console.error('Error fetching teachers:', teachersResult.error);
      return NextResponse.json({ error: teachersResult.error }, { status: 500 });
    }

    // Also fetch admins
    const adminsResult = await userService.getAdmins();
    
    // Filter admins who are available for booking
    const availableAdmins = adminsResult.data?.filter(
      admin => admin.available_for_booking === true
    ) || [];

    // Combine teachers and admins
    const allTeachers = [
      ...(teachersResult.data || []),
      ...availableAdmins
    ];

    return NextResponse.json({ 
      teachers: allTeachers,
      count: allTeachers.length
    });
    
  } catch (error) {
    console.error('Error in teachers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}