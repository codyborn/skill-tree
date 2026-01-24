'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import SkillTreeEditor from '@/components/SkillTreeEditor';
import Toast from '@/components/Toast';
import type { TreeData } from '@/types/skill-tree';

export default function TreePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const [initialData, setInitialData] = useState<TreeData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);

  // Fetch tree data on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetch(`/api/trees/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.tree?.data) {
            setInitialData(data.tree.data);
          }
        })
        .catch((error) => {
          console.error('Failed to fetch tree:', error);
          setToast({ message: 'Failed to load tree', type: 'error' });
        });
    }
  }, [params.id, status]);

  // Auto-save with 1 second debounce
  const handleSave = (data: TreeData) => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/trees/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
        });

        if (!response.ok) {
          throw new Error('Failed to save');
        }
      } catch (error) {
        console.error('Save error:', error);
        setToast({ message: 'Failed to save', type: 'error' });
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  };

  // Share button handler
  const handleShare = async () => {
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ treeId: params.id }),
      });

      if (!res.ok) {
        throw new Error('Failed to create share link');
      }

      const { url } = await res.json();

      await navigator.clipboard.writeText(url);
      setToast({ message: 'Link copied to clipboard!', type: 'success' });
    } catch (error) {
      console.error('Share error:', error);
      setToast({ message: 'Failed to create share link', type: 'error' });
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/');
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Skill Tree Editor</h1>
          <div className="flex items-center gap-4">
            {isSaving && <span className="text-gray-400 text-sm">Saving...</span>}
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
            >
              Share
            </button>
          </div>
        </div>
      </header>

      {initialData && (
        <SkillTreeEditor treeId={params.id} initialData={initialData} onSave={handleSave} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
