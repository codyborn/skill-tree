/**
 * themes.js - Theme management for light/dark mode
 */

const ThemeManager = {
    currentTheme: 'light',

    init() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('skill_tree_theme') || 'light';
        this.setTheme(savedTheme, false);
        this.setupEventListeners();
    },

    setupEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    },

    setTheme(theme, save = true) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);

        // Update toggle button icon
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }

        // Save to localStorage
        if (save) {
            localStorage.setItem('skill_tree_theme', theme);
        }

        // Dispatch event for other components (e.g., Cytoscape styles)
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    },

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    },

    // Get current theme colors for Cytoscape
    getCytoscapeStyle() {
        const isDark = this.currentTheme === 'dark';

        return [
            {
                selector: 'node',
                style: {
                    'background-color': (node) => {
                        const iconData = node.data('iconData') || { color: '#6366f1' };
                        const completion = node.data('subtreeCompletion') || 0;
                        // Brighten color based on completion
                        const color = iconData.color;
                        return this.adjustColorBrightness(color, 0.3 + (completion * 0.7));
                    },
                    'background-opacity': (node) => {
                        const locked = node.data('locked');
                        return locked ? 0.4 : 1;
                    },
                    'border-color': (node) => {
                        const iconData = node.data('iconData') || { color: '#6366f1' };
                        const completed = node.data('completed');
                        return completed ? '#fbbf24' : this.adjustColorBrightness(iconData.color, 1.2);
                    },
                    'border-width': (node) => node.data('completed') ? 6 : 4,
                    'label': (node) => {
                        const iconData = node.data('iconData');
                        // If no icon data or no icon, show the node's text label
                        if (!iconData || !iconData.icon) {
                            return node.data('label') || '';
                        }
                        // If emoji icon, show the emoji
                        return iconData.type === 'emoji' ? iconData.icon : '';
                    },
                    'color': isDark ? '#ffffff' : '#1a1a2e',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': (node) => {
                        const iconData = node.data('iconData');
                        const isHovering = node.data('_hover');
                        const weight = node.data('weight') || 1;

                        // Scale font size based on weight
                        const scaleFactor = 0.5 + (weight * 0.1); // 0.6 for weight 1, 1.0 for weight 5

                        // Smaller font for text labels, larger for emoji icons
                        if (!iconData || !iconData.icon) {
                            const baseSize = 12 * scaleFactor;
                            return isHovering ? (baseSize * 1.2) + 'px' : baseSize + 'px';
                        }
                        const baseSize = 32 * scaleFactor;
                        return iconData.type === 'emoji' ? (isHovering ? (baseSize * 1.25) + 'px' : baseSize + 'px') : (12 * scaleFactor) + 'px';
                    },
                    'text-wrap': 'wrap',
                    'text-max-width': '60px',
                    'width': (node) => {
                        const weight = node.data('weight') || 1;
                        const baseSize = 50 + (weight * 8); // Scale based on weight
                        if (node.data('_hover')) return baseSize + 15;
                        if (node.data('_childHighlight')) return baseSize + 10;
                        return baseSize;
                    },
                    'height': (node) => {
                        const weight = node.data('weight') || 1;
                        const baseSize = 50 + (weight * 8); // Scale based on weight
                        if (node.data('_hover')) return baseSize + 15;
                        if (node.data('_childHighlight')) return baseSize + 10;
                        return baseSize;
                    },
                    'transition-property': 'background-color, border-color, border-width',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'node:selected',
                style: {
                    'border-width': 8,
                    'border-color': '#fbbf24',
                    'overlay-color': (node) => {
                        const iconData = node.data('iconData') || { color: '#6366f1' };
                        return iconData.color;
                    },
                    'overlay-opacity': 0.3,
                    'overlay-padding': 10
                }
            },
            {
                selector: 'node:active',
                style: {
                    'overlay-opacity': 0.4
                }
            },
            {
                selector: 'node[_childHighlight]',
                style: {
                    'border-width': 6,
                    'border-color': (node) => {
                        const iconData = node.data('iconData') || { color: '#6366f1' };
                        return this.adjustColorBrightness(iconData.color, 1.4);
                    },
                    'overlay-color': (node) => {
                        const iconData = node.data('iconData') || { color: '#6366f1' };
                        return iconData.color;
                    },
                    'overlay-opacity': 0.2,
                    'overlay-padding': 6
                }
            },
            {
                selector: 'node[_selected]',
                style: {
                    'border-width': 8,
                    'border-color': '#fbbf24',
                    'overlay-color': '#fbbf24',
                    'overlay-opacity': 0.3,
                    'overlay-padding': 10
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': (edge) => {
                        // Thicker edges for completed paths
                        const source = edge.source();
                        return source.data('completed') ? 4 : 2;
                    },
                    'line-color': (edge) => {
                        const source = edge.source();
                        const iconData = source.data('iconData') || { color: '#6366f1' };
                        const completed = source.data('completed');
                        if (completed) {
                            return this.adjustColorBrightness(iconData.color, 1.2);
                        }
                        return isDark ? '#3d3a5c' : '#cbd5e1';
                    },
                    'target-arrow-color': (edge) => {
                        const source = edge.source();
                        const iconData = source.data('iconData') || { color: '#6366f1' };
                        const completed = source.data('completed');
                        if (completed) {
                            return this.adjustColorBrightness(iconData.color, 1.2);
                        }
                        return isDark ? '#3d3a5c' : '#cbd5e1';
                    },
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'arrow-scale': 1.5,
                    'opacity': (edge) => {
                        const source = edge.source();
                        return source.data('completed') ? 1 : 0.6;
                    },
                    'line-style': (edge) => {
                        const target = edge.target();
                        return target.data('locked') ? 'dashed' : 'solid';
                    },
                    'transition-property': 'line-color, target-arrow-color, width, opacity',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'edge:selected',
                style: {
                    'width': 5,
                    'opacity': 1
                }
            },
            {
                selector: 'edge.highlighted',
                style: {
                    'width': 5,
                    'opacity': 1
                }
            },
            {
                selector: 'node.potential-parent',
                style: {
                    'border-width': 8,
                    'border-color': '#10b981',
                    'border-style': 'dashed',
                    'overlay-color': '#10b981',
                    'overlay-opacity': 0.4,
                    'overlay-padding': 15
                }
            }
        ];
    },

    // Adjust color brightness
    adjustColorBrightness(color, factor) {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Adjust brightness
        const newR = Math.min(255, Math.floor(r * factor));
        const newG = Math.min(255, Math.floor(g * factor));
        const newB = Math.min(255, Math.floor(b * factor));

        // Convert back to hex
        return '#' + ((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1);
    }
};

// Expose to global scope
window.ThemeManager = ThemeManager;

// Initialize theme when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    ThemeManager.init();
}
