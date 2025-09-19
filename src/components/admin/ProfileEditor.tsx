'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  title: z.string().min(1, 'Professional title is required'), // ✅ Made required since it's displayed on homepage
  summary: z.string().optional(),
  location: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfileEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/profile');
      if (!response.ok) throw new Error('Failed to load profile');
      
      const profile = await response.json();
      reset({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        title: profile.title || '',
        summary: profile.summary || '',
        location: profile.location || '',
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        website_url: profile.website_url || '',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setMessage({ type: 'success', text: 'Profile updated successfully! Changes will appear on the homepage.' });
      reset(data); // Reset form with new data to clear isDirty
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-1/4"></div>
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-4 bg-muted rounded w-1/4"></div>
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-4 bg-muted rounded w-1/4"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-6">
      <h2 className="font-serif text-xl font-semibold text-foreground mb-6">Edit Profile</h2>

      {message && (
        <div
          className={`mb-4 p-4 border ${
            message.type === 'success'
              ? 'bg-card border-foreground/20 text-foreground'
              : 'bg-card border-destructive/20 text-destructive'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Name * <span className="inline-flex items-center px-2 py-1 text-xs bg-foreground text-background ml-2">HOMEPAGE</span>
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent font-sans"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive font-sans">{errors.name.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground font-sans">Appears as large heading on homepage</p>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Email * <span className="inline-flex items-center px-2 py-1 text-xs bg-foreground text-background ml-2">HOMEPAGE</span>
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent font-sans"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-destructive font-sans">{errors.email.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground font-sans">Shows in contact section on homepage</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Professional Title * <span className="inline-flex items-center px-2 py-1 text-xs bg-foreground text-background ml-2">HOMEPAGE</span>
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="e.g. Full-stack Developer & AI Data Analyst"
              className="w-full px-3 py-2 border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent font-sans"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive font-sans">{errors.title.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground font-sans">Displays directly below your name on homepage</p>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Phone <span className="inline-flex items-center px-2 py-1 text-xs bg-muted text-muted-foreground ml-2">ADMIN ONLY</span>
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full px-3 py-2 border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent font-sans"
            />
            <p className="mt-1 text-xs text-muted-foreground font-sans">For admin records only, not displayed on website</p>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Location <span className="inline-flex items-center px-2 py-1 text-xs bg-foreground text-background ml-2">HOMEPAGE</span>
            </label>
            <input
              {...register('location')}
              type="text"
              className="w-full px-3 py-2 border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent font-sans"
            />
            <p className="mt-1 text-xs text-muted-foreground font-sans">Shows in contact section on homepage</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-sans font-medium text-foreground mb-2">
            Professional Summary <span className="inline-flex items-center px-2 py-1 text-xs bg-foreground text-background ml-2">HOMEPAGE</span>
          </label>
          <textarea
            {...register('summary')}
            rows={4}
            className="w-full px-3 py-2 border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent font-sans"
          />
          <p className="mt-1 text-xs text-muted-foreground font-sans">Appears in the "About" section when users click Overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              LinkedIn URL <span className="inline-flex items-center px-2 py-1 text-xs bg-foreground text-background ml-2">HOMEPAGE</span>
            </label>
            <input
              {...register('linkedin_url')}
              type="url"
              className="w-full px-3 py-2 border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent font-sans"
            />
            {errors.linkedin_url && (
              <p className="mt-1 text-sm text-destructive font-sans">{errors.linkedin_url.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground font-sans">Creates clickable LinkedIn link on homepage</p>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              GitHub URL <span className="inline-flex items-center px-2 py-1 text-xs bg-foreground text-background ml-2">HOMEPAGE</span>
            </label>
            <input
              {...register('github_url')}
              type="url"
              className="w-full px-3 py-2 border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent font-sans"
            />
            {errors.github_url && (
              <p className="mt-1 text-sm text-destructive font-sans">{errors.github_url.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground font-sans">Creates clickable GitHub link on homepage</p>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Website URL <span className="inline-flex items-center px-2 py-1 text-xs bg-muted text-muted-foreground ml-2">ADMIN ONLY</span>
            </label>
            <input
              {...register('website_url')}
              type="url"
              className="w-full px-3 py-2 border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent font-sans"
            />
            {errors.website_url && (
              <p className="mt-1 text-sm text-destructive font-sans">{errors.website_url.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground font-sans">For admin records only, not currently displayed on website</p>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={loadProfile}
            className="px-4 py-2 text-foreground bg-muted hover:bg-secondary transition-colors font-sans"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="px-6 py-2 bg-foreground text-background hover:bg-secondary disabled:bg-muted disabled:cursor-not-allowed transition-colors font-sans"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}