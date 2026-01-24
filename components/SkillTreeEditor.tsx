'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { NodeSingular } from 'cytoscape';
import type { SkillTree } from '@/lib/skill-tree/SkillTree';
import type { TreeData, CytoscapeNodeData } from '@/types/skill-tree';
import DetailPanel from './DetailPanel';
import ContextMenu from './ContextMenu';
import AIGenerateModal from './AIGenerateModal';
import Toast from './Toast';

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
  const [selectedNode, setSelectedNode] = useState<NodeSingular | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ node: NodeSingular | null; x: number; y: number } | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiParentNode, setAiParentNode] = useState<NodeSingular | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Initialize Cytoscape only on client
    if (typeof window !== 'undefined' && containerRef.current && !skillTree) {
      import('@/lib/skill-tree/SkillTree').then(({ SkillTree: SkillTreeClass }) => {
        const tree = new SkillTreeClass({
          container: containerRef.current!,
          onNodeClick: (node) => {
            setSelectedNode(node);
            setIsPanelOpen(true);
          },
          onNodeRightClick: (node, event) => {
            setContextMenu({ node, x: event.clientX, y: event.clientY });
          },
          onCanvasRightClick: (event) => {
            setIsPanelOpen(false);
            setContextMenu(null);
          },
          onTreeChanged: () => {
            if (onSave && tree) {
              const data = tree.getTreeData();
              onSave(data);
            }
          },
          onThemeChange: () => {
            // Theme changed, Cytoscape will update automatically
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

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      if (skillTree) {
        skillTree.updateCytoscapeTheme();
      }
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, [skillTree]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPanelOpen(false);
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Node operation handlers
  const handleUpdateNode = (nodeId: string, updates: Partial<CytoscapeNodeData>) => {
    skillTree?.updateNode(nodeId, updates);
  };

  const handleAddChild = async (nodeId: string) => {
    if (skillTree) {
      const cy = skillTree.getCytoscapeInstance();
      const node = cy?.getElementById(nodeId);
      if (node && node.length > 0) {
        await skillTree.addChildNode(node);
        setContextMenu(null);
      }
    }
  };

  const handleToggleComplete = (nodeId: string) => {
    const cy = skillTree?.getCytoscapeInstance();
    const node = cy?.getElementById(nodeId);
    if (node && node.length > 0) {
      const completed = node.data('completed');
      skillTree?.updateNode(nodeId, { completed: !completed });
      setContextMenu(null);
    }
  };

  const handleDelete = (nodeId: string) => {
    skillTree?.deleteNode(nodeId);
    setIsPanelOpen(false);
    setContextMenu(null);
  };

  const handleAIGenerate = (nodeId: string) => {
    const cy = skillTree?.getCytoscapeInstance();
    const node = cy?.getElementById(nodeId);
    if (node && node.length > 0) {
      setAiParentNode(node);
      setAiModalOpen(true);
      setContextMenu(null);
    }
  };

  const handleAIGenerateSubmit = async (topic: string) => {
    if (!skillTree || !aiParentNode) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          nodeCount: 8,
          style: 'technical',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate skill tree');
      }

      const { tree } = await response.json();

      // Import NodeRenderer
      const { NodeRenderer } = await import('@/lib/skill-tree/NodeRenderer');
      const cy = skillTree.getCytoscapeInstance();
      if (!cy) return;

      // Get parent node color to inherit
      const parentIconData = aiParentNode.data('iconData');
      const parentColor = parentIconData?.color || '#6366f1';

      // Add all generated nodes as children of the selected node
      const parentId = aiParentNode.id();
      const parentPos = aiParentNode.position();

      tree.nodes.forEach((nodeData: any, index: number) => {
        // Skip the root node from AI generation, use existing parent
        if (nodeData.parent === null) return;

        const newNodeData = NodeRenderer.createNode(
          nodeData.label,
          parentId,
          {
            type: 'emoji' as const,
            icon: nodeData.iconData?.icon || '',
            color: parentColor, // Inherit parent color
          }
        );

        newNodeData.description = nodeData.description || '';
        newNodeData.weight = nodeData.weight || 5;

        const cyNode = NodeRenderer.toCytoscapeNode(newNodeData);
        cyNode.position = {
          x: parentPos.x + (index % 3) * 150 - 150,
          y: parentPos.y + Math.floor(index / 3) * 150 + 150,
        };

        cy.add(cyNode);
        cy.add(NodeRenderer.createEdge(parentId, newNodeData.id));
      });

      // Update lock states and layout
      NodeRenderer.recalculateAllLockStates(cy);
      await skillTree.applyLayout(true);

      setToast({ message: 'Skill tree generated successfully!', type: 'success' });
      setAiModalOpen(false);
    } catch (error) {
      console.error('AI generation error:', error);
      setToast({ message: 'Failed to generate skill tree', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 relative bg-gray-900">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">Loading skill tree...</div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '600px' }} />

      <DetailPanel
        node={selectedNode}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onUpdate={handleUpdateNode}
      />

      {contextMenu && (
        <ContextMenu
          node={contextMenu.node}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onAddChild={handleAddChild}
          onAIGenerate={handleAIGenerate}
          onEdit={() => {
            setSelectedNode(contextMenu.node);
            setIsPanelOpen(true);
            setContextMenu(null);
          }}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDelete}
        />
      )}

      <AIGenerateModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onGenerate={handleAIGenerateSubmit}
        isGenerating={isGenerating}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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
