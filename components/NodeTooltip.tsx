'use client';

import { useEffect, useState } from 'react';
import type { NodeSingular } from 'cytoscape';

interface NodeTooltipProps {
  node: NodeSingular | null;
  position: { x: number; y: number } | null;
}

export default function NodeTooltip({ node, position }: NodeTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (node && position) {
      // Small delay before showing tooltip
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [node, position]);

  if (!node || !position || !isVisible) return null;

  const label = node.data('label') || 'Untitled';
  const description = node.data('description') || '';
  const iconData = node.data('iconData');
  const icon = iconData?.icon || '';
  const color = iconData?.color || '#6366f1';

  // Position tooltip to the right of cursor, adjust if too close to edge
  const adjustedPosition = { ...position };
  if (typeof window !== 'undefined') {
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    // Position to the right with offset
    adjustedPosition.x = position.x + 20;
    adjustedPosition.y = position.y - 50;

    // Adjust if off screen
    if (adjustedPosition.x + tooltipWidth > window.innerWidth) {
      adjustedPosition.x = position.x - tooltipWidth - 20;
    }

    if (adjustedPosition.y + tooltipHeight > window.innerHeight) {
      adjustedPosition.y = window.innerHeight - tooltipHeight - 10;
    }

    if (adjustedPosition.y < 10) {
      adjustedPosition.y = 10;
    }
  }

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <div
        className="bg-gray-800 border-2 rounded-xl shadow-2xl p-4 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-200"
        style={{
          borderColor: color,
          boxShadow: `0 10px 40px rgba(0, 0, 0, 0.3), 0 0 20px ${color}40`,
        }}
      >
        {/* Header with icon and title */}
        <div className="flex items-center gap-3 mb-3">
          {icon && (
            <div
              className="flex items-center justify-center w-12 h-12 rounded-lg text-2xl"
              style={{
                backgroundColor: `${color}20`,
                color: color,
              }}
            >
              {icon}
            </div>
          )}
          <h3 className="text-white font-bold text-lg flex-1 line-clamp-2">{label}</h3>
        </div>

        {/* Description */}
        {description && (
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">
            {description}
          </p>
        )}

        {!description && (
          <p className="text-gray-500 text-sm italic">No description</p>
        )}
      </div>
    </div>
  );
}
