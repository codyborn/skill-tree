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
            const completed = node.data('completed');
            const color = iconData.color;
            // Completed nodes get full brightness, incomplete nodes are grayed out
            return completed 
              ? this.adjustColorBrightness(color, 1.0)
              : this.desaturateColor(color, 0.6);
          },
          'background-opacity': (node: any) => {
            const locked = node.data('locked');
            const completed = node.data('completed');
            if (locked) return 0.3;
            if (!completed) return 0.5;
            return 1;
          },
          'border-color': (node: any) => {
            // Background ring color (unfilled portion) - gray track
            const locked = node.data('locked');
            return locked ? '#2d2d3d' : '#3d3d4d';
          },
          'border-width': 8,
          'border-style': 'solid',
          // Progress ring using background-image SVG
          'background-image': (node: any) => {
            const subtreeCompletion = node.data('subtreeCompletion') || 0;
            if (subtreeCompletion <= 0) return 'none';
            
            const iconData = node.data('iconData') || { color: '#6366f1' };
            const progressColor = subtreeCompletion >= 1 
              ? '#10b981' 
              : this.adjustColorBrightness(iconData.color, 1.4);
            
            return this.generateProgressRingSVG(subtreeCompletion, progressColor);
          },
          'background-width': '115%',
          'background-height': '115%',
          'background-clip': 'none',
          'bounds-expansion': 10,
          label: (node: any) => {
            const iconData = node.data('iconData');
            const collapsed = node.data('_collapsed');
            const collapsedCount = node.data('_collapsedCount') || 0;

            // Show count badge if collapsed
            if (collapsed && collapsedCount > 0) {
              const baseLabel = iconData?.icon || node.data('label') || '';
              return baseLabel + `\n+${collapsedCount}`;
            }

            // If no icon data or no icon, show the node's text label
            if (!iconData || !iconData.icon) {
              return node.data('label') || '';
            }
            // If emoji icon, show the emoji
            return iconData.type === 'emoji' ? iconData.icon : '';
          },
          color: isDark ? '#ffffff' : '#1a1a2e',
          'text-opacity': (node: any) => {
            const completed = node.data('completed');
            const locked = node.data('locked');
            // Gray out icon/text for incomplete nodes
            if (locked) return 0.3;
            if (!completed) return 0.5;
            return 1;
          },
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': (node: any) => {
            const iconData = node.data('iconData');
            const isHovering = node.data('_hover');
            const weight = node.data('weight') || 1;

            // Scale font size inversely to weight (more subtle)
            const scaleFactor = 1.15 - weight * 0.03; // 1.12 for weight 1, 0.85 for weight 10

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
            const baseSize = 90 - weight * 3; // Subtle inverse: weight 1 = 87px, weight 10 = 60px
            if (node.data('_hover')) return baseSize + 15;
            if (node.data('_childHighlight')) return baseSize + 10;
            return baseSize;
          },
          height: (node: any) => {
            const weight = node.data('weight') || 1;
            const baseSize = 90 - weight * 3; // Subtle inverse: weight 1 = 87px, weight 10 = 60px
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
          'border-width': 5,
          'border-color': '#3b82f6',
          'overlay-opacity': 0,
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
          'border-width': 5,
          'border-color': '#3b82f6',
          'overlay-opacity': 0,
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
      {
        selector: 'node[_collapsed]',
        style: {
          'border-width': 10,
          'border-style': 'double',
        },
      },
      {
        selector: 'edge.collapsed-edge',
        style: {
          display: 'none',
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

  /**
   * Desaturate a color (make it more gray)
   * @param color - Hex color string
   * @param amount - Amount to desaturate (0 = full color, 1 = grayscale)
   */
  desaturateColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate grayscale value (luminance)
    const gray = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);

    // Blend between original color and grayscale
    const newR = Math.floor(r + (gray - r) * amount);
    const newG = Math.floor(g + (gray - g) * amount);
    const newB = Math.floor(b + (gray - b) * amount);

    return (
      '#' + ((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)
    );
  },

  /**
   * Generate an SVG progress ring as a data URI
   * @param progress - Progress value from 0 to 1
   * @param color - Color of the progress arc
   */
  generateProgressRingSVG(progress: number, color: string): string {
    const size = 100;
    const strokeWidth = 6;
    // Position ring at the outer edge of the SVG
    const radius = (size / 2) - (strokeWidth / 2);
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    
    // Calculate the arc path using stroke-dasharray
    const dashArray = circumference;
    const dashOffset = circumference * (1 - progress);
    
    // SVG with a circular progress arc
    // Rotated -90deg so progress starts from top
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
        <circle
          cx="${center}"
          cy="${center}"
          r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${dashArray}"
          stroke-dashoffset="${dashOffset}"
          stroke-linecap="round"
          transform="rotate(-90 ${center} ${center})"
        />
      </svg>
    `.trim().replace(/\s+/g, ' ');
    
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  },
};
