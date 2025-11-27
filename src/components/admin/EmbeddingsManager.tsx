'use client';

import { useState, useEffect } from 'react';

interface EmbeddingsInfo {
  vectorCount: number;
  dimension: number;
  contentChunks: number;
  lastUpdated: string;
}

export default function EmbeddingsManager() {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<EmbeddingsInfo | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadEmbeddingsInfo();
  }, []);

  const loadEmbeddingsInfo = async () => {
    try {
      const response = await fetch('/api/admin/embeddings?action=info');
      if (response.ok) {
        const data = await response.json();
        setInfo(data);
      }
    } catch (error) {
      console.error('Failed to load embeddings info:', error);
    }
  };

  const handleEmbeddingsAction = async (action: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Action completed successfully' });
        // Reload info after action
        setTimeout(() => loadEmbeddingsInfo(), 1000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Action failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to perform action' });
    } finally {
      setLoading(false);
    }
  };

  const confirmAndExecute = (action: string, confirmMessage: string) => {
    if (confirm(confirmMessage)) {
      handleEmbeddingsAction(action);
    }
  };

  return (
    <div className="bg-background border border-border rounded-[4px] p-8">
      <h3 className="font-serif italic text-xl font-light text-foreground mb-6">
        AI Embeddings Management
      </h3>

      {message && (
        <div
          className={`mb-6 p-4 rounded-[4px] ${
            message.type === 'success'
              ? 'bg-primary/10 border border-primary text-foreground'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {info && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#ebe6da] p-4 rounded-[4px]">
            <div className="text-xs uppercase tracking-wide text-foreground/60 mb-1 font-sans">Vector Count</div>
            <div className="text-2xl font-serif italic font-light text-foreground">{info.vectorCount}</div>
          </div>
          <div className="bg-[#ebe6da] p-4 rounded-[4px]">
            <div className="text-xs uppercase tracking-wide text-foreground/60 mb-1 font-sans">Dimension</div>
            <div className="text-2xl font-serif italic font-light text-foreground">{info.dimension}</div>
          </div>
          <div className="bg-[#ebe6da] p-4 rounded-[4px]">
            <div className="text-xs uppercase tracking-wide text-foreground/60 mb-1 font-sans">Content Chunks</div>
            <div className="text-2xl font-serif italic font-light text-foreground">{info.contentChunks}</div>
          </div>
          <div className="bg-[#ebe6da] p-4 rounded-[4px]">
            <div className="text-xs uppercase tracking-wide text-foreground/60 mb-1 font-sans">Last Updated</div>
            <div className="text-sm font-sans text-foreground">
              {new Date(info.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="border-b border-border pb-6">
          <h4 className="font-sans font-medium text-foreground mb-2">What are AI Embeddings?</h4>
          <p className="text-sm text-foreground/70 mb-4 font-sans leading-relaxed">
            AI embeddings power your chatbot's ability to understand and answer questions about your profile. They convert your content into vector representations that enable semantic search and intelligent responses.
          </p>
        </div>

        <div className="border-b border-border pb-6">
          <h4 className="font-sans font-medium text-foreground mb-2">Regenerate Embeddings</h4>
          <p className="text-sm text-foreground/70 mb-4 font-sans">
            Update the AI embeddings with your latest content. Run this after making significant changes to your profile, experience, or projects.
          </p>
          <button
            onClick={() => handleEmbeddingsAction('regenerate')}
            disabled={loading}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-[30px] font-medium text-sm transition-all hover:bg-[#3d6149] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Regenerating...' : 'Regenerate Embeddings'}
          </button>
        </div>

        <div className="border-b border-border pb-6">
          <h4 className="font-sans font-medium text-foreground mb-2">Test AI Chat</h4>
          <p className="text-sm text-foreground/70 mb-4 font-sans">
            Verify that your AI chatbot is working correctly by asking it a test question.
          </p>
          <button
            onClick={() => handleEmbeddingsAction('test')}
            disabled={loading}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-[30px] font-medium text-sm transition-all hover:bg-[#3d6149] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Testing...' : 'Test AI Chat'}
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-[4px] p-6">
          <h4 className="font-sans font-medium text-red-800 mb-2 flex items-center gap-2">
            ⚠️ Danger Zone
          </h4>
          <p className="text-sm text-red-700 mb-4 font-sans">
            Clear all embeddings from the vector database. You'll need to regenerate them afterward.
          </p>
          <button
            onClick={() =>
              confirmAndExecute(
                'clear',
                'Are you sure you want to clear all embeddings? The AI chat will not work until you regenerate them.'
              )
            }
            disabled={loading}
            className="border-2 border-red-600 text-red-600 px-6 py-2 rounded-[30px] font-medium text-sm transition-all hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All Embeddings
          </button>
        </div>
      </div>
    </div>
  );
}
