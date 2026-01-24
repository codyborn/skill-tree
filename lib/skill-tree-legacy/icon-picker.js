/**
 * icon-picker.js - Icon and color picker for nodes
 */

const IconPicker = {
    modal: null,
    currentNode: null,
    selectedIcon: '🎮',
    selectedColor: '#6366f1',
    selectedType: 'emoji',

    init() {
        this.modal = document.getElementById('iconPickerModal');
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.icon-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Color swatch selection
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                this.selectColor(e.target.dataset.color);
            });
        });

        // Custom color picker
        document.getElementById('customColorPicker')?.addEventListener('change', (e) => {
            this.selectColor(e.target.value);
        });

        // Emoji selection
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectEmoji(e.target.dataset.emoji);
            });
        });

        // Custom image URL
        document.getElementById('customImageURL')?.addEventListener('input', (e) => {
            this.previewCustomImage(e.target.value);
        });

        // Modal buttons
        document.getElementById('saveIconBtn')?.addEventListener('click', () => {
            this.save();
        });

        document.getElementById('cancelIconBtn')?.addEventListener('click', () => {
            this.close();
        });

        document.getElementById('closeIconPickerBtn')?.addEventListener('click', () => {
            this.close();
        });

        // Remove icon button
        document.getElementById('removeIconBtn')?.addEventListener('click', () => {
            this.removeIcon();
        });

        // Close on overlay click
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    },

    switchTab(tabName) {
        // Update tabs
        document.querySelectorAll('.icon-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update content
        document.querySelectorAll('.icon-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });

        this.selectedType = tabName;
    },

    selectColor(color) {
        this.selectedColor = color;

        // Update UI
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.toggle('selected', swatch.dataset.color === color);
        });

        // Update custom color picker
        const customPicker = document.getElementById('customColorPicker');
        if (customPicker) {
            customPicker.value = color;
        }

        // Update icon display preview
        const iconDisplay = document.getElementById('nodeIconDisplay');
        if (iconDisplay) {
            iconDisplay.style.background = color;
        }
    },

    selectEmoji(emoji) {
        this.selectedIcon = emoji;
        this.selectedType = 'emoji';

        // Update UI
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.emoji === emoji);
        });

        // Update icon display preview
        const iconDisplay = document.getElementById('nodeIconDisplay');
        if (iconDisplay) {
            iconDisplay.textContent = emoji;
        }
    },

    previewCustomImage(url) {
        const preview = document.getElementById('customImagePreview');
        if (!preview) return;

        if (url) {
            preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.style.display='none'">`;
            this.selectedIcon = url;
            this.selectedType = 'custom';
        } else {
            preview.innerHTML = '';
        }
    },

    open(node) {
        if (!this.modal) return;

        this.currentNode = node;

        // Load current node icon/color
        const nodeData = node.data();
        const iconData = nodeData.iconData;

        // Default values if no icon data exists
        this.selectedType = iconData ? iconData.type : 'emoji';
        this.selectedIcon = iconData ? iconData.icon : '';
        this.selectedColor = iconData ? iconData.color : '#6366f1';

        // Update UI to reflect current values
        this.selectColor(this.selectedColor);

        if (iconData && iconData.type === 'emoji' && iconData.icon) {
            this.selectEmoji(iconData.icon);
            this.switchTab('emoji');
        } else if (iconData && iconData.type === 'custom' && iconData.icon) {
            document.getElementById('customImageURL').value = iconData.icon;
            this.previewCustomImage(iconData.icon);
            this.switchTab('custom');
        } else {
            // No icon - show emoji tab by default
            this.switchTab('emoji');
        }

        // Update icon display
        const iconDisplay = document.getElementById('nodeIconDisplay');
        if (iconDisplay) {
            if (!iconData || !iconData.icon) {
                iconDisplay.textContent = node.data('label') || 'No Icon';
                iconDisplay.style.background = this.selectedColor;
                iconDisplay.style.fontSize = '12px';
                iconDisplay.style.padding = '0.5rem';
            } else if (iconData.type === 'emoji') {
                iconDisplay.textContent = iconData.icon;
                iconDisplay.style.background = iconData.color;
                iconDisplay.style.fontSize = '24px';
                iconDisplay.style.padding = '0';
            } else {
                iconDisplay.innerHTML = `<img src="${iconData.icon}" style="width:100%;height:100%;object-fit:cover;" alt="Icon">`;
                iconDisplay.style.background = iconData.color;
                iconDisplay.style.padding = '0';
            }
        }

        // Show modal
        this.modal.classList.remove('hidden');
    },

    close() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            this.currentNode = null;
        }
    },

    removeIcon() {
        if (!this.currentNode) return;

        // Set iconData to null to remove icon
        window.skillTree.updateNode(this.currentNode.id(), {
            iconData: null
        });

        // Update icon display in detail panel
        const iconDisplay = document.getElementById('nodeIconDisplay');
        if (iconDisplay) {
            iconDisplay.textContent = '';
            iconDisplay.innerHTML = '';
            iconDisplay.style.background = '#6366f1'; // Default background
        }

        // Re-apply layout to update display
        window.skillTree.applyLayout(false);

        this.close();
        UIControls.showToast('Icon removed', 'success');
    },

    save() {
        if (!this.currentNode) return;

        // Get icon data
        const iconData = {
            type: this.selectedType,
            icon: this.selectedIcon,
            color: this.selectedColor
        };

        // Update node
        window.skillTree.updateNode(this.currentNode.id(), {
            iconData: iconData
        });

        // Update icon display in detail panel
        const iconDisplay = document.getElementById('nodeIconDisplay');
        if (iconDisplay) {
            if (iconData.type === 'emoji') {
                iconDisplay.textContent = iconData.icon;
            } else {
                iconDisplay.innerHTML = `<img src="${iconData.icon}" style="width:100%;height:100%;object-fit:cover;border-radius:0.5rem;" alt="Icon">`;
            }
            iconDisplay.style.background = iconData.color;
        }

        // Re-apply layout to update colors
        window.skillTree.applyLayout(false);

        this.close();
        UIControls.showToast('Icon updated', 'success');
    }
};

// Expose to global scope
window.IconPicker = IconPicker;
