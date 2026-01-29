'use client';

import { useEffect, useState } from 'react';

interface HelpTooltipProps {
  show: boolean;
}

export default function HelpTooltip({ show }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay showing the tooltip slightly so the tree has time to render
    if (show) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
      <div className="relative">
        {/* Arrow pointing to root node (slightly up and left) */}
        <div className="absolute -top-12 -left-8 w-24 h-24">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full text-blue-400"
            style={{
              filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
            }}
          >
            {/* Curved arrow */}
            <path
              d="M 80 80 Q 60 60, 40 40"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            {/* Arrowhead */}
            <path
              d="M 40 40 L 45 35 L 35 33 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Help text */}
        <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-xs animate-pulse">
          <p className="text-sm font-medium">Right-click here to get started!</p>
          <p className="text-xs mt-1 opacity-90">
            Add your first skill or use AI to generate a tree
          </p>
        </div>
      </div>
    </div>
  );
}
