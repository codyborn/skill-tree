/**
 * data-manager.js - Import/export, validation, localStorage management
 */

const DataManager = {
    /**
     * Export tree to JSON file
     */
    exportTree(skillTree) {
        const treeData = skillTree.getTreeData();
        const exportData = this.createExportFormat(treeData, 'My Skill Tree');

        this.downloadJSON(exportData, 'skill-tree.json');
        UIControls.showToast('Tree exported successfully', 'success');
    },

    /**
     * Export subtree to JSON file
     */
    exportSubtree(skillTree, nodeId) {
        const subtreeData = skillTree.getSubtreeData(nodeId);
        if (!subtreeData) {
            UIControls.showToast('Failed to export subtree', 'error');
            return;
        }

        const node = skillTree.cy.getElementById(nodeId);
        const nodeName = node.data('label') || 'Subtree';
        const exportData = this.createExportFormat(subtreeData, nodeName + ' Subtree');

        this.downloadJSON(exportData, `subtree-${this.sanitizeFilename(nodeName)}.json`);
        UIControls.showToast('Subtree exported successfully', 'success');
    },

    /**
     * Import tree from JSON file
     */
    importTree() {
        const fileInput = document.getElementById('fileInput');
        if (!fileInput) return;

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    this.processImportedTree(data);
                } catch (error) {
                    console.error('Import error:', error);
                    UIControls.showToast('Invalid JSON file', 'error');
                }
            };
            reader.readAsText(file);

            // Reset input so same file can be imported again
            fileInput.value = '';
        };

        fileInput.click();
    },

    /**
     * Process imported tree data
     */
    processImportedTree(data) {
        // Validate the data
        const validation = this.validateTreeData(data);
        if (!validation.valid) {
            UIControls.showToast('Invalid tree data: ' + validation.error, 'error');
            return;
        }

        // Show import options
        this.showImportOptions(data);
    },

    /**
     * Show import options dialog
     */
    showImportOptions(data) {
        const content = `
            <div style="margin-bottom: 1rem;">
                <p style="margin-bottom: 1rem;">
                    Importing: <strong>${data.name || 'Skill Tree'}</strong>
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                    ${data.description || 'No description'}
                </p>
                <p style="color: var(--text-muted); font-size: 0.875rem;">
                    Nodes: ${data.nodes?.length || 0} |
                    Edges: ${data.edges?.length || 0}
                </p>
            </div>
            <div style="margin-top: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                    Import Options:
                </label>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <label class="checkbox-label">
                        <input type="radio" name="importMode" value="replace" checked>
                        <span>Replace current tree</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="radio" name="importMode" value="merge">
                        <span>Merge with current tree</span>
                    </label>
                </div>
            </div>
            <div style="margin-top: 1rem;">
                <label class="checkbox-label">
                    <input type="checkbox" id="resetCompletion" checked>
                    <span>Reset all nodes to incomplete</span>
                </label>
            </div>
        `;

        UIControls.showModal('Import Skill Tree', content, [
            {
                label: 'Import',
                primary: true,
                action: () => {
                    const mode = document.querySelector('input[name="importMode"]:checked')?.value || 'replace';
                    const resetCompletion = document.getElementById('resetCompletion')?.checked || false;
                    this.executeImport(data, mode, resetCompletion);
                    UIControls.closeModal();
                }
            },
            {
                label: 'Cancel',
                primary: false,
                action: () => UIControls.closeModal()
            }
        ]);
    },

    /**
     * Execute the import
     */
    executeImport(data, mode, resetCompletion) {
        // Reset completion if requested
        if (resetCompletion) {
            data.nodes.forEach(node => {
                node.completed = false;
            });
        }

        if (mode === 'replace') {
            // Replace current tree
            window.skillTree.loadTree(data);
            UIControls.showToast('Tree imported successfully', 'success');
        } else if (mode === 'merge') {
            // Merge with current tree
            this.mergeTree(data);
            UIControls.showToast('Trees merged successfully', 'success');
        }
    },

    /**
     * Merge imported tree with current tree
     */
    mergeTree(importedData) {
        const currentData = window.skillTree.getTreeData();

        // Assign new IDs to imported nodes to avoid conflicts
        const idMap = {};
        importedData.nodes.forEach(node => {
            const newId = NodeRenderer.generateId();
            idMap[node.id] = newId;
            node.id = newId;
        });

        // Update references in imported nodes
        importedData.nodes.forEach(node => {
            if (node.parentId && idMap[node.parentId]) {
                node.parentId = idMap[node.parentId];
            }
            if (node.prerequisites) {
                node.prerequisites = node.prerequisites.map(id => idMap[id] || id);
            }
        });

        // Update edges
        importedData.edges.forEach(edge => {
            if (edge.data) {
                if (idMap[edge.data.source]) edge.data.source = idMap[edge.data.source];
                if (idMap[edge.data.target]) edge.data.target = idMap[edge.data.target];
                edge.data.id = `edge_${edge.data.source}_${edge.data.target}`;
            }
        });

        // Merge nodes and edges
        const mergedData = {
            nodes: [...currentData.nodes, ...importedData.nodes],
            edges: [...currentData.edges, ...importedData.edges]
        };

        window.skillTree.loadTree(mergedData);
    },

    /**
     * Create export format
     */
    createExportFormat(treeData, name = 'Skill Tree') {
        return {
            version: '1.0',
            name: name,
            description: '',
            root: treeData.nodes.find(n => !n.parent)?.id || null,
            nodes: treeData.nodes,
            edges: treeData.edges,
            metadata: {
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            }
        };
    },

    /**
     * Validate tree data structure
     */
    validateTreeData(data) {
        if (!data) {
            return { valid: false, error: 'No data provided' };
        }

        if (!Array.isArray(data.nodes)) {
            return { valid: false, error: 'Missing or invalid nodes array' };
        }

        if (!Array.isArray(data.edges)) {
            return { valid: false, error: 'Missing or invalid edges array' };
        }

        // Validate each node has required fields
        for (const node of data.nodes) {
            if (!node.id) {
                return { valid: false, error: 'Node missing id field' };
            }
            if (!node.label) {
                return { valid: false, error: 'Node missing label field' };
            }
        }

        return { valid: true };
    },

    /**
     * Download JSON data as file
     */
    downloadJSON(data, filename) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    },

    /**
     * Sanitize filename
     */
    sanitizeFilename(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    },

    /**
     * Load sample tree
     */
    async loadSampleTree(treeName) {
        try {
            const response = await fetch('data/sample-trees.json');
            const data = await response.json();

            const sampleTree = data.trees.find(t => t.id === treeName || t.name === treeName);
            if (!sampleTree) {
                UIControls.showToast('Sample tree not found', 'error');
                return;
            }

            this.showImportOptions(sampleTree);
        } catch (error) {
            console.error('Error loading sample tree:', error);
            UIControls.showToast('Failed to load sample tree', 'error');
        }
    },

    /**
     * Show sample tree library
     */
    async showSampleLibrary() {
        try {
            const response = await fetch('data/sample-trees.json');
            const data = await response.json();

            let content = '<div style="display: flex; flex-direction: column; gap: 1rem;">';

            data.trees.forEach(tree => {
                content += `
                    <div style="padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md); cursor: pointer;"
                         onclick="DataManager.loadSampleTree('${tree.id}')">
                        <h3 style="margin: 0 0 0.5rem 0; color: var(--accent-primary);">
                            ${tree.name}
                        </h3>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem;">
                            ${tree.description}
                        </p>
                        <p style="margin: 0.5rem 0 0 0; color: var(--text-muted); font-size: 0.75rem;">
                            ${tree.nodes.length} nodes
                        </p>
                    </div>
                `;
            });

            content += '</div>';

            UIControls.showModal('Sample Trees', content, [
                {
                    label: 'Close',
                    primary: true,
                    action: () => UIControls.closeModal()
                }
            ]);
        } catch (error) {
            console.error('Error loading sample library:', error);
            UIControls.showToast('Failed to load sample library', 'error');
        }
    },

    /**
     * Save tree to library
     */
    saveToLibrary(skillTree, name) {
        const library = this.getLibrary();
        const treeData = skillTree.getTreeData();

        const entry = {
            id: NodeRenderer.generateId(),
            name: name,
            tree: this.createExportFormat(treeData, name),
            thumbnail: null,
            created: new Date().toISOString()
        };

        library.push(entry);
        localStorage.setItem('skill_tree_library', JSON.stringify(library));

        UIControls.showToast('Saved to library', 'success');
    },

    /**
     * Get tree library from localStorage
     */
    getLibrary() {
        const libraryData = localStorage.getItem('skill_tree_library');
        return libraryData ? JSON.parse(libraryData) : [];
    },

    /**
     * Show user's tree library
     */
    showUserLibrary() {
        const library = this.getLibrary();

        if (library.length === 0) {
            UIControls.showToast('No saved trees in library', 'info');
            return;
        }

        let content = '<div style="display: flex; flex-direction: column; gap: 1rem;">';

        library.forEach(entry => {
            content += `
                <div style="padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h3 style="margin: 0 0 0.5rem 0; color: var(--accent-primary);">
                                ${entry.name}
                            </h3>
                            <p style="margin: 0; color: var(--text-muted); font-size: 0.75rem;">
                                Saved: ${new Date(entry.created).toLocaleDateString()}
                            </p>
                        </div>
                        <button class="button-primary" style="padding: 0.5rem 1rem;"
                                onclick="DataManager.loadFromLibrary('${entry.id}')">
                            Load
                        </button>
                    </div>
                </div>
            `;
        });

        content += '</div>';

        UIControls.showModal('My Trees', content, [
            {
                label: 'Close',
                primary: true,
                action: () => UIControls.closeModal()
            }
        ]);
    },

    /**
     * Load tree from library
     */
    loadFromLibrary(entryId) {
        const library = this.getLibrary();
        const entry = library.find(e => e.id === entryId);

        if (!entry) {
            UIControls.showToast('Tree not found in library', 'error');
            return;
        }

        this.processImportedTree(entry.tree);
        UIControls.closeModal();
    }
};

// Expose to global scope
window.DataManager = DataManager;
