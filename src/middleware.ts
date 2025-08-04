import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

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

  // If user is not authenticated and trying to access protected routes
  if (!session && (isAdminRoute || isAccountRoute)) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and trying to access auth routes, redirect to appropriate dashboard
  if (session && isAuthRoute) {
    const redirectUrl = req.nextUrl.clone();
    
    // Check user role from metadata or database
    // For now, we'll assume all authenticated users can access admin
    // You'll need to implement proper role checking later
    const userRole = session.user.user_metadata?.role || 'student';
    
    if (userRole === 'admin' || userRole === 'tutor') {
      redirectUrl.pathname = '/admin';
    } else {
      redirectUrl.pathname = '/account';
    }
    
    return NextResponse.redirect(redirectUrl);
  }

  // For admin routes, check if user has admin/tutor role
  if (isAdminRoute && session) {
    const userRole = session.user.user_metadata?.role || 'student';
    
    if (userRole !== 'admin' && userRole !== 'tutor') {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/account';
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};