import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@/types/user-management';

interface CreateUserRequest {
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  grade_level?: number;
  phone?: string;
  parent_email?: string;
  group_ids?: string[];
  send_invitation?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if current user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body: CreateUserRequest = await request.json();
    const { 
      email, 
      password,
      full_name, 
      role, 
      grade_level, 
      phone,
      parent_email,
      group_ids,
      send_invitation = true
    } = body;

    // Validate required fields
    if (!email || !full_name || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, full_name, and role are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    let newUserId: string;
    let authError: any = null;

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', email);

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ 
        error: 'A user with this email already exists' 
      }, { status: 400 });
    }

    if (send_invitation) {
      // Create user with magic link (they'll set password when they click the link)
      // First, we need to create a temporary user entry
      // Since we can't use Admin API, we'll create an invitation record
      
      // Generate a random password for initial creation
      const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
      
      // Try to sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            full_name,
            role
          }
        }
      });

      if (signUpError) {
        console.error('Auth signup error:', signUpError);
        return NextResponse.json({ 
          error: signUpError.message || 'Failed to create user account' 
        }, { status: 500 });
      }

      if (!authData.user) {
        return NextResponse.json({ 
          error: 'Failed to create user account' 
        }, { status: 500 });
      }

      newUserId = authData.user.id;

      // Send password reset email so user can set their own password
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
      });

      if (resetError) {
        console.error('Password reset email error:', resetError);
      }
    } else {
      // Create user with provided password
      if (!password || password.length < 6) {
        return NextResponse.json({ 
          error: 'Password must be at least 6 characters when not sending invitation' 
        }, { status: 400 });
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            role
          }
        }
      });

      if (signUpError) {
        console.error('Auth signup error:', signUpError);
        return NextResponse.json({ 
          error: signUpError.message || 'Failed to create user account' 
        }, { status: 500 });
      }

      if (!authData.user) {
        return NextResponse.json({ 
          error: 'Failed to create user account' 
        }, { status: 500 });
      }

      newUserId = authData.user.id;
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .rpc('create_user_profile', {
        p_user_id: newUserId,
        p_email: email,
        p_full_name: full_name,
        p_role: role,
        p_grade_level: grade_level || null,
        p_phone: phone || null,
        p_parent_email: parent_email || null,
        p_group_ids: group_ids || null
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Note: User is created in auth but profile failed
      // In production, you might want to handle this differently
    }

    const message = send_invitation 
      ? `User created successfully. An email has been sent to ${email} to set up their password.`
      : `User created successfully.`;

    return NextResponse.json({ 
      success: true,
      user_id: newUserId,
      message
    });

  } catch (error: any) {
    console.error('User creation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}