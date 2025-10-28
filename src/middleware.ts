import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('access_token')?.value;
  const hasToken = !!token;

  // Log for debugging authentication issues
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Path: ${pathname}, Has Token: ${hasToken}`);
  }

  // Route: /login
  if (pathname === '/login') {
    // If user has token, redirect to dashboard
    if (hasToken) {
      console.log('[Middleware] Authenticated user accessing /login, redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Otherwise, allow access to login page
    return NextResponse.next();
  }

  // Route: /dashboard and protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/change-password')) {
    // If no token, redirect to login
    if (!hasToken) {
      console.log(`[Middleware] Unauthenticated access to ${pathname}, redirecting to login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Allow access
    return NextResponse.next();
  }

  // Route: /
  if (pathname === '/') {
    if (hasToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/change-password'],
};