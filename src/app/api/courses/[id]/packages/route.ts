import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// GET packages for a specific course
// No authentication required - packages are public
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get package IDs associated with this course
    const { data: coursePackages, error: cpError } = await supabase
      .from('course_packages')
      .select('package_id, is_default')
      .eq('course_id', params.id);
    
    if (cpError) {
      console.error('Error fetching course packages:', cpError);
      // Return empty array if error
      return NextResponse.json([]);
    }
    
    if (!coursePackages || coursePackages.length === 0) {
      // If no specific packages, return all active packages as options
      const { data: allPackages, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (packagesError) {
        console.error('Error fetching all packages:', packagesError);
        return NextResponse.json([]);
      }
      
      return NextResponse.json(allPackages || []);
    }
    
    // Get full package details
    const packageIds = coursePackages.map(cp => cp.package_id);
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('*')
      .in('id', packageIds)
      .order('display_order');
    
    if (packagesError) {
      console.error('Error fetching packages details:', packagesError);
      return NextResponse.json([]);
    }
    
    // Add is_default flag to packages
    const packagesWithDefault = packages?.map(pkg => {
      const coursePackage = coursePackages.find(cp => cp.package_id === pkg.id);
      return {
        ...pkg,
        is_default: coursePackage?.is_default || false
      };
    });
    
    return NextResponse.json(packagesWithDefault || []);
  } catch (error) {
    console.error('Error fetching course packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course packages' },
      { status: 500 }
    );
  }
}

// POST - Associate packages with a course (admin only)
export async function POST(
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
    const { packageIds, defaultPackageId } = body;
    
    if (!packageIds || !Array.isArray(packageIds)) {
      return NextResponse.json(
        { error: 'packageIds must be an array' },
        { status: 400 }
      );
    }
    
    // Remove existing associations
    const { error: deleteError } = await supabase
      .from('course_packages')
      .delete()
      .eq('course_id', params.id);
    
    if (deleteError) throw deleteError;
    
    // Create new associations
    if (packageIds.length > 0) {
      const coursePackages = packageIds.map((packageId: string) => ({
        course_id: params.id,
        package_id: packageId,
        is_default: packageId === defaultPackageId
      }));
      
      const { error: insertError } = await supabase
        .from('course_packages')
        .insert(coursePackages);
      
      if (insertError) throw insertError;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error associating packages with course:', error);
    return NextResponse.json(
      { error: 'Failed to associate packages' },
      { status: 500 }
    );
  }
}