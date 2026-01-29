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
import NodeTooltip from './NodeTooltip';
import HelpTooltip from './HelpTooltip';

interface SkillTreeEditorProps {
  treeId?: string;
  initialData?: TreeData;
  readOnly?: boolean;
  shareId?: string;
  onSave?: (data: TreeData) => void | Promise<void>;
}

function SkillTreeEditorInner({ treeId, initialData, readOnly, shareId, onSave }: SkillTreeEditorProps) {
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
  const [hoveredNode, setHoveredNode] = useState<NodeSingular | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Check if we should show the help tooltip (only root node exists and not in readOnly mode)
  useEffect(() => {
    if (readOnly) {
      setShowHelp(false);
      return;
    }

    if (initialData && initialData.nodes) {
      const hasOnlyRootNode = initialData.nodes.length === 1;
      setShowHelp(hasOnlyRootNode);
    }
  }, [initialData, readOnly]);

  useEffect(() => {
    // Initialize Cytoscape only on client
    if (typeof window !== 'undefined' && containerRef.current && !skillTree) {
      import('@/lib/skill-tree/SkillTree').then(({ SkillTree: SkillTreeClass }) => {
        const tree = new SkillTreeClass({
          container: containerRef.current!,
          readOnly: readOnly,
          onNodeClick: (node) => {
            // Don't open detail panel for root nodes
            const parentId = node.data('parentId');
            const isRootNode = parentId === null || parentId === undefined;
            if (!isRootNode) {
              setSelectedNode(node);
              setIsPanelOpen(true);
            }
          },
          onNodeRightClick: (node, event) => {
            setIsPanelOpen(false); // Close detail panel when opening context menu
            setHoveredNode(null); // Close tooltip when opening context menu
            setHoverPosition(null);
            setContextMenu({ node, x: event.clientX, y: event.clientY });
          },
          onCanvasClick: () => {
            // Close detail panel when clicking on canvas background
            setIsPanelOpen(false);
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

          // Set up hover listeners for tooltip
          const cy = tree.getCytoscapeInstance();
          if (cy) {
            cy.on('mouseover', 'node', (evt) => {
              const node = evt.target;
              const renderedPos = node.renderedPosition();
              setHoveredNode(node);
              setHoverPosition({ x: renderedPos.x, y: renderedPos.y });
            });

            cy.on('mouseout', 'node', () => {
              setHoveredNode(null);
              setHoverPosition(null);
            });
          }
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
        // Hide help tooltip after adding first node
        setShowHelp(false);
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

  const handleCopySkillset = async (nodeId: string) => {
    if (!shareId) return;

    try {
      const response = await fetch('/api/copy-skillset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId, nodeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setToast({ message: 'Please sign in to copy skills', type: 'error' });
          // Redirect to login
          window.location.href = '/';
        } else {
          throw new Error(data.error || 'Failed to copy skillset');
        }
        return;
      }

      setToast({ message: data.message, type: 'success' });
      setContextMenu(null);

      // Optionally redirect to the user's tree after a delay
      setTimeout(() => {
        window.location.href = `/tree/${data.treeId}`;
      }, 2000);
    } catch (error) {
      console.error('Copy skillset error:', error);
      setToast({ message: 'Failed to copy skillset', type: 'error' });
    }
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

      const selectedParentId = aiParentNode.id();

      // Build a mapping from old IDs to new IDs
      const idMap = new Map<string, string>();

      // First pass: Create all nodes and map old IDs to new IDs
      tree.nodes.forEach((nodeData: any) => {
        const newNodeData = NodeRenderer.createNode(
          nodeData.label,
          null, // Will set parent in second pass
          {
            type: 'emoji' as const,
            icon: nodeData.iconData?.icon || '',
            color: parentColor, // Inherit parent color
          }
        );

        newNodeData.description = nodeData.description || '';
        newNodeData.weight = nodeData.weight || 5;

        // Map old ID to new ID
        idMap.set(nodeData.id, newNodeData.id);

        const cyNode = NodeRenderer.toCytoscapeNode(newNodeData);
        // Don't set position - let layout algorithm handle it
        cy.add(cyNode);
      });

      // Second pass: Create edges with proper parent-child relationships
      tree.nodes.forEach((nodeData: any) => {
        const newNodeId = idMap.get(nodeData.id);
        if (!newNodeId) return;

        const node = cy.getElementById(newNodeId);

        if (nodeData.parent === null) {
          // This is the root of the AI tree, connect to selected parent
          node.data('parentId', selectedParentId);
          node.data('prerequisites', [selectedParentId]);
          cy.add(NodeRenderer.createEdge(selectedParentId, newNodeId));
        } else {
          // This node has a parent in the AI tree
          const newParentId = idMap.get(nodeData.parent);
          if (newParentId) {
            node.data('parentId', newParentId);
            node.data('prerequisites', [newParentId]);
            cy.add(NodeRenderer.createEdge(newParentId, newNodeId));
          }
        }
      });

      // Update lock states and layout
      NodeRenderer.recalculateAllLockStates(cy);
      NodeRenderer.updateAllSubtreeCompletions(cy);
      await skillTree.applyLayout(true);

      // Trigger save after generation
      if (onSave && skillTree) {
        const data = skillTree.getTreeData();
        onSave(data);
      }

      setToast({ message: 'Skill tree generated successfully!', type: 'success' });
      setAiModalOpen(false);
      // Hide help tooltip after AI generation
      setShowHelp(false);
    } catch (error) {
      console.error('AI generation error:', error);
      setToast({ message: 'Failed to generate skill tree', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 relative" style={{ backgroundColor: 'var(--graph-bg)' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--graph-bg)' }}>
          <div className="text-white text-xl">Loading skill tree...</div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '600px', backgroundColor: 'var(--graph-bg)' }} />

      <DetailPanel
        node={selectedNode}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          skillTree?.clearAllHighlights();
        }}
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
          readOnly={readOnly}
          onCopySkillset={handleCopySkillset}
        />
      )}

      <AIGenerateModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onGenerate={handleAIGenerateSubmit}
        isGenerating={isGenerating}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <NodeTooltip node={hoveredNode} position={hoverPosition} />

      <HelpTooltip show={showHelp} />
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
