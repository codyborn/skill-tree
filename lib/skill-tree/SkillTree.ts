/**
 * SkillTree.ts - Core SkillTree class managing Cytoscape instance
 * Converted to TypeScript for use with React/Next.js
 */

import type { Core, NodeSingular, EdgeSingular } from 'cytoscape';
import type {
  TreeData,
  CytoscapeNode,
  CytoscapeEdge,
  CytoscapeNodeData,
  NodeData,
} from '@/types/skill-tree';

export interface SkillTreeOptions {
  container: HTMLElement;
  onNodeClick?: (node: NodeSingular) => void;
  onNodeRightClick?: (node: NodeSingular, event: MouseEvent) => void;
  onCanvasRightClick?: (event: MouseEvent) => void;
  onTreeChanged?: () => void;
  onThemeChange?: () => void;
}

export class SkillTree {
  private cy: Core | null = null;
  private container: HTMLElement;
  private selectedNode: NodeSingular | null = null;
  private isDragging = false;

  // Callbacks
  private onNodeClick?: (node: NodeSingular) => void;
  private onNodeRightClick?: (node: NodeSingular, event: MouseEvent) => void;
  private onCanvasRightClick?: (event: MouseEvent) => void;
  private onTreeChanged?: () => void;
  private onThemeChange?: () => void;

  constructor(options: SkillTreeOptions) {
    this.container = options.container;
    this.onNodeClick = options.onNodeClick;
    this.onNodeRightClick = options.onNodeRightClick;
    this.onCanvasRightClick = options.onCanvasRightClick;
    this.onTreeChanged = options.onTreeChanged;
    this.onThemeChange = options.onThemeChange;
  }

  async init() {
    if (!this.container) {
      console.error('Container not found');
      return;
    }

    // Dynamically import Cytoscape and plugins (browser-only)
    const cytoscape = (await import('cytoscape')).default;
    const dagre = (await import('cytoscape-dagre')).default;

    // Register layout
    cytoscape.use(dagre);

    // Import theme manager and node renderer
    const { ThemeManager } = await import('./themes');
    const { NodeRenderer } = await import('./NodeRenderer');

    // Initialize theme from localStorage
    const savedTheme = ThemeManager.getTheme();
    ThemeManager.currentTheme = savedTheme;

    // Create Cytoscape instance
    this.cy = cytoscape({
      container: this.container,
      elements: [],
      style: ThemeManager.getCytoscapeStyle(),
      layout: {
        name: 'preset',
      },
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.2,
      selectionType: 'single',
      boxSelectionEnabled: false,
    });

    this.setupEventListeners();
    await this.loadSampleTree();
  }

  private setupEventListeners() {
    if (!this.cy) return;

    // Node tap/click
    this.cy.on('tap', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      this.selectedNode = node;
      this.highlightNodeAndChildren(node);
      if (this.onNodeClick) {
        this.onNodeClick(node);
      }
    });

    // Right-click on node
    this.cy.on('cxttap', 'node', (evt) => {
      evt.preventDefault();
      const node = evt.target as NodeSingular;
      this.selectedNode = node;
      if (this.onNodeRightClick) {
        this.onNodeRightClick(node, evt.originalEvent as MouseEvent);
      }
    });

    // Right-click on canvas
    this.cy.on('cxttap', (evt) => {
      if (evt.target === this.cy) {
        evt.preventDefault();
        if (this.onCanvasRightClick) {
          this.onCanvasRightClick(evt.originalEvent as MouseEvent);
        }
      }
    });

    // Click on canvas (deselect)
    this.cy.on('tap', (evt) => {
      if (evt.target === this.cy) {
        this.selectedNode = null;
        this.clearAllHighlights();
      }
    });

    // Node drag events for reparenting
    let draggedNode: NodeSingular | null = null;
    let potentialParent: NodeSingular | null = null;

    this.cy.on('grab', 'node', (evt) => {
      this.isDragging = true;
      draggedNode = evt.target as NodeSingular;
    });

    this.cy.on('drag', 'node', async (evt) => {
      if (!draggedNode || !this.cy) return;

      const { NodeRenderer } = await import('./NodeRenderer');

      // Find node under cursor
      const draggedPos = draggedNode.position();
      const nodesUnderCursor = this.cy.nodes().filter((node) => {
        if (node.id() === draggedNode!.id()) return false;
        const pos = node.position();
        const distance = Math.sqrt(
          Math.pow(pos.x - draggedPos.x, 2) + Math.pow(pos.y - draggedPos.y, 2)
        );
        return distance < 40; // Within 40px
      });

      // Clear previous highlight
      if (potentialParent) {
        potentialParent.removeClass('potential-parent');
      }

      // Highlight potential parent
      if (nodesUnderCursor.length > 0) {
        potentialParent = nodesUnderCursor[0] as NodeSingular;
        potentialParent.addClass('potential-parent');
      } else {
        potentialParent = null;
      }
    });

    this.cy.on('free', 'node', async (evt) => {
      this.isDragging = false;

      // Attempt reparenting if dropped on another node
      if (draggedNode && potentialParent) {
        const success = await this.reparentNode(draggedNode.id(), potentialParent.id());
        // Toast notification handled by parent component
      }

      // Clear highlights
      if (potentialParent) {
        potentialParent.removeClass('potential-parent');
      }

      draggedNode = null;
      potentialParent = null;
      this.saveViewport();
    });

    // Node hover effects
    this.cy.on('mouseover', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      node.data('_hover', true);
    });

    this.cy.on('mouseout', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      node.data('_hover', false);
    });
  }

  async updateCytoscapeTheme() {
    if (this.cy) {
      const { ThemeManager } = await import('./themes');
      // Update theme from localStorage
      const savedTheme = ThemeManager.getTheme();
      ThemeManager.currentTheme = savedTheme;
      this.cy.style(ThemeManager.getCytoscapeStyle());
      if (this.onThemeChange) {
        this.onThemeChange();
      }
    }
  }

  private async loadSampleTree() {
    const { NodeRenderer } = await import('./NodeRenderer');

    const rootNodeData = NodeRenderer.createNode('Root', null);
    const rootNode = NodeRenderer.toCytoscapeNode(rootNodeData);
    rootNode.data.locked = false;
    rootNode.data.completed = false;

    const sampleData: TreeData = {
      version: '1.0',
      name: 'Sample Tree',
      nodes: [rootNode],
      edges: [],
    };

    await this.loadTree(sampleData);
  }

  async loadTree(treeData: TreeData) {
    if (!this.cy) return;

    const { NodeRenderer } = await import('./NodeRenderer');

    // Clear existing elements
    this.cy.elements().remove();

    // Convert nodes to Cytoscape format
    const cyNodes = treeData.nodes.map((node) => {
      const cyNode = { ...node };
      // Don't set positions - let layout handle it
      delete cyNode.position;
      return cyNode;
    });
    const cyEdges = treeData.edges;

    // Add elements to graph in batch
    this.cy.batch(() => {
      this.cy!.add(cyNodes);
      this.cy!.add(cyEdges);
    });

    // Recalculate lock states
    NodeRenderer.recalculateAllLockStates(this.cy);

    // Calculate subtree completions
    NodeRenderer.updateAllSubtreeCompletions(this.cy);

    // Apply layout
    await this.applyLayout(false);

    // Fit viewport after layout completes
    this.cy.fit(undefined, 50);

    // Trigger change callback
    if (this.onTreeChanged) {
      this.onTreeChanged();
    }
  }

  async applyLayout(animate = true): Promise<void> {
    if (!this.cy) return;

    // Stop any running layouts first
    this.cy.stop();

    const layout = this.cy.layout({
      name: 'dagre',
      // Dagre-specific options for tree layout
      rankDir: 'TB', // Top to bottom
      nodeSep: 80, // Horizontal separation between nodes
      rankSep: 120, // Vertical separation between ranks
      animate: animate,
      animationDuration: 800,
      animationEasing: 'ease-out',
      fit: true,
      padding: 50,
      // Node dimensions (helps with spacing)
      nodeDimensionsIncludeLabels: true,
    });

    layout.run();

    // Return a promise that resolves when layout completes
    return new Promise((resolve) => {
      if (animate) {
        layout.on('layoutstop', () => resolve());
      } else {
        resolve();
      }
    });
  }

  async addChildNode(parentNode: NodeSingular): Promise<NodeData | null> {
    if (!parentNode || !this.cy) {
      console.error('No parent node provided');
      return null;
    }

    const { NodeRenderer } = await import('./NodeRenderer');

    const parentId = parentNode.id();

    // Inherit parent's icon data
    const parentIconData = parentNode.data('iconData');
    const newNodeData = NodeRenderer.createNode('New Skill', parentId, parentIconData);

    // Get parent position for initial placement
    const parentPos = parentNode.position();
    const childrenCount = this.cy.nodes().filter((n) => n.data('parentId') === parentId).length;

    // Convert to Cytoscape node
    const cyNode = NodeRenderer.toCytoscapeNode(newNodeData);
    cyNode.position = {
      x: parentPos.x + childrenCount * 100, // Spread horizontally
      y: parentPos.y + 150, // Place below parent
    };

    this.cy.add(cyNode);
    this.cy.add(NodeRenderer.createEdge(parentId, newNodeData.id));

    // Update lock states
    NodeRenderer.recalculateAllLockStates(this.cy);

    // Re-layout with animation
    await this.applyLayout(true);

    // Trigger change callback
    if (this.onTreeChanged) {
      this.onTreeChanged();
    }

    return newNodeData;
  }

  async deleteNode(nodeId: string) {
    if (!this.cy) return;

    const { NodeRenderer } = await import('./NodeRenderer');

    const node = this.cy.getElementById(nodeId);
    if (!node.length) return;

    // Get all descendants
    const descendants = NodeRenderer.getAllDescendants(this.cy, nodeId);

    // Remove descendants
    descendants.forEach((descId) => {
      this.cy!.getElementById(descId).remove();
    });

    // Remove the node itself
    node.remove();

    // Re-layout
    await this.applyLayout();

    // Trigger change callback
    if (this.onTreeChanged) {
      this.onTreeChanged();
    }
  }

  async updateNode(nodeId: string, updates: Partial<CytoscapeNodeData>) {
    if (!this.cy) return;

    const { NodeRenderer } = await import('./NodeRenderer');

    const node = this.cy.getElementById(nodeId);
    if (!node.length) return;

    // Update node data
    Object.keys(updates).forEach((key) => {
      node.data(key, updates[key as keyof CytoscapeNodeData]);
    });

    // If color changed, propagate to all descendants
    if ('iconData' in updates && updates.iconData?.color) {
      const descendants = NodeRenderer.getAllDescendants(this.cy, nodeId);
      descendants.forEach((descId) => {
        const descNode = this.cy!.getElementById(descId);
        if (descNode.length) {
          const descIconData = descNode.data('iconData') || { type: 'emoji', icon: '', color: '#6366f1' };
          descNode.data('iconData', {
            ...descIconData,
            color: updates.iconData!.color,
          });
        }
      });
    }

    // If completion, iconData, or weight changed, update subtree completions
    if ('completed' in updates || 'iconData' in updates || 'weight' in updates) {
      NodeRenderer.updateChildrenLockState(this.cy, nodeId);
      NodeRenderer.updateAllSubtreeCompletions(this.cy);
    }

    // Trigger change callback
    if (this.onTreeChanged) {
      this.onTreeChanged();
    }
  }

  async reparentNode(nodeId: string, newParentId: string): Promise<boolean> {
    if (!this.cy) return false;

    const { NodeRenderer } = await import('./NodeRenderer');

    // Validate
    const validation = NodeRenderer.validateReparent(this.cy, nodeId, newParentId);
    if (!validation.valid) {
      console.error('Reparent validation failed:', validation.error);
      return false;
    }

    const node = this.cy.getElementById(nodeId);
    const oldParentId = node.data('parentId');

    // Remove old edge
    if (oldParentId) {
      this.cy.edges(`[source="${oldParentId}"][target="${nodeId}"]`).remove();
    }

    // Update node parent
    node.data('parentId', newParentId);

    // Update prerequisites
    const newPrereqs = [newParentId];
    node.data('prerequisites', newPrereqs);

    // Add new edge
    this.cy.add(NodeRenderer.createEdge(newParentId, nodeId));

    // Recalculate lock states
    NodeRenderer.recalculateAllLockStates(this.cy);

    // Re-layout
    await this.applyLayout();

    // Trigger change callback
    if (this.onTreeChanged) {
      this.onTreeChanged();
    }

    return true;
  }

  getTreeData(): TreeData {
    if (!this.cy) {
      return {
        version: '1.0',
        name: 'Empty Tree',
        nodes: [],
        edges: [],
      };
    }

    const nodes: CytoscapeNode[] = [];
    const edges: CytoscapeEdge[] = [];

    this.cy.nodes().forEach((node) => {
      nodes.push({
        group: 'nodes',
        data: {
          id: node.id(),
          label: node.data('label'),
          description: node.data('description') || '',
          completed: node.data('completed') || false,
          locked: node.data('locked') || false,
          parentId: node.data('parentId') || null,
          prerequisites: node.data('prerequisites') || [],
          iconData: node.data('iconData') || null,
          weight: node.data('weight') || 1,
          subtreeCompletion: node.data('subtreeCompletion') || 0,
          subtreeProgress: node.data('subtreeProgress') || { completed: 0, total: 0 },
          metadata: node.data('metadata') || {},
        },
      });
    });

    this.cy.edges().forEach((edge) => {
      edges.push({
        group: 'edges',
        data: {
          id: edge.id(),
          source: edge.data('source'),
          target: edge.data('target'),
        },
      });
    });

    return {
      version: '1.0',
      name: 'Current Tree',
      nodes,
      edges,
    };
  }

  getSubtreeData(nodeId: string): TreeData | null {
    if (!this.cy) return null;

    const { NodeRenderer } = require('./NodeRenderer');

    const node = this.cy.getElementById(nodeId);
    if (!node.length) return null;

    const descendants = NodeRenderer.getAllDescendants(this.cy, nodeId);
    const subtreeNodeIds = [nodeId, ...descendants];

    const nodes: CytoscapeNode[] = [];
    const edges: CytoscapeEdge[] = [];

    subtreeNodeIds.forEach((id) => {
      const n = this.cy!.getElementById(id);
      if (n.length) {
        nodes.push({
          group: 'nodes',
          data: {
            id: n.id(),
            label: n.data('label'),
            description: n.data('description') || '',
            completed: n.data('completed') || false,
            locked: n.data('locked') || false,
            parentId: n.data('parentId') || null,
            prerequisites: n.data('prerequisites') || [],
            iconData: n.data('iconData') || null,
            weight: n.data('weight') || 1,
            subtreeCompletion: n.data('subtreeCompletion') || 0,
            subtreeProgress: n.data('subtreeProgress') || { completed: 0, total: 0 },
            metadata: n.data('metadata') || {},
          },
        });
      }
    });

    // Get edges between subtree nodes
    this.cy.edges().forEach((edge) => {
      const source = edge.data('source');
      const target = edge.data('target');

      if (subtreeNodeIds.includes(source) && subtreeNodeIds.includes(target)) {
        edges.push({
          group: 'edges',
          data: {
            id: edge.id(),
            source: source,
            target: target,
          },
        });
      }
    });

    return {
      version: '1.0',
      name: 'Subtree',
      nodes,
      edges,
    };
  }

  // Navigation methods
  panToNode(nodeId: string) {
    if (!this.cy) return;

    const node = this.cy.getElementById(nodeId);
    if (node.length) {
      this.cy.animate({
        center: { eles: node },
        zoom: 1.5,
        duration: 500,
        easing: 'ease-out',
      });
    }
  }

  zoomIn() {
    if (!this.cy) return;
    this.cy.zoom(this.cy.zoom() * 1.2);
    this.cy.center();
  }

  zoomOut() {
    if (!this.cy) return;
    this.cy.zoom(this.cy.zoom() * 0.8);
    this.cy.center();
  }

  fit() {
    if (!this.cy) return;
    this.cy.fit(undefined, 50);
  }

  resetView() {
    if (!this.cy) return;
    this.cy.reset();
  }

  // Highlighting
  highlightNodeAndChildren(node: NodeSingular) {
    if (!this.cy) return;

    // Clear previous highlights
    this.clearAllHighlights();

    // Dynamic import for NodeRenderer
    import('./NodeRenderer').then(({ NodeRenderer }) => {
      // Get all descendants
      const descendants = NodeRenderer.getAllDescendants(this.cy!, node.id());

      // Highlight the selected node
      node.data('_selected', true);

      // Highlight all descendants
      descendants.forEach((descId) => {
        const descNode = this.cy!.getElementById(descId);
        if (descNode.length) {
          descNode.data('_childHighlight', true);
        }
      });
    });
  }

  clearAllHighlights() {
    if (!this.cy) return;

    this.cy.nodes().forEach((node) => {
      node.data('_selected', false);
      node.data('_childHighlight', false);
    });
  }

  // Persistence
  saveViewport() {
    if (!this.cy || typeof window === 'undefined') return;

    const viewport = {
      zoom: this.cy.zoom(),
      pan: this.cy.pan(),
    };
    localStorage.setItem('skill_tree_viewport', JSON.stringify(viewport));
  }

  restoreViewport() {
    if (!this.cy || typeof window === 'undefined') return;

    const viewportData = localStorage.getItem('skill_tree_viewport');
    if (viewportData) {
      try {
        const viewport = JSON.parse(viewportData);
        this.cy.zoom(viewport.zoom);
        this.cy.pan(viewport.pan);
      } catch (e) {
        console.error('Error restoring viewport:', e);
      }
    }
  }

  clearTree() {
    if (this.cy) {
      this.cy.elements().remove();
      if (this.onTreeChanged) {
        this.onTreeChanged();
      }
    }
  }

  async newTree(rootLabel = 'Root Skill') {
    if (!this.cy) return;

    const { NodeRenderer } = await import('./NodeRenderer');

    this.clearTree();

    const rootNodeData = NodeRenderer.createNode(rootLabel, null);
    rootNodeData.locked = false;
    rootNodeData.completed = false;

    const cyNode = NodeRenderer.toCytoscapeNode(rootNodeData);
    this.cy.add(cyNode);

    await this.applyLayout();

    if (this.onTreeChanged) {
      this.onTreeChanged();
    }
  }

  getSelectedNode(): NodeSingular | null {
    return this.selectedNode;
  }

  getCytoscapeInstance(): Core | null {
    return this.cy;
  }

  destroy() {
    if (this.cy) {
      this.cy.destroy();
      this.cy = null;
    }
  }
}
