import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/user/[userId]/latest-share - Get user's most recent share
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find the most recent share created by this user
    const latestShare = await prisma.share.findFirst({
      where: {
        createdBy: userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      select: {
        shareId: true,
      },
    });

    if (!latestShare) {
      return NextResponse.json({ error: 'No shares found for this user' }, { status: 404 });
    }

    return NextResponse.json({ shareId: latestShare.shareId });
  } catch (error) {
    console.error('Error fetching latest share:', error);
    return NextResponse.json({ error: 'Failed to fetch latest share' }, { status: 500 });
  }
}
