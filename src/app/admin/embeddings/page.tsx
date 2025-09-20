'use client';

import { useState, useEffect } from 'react';

interface EmbeddingsInfo {
  vectorCount: number;
  dimension: number;
  contentChunks: number;
  lastUpdated: string;
}

interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
  data: string;
}

export default function EmbeddingsManagementPage() {
  const [info, setInfo] = useState<EmbeddingsInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmbeddingsInfo();
  }, []);

  const loadEmbeddingsInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/embeddings?action=info');
      if (!response.ok) throw new Error('Failed to load embeddings info');
      
      const data = await response.json();
      setInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load embeddings info');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searching) return;

    try {
      setSearching(true);
      setSearchResults([]);
      
      const response = await fetch(
        `/api/admin/embeddings?action=search&query=${encodeURIComponent(searchQuery)}`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      let confirmMessage = '';
      switch (action) {
        case 'regenerate':
          confirmMessage = 'This will regenerate all embeddings. Continue?';
          break;
        case 'clear':
          confirmMessage = 'This will delete all vectors. This cannot be undone. Continue?';
          break;
        default:
          return;
      }

      if (!confirm(confirmMessage)) return;

      const response = await fetch('/api/admin/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Action failed');
      }

      alert(result.message || 'Action completed successfully');
      loadEmbeddingsInfo(); // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Embeddings Management</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h3 className="text-lg font-medium text-red-800">Error</h3>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={loadEmbeddingsInfo}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Vector Count</h3>
          <p className="text-3xl font-bold text-blue-600">{info?.vectorCount || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Total vectors in database</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Dimensions</h3>
          <p className="text-3xl font-bold text-green-600">{info?.dimension || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Vector dimensions</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Chunks</h3>
          <p className="text-3xl font-bold text-purple-600">{info?.contentChunks || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Database content chunks</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Vector Operations</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleAction('regenerate')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            🔄 Regenerate All Embeddings
          </button>
          
          <button
            onClick={() => handleAction('clear')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            🗑️ Clear All Vectors
          </button>
          
          <button
            onClick={loadEmbeddingsInfo}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            🔄 Refresh Info
          </button>
        </div>
      </div>

      {/* Vector Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Vector Search Testing</h2>
        
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search query..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={searching}
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Search Results ({searchResults.length})
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div key={result.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      ID: {result.id}
                    </span>
                    <span className="text-sm text-blue-600 font-medium">
                      Score: {result.score.toFixed(4)}
                    </span>
                  </div>
                  
                  {result.metadata && (
                    <div className="text-xs text-gray-500 mb-2">
                      <strong>Metadata:</strong> {JSON.stringify(result.metadata, null, 2)}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-800">
                    <strong>Content:</strong> {result.data}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchQuery && searchResults.length === 0 && !searching && (
          <div className="text-center py-8">
            <p className="text-gray-500">No results found for &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}