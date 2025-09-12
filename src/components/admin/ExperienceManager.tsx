'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const experienceSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  position: z.string().min(1, 'Position is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().nullable(),
  description: z.string().optional(),
  location: z.string().optional(),
  achievements: z.string().optional(),
  technologies: z.string().optional(),
});

type ExperienceForm = z.infer<typeof experienceSchema>;

interface Experience {
  id: number;
  company: string;
  position: string;
  start_date: string;
  end_date: string | null;
  description?: string;
  location?: string;
  achievements?: string[];
  technologies?: string[];
}

export default function ExperienceManager() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExperienceForm>({
    resolver: zodResolver(experienceSchema),
  });

  useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/experiences');
      if (!response.ok) throw new Error('Failed to load experiences');
      
      const data = await response.json();
      setExperiences(data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load experiences',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ExperienceForm) => {
    try {
      setSaving(true);
      setMessage(null);

      // Convert comma-separated strings to arrays
      const formattedData = {
        ...data,
        end_date: data.end_date || null,
        achievements: data.achievements ? data.achievements.split(',').map(s => s.trim()) : [],
        technologies: data.technologies ? data.technologies.split(',').map(s => s.trim()) : [],
      };

      const url = editingId 
        ? `/api/admin/experiences/${editingId}`
        : '/api/admin/experiences';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save experience');
      }

      setMessage({ 
        type: 'success', 
        text: editingId ? 'Experience updated successfully!' : 'Experience added successfully!' 
      });
      
      reset();
      setShowForm(false);
      setEditingId(null);
      loadExperiences();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save experience',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (experience: Experience) => {
    setEditingId(experience.id);
    reset({
      company: experience.company,
      position: experience.position,
      start_date: experience.start_date,
      end_date: experience.end_date,
      description: experience.description || '',
      location: experience.location || '',
      achievements: (experience.achievements || []).join(', '),
      technologies: (experience.technologies || []).join(', '),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;

    try {
      const response = await fetch(`/api/admin/experiences/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete experience');
      }

      setMessage({ type: 'success', text: 'Experience deleted successfully!' });
      loadExperiences();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete experience',
      });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Experience' : 'Add New Experience'}
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company *
                </label>
                <input
                  {...register('company')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Google, Microsoft"
                />
                {errors.company && (
                  <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <input
                  {...register('position')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Senior Developer"
                />
                {errors.position && (
                  <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  {...register('start_date')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (leave empty if current)
                </label>
                <input
                  {...register('end_date')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  {...register('location')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your role and responsibilities..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Achievements (comma-separated)
              </label>
              <input
                {...register('achievements')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Led team of 5, Increased performance by 30%"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technologies Used (comma-separated)
              </label>
              <input
                {...register('technologies')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. React, Node.js, Python, AWS"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                {saving ? 'Saving...' : editingId ? 'Update Experience' : 'Add Experience'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          + Add New Experience
        </button>
      )}

      {/* Experiences List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Experiences ({experiences.length})
        </h3>
        
        {experiences.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">No experiences added yet.</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add New Experience" to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map((experience) => (
              <div key={experience.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{experience.position}</h4>
                    <p className="text-lg text-blue-600">{experience.company}</p>
                    {experience.location && (
                      <p className="text-gray-600">{experience.location}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">
                      {formatDate(experience.start_date)} - {formatDate(experience.end_date)}
                    </span>
                    <div className="mt-2 space-x-2">
                      <button
                        onClick={() => handleEdit(experience)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(experience.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {experience.description && (
                  <p className="text-gray-700 mb-3">{experience.description}</p>
                )}

                {experience.achievements && experience.achievements.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-1">Key Achievements:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {experience.achievements.map((achievement, index) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {experience.technologies && experience.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {experience.technologies.map((tech, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}