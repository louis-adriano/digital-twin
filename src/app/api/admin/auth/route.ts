import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { password, action } = await request.json();

    if (action === 'logout') {
      const cookieStore = await cookies();
      cookieStore.delete('admin-session');
      return NextResponse.json({ success: true });
    }

    if (action === 'login') {
      if (!password || typeof password !== 'string') {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        );
      }

      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        return NextResponse.json(
          { error: 'Admin password not configured' },
          { status: 500 }
        );
      }

      if (password !== adminPassword) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }

      // Create session (in production, use proper JWT or session management)
      const sessionToken = Buffer.from(
        `admin:${Date.now()}:${Math.random()}`
      ).toString('base64');

      const cookieStore = await cookies();
      cookieStore.set('admin-session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
      });

      return NextResponse.json({ 
        success: true,
        message: 'Login successful' 
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin-session');
    
    return NextResponse.json({
      authenticated: !!adminSession
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      authenticated: false
    });
  }
}