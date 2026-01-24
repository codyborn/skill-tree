/**
 * permalink.js - URL encoding/decoding with compression for sharing
 */

const PermalinkManager = {
    /**
     * Generate permalink for current tree
     */
    generatePermalink(skillTree) {
        try {
            const treeData = skillTree.getTreeData();
            const exportData = DataManager.createExportFormat(treeData, 'Shared Skill Tree');

            // Serialize to JSON
            const jsonStr = JSON.stringify(exportData);

            // Compress using LZ-String
            const compressed = LZString.compressToEncodedURIComponent(jsonStr);

            // Generate URL
            const baseUrl = window.location.origin + window.location.pathname;
            const permalink = `${baseUrl}?tree=${compressed}`;

            // Show modal with permalink
            this.showPermalinkModal(permalink);
        } catch (error) {
            console.error('Error generating permalink:', error);
            UIControls.showToast('Failed to generate permalink', 'error');
        }
    },

    /**
     * Show permalink modal with copy button
     */
    showPermalinkModal(permalink) {
        const content = `
            <div style="margin-bottom: 1rem;">
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                    Share this link to let others view and import your skill tree:
                </p>
                <div style="position: relative;">
                    <textarea
                        id="permalinkText"
                        readonly
                        style="width: 100%; padding: 0.75rem; font-family: monospace; font-size: 0.875rem;
                               background: var(--bg-tertiary); border: 1px solid var(--border-color);
                               border-radius: var(--radius-md); resize: vertical; min-height: 100px;"
                    >${permalink}</textarea>
                </div>
                <p style="margin-top: 1rem; color: var(--text-muted); font-size: 0.75rem;">
                    Link size: ${this.formatBytes(permalink.length)}
                </p>
            </div>
        `;

        UIControls.showModal('Share Skill Tree', content, [
            {
                label: 'Copy to Clipboard',
                primary: true,
                action: () => {
                    this.copyToClipboard(permalink);
                }
            },
            {
                label: 'Close',
                primary: false,
                action: () => UIControls.closeModal()
            }
        ]);

        // Auto-select the text
        setTimeout(() => {
            const textarea = document.getElementById('permalinkText');
            if (textarea) {
                textarea.select();
            }
        }, 100);
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            UIControls.showToast('Link copied to clipboard!', 'success');
        } catch (error) {
            console.error('Failed to copy:', error);

            // Fallback method
            const textarea = document.getElementById('permalinkText');
            if (textarea) {
                textarea.select();
                document.execCommand('copy');
                UIControls.showToast('Link copied to clipboard!', 'success');
            } else {
                UIControls.showToast('Failed to copy link', 'error');
            }
        }
    },

    /**
     * Load tree from URL parameter
     */
    loadFromURL(skillTree) {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const compressed = urlParams.get('tree');

            if (!compressed) {
                return false;
            }

            // Decompress
            const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);

            if (!jsonStr) {
                UIControls.showToast('Invalid or corrupted share link', 'error');
                return false;
            }

            // Parse JSON
            const treeData = JSON.parse(jsonStr);

            // Validate
            const validation = DataManager.validateTreeData(treeData);
            if (!validation.valid) {
                UIControls.showToast('Invalid tree data in link', 'error');
                return false;
            }

            // Show import options
            DataManager.showImportOptions(treeData);

            // Clean URL after loading
            window.history.replaceState({}, document.title, window.location.pathname);

            return true;
        } catch (error) {
            console.error('Error loading from URL:', error);
            UIControls.showToast('Failed to load tree from link', 'error');
            return false;
        }
    },

    /**
     * Show import from URL dialog
     */
    showImportDialog(skillTree) {
        const content = `
            <div style="margin-bottom: 1rem;">
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                    Paste a skill tree share link below to import it:
                </p>
                <textarea
                    id="importURLText"
                    placeholder="https://..."
                    style="width: 100%; padding: 0.75rem; font-family: monospace; font-size: 0.875rem;
                           background: var(--bg-tertiary); border: 1px solid var(--border-color);
                           border-radius: var(--radius-md); resize: vertical; min-height: 120px;"
                ></textarea>
            </div>
        `;

        UIControls.showModal('Import from URL', content, [
            {
                label: 'Import',
                primary: true,
                action: () => {
                    const url = document.getElementById('importURLText')?.value.trim();
                    if (url) {
                        this.importFromURL(url, skillTree);
                    } else {
                        UIControls.showToast('Please enter a URL', 'error');
                    }
                }
            },
            {
                label: 'Cancel',
                primary: false,
                action: () => UIControls.closeModal()
            }
        ]);

        // Focus the textarea
        setTimeout(() => {
            document.getElementById('importURLText')?.focus();
        }, 100);
    },

    /**
     * Import tree from pasted URL
     */
    importFromURL(url, skillTree) {
        try {
            // Parse the URL
            const urlObj = new URL(url);
            const compressed = urlObj.searchParams.get('tree');

            if (!compressed) {
                UIControls.showToast('No tree data found in URL', 'error');
                return;
            }

            // Decompress
            const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);

            if (!jsonStr) {
                UIControls.showToast('Failed to decompress tree data', 'error');
                return;
            }

            // Parse JSON
            const treeData = JSON.parse(jsonStr);

            // Validate
            const validation = DataManager.validateTreeData(treeData);
            if (!validation.valid) {
                UIControls.showToast('Invalid tree data: ' + validation.error, 'error');
                return;
            }

            // Close the import dialog
            UIControls.closeModal();

            // Show import options
            setTimeout(() => {
                this.showImportOptionsWithAttach(treeData, skillTree);
            }, 100);

        } catch (error) {
            console.error('Error importing from URL:', error);
            UIControls.showToast('Failed to import from URL', 'error');
        }
    },

    /**
     * Show import options with subtree attachment option
     */
    showImportOptionsWithAttach(data, skillTree) {
        const hasNodes = skillTree.cy.nodes().length > 0;

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
                    ${hasNodes ? `
                        <label class="checkbox-label">
                            <input type="radio" name="importMode" value="merge">
                            <span>Merge with current tree</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="radio" name="importMode" value="attach">
                            <span>Attach as subtree to selected node</span>
                        </label>
                    ` : ''}
                </div>
            </div>
            ${hasNodes ? `
                <div id="attachOptions" style="margin-top: 1rem; display: none;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                        Select parent node:
                    </label>
                    <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.5rem;">
                        Click a node in the tree, then click Import.
                    </p>
                    <div id="selectedNodeDisplay" style="padding: 0.75rem; background: var(--bg-tertiary);
                                                         border-radius: var(--radius-md); font-size: 0.875rem;">
                        No node selected
                    </div>
                </div>
            ` : ''}
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

                    if (mode === 'attach') {
                        if (!skillTree.selectedNode) {
                            UIControls.showToast('Please select a parent node first', 'error');
                            return;
                        }
                        this.attachSubtree(data, skillTree, skillTree.selectedNode.id(), resetCompletion);
                    } else {
                        DataManager.executeImport(data, mode, resetCompletion);
                    }

                    UIControls.closeModal();
                }
            },
            {
                label: 'Cancel',
                primary: false,
                action: () => UIControls.closeModal()
            }
        ]);

        // Show/hide attach options based on radio selection
        if (hasNodes) {
            document.querySelectorAll('input[name="importMode"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    const attachOptions = document.getElementById('attachOptions');
                    if (attachOptions) {
                        attachOptions.style.display = e.target.value === 'attach' ? 'block' : 'none';
                    }
                });
            });

            // Update selected node display when a node is clicked
            const updateSelectedDisplay = () => {
                const display = document.getElementById('selectedNodeDisplay');
                if (display && skillTree.selectedNode) {
                    display.textContent = `Selected: ${skillTree.selectedNode.data('label')}`;
                    display.style.color = 'var(--accent-primary)';
                } else if (display) {
                    display.textContent = 'No node selected';
                    display.style.color = 'var(--text-muted)';
                }
            };

            // Listen for node selection
            const oldListener = skillTree.cy._private.listeners.find(l => l.type === 'tap');
            skillTree.cy.on('tap', 'node', updateSelectedDisplay);
        }
    },

    /**
     * Attach imported tree as subtree to a parent node
     */
    attachSubtree(importedData, skillTree, parentNodeId, resetCompletion) {
        try {
            // Reset completion if requested
            if (resetCompletion) {
                importedData.nodes.forEach(node => {
                    node.completed = false;
                });
            }

            // Find the root node of the imported tree
            const importedRoot = importedData.nodes.find(n => !n.parent);
            if (!importedRoot) {
                UIControls.showToast('Imported tree has no root node', 'error');
                return;
            }

            // Assign new IDs to avoid conflicts
            const idMap = {};
            importedData.nodes.forEach(node => {
                const newId = NodeRenderer.generateId();
                idMap[node.id] = newId;
            });

            // Update imported nodes with new IDs and set parent for root
            importedData.nodes.forEach(node => {
                const newId = idMap[node.id];
                node.id = newId;

                // Update parent references
                if (node.parentId && idMap[node.parentId]) {
                    node.parentId = idMap[node.parentId];
                } else if (node.parentId === importedRoot.id) {
                    // This is a direct child of the imported root
                }

                // Update prerequisites
                if (node.prerequisites) {
                    node.prerequisites = node.prerequisites.map(id => idMap[id] || id);
                }
            });

            // Set the imported root's parent to the selected node
            const newRootId = idMap[importedRoot.id];
            const newRoot = importedData.nodes.find(n => n.id === newRootId);
            if (newRoot) {
                newRoot.parent = parentNodeId;
                newRoot.prerequisites = [parentNodeId];
            }

            // Update edges
            importedData.edges.forEach(edge => {
                if (edge.data) {
                    if (idMap[edge.data.source]) edge.data.source = idMap[edge.data.source];
                    if (idMap[edge.data.target]) edge.data.target = idMap[edge.data.target];
                    edge.data.id = `edge_${edge.data.source}_${edge.data.target}`;
                }
            });

            // Add edge from parent to imported root
            importedData.edges.push({
                group: 'edges',
                data: {
                    id: `edge_${parentNodeId}_${newRootId}`,
                    source: parentNodeId,
                    target: newRootId
                }
            });

            // Merge with current tree
            const currentData = skillTree.getTreeData();
            const mergedData = {
                nodes: [...currentData.nodes, ...importedData.nodes],
                edges: [...currentData.edges, ...importedData.edges]
            };

            skillTree.loadTree(mergedData);
            UIControls.showToast('Subtree attached successfully', 'success');

        } catch (error) {
            console.error('Error attaching subtree:', error);
            UIControls.showToast('Failed to attach subtree', 'error');
        }
    },

    /**
     * Format bytes to human readable string
     */
    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
};

// Expose to global scope
window.PermalinkManager = PermalinkManager;
