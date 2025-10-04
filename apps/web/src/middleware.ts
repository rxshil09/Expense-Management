import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/(public)', '/(auth)/login', '/(auth)/register'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If accessing dashboard routes without token, redirect to login
  if (pathname.startsWith('/(dashboard)') && !token) {
    return NextResponse.redirect(new URL('/(auth)/login', request.url));
  }

  // If accessing auth routes with token, redirect to dashboard
  if ((pathname.startsWith('/(auth)') || pathname === '/') && token) {
    return NextResponse.redirect(new URL('/(dashboard)', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};