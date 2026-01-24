import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

function parseExpiry(expiresIn: string): number {
  const units: Record<string, number> = {
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  const match = expiresIn.match(/^(\d+)([hdw])$/);
  if (!match) {
    throw new Error('Invalid expiry format. Use format like: 24h, 7d, 2w');
  }

  const [, amount, unit] = match;
  return parseInt(amount) * units[unit];
}

// POST /api/share - Create shareable link
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { treeId, expiresIn } = body;

    if (!treeId) {
      return NextResponse.json({ error: 'Tree ID is required' }, { status: 400 });
    }

    // Verify user owns tree
    const tree = await prisma.tree.findFirst({
      where: { id: treeId, userId: session.user.id },
    });

    if (!tree) {
      return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
    }

    // Create share
    const shareId = nanoid(10); // Short, URL-friendly ID
    const expiresAt = expiresIn ? new Date(Date.now() + parseExpiry(expiresIn)) : null;

    const share = await prisma.share.create({
      data: {
        treeId,
        shareId,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const url = `${baseUrl}/share/${shareId}`;

    return NextResponse.json({
      shareId,
      url,
      expiresAt: share.expiresAt,
    });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}

// GET /api/share?treeId=xxx - Get existing shares for a tree
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const treeId = searchParams.get('treeId');

    if (!treeId) {
      return NextResponse.json({ error: 'Tree ID is required' }, { status: 400 });
    }

    // Verify user owns tree
    const tree = await prisma.tree.findFirst({
      where: { id: treeId, userId: session.user.id },
    });

    if (!tree) {
      return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
    }

    const shares = await prisma.share.findMany({
      where: { treeId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ shares });
  } catch (error) {
    console.error('Error fetching shares:', error);
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 });
  }
}
