import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      message: 'Test API is working',
      env_check: {
        has_vector_url: !!process.env.UPSTASH_VECTOR_REST_URL,
        has_vector_token: !!process.env.UPSTASH_VECTOR_REST_TOKEN,
      }
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    return NextResponse.json({
      message: 'Test POST is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test POST error:', error);
    return NextResponse.json(
      { error: 'Test POST failed' },
      { status: 500 }
    );
  }
}