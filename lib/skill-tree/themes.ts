/**
 * themes.ts - Theme management for light/dark mode
 * Converted to TypeScript
 */

export type Theme = 'light' | 'dark';

export const ThemeManager = {
  currentTheme: 'light' as Theme,

  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('skill_tree_theme', theme);
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }
  },

  getTheme(): Theme {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skill_tree_theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    }
    return 'light';
  },

  toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  },

  /**
   * Get current theme colors for Cytoscape
   */
  getCytoscapeStyle(): any[] {
    const isDark = this.currentTheme === 'dark';

    return [
      {
        selector: 'node',
        style: {
          'background-color': (node: any) => {
            const iconData = node.data('iconData') || { color: '#6366f1' };
            const completion = node.data('subtreeCompletion') || 0;
            // Brighten color based on completion
            const color = iconData.color;
            return this.adjustColorBrightness(color, 0.3 + completion * 0.7);
          },
          'background-opacity': (node: any) => {
            const locked = node.data('locked');
            return locked ? 0.4 : 1;
          },
          'border-color': (node: any) => {
            const iconData = node.data('iconData') || { color: '#6366f1' };
            const completed = node.data('completed');
            return completed
              ? '#fbbf24'
              : this.adjustColorBrightness(iconData.color, 1.2);
          },
          'border-width': (node: any) => (node.data('completed') ? 6 : 4),
          label: (node: any) => {
            const iconData = node.data('iconData');
            // If no icon data or no icon, show the node's text label
            if (!iconData || !iconData.icon) {
              return node.data('label') || '';
            }
            // If emoji icon, show the emoji
            return iconData.type === 'emoji' ? iconData.icon : '';
          },
          color: isDark ? '#ffffff' : '#1a1a2e',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': (node: any) => {
            const iconData = node.data('iconData');
            const isHovering = node.data('_hover');
            const weight = node.data('weight') || 1;

            // Scale font size based on weight
            const scaleFactor = 0.5 + weight * 0.1; // 0.6 for weight 1, 1.0 for weight 5

            // Smaller font for text labels, larger for emoji icons
            if (!iconData || !iconData.icon) {
              const baseSize = 12 * scaleFactor;
              return isHovering ? baseSize * 1.2 + 'px' : baseSize + 'px';
            }
            const baseSize = 32 * scaleFactor;
            return iconData.type === 'emoji'
              ? isHovering
                ? baseSize * 1.25 + 'px'
                : baseSize + 'px'
              : 12 * scaleFactor + 'px';
          },
          'text-wrap': 'wrap',
          'text-max-width': '60px',
          width: (node: any) => {
            const weight = node.data('weight') || 1;
            const baseSize = 50 + weight * 8; // Scale based on weight
            if (node.data('_hover')) return baseSize + 15;
            if (node.data('_childHighlight')) return baseSize + 10;
            return baseSize;
          },
          height: (node: any) => {
            const weight = node.data('weight') || 1;
            const baseSize = 50 + weight * 8; // Scale based on weight
            if (node.data('_hover')) return baseSize + 15;
            if (node.data('_childHighlight')) return baseSize + 10;
            return baseSize;
          },
          'transition-property': 'background-color, border-color, border-width',
          'transition-duration': '0.3s',
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 8,
          'border-color': '#fbbf24',
          'overlay-color': (node: any) => {
            const iconData = node.data('iconData') || { color: '#6366f1' };
            return iconData.color;
          },
          'overlay-opacity': 0.3,
          'overlay-padding': 10,
        },
      },
      {
        selector: 'node:active',
        style: {
          'overlay-opacity': 0.4,
        },
      },
      {
        selector: 'node[_childHighlight]',
        style: {
          'border-width': 6,
          'border-color': (node: any) => {
            const iconData = node.data('iconData') || { color: '#6366f1' };
            return this.adjustColorBrightness(iconData.color, 1.4);
          },
          'overlay-color': (node: any) => {
            const iconData = node.data('iconData') || { color: '#6366f1' };
            return iconData.color;
          },
          'overlay-opacity': 0.2,
          'overlay-padding': 6,
        },
      },
      {
        selector: 'node[_selected]',
        style: {
          'border-width': 8,
          'border-color': '#fbbf24',
          'overlay-color': '#fbbf24',
          'overlay-opacity': 0.3,
          'overlay-padding': 10,
        },
      },
      {
        selector: 'edge',
        style: {
          width: (edge: any) => {
            // Thicker edges for completed paths
            const source = edge.source();
            return source.data('completed') ? 4 : 2;
          },
          'line-color': (edge: any) => {
            const source = edge.source();
            const iconData = source.data('iconData') || { color: '#6366f1' };
            const completed = source.data('completed');
            if (completed) {
              return this.adjustColorBrightness(iconData.color, 1.2);
            }
            return isDark ? '#3d3a5c' : '#cbd5e1';
          },
          'target-arrow-color': (edge: any) => {
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
          opacity: (edge: any) => {
            const source = edge.source();
            return source.data('completed') ? 1 : 0.6;
          },
          'line-style': (edge: any) => {
            const target = edge.target();
            return target.data('locked') ? 'dashed' : 'solid';
          },
          'transition-property': 'line-color, target-arrow-color, width, opacity',
          'transition-duration': '0.3s',
        },
      },
      {
        selector: 'edge:selected',
        style: {
          width: 5,
          opacity: 1,
        },
      },
      {
        selector: 'edge.highlighted',
        style: {
          width: 5,
          opacity: 1,
        },
      },
      {
        selector: 'node.potential-parent',
        style: {
          'border-width': 8,
          'border-color': '#10b981',
          'border-style': 'dashed',
          'overlay-color': '#10b981',
          'overlay-opacity': 0.4,
          'overlay-padding': 15,
        },
      },
    ];
  },

  /**
   * Adjust color brightness
   */
  adjustColorBrightness(color: string, factor: number): string {
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
    return (
      '#' + ((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)
    );
  },
};
