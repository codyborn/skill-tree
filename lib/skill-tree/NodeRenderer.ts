/**
 * NodeRenderer.ts - Node styling and completion state rendering
 * Converted to TypeScript
 */

import type { Core, NodeSingular } from 'cytoscape';
import type {
  NodeData,
  CytoscapeNode,
  CytoscapeEdge,
  IconData,
} from '@/types/skill-tree';

export const NodeRenderer = {
  /**
   * Create a new node data object
   */
  createNode(label: string, parentId: string | null = null, iconData: IconData | null = null): NodeData {
    return {
      id: this.generateId(),
      label: label || '',
      description: '',
      completed: false,
      locked: parentId ? true : false, // Root nodes unlocked, children locked
      parent: parentId,
      prerequisites: parentId ? [parentId] : [],
      iconData: iconData || (parentId === null ? { type: 'emoji', icon: '', color: '#8b5cf6' } : null),
      weight: parentId ? 1 : 5, // Root nodes get weight 5, children get 1
      subtreeCompletion: 0,
      subtreeProgress: { completed: 0, total: 0 },
      metadata: {},
    };
  },

  /**
   * Generate a unique ID for a node
   */
  generateId(): string {
    return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Convert node data to Cytoscape format
   */
  toCytoscapeNode(nodeData: NodeData): CytoscapeNode {
    return {
      group: 'nodes',
      data: {
        id: nodeData.id,
        label: nodeData.label,
        description: nodeData.description || '',
        completed: nodeData.completed || false,
        locked: nodeData.locked || false,
        parentId: nodeData.parent || null,
        prerequisites: nodeData.prerequisites || [],
        iconData: nodeData.iconData || null,
        weight: nodeData.weight || 1,
        subtreeCompletion: nodeData.subtreeCompletion || 0,
        subtreeProgress: nodeData.subtreeProgress || { completed: 0, total: 0 },
        metadata: nodeData.metadata || {},
      },
    };
  },

  /**
   * Create an edge between two nodes
   */
  createEdge(fromId: string, toId: string): CytoscapeEdge {
    return {
      group: 'edges',
      data: {
        id: `edge_${fromId}_${toId}`,
        source: fromId,
        target: toId,
      },
    };
  },

  /**
   * Update node's completion state and check for unlocks
   */
  updateNodeCompletion(cy: Core, nodeId: string, completed: boolean): NodeSingular | undefined {
    const node = cy.getElementById(nodeId);
    if (!node.length) return;

    // Update the node
    node.data('completed', completed);

    // Check if any children can be unlocked
    this.updateChildrenLockState(cy, nodeId);

    return node;
  },

  /**
   * Update lock state of children based on prerequisites
   */
  updateChildrenLockState(cy: Core, nodeId: string): void {
    // Find all nodes that have this node as a prerequisite
    cy.nodes().forEach((node) => {
      const prerequisites = node.data('prerequisites') || [];

      if (prerequisites.length > 0) {
        // Check if all prerequisites are completed
        const allCompleted = prerequisites.every((prereqId: string) => {
          const prereqNode = cy.getElementById(prereqId);
          return prereqNode.length && prereqNode.data('completed');
        });

        // Update locked state
        node.data('locked', !allCompleted);
      }
    });
  },

  /**
   * Recalculate all node lock states based on prerequisites
   */
  recalculateAllLockStates(cy: Core): void {
    cy.nodes().forEach((node) => {
      const prerequisites = node.data('prerequisites') || [];

      if (prerequisites.length === 0) {
        // No prerequisites means unlocked
        node.data('locked', false);
      } else {
        // Check if all prerequisites are completed
        const allCompleted = prerequisites.every((prereqId: string) => {
          const prereqNode = cy.getElementById(prereqId);
          return prereqNode.length && prereqNode.data('completed');
        });
        node.data('locked', !allCompleted);
      }
    });
  },

  /**
   * Apply completion styles
   */
  applyCompletionStyles(cy: Core): void {
    // Completed nodes get special styling via the stylesheet
    // The getCytoscapeStyle in themes.ts handles this
    cy.nodes('[?completed]').forEach((node) => {
      // Could add additional styling or overlays here if needed
    });
  },

  /**
   * Validate that reparenting doesn't create circular references
   */
  validateReparent(
    cy: Core,
    nodeId: string,
    newParentId: string
  ): { valid: boolean; error?: string } {
    if (nodeId === newParentId) {
      return { valid: false, error: 'Cannot parent a node to itself' };
    }

    // Check if newParent is a descendant of node (would create cycle)
    const descendants = this.getAllDescendants(cy, nodeId);
    if (descendants.includes(newParentId)) {
      return { valid: false, error: 'Cannot create circular reference' };
    }

    return { valid: true };
  },

  /**
   * Get all descendants of a node
   */
  getAllDescendants(cy: Core, nodeId: string): string[] {
    const descendants: string[] = [];
    const queue: string[] = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = cy.nodes().filter((node) => node.data('parentId') === currentId);

      children.forEach((child) => {
        const childId = child.id();
        descendants.push(childId);
        queue.push(childId);
      });
    }

    return descendants;
  },

  /**
   * Get all ancestors of a node
   */
  getAllAncestors(cy: Core, nodeId: string): string[] {
    const ancestors: string[] = [];
    let currentId: string | null = nodeId;

    while (currentId) {
      const node = cy.getElementById(currentId);
      if (!node.length) break;

      const parentId = node.data('parentId');
      if (parentId) {
        ancestors.push(parentId);
        currentId = parentId;
      } else {
        break;
      }
    }

    return ancestors;
  },

  /**
   * Highlight a node and its connections
   */
  highlightNode(cy: Core, nodeId: string): void {
    cy.elements().removeClass('highlighted');

    const node = cy.getElementById(nodeId);
    if (!node.length) return;

    node.addClass('highlighted');
    node.connectedEdges().addClass('highlighted');
  },

  /**
   * Clear all highlights
   */
  clearHighlights(cy: Core): void {
    cy.elements().removeClass('highlighted');
  },

  /**
   * Calculate completion percentage for the tree
   */
  calculateProgress(cy: Core): number {
    const allNodes = cy.nodes();
    const totalNodes = allNodes.length;

    if (totalNodes === 0) return 0;

    const completedNodes = allNodes.filter((node) => node.data('completed')).length;
    return Math.round((completedNodes / totalNodes) * 100);
  },

  /**
   * Calculate subtree completion for a node (weighted by difficulty)
   */
  calculateSubtreeCompletion(cy: Core, nodeId: string): number {
    const node = cy.getElementById(nodeId);
    if (!node.length) return 0;

    // Get all descendants
    const descendants = this.getAllDescendants(cy, nodeId);

    // Calculate weighted completion
    let completedWeight = 0;
    let totalWeight = 0;

    // Add this node's weight
    const nodeWeight = node.data('weight') || 1;
    totalWeight += nodeWeight;
    if (node.data('completed')) {
      completedWeight += nodeWeight;
    }

    // Add descendants' weights
    descendants.forEach((descId) => {
      const descNode = cy.getElementById(descId);
      if (descNode.length) {
        const descWeight = descNode.data('weight') || 1;
        totalWeight += descWeight;
        if (descNode.data('completed')) {
          completedWeight += descWeight;
        }
      }
    });

    const completion = totalWeight > 0 ? completedWeight / totalWeight : 0;

    // Store progress data for display
    node.data('subtreeProgress', {
      completed: completedWeight,
      total: totalWeight,
    });

    return completion;
  },

  /**
   * Update subtree completion for all nodes
   */
  updateAllSubtreeCompletions(cy: Core): void {
    cy.nodes().forEach((node) => {
      const completion = this.calculateSubtreeCompletion(cy, node.id());
      node.data('subtreeCompletion', completion);
    });
  },
};
