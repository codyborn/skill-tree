'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SkillTreeEditor from '@/components/SkillTreeEditor';

export default function SharePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('skill_tree_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Fetch share data
  useEffect(() => {
    fetch(`/api/share/${params.id}`)
      .then((res) => {
        if (!res.ok) {
          router.push('/404');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setShareData(data);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/404');
      });
  }, [params.id, router]);

  // Theme toggle handler
  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('skill_tree_theme', newTheme);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!shareData) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{shareData.tree.name}</h1>
            {shareData.tree.description && (
              <p className="text-sm text-gray-400 mt-1">{shareData.tree.description}</p>
            )}
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
            <div className="text-sm text-gray-400">
              👁️ {shareData.views} views
            </div>
          </div>
        </div>
      </header>
      <SkillTreeEditor initialData={shareData.tree.data as any} readOnly />
    </div>
  );
}
