'use server';

interface TestResponse {
  message: string;
  env_check?: {
    has_vector_url: boolean;
    has_vector_token: boolean;
  };
  timestamp?: string;
  error?: string;
}

export async function testGetAction(): Promise<TestResponse> {
  try {
    return {
      message: 'Test server action is working',
      env_check: {
        has_vector_url: !!process.env.UPSTASH_VECTOR_REST_URL,
        has_vector_token: !!process.env.UPSTASH_VECTOR_REST_TOKEN,
      }
    };
  } catch (error) {
    console.error('Test server action error:', error);
    return {
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function testPostAction(): Promise<TestResponse> {
  try {
    return {
      message: 'Test POST server action is working',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Test POST server action error:', error);
    return {
      message: 'Test POST failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}