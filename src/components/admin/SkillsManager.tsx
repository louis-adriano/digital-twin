'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  category: z.string().min(1, 'Category is required'),
  years_experience: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
});

type SkillForm = z.infer<typeof skillSchema>;

interface Skill {
  id: number;
  name: string;
  category: string;
  years_experience?: number;
  description?: string;
}

const SKILL_CATEGORIES = [
  'Programming Languages',
  'Frontend Frameworks',
  'Backend Frameworks', 
  'Databases',
  'Cloud Platforms',
  'DevOps & Tools',
  'Mobile Development',
  'Design Tools',
  'Project Management',
  'Soft Skills',
  'Other'
];

export default function SkillsManager() {
  const [skills, setSkills] = useState<Skill[]>([]);
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
    watch,
  } = useForm<SkillForm>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      years_experience: 1,
    },
  });



  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/skills');
      if (!response.ok) throw new Error('Failed to load skills');
      
      const data = await response.json();
      setSkills(data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to load skills',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SkillForm) => {
    try {
      setSaving(true);
      setMessage(null);

      const url = editingId 
        ? `/api/admin/skills/${editingId}`
        : '/api/admin/skills';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save skill');
      }

      setMessage({ 
        type: 'success', 
        text: editingId ? 'Skill updated successfully!' : 'Skill added successfully!' 
      });
      
      reset({ years_experience: 1 });
      setShowForm(false);
      setEditingId(null);
      loadSkills();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save skill',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingId(skill.id);
    reset({
      name: skill.name,
      category: skill.category,

      years_experience: skill.years_experience || 1,
      description: skill.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
      const response = await fetch(`/api/admin/skills/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete skill');
      }

      setMessage({ type: 'success', text: 'Skill deleted successfully!' });
      loadSkills();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete skill',
      });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    reset({ years_experience: 1 });
  };





  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

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
            {editingId ? 'Edit Skill' : 'Add New Skill'}
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. React, Python, Project Management"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {SKILL_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <input
                  {...register('years_experience')}
                  type="number"
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 2.5"
                />
                {errors.years_experience && (
                  <p className="mt-1 text-sm text-red-600">{errors.years_experience.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes about this skill..."
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
                {saving ? 'Saving...' : editingId ? 'Update Skill' : 'Add Skill'}
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
          + Add New Skill
        </button>
      )}

      {/* Skills List */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Skills ({skills.length})
        </h3>
        
        {skills.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">No skills added yet.</p>
            <p className="text-sm text-gray-400 mt-1">Click &quot;Add New Skill&quot; to get started!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category} className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorySkills.map((skill) => (
                    <div key={skill.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{skill.name}</h5>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(skill)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(skill.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {skill.years_experience && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Experience</span>
                            <span className="text-xs text-gray-700">
                              {skill.years_experience} year{skill.years_experience !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}

                        {skill.description && (
                          <p className="text-xs text-gray-600 mt-2">{skill.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}