'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SkillTreeEditor from '@/components/SkillTreeEditor';
import CreatorInfo from '@/components/CreatorInfo';
import UserMenu from '@/components/UserMenu';

export default function SharePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch share data
  useEffect(() => {
    fetch(`/api/share/${params.id}`)
      .then((res) => {
        if (!res.ok) {
          router.push('/404');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setShareData(data);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/404');
      });
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!shareData) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{shareData.tree.name}</h1>
            {shareData.tree.description && (
              <p className="text-sm text-gray-400 mt-1">{shareData.tree.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              👁️ {shareData.views} views
            </div>
            {session && <UserMenu session={session} showShareLink={false} />}
          </div>
        </div>
        {shareData.creator && (
          <CreatorInfo creator={shareData.creator} currentUserId={session?.user?.id} />
        )}
      </header>
      <SkillTreeEditor initialData={shareData.tree.data as any} readOnly shareId={params.id} />
    </div>
  );
}
