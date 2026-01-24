'use client';

import { useState, useEffect } from 'react';
import type { NodeSingular } from 'cytoscape';
import type { CytoscapeNodeData } from '@/types/skill-tree';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface DetailPanelProps {
  node: NodeSingular | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (nodeId: string, updates: Partial<CytoscapeNodeData>) => void;
}

export default function DetailPanel({ node, isOpen, onClose, onUpdate }: DetailPanelProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [completed, setCompleted] = useState(false);
  const [weight, setWeight] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (node) {
      setLabel(node.data('label') || '');
      setDescription(node.data('description') || '');
      setCompleted(node.data('completed') || false);
      setWeight(node.data('weight') || 1);
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

  const handleCompletedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCompleted = e.target.checked;
    setCompleted(newCompleted);
    onUpdate(nodeId, { completed: newCompleted });
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWeight = parseInt(e.target.value, 10);
    if (newWeight >= 1 && newWeight <= 10) {
      setWeight(newWeight);
      onUpdate(nodeId, { weight: newWeight });
    }
  };

  const renderMarkdown = () => {
    const rawHtml = marked(description) as string;
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    return { __html: cleanHtml };
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

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">Description</label>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {showPreview ? (
              <div
                className="w-full min-h-[100px] px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={renderMarkdown()}
              />
            ) : (
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                rows={6}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Markdown supported..."
              />
            )}
          </div>

          {/* Completed Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="completed"
              checked={completed}
              onChange={handleCompletedChange}
              className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
            />
            <label htmlFor="completed" className="ml-2 text-sm text-gray-300">
              Completed
            </label>
          </div>

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
