import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// GET single package by ID
// No authentication required - packages are public
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package' },
      { status: 500 }
    );
  }
}

// PUT - Update package (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check admin authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin role
    const isAdmin = user.user_metadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    const { courseIds, ...packageData } = body;
    
    // Update the package
    const { data: updatedPackage, error: updateError } = await supabase
      .from('packages')
      .update(packageData)
      .eq('id', params.id)
      .select()
      .single();
    
    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        );
      }
      throw updateError;
    }
    
    // Update course associations if provided
    if (courseIds !== undefined) {
      // First, remove existing associations
      await supabase
        .from('course_packages')
        .delete()
        .eq('package_id', params.id);
      
      // Then add new ones
      if (courseIds.length > 0) {
        const coursePackages = courseIds.map((courseId: string) => ({
          course_id: courseId,
          package_id: params.id
        }));
        
        const { error: linkError } = await supabase
          .from('course_packages')
          .insert(coursePackages);
        
        if (linkError) {
          console.error('Error updating package courses:', linkError);
        }
      }
    }
    
    // Clear server cache and invalidate client caches after successful update
    try {
      // Clear server-side cache
      await fetch(`${request.nextUrl.origin}/api/packages`, {
        method: 'DELETE',
        headers: { 'Cookie': request.headers.get('Cookie') || '' }
      });
      
      // Signal client-side cache invalidation
      await fetch(`${request.nextUrl.origin}/api/packages/invalidate-cache`, {
        method: 'POST',
        headers: { 'Cookie': request.headers.get('Cookie') || '' }
      });
    } catch (error) {
      // Cache clearing failed, but don't fail the update
      console.warn('Failed to clear packages cache:', error);
    }
    
    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    );
  }
}

// DELETE - Delete package (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check admin authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin role
    const isAdmin = user.user_metadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete the package (course_packages will be deleted via cascade)
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        );
      }
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}