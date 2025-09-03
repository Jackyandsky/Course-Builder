import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a Supabase client - use service role key if available, otherwise use anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('No Supabase key found. Please set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabaseAdmin = supabaseKey ? createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null;

// Cache category IDs to avoid repeated lookups
const CATEGORY_IDS_CACHE: Record<string, string> = {
  'Standardizers': 'ff7b2caf-958d-4022-b25e-6ebb5a65b21e',
  'Complete Study Packages': 'b8531503-d131-4ec2-8ff9-be05fe57f09c',
  'Decoders': '8051a901-dbea-47f4-9b20-dec62659c9c6',
  'LEX': '25b09201-e4d7-4000-b5f8-0b9ef7a9b914'
};

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const categories = searchParams.getAll('categories');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '24');
    const offset = (page - 1) * pageSize;

    // Build count query
    let countQuery = supabaseAdmin
      .from('content')
      .select('*', { count: 'exact', head: true });

    // Build data query with category join
    let dataQuery = supabaseAdmin
      .from('content')
      .select(`
        *,
        category:categories!category_id(
          id,
          name,
          type
        )
      `);

    // Apply search filter
    if (search) {
      const searchFilter = `name.ilike.%${search}%,content.ilike.%${search}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    // If a specific category is requested
    if (category && category !== 'All') {
      // Check cache first
      const cachedId = CATEGORY_IDS_CACHE[category];
      if (cachedId) {
        countQuery = countQuery.eq('category_id', cachedId);
        dataQuery = dataQuery.eq('category_id', cachedId);
      } else {
        // Fallback to database lookup if not in cache
        const { data: categoryData } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('name', category)
          .single();
          
        if (categoryData) {
          countQuery = countQuery.eq('category_id', categoryData.id);
          dataQuery = dataQuery.eq('category_id', categoryData.id);
        }
      }
    } else if (categories.length > 0) {
      // Use cached IDs for known categories
      const categoryIds: string[] = [];
      const uncachedCategories: string[] = [];
      
      categories.forEach(cat => {
        if (CATEGORY_IDS_CACHE[cat]) {
          categoryIds.push(CATEGORY_IDS_CACHE[cat]);
        } else {
          uncachedCategories.push(cat);
        }
      });
      
      // Only query database for uncached categories
      if (uncachedCategories.length > 0) {
        const { data: categoriesData } = await supabaseAdmin
          .from('categories')
          .select('id')
          .in('name', uncachedCategories);
          
        if (categoriesData && categoriesData.length > 0) {
          categoryIds.push(...categoriesData.map(cat => cat.id));
        }
      }
      
      if (categoryIds.length > 0) {
        countQuery = countQuery.in('category_id', categoryIds);
        dataQuery = dataQuery.in('category_id', categoryIds);
      }
    }

    // Get total count
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error counting store products:', countError);
      return NextResponse.json(
        { error: 'Failed to count products', details: countError.message },
        { status: 500 }
      );
    }

    // Get paginated data
    const { data, error } = await dataQuery
      .order('name')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching store products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }


    // Transform the data to match the expected format
    const transformedProducts = data?.map(product => ({
      id: product.id,
      title: product.name,
      author: product.metadata?.author || 'IGPS',
      description: product.content?.substring(0, 200) + '...' || '',
      price: product.price || 0, // Use actual price, don't default to $50
      currency: product.currency || 'CAD',
      discount_percentage: product.discount_percentage || 0,
      sale_price: product.sale_price || null,
      is_free: product.is_free || (product.price === 0 || product.price === null),
      imageUrl: product.metadata?.image_url || undefined,
      category: product.category?.name || 'Uncategorized',
      type: 'store'
    })) || [];

    return NextResponse.json({
      products: transformedProducts,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page,
      pageSize
    });
  } catch (error) {
    console.error('Error in store products API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}