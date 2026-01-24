'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { SkillTree } from '@/lib/skill-tree/SkillTree';
import type { TreeData } from '@/types/skill-tree';

interface SkillTreeEditorProps {
  treeId?: string;
  initialData?: TreeData;
  readOnly?: boolean;
  onSave?: (data: TreeData) => void | Promise<void>;
}

function SkillTreeEditorInner({ treeId, initialData, readOnly, onSave }: SkillTreeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [skillTree, setSkillTree] = useState<SkillTree | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Cytoscape only on client
    if (typeof window !== 'undefined' && containerRef.current && !skillTree) {
      import('@/lib/skill-tree/SkillTree').then(({ SkillTree: SkillTreeClass }) => {
        const tree = new SkillTreeClass({
          container: containerRef.current!,
          onNodeClick: (node) => {
            console.log('Node clicked:', node.data('label'));
            // Will implement detail panel later
          },
          onNodeRightClick: (node, event) => {
            console.log('Node right-clicked:', node.data('label'));
            // Will implement context menu later
          },
          onCanvasRightClick: (event) => {
            console.log('Canvas right-clicked');
            // Will implement canvas context menu later
          },
          onTreeChanged: () => {
            if (onSave && tree) {
              const data = tree.getTreeData();
              onSave(data);
            }
          },
        });

        tree.init().then(() => {
          if (initialData) {
            tree.loadTree(initialData);
          }
          setSkillTree(tree);
          setLoading(false);
        });
      });
    }

    // Cleanup
    return () => {
      if (skillTree) {
        skillTree.destroy();
      }
    };
  }, []);

  return (
    <div className="flex-1 relative bg-gray-900">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">Loading skill tree...</div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '600px' }} />
    </div>
  );
}

// Export with dynamic import to disable SSR
export default dynamic(() => Promise.resolve(SkillTreeEditorInner), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-900">
      <div className="text-white text-xl">Initializing...</div>
    </div>
  ),
});
