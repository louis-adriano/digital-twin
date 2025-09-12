'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  professionals: number;
  experiences: number;
  skills: number;
  projects: number;
  contentChunks: number;
  lastUpdated: string;
}

interface EmbeddingsData {
  vectorCount: number;
  dimension: number;
  contentChunks: number;
  lastUpdated: string;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [embeddings, setEmbeddings] = useState<EmbeddingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      
      const [analyticsRes, embeddingsRes] = await Promise.all([
        fetch('/api/admin/analytics?type=overview'),
        fetch('/api/admin/embeddings?action=info'),
      ]);

      if (!analyticsRes.ok) throw new Error('Failed to load analytics');
      if (!embeddingsRes.ok) throw new Error('Failed to load embeddings data');

      const [analyticsData, embeddingsData] = await Promise.all([
        analyticsRes.json(),
        embeddingsRes.json(),
      ]);

      setAnalytics(analyticsData);
      setEmbeddings(embeddingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    try {
      let endpoint = '';
      let method = 'POST';
      let body = {};

      switch (action) {
        case 'regenerate-embeddings':
          endpoint = '/api/admin/embeddings';
          body = { action: 'regenerate' };
          break;
        case 'clear-vectors':
          if (!confirm('Are you sure you want to clear all vectors? This cannot be undone.')) {
            return;
          }
          endpoint = '/api/admin/embeddings';
          body = { action: 'clear' };
          break;
        default:
          alert('Action not implemented yet');
          return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Action failed');
      }

      alert(result.message || 'Action completed successfully');
      loadDashboardData(); // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-red-800">Error Loading Dashboard</h3>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Experiences</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics?.experiences || 0}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">💼</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Skills</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics?.skills || 0}</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600">🛠️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics?.projects || 0}</p>
            </div>
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600">🚀</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vectors</p>
              <p className="text-2xl font-semibold text-gray-900">{embeddings?.vectorCount || 0}</p>
            </div>
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600">🧠</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Database Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">PostgreSQL</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Vector Database</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Content Chunks</span>
              <span className="text-sm text-gray-900">{analytics?.contentChunks || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vector Database</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Vectors</span>
              <span className="text-sm text-gray-900">{embeddings?.vectorCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dimensions</span>
              <span className="text-sm text-gray-900">{embeddings?.dimension || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="text-sm text-gray-900">
                {embeddings?.lastUpdated 
                  ? new Date(embeddings.lastUpdated).toLocaleString()
                  : 'Never'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleQuickAction('regenerate-embeddings')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            🔄 Regenerate Embeddings
          </button>
          
          <button
            onClick={() => handleQuickAction('backup-database')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            💾 Backup Database
          </button>
          
          <button
            onClick={() => handleQuickAction('clear-vectors')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            🗑️ Clear Vectors
          </button>
          
          <button
            onClick={loadDashboardData}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}