import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import SkillTreeEditor from '@/components/SkillTreeEditor';

export default async function SharePage({ params }: { params: { id: string } }) {
  const share = await prisma.share.findUnique({
    where: { shareId: params.id },
    include: { tree: true },
  });

  if (!share || (share.expiresAt && share.expiresAt < new Date())) {
    notFound();
  }

  // Increment view count
  await prisma.share.update({
    where: { id: share.id },
    data: { views: { increment: 1 } },
  });

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{share.tree.name}</h1>
            {share.tree.description && (
              <p className="text-sm text-gray-400 mt-1">{share.tree.description}</p>
            )}
          </div>
          <div className="text-sm text-gray-400">
            👁️ {share.views} views
          </div>
        </div>
      </header>
      <SkillTreeEditor initialData={share.tree.data as any} readOnly />
    </div>
  );
}
