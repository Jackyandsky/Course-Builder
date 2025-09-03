import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';
import { getClientIP, getClientIPWithDebug } from '@/lib/utils/ip-detection';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Fetch user profile
    let userProfile = null;
    if (data.user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      userProfile = profile;
      
      // Log the login activity with IP address
      try {
        const headersList = headers();
        const userAgent = headersList.get('user-agent') || 'Unknown';
        
        // Get IP address (preferring IPv4)
        const { ip: ipAddress, debug } = getClientIPWithDebug();
        

        // Insert login activity log
        await supabase
          .from('activity_logs')
          .insert({
            user_id: data.user.id,
            user_email: email,
            activity_type: 'login',
            entity_type: 'auth',
            description: `User logged in from ${ipAddress}`,
            ip_address: ipAddress === 'Unknown' ? null : ipAddress,
            user_agent: userAgent,
            metadata: {
              email: email,
              login_method: 'password',
              timestamp: new Date().toISOString()
            }
          });
      } catch (logError) {
        // Don't fail login if activity logging fails
        console.error('Failed to log login activity:', logError);
      }
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
      userProfile,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}