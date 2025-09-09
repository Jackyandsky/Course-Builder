import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { service, api_key } = body;

    if (service === 'google_books') {
      return await testGoogleBooksAPI(api_key);
    }

    return NextResponse.json({ error: 'Unsupported service' }, { status: 400 });
  } catch (error: any) {
    console.error('Integration test API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function testGoogleBooksAPI(apiKey: string) {
  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  try {
    // Test the API with a simple search query
    const testQuery = 'intitle:test';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(testQuery)}&maxResults=1&key=${apiKey}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 403) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid API key or API access not enabled' 
        });
      }
      
      if (response.status === 429) {
        return NextResponse.json({ 
          success: false, 
          error: 'API quota exceeded. Please try again later.' 
        });
      }

      return NextResponse.json({ 
        success: false, 
        error: errorData.error?.message || 'API request failed' 
      });
    }

    const data = await response.json();
    
    // If we get here, the API key is valid
    return NextResponse.json({ 
      success: true, 
      message: `API connection successful! Found ${data.totalItems || 0} results.`,
      quota_remaining: response.headers.get('X-RateLimit-Remaining') || 'Unknown'
    });

  } catch (error: any) {
    console.error('Google Books API test error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json({ 
        success: false, 
        error: 'Request timed out. Please try again.' 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Failed to connect to Google Books API. Please check your internet connection.' 
    });
  }
}