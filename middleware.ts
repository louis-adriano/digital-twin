import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Check admin authentication for /admin routes (except login)
  if (request.nextUrl.pathname.startsWith('/admin') && 
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    
    const adminSession = request.cookies.get('admin-session');
    
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // In a production environment, you would verify the session token here
    // For simplicity, we're using a basic session check
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};