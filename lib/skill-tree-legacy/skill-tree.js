/**
 * skill-tree.js - Core SkillTree class managing Cytoscape instance
 */

class SkillTree {
    constructor(containerId) {
        this.containerId = containerId;
        this.cy = null;
        this.selectedNode = null;
        this.isDragging = false;
        this.init();
    }

    /**
     * Initialize Cytoscape instance
     */
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('Container not found:', this.containerId);
            return;
        }

        // Create Cytoscape instance
        this.cy = cytoscape({
            container: container,
            elements: [],
            style: ThemeManager.getCytoscapeStyle(),
            layout: {
                name: 'preset'
            },
            minZoom: 0.3,
            maxZoom: 3,
            wheelSensitivity: 0.2,
            selectionType: 'single',
            boxSelectionEnabled: false
        });

        this.setupEventListeners();
        this.loadSampleTree();
    }

    /**
     * Setup event listeners for Cytoscape
     */
    setupEventListeners() {
        // Node tap/click
        this.cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            this.selectedNode = node;
            this.highlightNodeAndChildren(node);
            this.openDetailPanel(node);
        });

        // Right-click on node
        this.cy.on('cxttap', 'node', (evt) => {
            evt.preventDefault();
            const node = evt.target;
            this.selectedNode = node;
            this.showContextMenu(evt.originalEvent, node);
        });

        // Right-click on canvas (show canvas context menu)
        this.cy.on('cxttap', (evt) => {
            if (evt.target === this.cy) {
                evt.preventDefault();
                this.showContextMenu(evt.originalEvent, null);
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
        let draggedNode = null;
        let potentialParent = null;

        this.cy.on('grab', 'node', (evt) => {
            this.isDragging = true;
            draggedNode = evt.target;
        });

        this.cy.on('drag', 'node', (evt) => {
            if (!draggedNode) return;

            // Find node under cursor
            const draggedPos = draggedNode.position();
            const nodesUnderCursor = this.cy.nodes().filter(node => {
                if (node.id() === draggedNode.id()) return false;
                const pos = node.position();
                const distance = Math.sqrt(
                    Math.pow(pos.x - draggedPos.x, 2) +
                    Math.pow(pos.y - draggedPos.y, 2)
                );
                return distance < 40; // Within 40px
            });

            // Clear previous highlight
            if (potentialParent) {
                potentialParent.removeClass('potential-parent');
            }

            // Highlight potential parent
            if (nodesUnderCursor.length > 0) {
                potentialParent = nodesUnderCursor[0];
                potentialParent.addClass('potential-parent');
            } else {
                potentialParent = null;
            }
        });

        this.cy.on('free', 'node', (evt) => {
            this.isDragging = false;

            // Attempt reparenting if dropped on another node
            if (draggedNode && potentialParent) {
                const success = this.reparentNode(draggedNode.id(), potentialParent.id());
                if (success) {
                    UIControls.showToast('Node reparented successfully', 'success');
                }
            }

            // Clear highlights
            if (potentialParent) {
                potentialParent.removeClass('potential-parent');
            }

            draggedNode = null;
            potentialParent = null;
            this.saveViewport();
        });

        // Listen for theme changes
        window.addEventListener('themeChanged', () => {
            this.updateCytoscapeTheme();
        });

        // Close context menu on canvas click
        this.cy.on('tap', (evt) => {
            if (evt.target === this.cy) {
                UIControls.hideContextMenu();
            }
        });

        // Node hover effects - grow on hover
        this.cy.on('mouseover', 'node', (evt) => {
            const node = evt.target;
            node.data('_hover', true);
        });

        this.cy.on('mouseout', 'node', (evt) => {
            const node = evt.target;
            node.data('_hover', false);
        });
    }

    /**
     * Update Cytoscape theme/styles
     */
    updateCytoscapeTheme() {
        if (this.cy) {
            this.cy.style(ThemeManager.getCytoscapeStyle());
        }
    }

    /**
     * Load sample tree on initialization
     */
    loadSampleTree() {
        const sampleData = {
            nodes: [
                NodeRenderer.createNode('Root', null),
            ],
            edges: []
        };

        // Create single root node
        const rootNode = sampleData.nodes[0];
        rootNode.locked = false;
        rootNode.completed = false;

        this.loadTree(sampleData);
    }

    /**
     * Load tree data into Cytoscape
     */
    loadTree(treeData) {
        if (!this.cy) return;

        // Clear existing elements
        this.cy.elements().remove();

        // Convert nodes to Cytoscape format (without positions)
        const cyNodes = treeData.nodes.map(node => {
            const cyNode = NodeRenderer.toCytoscapeNode(node);
            // Don't set positions - let dagre handle it
            delete cyNode.position;
            return cyNode;
        });
        const cyEdges = treeData.edges;

        // Add elements to graph in batch for better performance
        this.cy.batch(() => {
            this.cy.add(cyNodes);
            this.cy.add(cyEdges);
        });

        // Recalculate lock states
        NodeRenderer.recalculateAllLockStates(this.cy);

        // Calculate subtree completions
        NodeRenderer.updateAllSubtreeCompletions(this.cy);

        // Apply layout without animation on initial load for immediate positioning
        this.applyLayout(false).then(() => {
            // Fit viewport after layout completes
            this.cy.fit(null, 50);
        });

        // Update progress
        // Global progress bar removed - progress now shown per-node in detail panel
        // NodeRenderer.updateProgressBar(this.cy);

        // Save to localStorage
        this.autoSave();
    }

    /**
     * Apply multi-directional radial layout using built-in cose
     */
    applyLayout(animate = true) {
        if (!this.cy) return;

        // Stop any running layouts first
        this.cy.stop();

        const layout = this.cy.layout({
            name: 'cose',
            // Animation
            animate: animate,
            animationDuration: 800,
            animationEasing: 'ease-out',
            // Separation and forces
            idealEdgeLength: 120,
            nodeOverlap: 20,
            refresh: 20,
            // Randomization & iterations
            randomize: false,
            componentSpacing: 100,
            nodeRepulsion: 400000,
            edgeElasticity: 100,
            nestingFactor: 5,
            gravity: 80,
            numIter: 1000,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0,
            // Layout boundaries
            fit: true,
            padding: 50
        });

        layout.run();

        // Return a promise that resolves when layout completes
        return new Promise(resolve => {
            if (animate) {
                layout.on('layoutstop', () => resolve());
            } else {
                resolve();
            }
        });
    }

    /**
     * Add a new child node to a parent
     */
    addChildNode(parentNode) {
        if (!parentNode) {
            console.error('No parent node provided');
            return;
        }

        const parentId = parentNode.id();

        // Inherit parent's icon data
        const parentIconData = parentNode.data('iconData');
        const newNode = NodeRenderer.createNode('New Skill', parentId, parentIconData);

        // Get parent position for initial placement
        const parentPos = parentNode.position();
        const childrenCount = this.cy.nodes().filter(n => n.data('parentId') === parentId).length;

        // Add to Cytoscape with initial position offset from parent
        const cyNode = NodeRenderer.toCytoscapeNode(newNode);
        cyNode.position = {
            x: parentPos.x + (childrenCount * 100), // Spread horizontally
            y: parentPos.y + 150 // Place below parent
        };

        this.cy.add(cyNode);
        this.cy.add(NodeRenderer.createEdge(parentId, newNode.id));

        // Update lock states
        NodeRenderer.recalculateAllLockStates(this.cy);

        // Re-layout with animation
        this.applyLayout(true);

        // Update progress
        // Global progress bar removed - progress now shown per-node in detail panel
        // NodeRenderer.updateProgressBar(this.cy);

        // Auto-save
        this.autoSave();

        return newNode;
    }

    /**
     * Delete a node and all its descendants
     */
    deleteNode(nodeId) {
        const node = this.cy.getElementById(nodeId);
        if (!node.length) return;

        // Get all descendants
        const descendants = NodeRenderer.getAllDescendants(this.cy, nodeId);

        // Remove descendants
        descendants.forEach(descId => {
            this.cy.getElementById(descId).remove();
        });

        // Remove the node itself
        node.remove();

        // Re-layout
        this.applyLayout();

        // Update progress
        // Global progress bar removed - progress now shown per-node in detail panel
        // NodeRenderer.updateProgressBar(this.cy);

        // Auto-save
        this.autoSave();
    }

    /**
     * Update node data
     */
    updateNode(nodeId, updates) {
        const node = this.cy.getElementById(nodeId);
        if (!node.length) return;

        // Update node data
        Object.keys(updates).forEach(key => {
            node.data(key, updates[key]);
        });

        // If completion, iconData, or weight changed, update subtree completions
        if ('completed' in updates || 'iconData' in updates || 'weight' in updates) {
            NodeRenderer.updateChildrenLockState(this.cy, nodeId);
            NodeRenderer.updateAllSubtreeCompletions(this.cy);
        }

        // Update progress
        // Global progress bar removed - progress now shown per-node in detail panel
        // NodeRenderer.updateProgressBar(this.cy);

        // Auto-save
        this.autoSave();
    }

    /**
     * Reparent a node to a new parent
     */
    reparentNode(nodeId, newParentId) {
        // Validate
        const validation = NodeRenderer.validateReparent(this.cy, nodeId, newParentId);
        if (!validation.valid) {
            alert(validation.error);
            return false;
        }

        const node = this.cy.getElementById(nodeId);
        const oldParentId = node.data('parentId');

        // Remove old edge
        if (oldParentId) {
            this.cy.edges(`[source="${oldParentId}"][target="${nodeId}"]`).remove();
        }

        // Update node parent
        node.data('parent', newParentId);

        // Update prerequisites
        const newPrereqs = [newParentId];
        node.data('prerequisites', newPrereqs);

        // Add new edge
        this.cy.add(NodeRenderer.createEdge(newParentId, nodeId));

        // Recalculate lock states
        NodeRenderer.recalculateAllLockStates(this.cy);

        // Re-layout
        this.applyLayout();

        // Auto-save
        this.autoSave();

        return true;
    }

    /**
     * Get tree data for export
     */
    getTreeData() {
        const nodes = [];
        const edges = [];

        this.cy.nodes().forEach(node => {
            nodes.push({
                id: node.id(),
                label: node.data('label'),
                description: node.data('description') || '',
                completed: node.data('completed') || false,
                locked: node.data('locked') || false,
                parent: node.data('parentId') || null,
                prerequisites: node.data('prerequisites') || [],
                iconData: node.data('iconData') || null,
                weight: node.data('weight') || 1,
                subtreeCompletion: node.data('subtreeCompletion') || 0,
                subtreeProgress: node.data('subtreeProgress') || { completed: 0, total: 0 },
                metadata: node.data('metadata') || {}
            });
        });

        this.cy.edges().forEach(edge => {
            edges.push({
                group: 'edges',
                data: {
                    id: edge.id(),
                    source: edge.data('source'),
                    target: edge.data('target')
                }
            });
        });

        return { nodes, edges };
    }

    /**
     * Get subtree data for a specific node
     */
    getSubtreeData(nodeId) {
        const node = this.cy.getElementById(nodeId);
        if (!node.length) return null;

        const descendants = NodeRenderer.getAllDescendants(this.cy, nodeId);
        const subtreeNodeIds = [nodeId, ...descendants];

        const nodes = [];
        const edges = [];

        subtreeNodeIds.forEach(id => {
            const n = this.cy.getElementById(id);
            if (n.length) {
                nodes.push({
                    id: n.id(),
                    label: n.data('label'),
                    description: n.data('description') || '',
                    completed: n.data('completed') || false,
                    locked: n.data('locked') || false,
                    parent: n.data('parentId') || null,
                    prerequisites: n.data('prerequisites') || [],
                    iconData: n.data('iconData') || null,
                    weight: n.data('weight') || 1,
                    subtreeCompletion: n.data('subtreeCompletion') || 0,
                    subtreeProgress: n.data('subtreeProgress') || { completed: 0, total: 0 },
                    metadata: n.data('metadata') || {}
                });
            }
        });

        // Get edges between subtree nodes
        this.cy.edges().forEach(edge => {
            const source = edge.data('source');
            const target = edge.data('target');

            if (subtreeNodeIds.includes(source) && subtreeNodeIds.includes(target)) {
                edges.push({
                    group: 'edges',
                    data: {
                        id: edge.id(),
                        source: source,
                        target: target
                    }
                });
            }
        });

        return { nodes, edges };
    }

    /**
     * Pan to a specific node
     */
    panToNode(nodeId) {
        const node = this.cy.getElementById(nodeId);
        if (node.length) {
            this.cy.animate({
                center: { eles: node },
                zoom: 1.5,
                duration: 500,
                easing: 'ease-out'
            });
        }
    }

    /**
     * Zoom controls
     */
    zoomIn() {
        this.cy.zoom(this.cy.zoom() * 1.2);
        this.cy.center();
    }

    zoomOut() {
        this.cy.zoom(this.cy.zoom() * 0.8);
        this.cy.center();
    }

    fit() {
        this.cy.fit(null, 50);
    }

    resetView() {
        this.cy.reset();
    }

    /**
     * Highlight node and all its children
     */
    highlightNodeAndChildren(node) {
        // Clear previous highlights
        this.clearAllHighlights();

        // Get all descendants
        const descendants = NodeRenderer.getAllDescendants(this.cy, node.id());

        // Highlight the selected node
        node.data('_selected', true);

        // Highlight all descendants
        descendants.forEach(descId => {
            const descNode = this.cy.getElementById(descId);
            if (descNode.length) {
                descNode.data('_childHighlight', true);
            }
        });
    }

    /**
     * Clear all selection highlights
     */
    clearAllHighlights() {
        this.cy.nodes().forEach(node => {
            node.data('_selected', false);
            node.data('_childHighlight', false);
        });
    }

    /**
     * Save viewport state
     */
    saveViewport() {
        const viewport = {
            zoom: this.cy.zoom(),
            pan: this.cy.pan()
        };
        localStorage.setItem('skill_tree_viewport', JSON.stringify(viewport));
    }

    /**
     * Restore viewport state
     */
    restoreViewport() {
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

    /**
     * Auto-save to localStorage
     */
    autoSave() {
        const treeData = this.getTreeData();
        const saveData = {
            tree: treeData,
            lastModified: new Date().toISOString()
        };
        localStorage.setItem('skill_tree_current', JSON.stringify(saveData));
    }

    /**
     * Load from localStorage
     */
    loadFromStorage() {
        const savedData = localStorage.getItem('skill_tree_current');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.tree) {
                    this.loadTree(data.tree);
                    this.restoreViewport();
                    return true;
                }
            } catch (e) {
                console.error('Error loading from storage:', e);
            }
        }
        return false;
    }

    /**
     * Open detail panel for a node
     */
    openDetailPanel(node) {
        if (window.UIControls) {
            UIControls.openDetailPanel(node);
        }
    }

    /**
     * Show context menu for a node
     */
    showContextMenu(event, node) {
        if (window.UIControls) {
            UIControls.showContextMenu(event, node);
        }
    }

    /**
     * Clear the entire tree
     */
    clearTree() {
        if (this.cy) {
            this.cy.elements().remove();
            // Global progress bar removed - progress now shown per-node in detail panel
        // NodeRenderer.updateProgressBar(this.cy);
            this.autoSave();
        }
    }

    /**
     * Create a new tree with a root node
     */
    newTree(rootLabel = 'Root Skill') {
        this.clearTree();

        const rootNode = NodeRenderer.createNode(rootLabel, null);
        rootNode.locked = false;
        rootNode.completed = false;

        this.cy.add(NodeRenderer.toCytoscapeNode(rootNode));

        this.applyLayout();
        // Global progress bar removed - progress now shown per-node in detail panel
        // NodeRenderer.updateProgressBar(this.cy);
        this.autoSave();
    }
}
