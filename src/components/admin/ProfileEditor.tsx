'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  title: z.string().min(1, 'Professional title is required'),
  bio: z.string().optional(),
  summary: z.string().optional(),
  portfolio_summary: z.string().optional(),
  hero_subtitle: z.string().optional(),
  about_greeting: z.string().optional(),
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
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [currentCvFilename, setCurrentCvFilename] = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const loadProfile = useCallback(async () => {
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
        bio: profile.bio || '',
        summary: profile.summary || '',
        portfolio_summary: profile.portfolio_summary || '',
        hero_subtitle: profile.hero_subtitle || '',
        about_greeting: profile.about_greeting || '',
        location: profile.location || '',
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        website_url: profile.website_url || '',
      });
      setCurrentCvFilename(profile.cv_filename || null);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load profile',
      });
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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

      setMessage({ type: 'success', text: '✓ Saved! Profile updated successfully. Changes will appear on the homepage.' });
      reset(data); // Reset form with new data to clear isDirty
      
      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCvUpload = async () => {
    if (!cvFile) return;

    try {
      setCvUploading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append('cv', cvFile);

      const response = await fetch('/api/admin/cv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload CV');
      }

      setCurrentCvFilename(result.filename);
      setCvFile(null);
      setMessage({ type: 'success', text: 'CV uploaded successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload CV',
      });
    } finally {
      setCvUploading(false);
    }
  };

  const handleCvRemove = async () => {
    try {
      setCvUploading(true);
      setMessage(null);

      const response = await fetch('/api/admin/cv', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove CV');
      }

      setCurrentCvFilename(null);
      setMessage({ type: 'success', text: 'CV removed successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to remove CV',
      });
    } finally {
      setCvUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Only PDF and DOCX files are allowed' });
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }

      setCvFile(file);
      setMessage(null);
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Name * <span className="inline-flex items-center px-2 py-1 text-xs bg-primary text-primary-foreground rounded ml-2">HOMEPAGE</span>
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive font-sans">{errors.name.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground font-sans">Displayed in hero section and navigation logo</p>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Email * <span className="inline-flex items-center px-2 py-1 text-xs bg-primary text-primary-foreground rounded ml-2">HOMEPAGE</span>
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-destructive font-sans">{errors.email.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground font-sans">Shows in Connect section social links</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Professional Title * <span className="inline-flex items-center px-2 py-1 text-xs bg-primary text-primary-foreground ml-2">HOMEPAGE</span>
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="e.g. Full-stack Developer & AI Data Analyst"
              className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive font-sans">{errors.title.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground font-sans">Displays in the hero description section</p>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Phone <span className="inline-flex items-center px-2 py-1 text-xs bg-muted text-muted-foreground rounded ml-2">ADMIN ONLY</span>
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
            />
            <p className="mt-1 text-xs text-muted-foreground font-sans">For admin records only, not displayed on website</p>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Location <span className="inline-flex items-center px-2 py-1 text-xs bg-primary text-primary-foreground rounded ml-2">HOMEPAGE</span>
            </label>
            <input
              {...register('location')}
              type="text"
              className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
            />
            <p className="mt-1 text-xs text-muted-foreground font-sans">Not currently displayed (reserved for future use)</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-sans font-medium text-foreground mb-2">
            Hero Bio/Tagline <span className="inline-flex items-center px-2 py-1 text-xs bg-primary text-primary-foreground ml-2">HOMEPAGE - HERO</span>
          </label>
          <textarea
            {...register('bio')}
            rows={2}
            placeholder="e.g. Building at the intersection of creativity and technology."
            className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
          />
          <p className="mt-1 text-xs text-muted-foreground font-sans">Large italic headline in the hero section (shown in Georgia serif)</p>
        </div>

        <div>
          <label className="block text-sm font-sans font-medium text-foreground mb-2">
            Hero Subtitle <span className="inline-flex items-center px-2 py-1 text-xs bg-primary text-primary-foreground ml-2">HOMEPAGE - HERO</span>
          </label>
          <textarea
            {...register('hero_subtitle')}
            rows={2}
            placeholder="e.g. I'm Louis Adriano, a Full-stack Developer passionate about creating meaningful digital experiences."
            className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
          />
          <p className="mt-1 text-xs text-muted-foreground font-sans">Subtitle text below the hero bio in the hero section</p>
        </div>

        <div>
          <label className="block text-sm font-sans font-medium text-foreground mb-2">
            About Greeting <span className="inline-flex items-center px-2 py-1 text-xs bg-primary text-primary-foreground ml-2">HOMEPAGE - ABOUT</span>
          </label>
          <textarea
            {...register('about_greeting')}
            rows={2}
            placeholder="e.g. I warmly welcome you to my corner of the internet."
            className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
          />
          <p className="mt-1 text-xs text-muted-foreground font-sans">Greeting text in the About Me section (appears above the summary)</p>
        </div>

        <div>
          <label className="block text-sm font-sans font-medium text-foreground mb-2">
            Homepage Summary <span className="inline-flex items-center px-2 py-1 text-xs bg-primary text-primary-foreground ml-2">HOMEPAGE - ABOUT</span>
          </label>
          <textarea
            {...register('summary')}
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
          />
          <p className="mt-1 text-xs text-muted-foreground font-sans">Main content in the About Me section on homepage</p>
        </div>

        <div>
          <label className="block text-sm font-sans font-medium text-foreground mb-2">
            Portfolio Summary <span className="inline-flex items-center px-2 py-1 text-xs bg-primary text-primary-foreground ml-2">PORTFOLIO PAGE</span>
          </label>
          <textarea
            {...register('portfolio_summary')}
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
          />
          <p className="mt-1 text-xs text-muted-foreground font-sans">Professional summary displayed on the Portfolio page</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              LinkedIn URL <span className="inline-flex items-center px-2 py-1 text-xs bg-primary text-primary-foreground rounded ml-2">HOMEPAGE</span>
            </label>
            <input
              {...register('linkedin_url')}
              type="url"
              className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
            />
            {errors.linkedin_url && (
              <p className="mt-1 text-sm text-destructive font-sans">{errors.linkedin_url.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground font-sans">Shows in Connect section footer</p>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              GitHub URL <span className="inline-flex items-center px-2 py-1 text-xs bg-primary text-primary-foreground rounded ml-2">HOMEPAGE</span>
            </label>
            <input
              {...register('github_url')}
              type="url"
              className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
            />
            {errors.github_url && (
              <p className="mt-1 text-sm text-destructive font-sans">{errors.github_url.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground font-sans">Shows in Connect section footer</p>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">
              Website URL <span className="inline-flex items-center px-2 py-1 text-xs bg-muted text-muted-foreground rounded ml-2">ADMIN ONLY</span>
            </label>
            <input
              {...register('website_url')}
              type="url"
              className="w-full px-3 py-2 border border-border rounded-[4px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
            />
            {errors.website_url && (
              <p className="mt-1 text-sm text-destructive font-sans">{errors.website_url.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground font-sans">For admin records only, not displayed</p>
          </div>
        </div>

        {/* CV Upload Section */}
        <div className="border-t border-border pt-6">
          <div className="mb-4">
            <h3 className="text-lg font-serif font-semibold text-foreground mb-2">CV/Resume</h3>
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-900 font-sans mb-2">
                <strong>💡 Recommended for Production:</strong> Use Google Drive for hosting your CV.
              </p>
              <a 
                href="https://drive.google.com/drive/folders/10t8jNz3gX75c24Fw_UeIe_ZKCKG-v6Nm?usp=sharing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 mb-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Open Google Drive to Upload
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <details className="text-xs text-blue-800">
                <summary className="cursor-pointer font-semibold mb-2">📋 Quick Setup Guide</summary>
                <ol className="list-decimal list-inside space-y-1 ml-2 mt-2">
                  <li>Upload your CV to Google Drive</li>
                  <li>Right-click → Share → &quot;Anyone with the link&quot; → Viewer</li>
                  <li>Copy the share link</li>
                  <li>Convert format: <code className="bg-blue-100 px-1 rounded">https://drive.google.com/file/d/FILE_ID/view</code> → <code className="bg-blue-100 px-1 rounded">https://drive.google.com/uc?export=download&amp;id=FILE_ID</code></li>
                  <li>Add to <code className="bg-blue-100 px-1 rounded">.env.local</code>: <code className="bg-blue-100 px-1 rounded">GOOGLE_DRIVE_CV_URL=YOUR_LINK</code></li>
                  <li>Add same variable to Vercel environment variables &amp; redeploy</li>
                </ol>
              </details>
            </div>
            <p className="text-sm text-muted-foreground font-sans">Development uploads work locally but won&apos;t deploy to production.</p>
          </div>

          {currentCvFilename ? (
            <div className="space-y-4">
              <div className="p-4 bg-card border border-border rounded">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-foreground/10 rounded flex items-center justify-center">
                      <span className="text-xs font-mono">
                        {currentCvFilename?.endsWith('.docx') ? 'DOCX' : 'PDF'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">CV uploaded</p>
                      <p className="text-xs text-muted-foreground">{currentCvFilename}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCvRemove}
                    disabled={cvUploading}
                    className="px-3 py-1 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors disabled:opacity-50"
                  >
                    {cvUploading ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:border-0 file:text-sm file:font-medium
                    file:bg-foreground file:text-background
                    hover:file:bg-secondary file:transition-colors"
                />
                <p className="mt-1 text-xs text-muted-foreground">PDF and DOCX files only, max 5MB</p>
              </div>

              {cvFile && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-foreground/10 rounded flex items-center justify-center">
                      <span className="text-xs font-mono">
                        {cvFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'DOCX' : 'PDF'}
                      </span>
                    </div>
                    <span className="text-sm text-foreground">{cvFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCvUpload}
                    disabled={cvUploading}
                    className="px-4 py-2 bg-foreground text-background hover:bg-secondary disabled:bg-muted disabled:cursor-not-allowed transition-colors font-sans text-sm"
                  >
                    {cvUploading ? 'Uploading...' : 'Upload CV'}
                  </button>
                </div>
              )}
            </div>
          )}
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

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={loadProfile}
            className="px-6 py-2 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all font-sans rounded-[30px]"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="px-8 py-2 bg-primary text-primary-foreground hover:bg-[#3d6149] disabled:bg-muted disabled:cursor-not-allowed transition-all font-sans rounded-[30px]"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}