import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/share/[id] - Get share data by shareId
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const share = await prisma.share.findUnique({
      where: { shareId: params.id },
      include: { tree: true },
    });

    if (!share || (share.expiresAt && share.expiresAt < new Date())) {
      return NextResponse.json({ error: 'Share not found or expired' }, { status: 404 });
    }

    // Increment view count
    await prisma.share.update({
      where: { id: share.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({
      tree: share.tree,
      views: share.views + 1, // Return incremented count
    });
  } catch (error) {
    console.error('Error fetching share:', error);
    return NextResponse.json({ error: 'Failed to fetch share' }, { status: 500 });
  }
}
