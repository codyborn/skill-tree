/**
 * ui-controls.js - UI components, modals, context menus, detail panel
 */

const UIControls = {
    skillTree: null,
    currentNode: null,
    contextMenu: null,
    detailPanel: null,
    modal: null,

    init(skillTree) {
        this.skillTree = skillTree;
        this.contextMenu = document.getElementById('contextMenu');
        this.detailPanel = document.getElementById('detailPanel');
        this.modal = document.getElementById('modalOverlay');

        this.setupToolbarButtons();
        this.setupDetailPanel();
        this.setupContextMenu();
        this.setupModal();

        // Initialize icon picker
        if (window.IconPicker) {
            IconPicker.init();
        }
    },

    /**
     * Setup toolbar button event listeners
     */
    setupToolbarButtons() {
        // Import
        document.getElementById('importBtn')?.addEventListener('click', () => {
            if (window.DataManager) {
                DataManager.importTree();
            } else {
                this.showToast('Import feature coming in Phase 3', 'info');
            }
        });

        // Generate with AI
        document.getElementById('generateLLMBtn')?.addEventListener('click', () => {
            if (window.LLMPrompt) {
                LLMPrompt.showPromptTemplate();
            } else {
                this.showToast('AI prompt feature coming in Phase 5', 'info');
            }
        });

        // Permalink
        document.getElementById('permalinkBtn')?.addEventListener('click', () => {
            if (window.PermalinkManager) {
                PermalinkManager.generatePermalink(this.skillTree);
            } else {
                this.showToast('Permalink feature coming in Phase 4', 'info');
            }
        });

        // Import from URL
        document.getElementById('importURLBtn')?.addEventListener('click', () => {
            if (window.PermalinkManager) {
                PermalinkManager.showImportDialog(this.skillTree);
            } else {
                this.showToast('Import URL feature coming in Phase 4', 'info');
            }
        });

        // Help
        document.getElementById('helpButton')?.addEventListener('click', () => {
            this.showHelpDialog();
        });
    },

    /**
     * Setup detail panel controls
     */
    setupDetailPanel() {
        // Close buttons
        document.getElementById('closePanelBtn')?.addEventListener('click', () => {
            this.closeDetailPanel();
        });

        document.getElementById('closePanelBtn2')?.addEventListener('click', () => {
            this.closeDetailPanel();
        });

        // Add child button
        document.getElementById('addChildPanelBtn')?.addEventListener('click', () => {
            if (this.currentNode) {
                this.skillTree.addChildNode(this.currentNode);
                this.showToast('Child node added', 'success');
            }
        });

        // Icon picker button
        document.getElementById('iconPickerBtn')?.addEventListener('click', () => {
            if (this.currentNode && window.IconPicker) {
                IconPicker.open(this.currentNode);
            }
        });

        // Auto-save on label change
        const labelField = document.getElementById('nodeLabel');
        labelField?.addEventListener('input', (e) => {
            if (this.currentNode) {
                this.skillTree.updateNode(this.currentNode.id(), {
                    label: e.target.value
                });
            }
        });

        // Auto-save on description change and update preview
        const descriptionField = document.getElementById('nodeDescription');
        descriptionField?.addEventListener('input', (e) => {
            this.updateDescriptionPreview(e.target.value);
            if (this.currentNode) {
                this.skillTree.updateNode(this.currentNode.id(), {
                    description: e.target.value
                });
            }
        });

        // Auto-save on completion toggle
        const completedCheckbox = document.getElementById('nodeCompleted');
        completedCheckbox?.addEventListener('change', (e) => {
            if (this.currentNode) {
                this.skillTree.updateNode(this.currentNode.id(), {
                    completed: e.target.checked
                });
                // Update progress display after completion change
                this.updateNodeProgress(this.currentNode);
            }
        });

        // Auto-save on weight change
        const weightField = document.getElementById('nodeWeight');
        weightField?.addEventListener('input', (e) => {
            if (this.currentNode) {
                const weight = parseInt(e.target.value) || 1;
                this.skillTree.updateNode(this.currentNode.id(), {
                    weight: weight
                });
                // Update progress display after weight change
                this.updateNodeProgress(this.currentNode);
            }
        });
    },

    /**
     * Setup context menu
     */
    setupContextMenu() {
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.contextMenu && !this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideContextMenu();
                this.closeDetailPanel();
                this.closeModal();
            }
        });

        // Context menu item clicks
        this.contextMenu?.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = item.dataset.action;
                this.handleContextMenuAction(action);
                this.hideContextMenu();
            });
        });
    },

    /**
     * Setup modal controls
     */
    setupModal() {
        document.getElementById('closeModalBtn')?.addEventListener('click', () => {
            this.closeModal();
        });

        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    },

    /**
     * Show context menu at position
     */
    showContextMenu(event, node) {
        this.currentNode = node;

        if (!this.contextMenu) return;

        // Position menu at cursor
        this.contextMenu.style.left = event.clientX + 'px';
        this.contextMenu.style.top = event.clientY + 'px';
        this.contextMenu.classList.remove('hidden');

        // Show/hide items based on whether it's a node or canvas context menu
        const nodeItems = this.contextMenu.querySelectorAll('.context-menu-item:not(.canvas-only), .context-menu-divider:not(.canvas-only)');
        const canvasItems = this.contextMenu.querySelectorAll('.canvas-only');

        if (node) {
            // Node context menu - show node items, hide canvas items
            nodeItems.forEach(item => item.style.display = '');
            canvasItems.forEach(item => item.style.display = 'none');

            // Update toggle complete text based on node state
            const toggleItem = this.contextMenu.querySelector('[data-action="toggle-complete"]');
            if (toggleItem) {
                const isCompleted = node.data('completed');
                toggleItem.querySelector('.menu-icon').textContent = isCompleted ? '○' : '✓';
                toggleItem.childNodes[1].textContent = isCompleted ? ' Mark Incomplete' : ' Mark Complete';
            }
        } else {
            // Canvas context menu - hide node items, show canvas items
            nodeItems.forEach(item => item.style.display = 'none');
            canvasItems.forEach(item => item.style.display = '');
        }
    },

    /**
     * Hide context menu
     */
    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.classList.add('hidden');
        }
    },

    /**
     * Handle context menu actions
     */
    handleContextMenuAction(action) {
        // Canvas actions (don't require a node)
        if (action === 'new-tree') {
            this.showNewTreeDialog();
            return;
        }

        if (action === 'export-tree') {
            if (window.DataManager) {
                DataManager.exportTree(this.skillTree);
            } else {
                this.showToast('Export feature not available', 'error');
            }
            return;
        }

        // Node actions (require a node)
        if (!this.currentNode) return;

        switch (action) {
            case 'add-child':
                this.skillTree.addChildNode(this.currentNode);
                this.showToast('Child node added', 'success');
                break;

            case 'edit':
                this.openDetailPanel(this.currentNode);
                break;

            case 'toggle-complete':
                const currentState = this.currentNode.data('completed');
                this.skillTree.updateNode(this.currentNode.id(), {
                    completed: !currentState
                });
                this.showToast(
                    !currentState ? 'Marked as complete' : 'Marked as incomplete',
                    'success'
                );
                break;

            case 'export-subtree':
                if (window.DataManager) {
                    DataManager.exportSubtree(this.skillTree, this.currentNode.id());
                } else {
                    this.showToast('Export subtree coming in Phase 3', 'info');
                }
                break;

            case 'delete':
                this.showDeleteConfirmation(this.currentNode);
                break;
        }
    },

    /**
     * Open detail panel for a node
     */
    openDetailPanel(node) {
        if (!this.detailPanel) return;

        this.currentNode = node;

        // Populate fields
        document.getElementById('nodeLabel').value = node.data('label') || '';
        document.getElementById('nodeDescription').value = node.data('description') || '';
        document.getElementById('nodeCompleted').checked = node.data('completed') || false;
        document.getElementById('nodeWeight').value = node.data('weight') || 1;

        // Update progress bar
        this.updateNodeProgress(node);

        // Update icon display
        const iconData = node.data('iconData');
        const iconDisplay = document.getElementById('nodeIconDisplay');
        if (iconDisplay) {
            if (!iconData || !iconData.icon) {
                // No icon - show node text
                iconDisplay.textContent = node.data('label') || 'No Icon';
                iconDisplay.style.background = '#6366f1'; // Default color
                iconDisplay.style.fontSize = '12px';
                iconDisplay.style.padding = '0.5rem';
            } else if (iconData.type === 'emoji') {
                iconDisplay.textContent = iconData.icon;
                iconDisplay.innerHTML = iconData.icon;
                iconDisplay.style.background = iconData.color;
                iconDisplay.style.fontSize = '24px';
                iconDisplay.style.padding = '0';
            } else {
                iconDisplay.innerHTML = `<img src="${iconData.icon}" style="width:100%;height:100%;object-fit:cover;border-radius:0.5rem;" alt="Icon">`;
                iconDisplay.style.background = iconData.color;
                iconDisplay.style.padding = '0';
            }
        }

        // Update prerequisites list
        this.updatePrerequisitesList(node);

        // Update description preview
        this.updateDescriptionPreview(node.data('description') || '');

        // Show panel
        this.detailPanel.classList.remove('hidden');
    },

    /**
     * Close detail panel
     */
    closeDetailPanel() {
        if (this.detailPanel) {
            this.detailPanel.classList.add('hidden');
            this.currentNode = null;
        }
    },

    /**
     * Save node details from panel
     */
    saveNodeDetails() {
        if (!this.currentNode) return;

        const label = document.getElementById('nodeLabel').value;
        const description = document.getElementById('nodeDescription').value;
        const completed = document.getElementById('nodeCompleted').checked;

        this.skillTree.updateNode(this.currentNode.id(), {
            label,
            description,
            completed
        });

        this.showToast('Node updated', 'success');
        this.closeDetailPanel();
    },

    /**
     * Update image preview
     */
    updateImagePreview(imageUrl) {
        const container = document.getElementById('nodeImageContainer');
        const img = document.getElementById('nodeImage');

        if (imageUrl && imageUrl.trim()) {
            img.src = imageUrl;
            container.style.display = 'flex';
        } else {
            container.style.display = 'none';
        }
    },

    /**
     * Update prerequisites list
     */
    updatePrerequisitesList(node) {
        const list = document.getElementById('prerequisitesList');
        if (!list) return;

        const prerequisites = node.data('prerequisites') || [];

        if (prerequisites.length === 0) {
            list.innerHTML = '<em style="color: var(--text-muted);">No prerequisites</em>';
            return;
        }

        list.innerHTML = '';
        prerequisites.forEach(prereqId => {
            const prereqNode = this.skillTree.cy.getElementById(prereqId);
            if (prereqNode.length) {
                const item = document.createElement('div');
                item.className = 'prerequisite-item';
                item.textContent = prereqNode.data('label');
                item.addEventListener('click', () => {
                    this.skillTree.panToNode(prereqId);
                    NodeRenderer.highlightNode(this.skillTree.cy, prereqId);
                });
                list.appendChild(item);
            }
        });
    },

    /**
     * Update description preview with markdown
     */
    updateDescriptionPreview(markdown) {
        const preview = document.getElementById('descriptionPreview');
        if (!preview) return;

        if (markdown && markdown.trim()) {
            try {
                // Render markdown using marked.js
                const rawHtml = marked.parse(markdown);
                // Sanitize with DOMPurify
                const cleanHtml = DOMPurify.sanitize(rawHtml);
                preview.innerHTML = cleanHtml;
                preview.style.display = 'block';
            } catch (error) {
                console.error('Markdown rendering error:', error);
                // Fallback to plain text
                preview.innerHTML = markdown.replace(/\n/g, '<br>');
                preview.style.display = 'block';
            }
        } else {
            preview.style.display = 'none';
        }
    },

    /**
     * Update node progress bar
     */
    updateNodeProgress(node) {
        const progressFill = document.getElementById('nodeProgressFill');
        const progressText = document.getElementById('nodeProgressText');

        if (!progressFill || !progressText) return;

        const subtreeProgress = node.data('subtreeProgress') || { completed: 0, total: 0 };
        const percentage = subtreeProgress.total > 0
            ? Math.round((subtreeProgress.completed / subtreeProgress.total) * 100)
            : 0;

        progressFill.style.width = percentage + '%';
        progressText.textContent = `${percentage}% (${subtreeProgress.completed}/${subtreeProgress.total})`;
    },

    /**
     * Show new tree dialog
     */
    showNewTreeDialog() {
        const confirmed = confirm('Create a new skill tree? This will clear the current tree.');
        if (confirmed) {
            const rootName = prompt('Enter the root skill name:', 'Root Skill');
            if (rootName) {
                this.skillTree.newTree(rootName);
                this.showToast('New tree created', 'success');
            }
        }
    },

    /**
     * Show delete confirmation
     */
    showDeleteConfirmation(node) {
        const descendants = NodeRenderer.getAllDescendants(this.skillTree.cy, node.id());
        const count = descendants.length + 1;

        const message = count > 1
            ? `Delete "${node.data('label')}" and ${descendants.length} descendant nodes?`
            : `Delete "${node.data('label')}"?`;

        const confirmed = confirm(message);
        if (confirmed) {
            this.skillTree.deleteNode(node.id());
            this.showToast('Node deleted', 'success');
            this.closeDetailPanel();
        }
    },

    /**
     * Show help dialog
     */
    showHelpDialog() {
        const helpContent = `
            <div style="line-height: 1.8;">
                <h3 style="margin-bottom: 1rem; color: var(--accent-primary);">How to Use</h3>
                <ul style="margin-left: 1.5rem;">
                    <li><strong>Click a node</strong> to view/edit details</li>
                    <li><strong>Right-click a node</strong> for more options</li>
                    <li><strong>Drag nodes</strong> to rearrange the tree</li>
                    <li><strong>Add child nodes</strong> via right-click menu</li>
                    <li><strong>Mark nodes complete</strong> to track progress</li>
                    <li><strong>Export/Import</strong> to save and share trees</li>
                </ul>

                <h3 style="margin: 1.5rem 0 1rem; color: var(--accent-primary);">Keyboard Shortcuts</h3>
                <ul style="margin-left: 1.5rem;">
                    <li><strong>ESC</strong> - Close panels and menus</li>
                    <li><strong>Mouse Wheel</strong> - Zoom in/out</li>
                </ul>
            </div>
        `;

        this.showModal('Help', helpContent, [
            { label: 'Close', primary: true, action: () => this.closeModal() }
        ]);
    },

    /**
     * Show modal with custom content
     */
    showModal(title, content, buttons = []) {
        if (!this.modal) return;

        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalContent').innerHTML = content;

        const footer = document.getElementById('modalFooter');
        footer.innerHTML = '';

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.label;
            button.className = btn.primary ? 'button-primary' : 'button-secondary';
            button.addEventListener('click', btn.action);
            footer.appendChild(button);
        });

        this.modal.classList.remove('hidden');
    },

    /**
     * Close modal
     */
    closeModal() {
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};

// Expose to global scope
window.UIControls = UIControls;
