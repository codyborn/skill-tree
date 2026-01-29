import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/activities/feed - Get activity feed from followed users
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    // Get list of users current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    // Include current user's activities too
    const userIds = [...followingIds, session.user.id];

    // Get activities from followed users
    const activities = await prisma.activity.findMany({
      where: {
        userId: { in: userIds },
        type: 'NODE_COMPLETED', // Only show completions in feed
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tree: {
          select: {
            id: true,
            name: true,
          },
        },
        kudos: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
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

    const hasMore = activities.length > limit;
    const items = activities.slice(0, limit);

    // Add kudos metadata
    const activitiesWithKudos = items.map(activity => ({
      ...activity,
      kudosCount: activity.kudos.length,
      hasKudos: activity.kudos.some(k => k.userId === session.user.id),
    }));

    return NextResponse.json({
      activities: activitiesWithKudos,
      hasMore,
      cursor: hasMore ? items[limit - 1].id : undefined,
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
  }
}
