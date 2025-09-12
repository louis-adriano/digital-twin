'use client';

import { useState } from 'react';
import ProfileEditor from '@/components/admin/ProfileEditor';
import ExperienceManager from '@/components/admin/ExperienceManager';
import SkillsManager from '@/components/admin/SkillsManager';
import ProjectsManager from '@/components/admin/ProjectsManager';

type TabType = 'profile' | 'experiences' | 'skills' | 'projects';

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const tabs = [
    { id: 'profile' as TabType, name: 'Profile', icon: '👤' },
    { id: 'experiences' as TabType, name: 'Experiences', icon: '💼' },
    { id: 'skills' as TabType, name: 'Skills', icon: '🛠️' },
    { id: 'projects' as TabType, name: 'Projects', icon: '🚀' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Content Management</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && <ProfileEditor />}
        {activeTab === 'experiences' && <ExperienceManager />}
        {activeTab === 'skills' && <SkillsManager />}
        {activeTab === 'projects' && <ProjectsManager />}
      </div>
    </div>
  );
}