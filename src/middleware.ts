import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// NOTE: Middleware is currently disabled because it conflicts with `output: 'export'`
// which is required for building the app with Capacitor. Authentication redirects
// are now handled on the client-side within each page component.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for either the admin cookie or the Firebase session cookies
  const hasAdminSession = request.cookies.has('admin-auth');
  const hasUserSession = request.cookies.has('firebaseIdToken') && request.cookies.has('sessionId');
  const hasSession = hasAdminSession || hasUserSession;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/request-access');

  // If user has a session and tries to access an auth page, redirect to home
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user does not have a session and is trying to access a protected page, redirect to login
  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If the user has a normal user session but is trying to access the admin page,
  // we let it pass. The page itself has client-side logic to verify the 'admin' role.
  // This avoids a slow API call in the middleware.

  return NextResponse.next();
}

export const config = {
  // The matcher is empty to prevent this middleware from running, as it conflicts with the
  // `output: "export"` setting in next.config.js that is required for Capacitor.
  matcher: [],
}
