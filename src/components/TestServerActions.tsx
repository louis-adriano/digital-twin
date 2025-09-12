'use client';

import { useState } from 'react';
import { testGetAction, testPostAction } from '../app/actions/test-actions';

export default function TestServerActions() {
  const [getResult, setGetResult] = useState<any>(null);
  const [postResult, setPostResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTestGet = async () => {
    setLoading(true);
    try {
      const result = await testGetAction();
      setGetResult(result);
    } catch (error) {
      console.error('Error calling test GET action:', error);
      setGetResult({ error: 'Failed to call server action' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestPost = async () => {
    setLoading(true);
    try {
      const result = await testPostAction();
      setPostResult(result);
    } catch (error) {
      console.error('Error calling test POST action:', error);
      setPostResult({ error: 'Failed to call server action' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Test Server Actions</h2>
      
      <div className="space-y-2">
        <button
          onClick={handleTestGet}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test GET Action'}
        </button>
        
        {getResult && (
          <div className="p-2 bg-gray-100 rounded">
            <pre>{JSON.stringify(getResult, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={handleTestPost}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test POST Action'}
        </button>
        
        {postResult && (
          <div className="p-2 bg-gray-100 rounded">
            <pre>{JSON.stringify(postResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}