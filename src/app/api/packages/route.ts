import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Optimized in-memory cache for packages
let packagesCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes server cache

// GET all packages (with optional filters)
// No authentication required - packages are public
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const isActive = searchParams.get('active');
    const paymentType = searchParams.get('payment_type');
    const courseId = searchParams.get('course_id');
    
    // Create cache key based on filters
    const cacheKey = `${isActive || 'all'}-${paymentType || 'all'}-${courseId || 'all'}`;
    
    // Check cache first
    const cached = packagesCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      const response = NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT', 
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'ETag': `"${now}-${cacheKey}"`
        }
      });
      
      return response;
    }
    
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Add timeout protection for database queries
    const queryWithTimeout = async (query: any, timeoutMs = 3000) => {
      return Promise.race([
        query,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), timeoutMs)
        )
      ]);
    };
    
    // If course_id is provided, fetch packages in parallel
    if (courseId) {
      const [packagesResult, coursePackagesResult] = await Promise.all([
        // Fetch all packages with timeout
        queryWithTimeout(
          supabase
            .from('packages')
            .select('*')
            .eq('is_active', isActive === 'false' ? false : true)
            .order('display_order', { ascending: true })
        ),
        
        // Fetch course-specific packages with timeout
        queryWithTimeout(
          supabase
            .from('course_packages')
            .select('package_id')
            .eq('course_id', courseId)
        )
      ]);
      
      if (packagesResult.error) {
        console.error('Error fetching packages:', packagesResult.error);
        throw packagesResult.error;
      }
      
      let filteredPackages = packagesResult.data || [];
      
      // If course packages exist, filter by them
      if (!coursePackagesResult.error && coursePackagesResult.data && coursePackagesResult.data.length > 0) {
        const packageIds = coursePackagesResult.data.map(cp => cp.package_id);
        filteredPackages = filteredPackages.filter(pkg => packageIds.includes(pkg.id));
      }
      
      // Apply payment type filter if specified
      if (paymentType) {
        filteredPackages = filteredPackages.filter(pkg => pkg.payment_type === paymentType);
      }
      
      // Update cache
      packagesCache.set(cacheKey, {
        data: filteredPackages,
        timestamp: now
      });
      
      const response = NextResponse.json(filteredPackages, {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'ETag': `"${now}-${cacheKey}"`
        }
      });
      
      return response;
    }
    
    // Standard query without course_id with timeout protection
    let query = supabase.from('packages').select('*');
    
    // Apply filters
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    
    if (paymentType) {
      query = query.eq('payment_type', paymentType);
    }
    
    // Order by display_order
    query = query.order('display_order', { ascending: true });
    
    const { data, error } = await queryWithTimeout(query);
    
    if (error) {
      console.error('Supabase error fetching packages:', error);
      throw error;
    }
    
    // Update cache
    packagesCache.set(cacheKey, {
      data: data || [],
      timestamp: now
    });
    
    // Add optimized cache headers
    const response = NextResponse.json(data || [], {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'ETag': `"${now}-${cacheKey}"`
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching packages:', error);
    
    // Try to return cached data even if expired as fallback
    const fallbackCache = packagesCache.get(`${isActive || 'all'}-${paymentType || 'all'}-${courseId || 'all'}`);
    if (fallbackCache) {
      console.log('Returning expired cached data as fallback');
      return NextResponse.json(fallbackCache.data, {
        headers: {
          'X-Cache': 'FALLBACK',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
        }
      });
    }
    
    // If no cache available, return empty array instead of error to prevent UI break
    console.log('No cached data available, returning empty packages array');
    return NextResponse.json([], {
      headers: {
        'X-Cache': 'MISS-FALLBACK',
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=60'
      }
    });
  }
}

// POST - Create new package (admin only)
export async function POST(request: NextRequest) {
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
    
    // Validate required fields
    if (!packageData.title || !packageData.price || !packageData.payment_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Ensure services is an array
    if (!packageData.services) {
      packageData.services = [];
    }
    
    // Insert the package
    const { data: newPackage, error: insertError } = await supabase
      .from('packages')
      .insert(packageData)
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    // If courseIds provided, create associations
    if (courseIds && courseIds.length > 0) {
      const coursePackages = courseIds.map((courseId: string) => ({
        course_id: courseId,
        package_id: newPackage.id
      }));
      
      const { error: linkError } = await supabase
        .from('course_packages')
        .insert(coursePackages);
      
      if (linkError) {
        console.error('Error linking package to courses:', linkError);
      }
    }
    
    // Clear cache on successful creation
    packagesCache.clear();
    
    return NextResponse.json(newPackage);
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}

// DELETE cache endpoint for admin
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check admin authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Clear the cache
    packagesCache.clear();
    
    return NextResponse.json({ message: 'Package cache cleared successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}