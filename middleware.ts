import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Check admin authentication for /secret-admin-panel-xyz789 routes (except login)
  if (request.nextUrl.pathname.startsWith('/secret-admin-panel-xyz789') && 
      !request.nextUrl.pathname.startsWith('/secret-admin-panel-xyz789/login')) {
    
    const adminSession = request.cookies.get('admin-session');
    
    if (!adminSession) {
      return NextResponse.redirect(new URL('/secret-admin-panel-xyz789/login', request.url));
    }
    
    // In a production environment, you would verify the session token here
    // For simplicity, we're using a basic session check
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/secret-admin-panel-xyz789/:path*']
};