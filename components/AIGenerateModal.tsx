'use client';

import { useState, useEffect } from 'react';

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (topic: string) => void;
  isGenerating: boolean;
}

const USAGE_TIPS = [
  "Remember, AI can make mistakes",
  "You can manually edit the skill tree after it's ready",
  "Double click on a skill to collapse it",
  "Drag and drop skills to restructure your tree",
  "Right-click nodes for more options",
  "Use weights to indicate skill difficulty",
  "Mark skills complete to track your progress",
];

export default function AIGenerateModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: AIGenerateModalProps) {
  const [topic, setTopic] = useState('');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [tipKey, setTipKey] = useState(0);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isGenerating, onClose]);

  // Reset topic when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTopic('');
    }
  }, [isOpen]);

  // Cycle through tips while generating
  useEffect(() => {
    if (isGenerating) {
      // Start with a random tip
      setCurrentTipIndex(Math.floor(Math.random() * USAGE_TIPS.length));

      const interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % USAGE_TIPS.length);
        setTipKey((prev) => prev + 1); // Force re-animation
      }, 3000); // Change tip every 3 seconds

      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isGenerating) {
      onGenerate(topic.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Generate Skill Tree with AI</h2>
          {!isGenerating && (
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
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">
              Describe the skill or topic
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Learn Web Development, Master Chess, etc."
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
          </div>

          {isGenerating && (
            <div className="mb-4 p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded">
              <div className="flex items-center mb-3">
                <svg
                  className="animate-spin h-5 w-5 text-blue-400 mr-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-blue-300 text-sm font-medium">Generating skill tree...</span>
              </div>
              <div className="overflow-hidden h-6">
                <div
                  key={tipKey}
                  className="text-gray-300 text-xs italic animate-slideUp"
                >
                  💡 {USAGE_TIPS[currentTipIndex]}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topic.trim() || isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
