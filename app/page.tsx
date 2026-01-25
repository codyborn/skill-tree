import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignInButton from "@/components/SignInButton";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/tree/new");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold mb-4 text-white">
          ❇︎ Skill Tree Builder
        </h1>
        <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
          Create, visualize, and track progress through interactive skill trees.
          Powered by AI to generate custom learning paths.
        </p>
        <SignInButton />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <div className="text-4xl mb-3">🌳</div>
            <h3 className="text-lg font-semibold mb-2 text-white">Interactive Trees</h3>
            <p className="text-white text-sm">
              Build and navigate through your skill progression with an intuitive visual interface
            </p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold mb-2 text-white">AI-Powered</h3>
            <p className="text-white text-sm">
              Generate comprehensive skill trees automatically using GPT-4
            </p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <div className="text-4xl mb-3">🔗</div>
            <h3 className="text-lg font-semibold mb-2 text-white">Share & Collaborate</h3>
            <p className="text-white text-sm">
              Create shareable links to showcase your learning paths
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
