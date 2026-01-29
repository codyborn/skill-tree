'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import SkillTreeEditor from '@/components/SkillTreeEditor';
import Toast from '@/components/Toast';
import UserMenu from '@/components/UserMenu';
import type { TreeData } from '@/types/skill-tree';

export default function TreePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const [initialData, setInitialData] = useState<TreeData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTreeId, setCurrentTreeId] = useState(params.id);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const isFirstRender = useRef(true);

  // Fetch tree data on mount
  useEffect(() => {
    if (status === 'authenticated') {
      // Handle "new" tree case
      if (params.id === 'new') {
        // Load with sample data for new trees
        const sampleData: TreeData = {
          version: '1.0',
          name: 'New Skill Tree',
          nodes: [
            {
              group: 'nodes',
              data: {
                id: 'root',
                label: 'Right click here to get started',
                description: 'Add your first skill or use AI to generate a tree',
                completed: false,
                locked: false,
                parentId: null,
                prerequisites: [],
                iconData: { type: 'emoji', icon: '', color: '#8b5cf6' },
                weight: 5,
                subtreeCompletion: 0,
                subtreeProgress: { completed: 0, total: 1 },
                metadata: {},
              },
            },
          ],
          edges: [],
        };
        setInitialData(sampleData);
        return;
      }

      // Fetch existing tree
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
        if (params.id === 'new') {
          // Create new tree
          const response = await fetch('/api/trees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.name || 'Untitled Skill Tree',
              description: 'Created from editor',
              data,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create tree');
          }

          const { tree } = await response.json();
          // Update current tree ID and URL
          setCurrentTreeId(tree.id);
          window.history.replaceState(null, '', `/tree/${tree.id}`);
        } else {
          // Update existing tree
          const response = await fetch(`/api/trees/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data }),
          });

          if (!response.ok) {
            throw new Error('Failed to save');
          }
        }
      } catch (error) {
        console.error('Save error:', error);
        setToast({ message: 'Failed to save', type: 'error' });
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  };

  // Share link handler (for UserMenu)
  const handleCopyShareLink = async () => {
    // Don't allow sharing unsaved trees
    if (currentTreeId === 'new') {
      setToast({ message: 'Please make a change to save the tree before sharing', type: 'error' });
      return;
    }

    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ treeId: currentTreeId }),
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
          <h1 className="text-xl font-bold text-white">Skill Tree</h1>
          <div className="flex items-center gap-4">
            {isSaving && <span className="text-gray-400 text-sm">Saving...</span>}
            {session && (
              <UserMenu
                session={session}
                onCopyShareLink={handleCopyShareLink}
                showShareLink={currentTreeId !== 'new'}
              />
            )}
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
