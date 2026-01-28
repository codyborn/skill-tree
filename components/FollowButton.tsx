'use client';

import { useState, useEffect } from 'react';

interface FollowButtonProps {
  userId: string;
  userName: string;
  currentUserId?: string;
}

export default function FollowButton({ userId, userName, currentUserId }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch follow status on mount
  useEffect(() => {
    if (userId === currentUserId) return;
    fetchFollowStatus(userId);
  }, [userId, currentUserId]);

  // Don't show button if viewing own tree
  if (userId === currentUserId) {
    return null;
  }

  const fetchFollowStatus = async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/follow/status/${targetUserId}`);
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error('Failed to fetch follow status:', error);
    }
  };

  const handleToggleFollow = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isFollowing) {
        // Unfollow
        const res = await fetch(`/api/follow/${userId}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          setIsFollowing(false);
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to unfollow');
        }
      } else {
        // Follow
        const res = await fetch('/api/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: userId }),
        });

        if (res.ok) {
          setIsFollowing(true);
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to follow');
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleToggleFollow}
        disabled={isLoading}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          isFollowing
            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          'Loading...'
        ) : isFollowing ? (
          <>Following ✓</>
        ) : (
          `Follow ${userName}`
        )}
      </button>
      {error && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
