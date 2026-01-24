'use client';

import { useState, useEffect } from 'react';
import SkillTreeEditor from '@/components/SkillTreeEditor';
import Toast from '@/components/Toast';
import type { TreeData } from '@/types/skill-tree';

// Sample tree data for testing
const sampleTreeData: TreeData = {
  version: '1.0',
  name: 'Test Skill Tree',
  nodes: [
    {
      group: 'nodes',
      data: {
        id: 'root',
        label: 'Root Skill',
        description: 'This is a **test** skill with markdown support',
        completed: false,
        locked: false,
        parentId: null,
        prerequisites: [],
        iconData: null,
        weight: 5,
        subtreeCompletion: 0,
        subtreeProgress: { completed: 0, total: 1 },
        metadata: {},
      },
    },
  ],
  edges: [],
};

export default function TestPage() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('skill_tree_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const handleSave = (data: TreeData) => {
    console.log('Auto-save triggered:', data);
    // In test mode, just log to console
  };

  const handleShare = () => {
    const testUrl = `${window.location.origin}/test`;
    navigator.clipboard.writeText(testUrl);
    setToast({ message: 'Test link copied to clipboard!', type: 'success' });
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('skill_tree_theme', newTheme);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Skill Tree Editor - Test Mode</h1>
            <p className="text-sm text-gray-400">No auth or database required</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleTheme}
              className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
            >
              Share
            </button>
          </div>
        </div>
      </header>

      <SkillTreeEditor initialData={sampleTreeData} onSave={handleSave} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Instructions Panel */}
      <div className="fixed bottom-4 left-4 bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-sm text-sm text-gray-300">
        <h3 className="font-bold text-white mb-2">Test Instructions:</h3>
        <ul className="space-y-1">
          <li>• Click node → Detail panel opens</li>
          <li>• Right-click node → Context menu</li>
          <li>• Edit fields → Auto-save logs to console</li>
          <li>• ESC → Close panels</li>
          <li>• Add children, toggle complete, delete</li>
        </ul>
      </div>
    </div>
  );
}
