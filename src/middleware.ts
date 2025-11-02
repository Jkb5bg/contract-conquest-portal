import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate a cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

/**
 * Build Content Security Policy with nonce
 */
function buildCSP(nonce: string): string {
  // Extract API domain from environment or use default
  const apiDomain = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const isDevelopment = process.env.NODE_ENV === 'development';

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`, // Nonce-based script loading
    "style-src 'self' 'unsafe-inline'", // Next.js and Tailwind need inline styles
    "img-src 'self' data: https://contractconquest.s3.amazonaws.com https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com",
    "font-src 'self' data:",
    `connect-src 'self' ${apiDomain} ws://localhost:* ws://127.0.0.1:*`, // Allow API calls + WebSocket for dev
    "frame-ancestors 'none'", // Prevent clickjacking
    "base-uri 'self'",
    "form-action 'self'",
  ];

  // Only add upgrade-insecure-requests in production (breaks localhost in dev)
  if (!isDevelopment) {
    cspDirectives.push("upgrade-insecure-requests");
  }

  return cspDirectives.join('; ');
}

/**
 * Add security headers to any response
 */
function addSecurityHeaders(response: NextResponse, nonce: string): void {
  const csp = buildCSP(nonce);
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('x-nonce', nonce); // Store nonce for components
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('access_token')?.value;
  const hasToken = !!token;

  // Generate nonce for CSP (needed for all requests)
  const nonce = generateNonce();

  // Create new headers with nonce for Next.js to use in inline scripts
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Log for debugging authentication issues
  console.log(`[Middleware] Path: ${pathname}, Has Token: ${hasToken}`);

  // Additional debugging for cookie issues
  if (!hasToken && pathname.startsWith('/dashboard')) {
    const allCookies = request.cookies.getAll();
    console.log(`[Middleware] ⚠️ No access_token found. All cookies:`, allCookies.map(c => c.name).join(', '));
  }

  if (hasToken) {
    console.log(`[Middleware] ✅ Token found, length: ${token.length}`);
  }

  // Route: /login
  if (pathname === '/login') {
    if (hasToken) {
      console.log('[Middleware] Authenticated user accessing /login, redirecting to dashboard');
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      addSecurityHeaders(response, nonce);
      return response;
    }
    // Otherwise, allow access to login page
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    addSecurityHeaders(response, nonce);
    return response;
  }

  // Route: /dashboard and protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/change-password')) {
    if (!hasToken) {
      console.log(`[Middleware] Unauthenticated access to ${pathname}, redirecting to login`);
      const response = NextResponse.redirect(new URL('/login', request.url));
      addSecurityHeaders(response, nonce);
      return response;
    }
    // Allow access
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    addSecurityHeaders(response, nonce);
    return response;
  }

  // Route: /writer protected routes
  if (pathname.startsWith('/writer/dashboard') || pathname.startsWith('/writer/change-password')) {
    const writerToken = request.cookies.get('writer_access_token')?.value;
    if (!writerToken) {
      console.log(`[Middleware] Unauthenticated writer access to ${pathname}, redirecting to writer login`);
      const response = NextResponse.redirect(new URL('/writer/login', request.url));
      addSecurityHeaders(response, nonce);
      return response;
    }
    // Allow access
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    addSecurityHeaders(response, nonce);
    return response;
  }

  // Route: /
  if (pathname === '/') {
    const redirectUrl = hasToken ? '/dashboard' : '/login';
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    addSecurityHeaders(response, nonce);
    return response;
  }

  // All other routes
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  addSecurityHeaders(response, nonce);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};