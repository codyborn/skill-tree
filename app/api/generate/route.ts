import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateSkillTree } from '@/lib/openai';

// Simple in-memory rate limiting (for production, use Redis/Vercel KV)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);

  if (!limit || now > limit.resetAt) {
    // Reset limit: 5 requests per hour
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + 60 * 60 * 1000,
    });
    return true;
  }

  if (limit.count >= 5) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const identifier = session.user.email;
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 5 generations per hour.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { topic, nodeCount, style } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const treeData = await generateSkillTree({ topic, nodeCount, style });

    return NextResponse.json({ tree: treeData });
  } catch (error: any) {
    console.error('AI generation error:', error);
    const errorMessage = error?.message || 'Failed to generate skill tree';
    return NextResponse.json(
      { error: errorMessage, details: error?.toString() },
      { status: 500 }
    );
  }
}
