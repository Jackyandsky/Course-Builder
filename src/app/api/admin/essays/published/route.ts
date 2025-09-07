import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';
import { cookies } from 'next/headers';

// GET: Fetch published student essays for teacher review
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user and verify admin/teacher role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'teacher')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const contentSearch = searchParams.get('contentSearch') || '';
    const studentSearch = searchParams.get('studentSearch') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // Build base query for essays
    let essaysQuery = supabase
      .from('essay_content')
      .select(`
        id,
        content_text,
        created_at,
        updated_at,
        is_published,
        metadata,
        created_by
      `)
      .eq('content_type', 'essay')
      .eq('draft_type', 'draft')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });
    
    // Apply content search filter
    if (contentSearch) {
      essaysQuery = essaysQuery.ilike('content_text', `%${contentSearch}%`);
    }
    
    // For student search, we need to filter after fetching user profiles
    // Get total count for essays (before student filtering)
    let countQuery = supabase
      .from('essay_content')
      .select('id', { count: 'exact' })
      .eq('content_type', 'essay')
      .eq('draft_type', 'draft')
      .eq('is_published', true);
    
    if (contentSearch) {
      countQuery = countQuery.ilike('content_text', `%${contentSearch}%`);
    }
    
    const { count: totalCount, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error counting essays:', countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }
    
    // Apply pagination to essays
    essaysQuery = essaysQuery.range(offset, offset + limit - 1);
    
    const { data: essays, error: essaysError } = await essaysQuery;
    
    if (essaysError) {
      console.error('Error fetching essays:', essaysError);
      return NextResponse.json({ error: essaysError.message }, { status: 500 });
    }
    
    if (!essays || essays.length === 0) {
      return NextResponse.json({
        essays: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }
    
    // Get unique user IDs from essays
    const userIds = [...new Set(essays.map(essay => essay.created_by))];
    
    // Fetch user profiles for these users
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email')
      .in('id', userIds);
    
    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }
    
    // Create a map for quick user profile lookup
    const userProfilesMap = new Map(
      userProfiles?.map(profile => [profile.id, profile]) || []
    );
    
    // Transform essays with user profile data
    let transformedEssays = essays.map(essay => {
      const userProfile = userProfilesMap.get(essay.created_by);
      return {
        id: essay.id,
        title: essay.content_text,
        created_at: essay.created_at,
        updated_at: essay.updated_at,
        is_published: essay.is_published,
        selectedEssayTitle: essay.metadata?.selectedEssayTitle || '',
        student: userProfile ? {
          id: userProfile.id,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          email: userProfile.email,
          full_name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
        } : {
          id: essay.created_by,
          first_name: 'Unknown',
          last_name: 'User',
          email: '',
          full_name: 'Unknown User'
        }
      };
    });
    
    // Apply student name filtering if provided
    if (studentSearch) {
      const searchLower = studentSearch.toLowerCase();
      transformedEssays = transformedEssays.filter(essay => 
        essay.student.first_name?.toLowerCase().includes(searchLower) ||
        essay.student.last_name?.toLowerCase().includes(searchLower) ||
        essay.student.email?.toLowerCase().includes(searchLower) ||
        essay.student.full_name?.toLowerCase().includes(searchLower)
      );
    }
    
    return NextResponse.json({
      essays: transformedEssays,
      pagination: {
        page,
        limit,
        total: studentSearch ? transformedEssays.length : (totalCount || 0),
        totalPages: studentSearch ? 1 : Math.ceil((totalCount || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/essays/published:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}