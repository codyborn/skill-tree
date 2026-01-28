'use client';

import FollowButton from './FollowButton';
import type { UserInfo } from '@/types/skill-tree';

interface CreatorInfoProps {
  creator: UserInfo;
  currentUserId?: string;
}

export default function CreatorInfo({ creator, currentUserId }: CreatorInfoProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
      {/* Creator Avatar */}
      {creator.image ? (
        <img
          src={creator.image}
          alt={creator.name || 'Creator'}
          className="w-12 h-12 rounded-full"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-semibold text-lg">
          {(creator.name || creator.email)?.[0]?.toUpperCase()}
        </div>
      )}

      {/* Creator Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white">
          {creator.name || creator.email}
        </p>
        <p className="text-sm text-gray-400">
          Tree Creator
        </p>
      </div>

      {/* Follow Button */}
      <FollowButton
        userId={creator.id}
        userName={creator.name || 'this user'}
        currentUserId={currentUserId}
      />
    </div>
  );
}
