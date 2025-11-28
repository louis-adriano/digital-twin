'use client';

import { useState, useEffect } from 'react';

interface Thought {
  id: number;
  title: string;
  excerpt: string;
  linkedin_url: string | null;
  published_date: string;
  is_featured: boolean;
}

export default function ThoughtsManager() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    linkedin_url: '',
    published_date: new Date().toISOString().split('T')[0],
    is_featured: false,
  });

  useEffect(() => {
    loadThoughts();
  }, []);

  const loadThoughts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/thoughts');
      if (!response.ok) throw new Error('Failed to load thoughts');
      
      const data = await response.json();
      setThoughts(data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load thoughts',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const url = editing ? `/api/admin/thoughts/${editing}` : '/api/admin/thoughts';
      const method = editing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(editing ? 'Failed to update thought' : 'Failed to create thought');

      setMessage({
        type: 'success',
        text: `✓ ${editing ? 'Updated' : 'Created'}! Thought ${editing ? 'updated' : 'added'} successfully.`,
      });

      // Reset form
      setFormData({
        title: '',
        excerpt: '',
        linkedin_url: '',
        published_date: new Date().toISOString().split('T')[0],
        is_featured: false,
      });
      setEditing(null);
      loadThoughts();

      setTimeout(() => setMessage(null), 5000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Operation failed',
      });
    }
  };

  const handleEdit = (thought: Thought) => {
    setEditing(thought.id);
    setFormData({
      title: thought.title,
      excerpt: thought.excerpt,
      linkedin_url: thought.linkedin_url || '',
      published_date: thought.published_date,
      is_featured: thought.is_featured,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this thought? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/admin/thoughts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete thought');

      setMessage({
        type: 'success',
        text: '✓ Deleted! Thought removed successfully.',
      });
      
      loadThoughts();
      setTimeout(() => setMessage(null), 5000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete thought',
      });
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({
      title: '',
      excerpt: '',
      linkedin_url: '',
      published_date: new Date().toISOString().split('T')[0],
      is_featured: false,
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-1/4"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Add/Edit Form */}
      <div className="bg-card border border-border p-6 rounded-lg">
        <h2 className="font-serif text-xl font-semibold text-foreground mb-6">
          {editing ? 'Edit Thought' : 'Add New Thought'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Why I switched from React to Next.js"
              className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Excerpt * <span className="text-xs text-muted-foreground font-normal">(Short preview text)</span>
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Share your key insight or takeaway from the post..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-sans font-medium text-foreground mb-2">
                LinkedIn Post URL
              </label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/posts/..."
                className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
              />
            </div>

            <div>
              <label className="block text-sm font-sans font-medium text-foreground mb-2">
                Published Date *
              </label>
              <input
                type="date"
                value={formData.published_date}
                onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_featured"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label htmlFor="is_featured" className="ml-2 text-sm font-sans text-foreground">
              Feature this thought <span className="text-xs text-muted-foreground">(Highlighted display)</span>
            </label>
          </div>

          {message && (
            <div
              className={`p-4 border-l-4 rounded ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-500 text-green-800'
                  : 'bg-red-50 border-red-500 text-red-800'
              } font-sans font-semibold shadow-sm`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-3">
            {editing && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all font-sans rounded-[30px]"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-8 py-2 bg-primary text-primary-foreground hover:bg-[#3d6149] transition-all font-sans rounded-[30px]"
            >
              {editing ? 'Update Thought' : 'Add Thought'}
            </button>
          </div>
        </form>
      </div>

      {/* Thoughts List */}
      <div className="bg-card border border-border p-6 rounded-lg">
        <h2 className="font-serif text-xl font-semibold text-foreground mb-6">
          Your Thoughts ({thoughts.length})
        </h2>

        {thoughts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-sans">No thoughts yet. Add your first LinkedIn post above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {thoughts.map((thought) => (
              <div
                key={thought.id}
                className="border border-border rounded-lg p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-sans font-semibold text-foreground mb-1">
                      {thought.title}
                      {thought.is_featured && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                          FEATURED
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground font-sans">
                      {new Date(thought.published_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(thought)}
                      className="px-3 py-1 text-sm font-sans text-primary hover:bg-primary/10 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(thought.id)}
                      className="px-3 py-1 text-sm font-sans text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-foreground font-sans mb-3 line-clamp-3">
                  {thought.excerpt}
                </p>
                
                {thought.linkedin_url && (
                  <a
                    href={thought.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline font-sans inline-flex items-center gap-1"
                  >
                    View on LinkedIn
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
