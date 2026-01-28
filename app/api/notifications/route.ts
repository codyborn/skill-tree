import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/notifications - Get notifications list
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    });

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = notifications.length > limit;
    const items = notifications.slice(0, limit);

    // Fetch actor information for notifications
    const actorIds = items
      .map(n => n.actorId)
      .filter((id): id is string => id !== null);

    const actors = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    const actorMap = new Map(actors.map(a => [a.id, a]));

    const notificationsWithActors = items.map(notification => ({
      ...notification,
      actor: notification.actorId ? actorMap.get(notification.actorId) : undefined,
    }));

    return NextResponse.json({
      notifications: notificationsWithActors,
      unreadCount,
      hasMore,
      cursor: hasMore ? items[limit - 1].id : undefined,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
