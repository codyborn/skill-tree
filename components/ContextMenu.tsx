'use client';

import { useEffect, useRef } from 'react';
import type { NodeSingular } from 'cytoscape';

interface ContextMenuProps {
  node: NodeSingular | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onAddChild: (nodeId: string) => void;
  onEdit: () => void;
  onToggleComplete: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
}

export default function ContextMenu({
  node,
  position,
  onClose,
  onAddChild,
  onEdit,
  onToggleComplete,
  onDelete,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!node || !position) return null;

  const nodeId = node.id();
  const isCompleted = node.data('completed');

  // Adjust position if menu would go off-screen
  const adjustedPosition = { ...position };
  if (typeof window !== 'undefined') {
    const menuWidth = 200;
    const menuHeight = 200;

    if (position.x + menuWidth > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - menuWidth - 10;
    }

    if (position.y + menuHeight > window.innerHeight) {
      adjustedPosition.y = window.innerHeight - menuHeight - 10;
    }
  }

  const handleDelete = () => {
    if (confirm('Delete this node and all children?')) {
      onDelete(nodeId);
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[180px]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <button
        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition"
        onClick={() => onAddChild(nodeId)}
      >
        Add Child
      </button>
      <button
        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition"
        onClick={onEdit}
      >
        Edit Node
      </button>
      <button
        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition"
        onClick={() => onToggleComplete(nodeId)}
      >
        {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
      </button>
      <hr className="my-2 border-gray-700" />
      <button
        className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 transition"
        onClick={handleDelete}
      >
        Delete
      </button>
    </div>
  );
}
