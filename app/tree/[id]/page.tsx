import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SkillTreeEditor from '@/components/SkillTreeEditor';

export default async function TreePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/');
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Skill Tree Editor</h1>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Save
            </button>
            <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
              Share
            </button>
          </div>
        </div>
      </header>
      <SkillTreeEditor treeId={params.id} />
    </div>
  );
}
