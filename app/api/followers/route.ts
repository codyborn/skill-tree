import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/followers - Get list of current user's followers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');

    const follows = await prisma.follow.findMany({
      where: { followingId: session.user.id },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = follows.length > limit;
    const users = follows.slice(0, limit).map(follow => ({
      ...follow.follower,
      followingSince: follow.createdAt,
    }));

    return NextResponse.json({
      users,
      hasMore,
      cursor: hasMore ? follows[limit - 1].id : undefined,
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json({ error: 'Failed to fetch followers list' }, { status: 500 });
  }
}
