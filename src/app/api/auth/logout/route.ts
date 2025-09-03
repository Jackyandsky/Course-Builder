import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';
import { getClientIP, getClientIPWithDebug } from '@/lib/utils/ip-detection';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user before signing out
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Log the logout activity with IP address
      try {
        const headersList = headers();
        const userAgent = headersList.get('user-agent') || 'Unknown';
        
        // Get IP address (preferring IPv4)
        const { ip: ipAddress, debug } = getClientIPWithDebug();
        

        // Insert logout activity log
        await supabase
          .from('activity_logs')
          .insert({
            user_id: user.id,
            user_email: user.email,
            activity_type: 'logout',
            entity_type: 'auth',
            description: `User logged out from ${ipAddress}`,
            ip_address: ipAddress === 'Unknown' ? null : ipAddress,
            user_agent: userAgent,
            metadata: {
              email: user.email,
              timestamp: new Date().toISOString()
            }
          });
      } catch (logError) {
        // Don't fail logout if activity logging fails
        console.error('Failed to log logout activity:', logError);
      }
    }
    
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}