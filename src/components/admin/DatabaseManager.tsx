'use client';

import { useState } from 'react';

export default function DatabaseManager() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDatabaseAction = async (action: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Action completed successfully' });
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
      handleDatabaseAction(action);
    }
  };

  return (
    <div className="bg-background border border-border rounded-[4px] p-8">
      <h3 className="font-serif italic text-xl font-light text-foreground mb-6">
        Database Management
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

      <div className="space-y-6">
        <div className="border-b border-border pb-6">
          <h4 className="font-sans font-medium text-foreground mb-2">Database Schema</h4>
          <p className="text-sm text-foreground/70 mb-4 font-sans">
            View and manage your PostgreSQL database tables and structure.
          </p>
          <button
            onClick={() => handleDatabaseAction('view-schema')}
            disabled={loading}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-[30px] font-medium text-sm transition-all hover:bg-[#3d6149] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'View Schema'}
          </button>
        </div>

        <div className="border-b border-border pb-6">
          <h4 className="font-sans font-medium text-foreground mb-2">Backup Database</h4>
          <p className="text-sm text-foreground/70 mb-4 font-sans">
            Create a backup of all your profile data, experiences, projects, and skills.
          </p>
          <button
            onClick={() => handleDatabaseAction('backup')}
            disabled={loading}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-[30px] font-medium text-sm transition-all hover:bg-[#3d6149] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Backup...' : 'Create Backup'}
          </button>
        </div>

        <div className="border-b border-border pb-6">
          <h4 className="font-sans font-medium text-foreground mb-2 flex items-center gap-2">
            Database Stats
          </h4>
          <p className="text-sm text-foreground/70 mb-4 font-sans">
            View statistics about your database content and performance.
          </p>
          <button
            onClick={() => handleDatabaseAction('stats')}
            disabled={loading}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-[30px] font-medium text-sm transition-all hover:bg-[#3d6149] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'View Stats'}
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-[4px] p-6">
          <h4 className="font-sans font-medium text-red-800 mb-2 flex items-center gap-2">
            ⚠️ Danger Zone
          </h4>
          <p className="text-sm text-red-700 mb-4 font-sans">
            These actions are irreversible. Please be absolutely certain before proceeding.
          </p>
          <div className="space-y-3">
            <button
              onClick={() =>
                confirmAndExecute(
                  'reset-database',
                  'Are you sure you want to reset the entire database? This will delete ALL data and cannot be undone!'
                )
              }
              disabled={loading}
              className="border-2 border-red-600 text-red-600 px-6 py-2 rounded-[30px] font-medium text-sm transition-all hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
