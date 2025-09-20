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
      const method = 'POST';
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
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-card border border-destructive/20 p-6">
            <h3 className="text-lg font-serif font-medium text-destructive mb-4">Error Loading Dashboard</h3>
            <p className="text-destructive/80 mb-6 font-sans">{error}</p>
            <button
              onClick={loadDashboardData}
              className="bg-foreground text-background hover:bg-secondary px-6 py-2 font-sans transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground font-sans font-light">Manage your digital twin system</p>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-sans uppercase tracking-widest text-muted-foreground">Experiences</p>
                <p className="text-3xl font-serif font-semibold text-foreground">{analytics?.experiences || 0}</p>
              </div>
              <div className="text-2xl">💼</div>
            </div>
          </div>

          <div className="bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-sans uppercase tracking-widest text-muted-foreground">Skills</p>
                <p className="text-3xl font-serif font-semibold text-foreground">{analytics?.skills || 0}</p>
              </div>
              <div className="text-2xl">🛠️</div>
            </div>
          </div>

          <div className="bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-sans uppercase tracking-widest text-muted-foreground">Projects</p>
                <p className="text-3xl font-serif font-semibold text-foreground">{analytics?.projects || 0}</p>
              </div>
              <div className="text-2xl">🚀</div>
            </div>
          </div>

          <div className="bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-sans uppercase tracking-widest text-muted-foreground">Vectors</p>
                <p className="text-3xl font-serif font-semibold text-foreground">{embeddings?.vectorCount || 0}</p>
              </div>
              <div className="text-2xl">🧠</div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-card border border-border p-6">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-6">Database Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm font-sans text-foreground">PostgreSQL</span>
                <span className="inline-flex items-center px-3 py-1 text-xs font-sans font-medium bg-foreground text-background">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm font-sans text-foreground">Vector Database</span>
                <span className="inline-flex items-center px-3 py-1 text-xs font-sans font-medium bg-foreground text-background">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-sans text-foreground">Content Chunks</span>
                <span className="text-sm font-sans text-muted-foreground">{analytics?.contentChunks || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-6">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-6">Vector Database</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm font-sans text-foreground">Total Vectors</span>
                <span className="text-sm font-sans text-muted-foreground">{embeddings?.vectorCount || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm font-sans text-foreground">Dimensions</span>
                <span className="text-sm font-sans text-muted-foreground">{embeddings?.dimension || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-sans text-foreground">Last Updated</span>
                <span className="text-sm font-sans text-muted-foreground">
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
        <div className="bg-card border border-border p-6">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleQuickAction('regenerate-embeddings')}
              className="bg-foreground text-background hover:bg-secondary px-4 py-3 text-sm font-sans font-medium transition-colors text-left"
            >
              <div className="flex items-center">
                <span className="mr-2">🔄</span>
                Regenerate Embeddings
              </div>
            </button>
            
            <button
              onClick={() => handleQuickAction('backup-database')}
              className="bg-foreground text-background hover:bg-secondary px-4 py-3 text-sm font-sans font-medium transition-colors text-left"
            >
              <div className="flex items-center">
                <span className="mr-2">💾</span>
                Backup Database
              </div>
            </button>
            
            <button
              onClick={() => handleQuickAction('clear-vectors')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-3 text-sm font-sans font-medium transition-colors text-left"
            >
              <div className="flex items-center">
                <span className="mr-2">🗑️</span>
                Clear Vectors
              </div>
            </button>
            
            <button
              onClick={loadDashboardData}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-3 text-sm font-sans font-medium transition-colors text-left"
            >
              <div className="flex items-center">
                <span className="mr-2">🔄</span>
                Refresh Data
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}