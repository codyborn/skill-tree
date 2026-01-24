/**
 * node-renderer.js - Node styling and completion state rendering
 */

const NodeRenderer = {
    /**
     * Create a new node data object
     */
    createNode(label, parentId = null, iconData = null) {
        return {
            id: this.generateId(),
            label: label || 'New Node',
            description: '',
            completed: false,
            locked: parentId ? true : false, // Root nodes unlocked, children locked
            parent: parentId,
            prerequisites: parentId ? [parentId] : [],
            iconData: iconData || null, // No default icon, starts blank
            weight: parentId ? 1 : 5, // Root nodes get weight 5, children get 1
            subtreeCompletion: 0,
            subtreeProgress: { completed: 0, total: 0 },
            metadata: {}
        };
    },

    /**
     * Generate a unique ID for a node
     */
    generateId() {
        return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Convert node data to Cytoscape format
     * NOTE: We don't use Cytoscape's compound nodes (parent property) because
     * it interferes with layout algorithms. We only use edges for hierarchy.
     */
    toCytoscapeNode(nodeData) {
        return {
            group: 'nodes',
            data: {
                id: nodeData.id,
                label: nodeData.label,
                description: nodeData.description || '',
                completed: nodeData.completed || false,
                locked: nodeData.locked || false,
                // Store parent in metadata for reference, but don't use Cytoscape's parent property
                parentId: nodeData.parent || null,
                prerequisites: nodeData.prerequisites || [],
                iconData: nodeData.iconData || null,
                weight: nodeData.weight || 1,
                subtreeCompletion: nodeData.subtreeCompletion || 0,
                subtreeProgress: nodeData.subtreeProgress || { completed: 0, total: 0 },
                metadata: nodeData.metadata || {}
            }
        };
    },

    /**
     * Create an edge between two nodes
     */
    createEdge(fromId, toId) {
        return {
            group: 'edges',
            data: {
                id: `edge_${fromId}_${toId}`,
                source: fromId,
                target: toId
            }
        };
    },

    /**
     * Update node's completion state and check for unlocks
     */
    updateNodeCompletion(cy, nodeId, completed) {
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
    updateChildrenLockState(cy, nodeId) {
        // Find all nodes that have this node as a prerequisite
        cy.nodes().forEach(node => {
            const prerequisites = node.data('prerequisites') || [];

            if (prerequisites.length > 0) {
                // Check if all prerequisites are completed
                const allCompleted = prerequisites.every(prereqId => {
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
    recalculateAllLockStates(cy) {
        cy.nodes().forEach(node => {
            const prerequisites = node.data('prerequisites') || [];

            if (prerequisites.length === 0) {
                // No prerequisites means unlocked
                node.data('locked', false);
            } else {
                // Check if all prerequisites are completed
                const allCompleted = prerequisites.every(prereqId => {
                    const prereqNode = cy.getElementById(prereqId);
                    return prereqNode.length && prereqNode.data('completed');
                });
                node.data('locked', !allCompleted);
            }
        });
    },

    /**
     * Add completion indicator (checkmark) to completed nodes
     * This will be handled by CSS and node styling in Cytoscape
     */
    applyCompletionStyles(cy) {
        // Completed nodes get special styling via the stylesheet
        // The getCytoscapeStyle in themes.js handles this
        cy.nodes('[?completed]').forEach(node => {
            // Could add additional styling or overlays here if needed
        });
    },

    /**
     * Validate that reparenting doesn't create circular references
     */
    validateReparent(cy, nodeId, newParentId) {
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
    getAllDescendants(cy, nodeId) {
        const descendants = [];
        const queue = [nodeId];

        while (queue.length > 0) {
            const currentId = queue.shift();
            const children = cy.nodes().filter(node =>
                node.data('parentId') === currentId
            );

            children.forEach(child => {
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
    getAllAncestors(cy, nodeId) {
        const ancestors = [];
        let currentId = nodeId;

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
    highlightNode(cy, nodeId) {
        cy.elements().removeClass('highlighted');

        const node = cy.getElementById(nodeId);
        if (!node.length) return;

        node.addClass('highlighted');
        node.connectedEdges().addClass('highlighted');
    },

    /**
     * Clear all highlights
     */
    clearHighlights(cy) {
        cy.elements().removeClass('highlighted');
    },

    /**
     * Calculate completion percentage for the tree
     */
    calculateProgress(cy) {
        const allNodes = cy.nodes();
        const totalNodes = allNodes.length;

        if (totalNodes === 0) return 0;

        const completedNodes = allNodes.filter(node => node.data('completed')).length;
        return Math.round((completedNodes / totalNodes) * 100);
    },

    /**
     * Update progress bar in UI
     */
    updateProgressBar(cy) {
        const progress = this.calculateProgress(cy);
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressFill) {
            progressFill.style.width = progress + '%';

            // Update ARIA attribute
            const progressBar = progressFill.parentElement;
            if (progressBar) {
                progressBar.setAttribute('aria-valuenow', progress);
            }
        }

        if (progressText) {
            progressText.textContent = progress + '% Complete';
        }
    },

    /**
     * Calculate subtree completion for a node (weighted by difficulty)
     */
    calculateSubtreeCompletion(cy, nodeId) {
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
        descendants.forEach(descId => {
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
            total: totalWeight
        });

        return completion;
    },

    /**
     * Update subtree completion for all nodes
     */
    updateAllSubtreeCompletions(cy) {
        cy.nodes().forEach(node => {
            const completion = this.calculateSubtreeCompletion(cy, node.id());
            node.data('subtreeCompletion', completion);
        });
    }
};

// Expose to global scope
window.NodeRenderer = NodeRenderer;
