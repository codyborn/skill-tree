'use client';

import { useState, useEffect } from 'react';
import type { NodeSingular } from 'cytoscape';
import type { CytoscapeNodeData } from '@/types/skill-tree';

interface DetailPanelProps {
  node: NodeSingular | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (nodeId: string, updates: Partial<CytoscapeNodeData>) => void;
}

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#14b8a6', '#f97316', '#a855f7'
];

export default function DetailPanel({ node, isOpen, onClose, onUpdate }: DetailPanelProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [completed, setCompleted] = useState(false);
  const [weight, setWeight] = useState(1);
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('');
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  useEffect(() => {
    if (node) {
      setLabel(node.data('label') || '');
      setDescription(node.data('description') || '');
      setCompleted(node.data('completed') || false);
      setWeight(node.data('weight') || 1);

      const iconData = node.data('iconData');
      if (iconData) {
        setColor(iconData.color || '#6366f1');
        setIcon(iconData.icon || '');
      } else {
        setColor('#6366f1');
        setIcon('');
      }

      const metadata = node.data('metadata') || {};
      setCompletedAt(metadata.completedAt || null);
    }
  }, [node]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!node) return null;

  const nodeId = node.id();
  const isRoot = !node.data('parentId');
  const subtreeProgress = node.data('subtreeProgress') || { completed: 0, total: 0 };
  const completionPercentage =
    subtreeProgress.total > 0 ? Math.round((subtreeProgress.completed / subtreeProgress.total) * 100) : 0;

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    onUpdate(nodeId, { label: newLabel });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    onUpdate(nodeId, { description: newDescription });
  };

  const handleCompletedToggle = () => {
    const newCompleted = !completed;
    setCompleted(newCompleted);

    const now = new Date().toISOString();
    const metadata = node.data('metadata') || {};
    const newMetadata = {
      ...metadata,
      completedAt: newCompleted ? now : null,
    };

    setCompletedAt(newCompleted ? now : null);
    onUpdate(nodeId, {
      completed: newCompleted,
      metadata: newMetadata,
    });
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWeight = parseInt(e.target.value, 10);
    if (newWeight >= 1 && newWeight <= 10) {
      setWeight(newWeight);
      onUpdate(nodeId, { weight: newWeight });
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    const iconData = node.data('iconData') || { type: 'emoji', icon: '', color: '#6366f1' };
    onUpdate(nodeId, {
      iconData: {
        ...iconData,
        color: newColor,
      },
    });
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIcon = e.target.value;
    setIcon(newIcon);
    const iconData = node.data('iconData') || { type: 'emoji', icon: '', color: color };
    onUpdate(nodeId, {
      iconData: {
        ...iconData,
        type: 'emoji',
        icon: newIcon,
      },
    });
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-gray-800 border-l border-gray-700 shadow-xl z-40 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Node Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Label</label>
            <input
              type="text"
              value={label}
              onChange={handleLabelChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Icon (emoji or leave empty)
            </label>
            <input
              type="text"
              value={icon}
              onChange={handleIconChange}
              placeholder="🎮"
              maxLength={4}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-2xl text-center focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => handleColorChange(presetColor)}
                  className={`w-10 h-10 rounded border-2 transition ${
                    color === presetColor ? 'border-white scale-110' : 'border-gray-600'
                  }`}
                  style={{ backgroundColor: presetColor }}
                  aria-label={`Select color ${presetColor}`}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-full mt-2 h-10 rounded bg-gray-900 border border-gray-700 cursor-pointer"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              rows={6}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Add description (markdown supported)..."
            />
          </div>

          {/* Completion Button - Hide for root nodes */}
          {!isRoot && (
            <div>
              <button
                onClick={handleCompletedToggle}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform active:scale-95 ${
                  completed
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-green-500'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white border-2 border-dashed border-gray-500 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  {completed ? (
                    <>
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Completed!</span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-400" />
                      <span>Mark Complete</span>
                    </>
                  )}
                </div>
              </button>

              {/* Date Completed - Show when completed */}
              {completed && completedAt && (
                <div className="mt-3 text-center text-sm text-emerald-400">
                  ✨ Completed on {new Date(completedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Weight (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={weight}
              onChange={handleWeightChange}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Progress Bar */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subtree Progress
            </label>
            <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
              <div
                className="bg-blue-600 h-full flex items-center justify-center text-xs text-white font-medium transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              >
                {completionPercentage > 10 && `${completionPercentage}%`}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {subtreeProgress.completed} of {subtreeProgress.total} nodes completed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
