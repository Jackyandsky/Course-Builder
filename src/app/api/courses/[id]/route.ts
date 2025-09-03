import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the authenticated user - but don't fail if not authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch the course with all relationships
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        *,
        category:categories(id, name, color, icon),
        course_books(
          id,
          book_id,
          is_required,
          notes,
          position,
          book:books(id, title, author, cover_image_url)
        ),
        course_vocabulary_groups(
          id,
          vocabulary_group_id,
          position,
          vocabulary_group:vocabulary_groups(id, name, language, difficulty)
        ),
        course_objectives(
          id,
          objective_id,
          position,
          objective:objectives(id, title, description, bloom_level, measurable, tags, is_template)
        ),
        course_methods(
          id,
          method_id,
          position,
          method:methods(id, name, description, tags)
        ),
        schedules(
          id,
          name,
          description,
          start_date,
          end_date,
          recurrence_type,
          recurrence_days,
          default_start_time,
          default_duration_minutes,
          timezone,
          location,
          max_students,
          is_active,
          lessons(count)
        )
      `)
      .eq('id', params.id)
      .single();

    if (courseError) {
      // If some tables don't exist, try with fewer relationships
      if (courseError.message?.includes('course_objectives') || 
          courseError.message?.includes('course_methods') || 
          courseError.code === '42P01') {
        
        const { data: fallbackCourse, error: fallbackError } = await supabase
          .from('courses')
          .select(`
            *,
            category:categories(id, name, color, icon),
            course_books(
              id,
              book_id,
              is_required,
              notes,
              position,
              book:books(id, title, author, cover_image_url)
            ),
            course_vocabulary_groups(
              id,
              vocabulary_group_id,
              position,
              vocabulary_group:vocabulary_groups(id, name, language, difficulty)
            ),
            schedules(
              id,
              name,
              description,
              start_date,
              end_date,
              recurrence_type,
              recurrence_days,
              default_start_time,
              default_duration_minutes,
              timezone,
              location,
              max_students,
              is_active,
              lessons(count)
            )
          `)
          .eq('id', params.id)
          .single();

        if (fallbackError) {
          // Final fallback without schedules
          const { data: minimalCourse, error: minimalError } = await supabase
            .from('courses')
            .select(`
              *,
              category:categories(id, name, color, icon),
              course_books(
                id,
                book_id,
                is_required,
                notes,
                position,
                book:books(id, title, author, cover_image_url)
              ),
              course_vocabulary_groups(
                id,
                vocabulary_group_id,
                position,
                vocabulary_group:vocabulary_groups(id, name, language, difficulty)
              )
            `)
            .eq('id', params.id)
            .single();

          if (minimalError) {
            console.error('Error fetching course:', minimalError);
            return NextResponse.json(
              { error: 'Course not found' },
              { status: 404 }
            );
          }

          return NextResponse.json({ 
            ...minimalCourse, 
            course_objectives: [], 
            course_methods: [], 
            schedules: [] 
          });
        }

        return NextResponse.json({ 
          ...fallbackCourse, 
          course_objectives: [], 
          course_methods: [] 
        });
      }

      console.error('Error fetching course:', courseError);
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);

  } catch (error) {
    console.error('Error in GET /api/courses/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// UPDATE endpoint for course
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or teacher
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Clean the data - remove undefined values and convert empty strings to null
    const cleanedData = Object.entries(body).reduce((acc, [key, value]) => {
      if (value === undefined) {
        return acc;
      }
      if (value === '' && ['short_description', 'description', 'category_id', 'public_slug', 
                           'thumbnail_url', 'stripe_product_id', 'stripe_price_id'].includes(key)) {
        acc[key] = null;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    // Update the course
    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update({
        ...cleanedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating course:', updateError);
      return NextResponse.json(
        { error: 'Failed to update course' },
        { status: 400 }
      );
    }

    return NextResponse.json(course);

  } catch (error) {
    console.error('Error in PUT /api/courses/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint for course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the course
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting course:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete course' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/courses/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}