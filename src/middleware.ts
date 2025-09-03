import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get the current session without forcing a refresh
  // The Supabase client will automatically refresh if needed
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get the pathname of the request
  const { pathname } = req.nextUrl;

  // Define protected routes
  const isAdminRoute = pathname.startsWith('/(admin)') || pathname.startsWith('/admin');
  const isAccountRoute = pathname.startsWith('/(account)') || pathname.startsWith('/account');
  const isAuthRoute = pathname.startsWith('/(auth)') || pathname.startsWith('/auth') || pathname.startsWith('/login');
  const isPublicRoute = pathname.startsWith('/(public)') || pathname === '/' || 
                       pathname.startsWith('/courses') || pathname.startsWith('/library') || 
                       pathname.startsWith('/store') || pathname.startsWith('/booking') ||
                       pathname.startsWith('/about');

  // For admin and account routes, allow the request through
  // Let the client-side handle auth more gracefully
  // This enables async non-blocking auth pattern
  if (!session && (isAdminRoute || isAccountRoute)) {
    // Don't redirect at middleware level for admin/account routes
    // Client will handle auth check and redirect if needed
    console.log(`${isAdminRoute ? 'Admin' : 'Account'} route accessed without session, allowing through for client-side handling`);
    return res;
  }

  // If user is authenticated and trying to access auth routes, redirect to appropriate dashboard
  // BUT respect any redirect parameter in the URL
  if (session && isAuthRoute) {
    const redirectUrl = req.nextUrl.clone();
    
    // Check if there's already a redirect parameter
    const existingRedirect = req.nextUrl.searchParams.get('redirect');
    if (existingRedirect) {
      // Respect the redirect parameter
      redirectUrl.pathname = existingRedirect;
      redirectUrl.searchParams.delete('redirect');
    } else {
      // Fetch user profile to get role for default redirect
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role, verified_at')
        .eq('id', session.user.id)
        .single();
      
      const userRole = userProfile?.role || session.user.user_metadata?.role || 'student';
      // For existing users without verified_at field, assume they are verified
      const isVerified = userProfile?.verified_at !== undefined ? userProfile.verified_at !== null : true;
      
      if ((userRole === 'admin' || userRole === 'teacher') && isVerified) {
        redirectUrl.pathname = '/admin';
      } else {
        redirectUrl.pathname = '/account';
      }
    }
    
    return NextResponse.redirect(redirectUrl);
  }

  // For admin routes, check if user has admin/teacher role and is verified
  // Note: This only blocks non-admin users from /admin routes
  // Admins can still access /account routes (no restriction there)
  if (isAdminRoute && session) {
    // Fetch user profile to get role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, verified_at')
      .eq('id', session.user.id)
      .single();
    
    const userRole = userProfile?.role || session.user.user_metadata?.role || 'student';
    // For existing users without verified_at field, assume they are verified
    const isVerified = userProfile?.verified_at !== undefined ? userProfile.verified_at !== null : true;
    
    if (userRole !== 'admin' && userRole !== 'teacher') {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/account';
      return NextResponse.redirect(redirectUrl);
    }
    
    // If not verified, redirect to a verification pending page
    if (!isVerified) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/verification-pending';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - .well-known (for various validations)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|\.well-known).*)',
  ],
};