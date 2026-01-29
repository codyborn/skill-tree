import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/activities - Create activity when node completed/uncompleted
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { treeId, nodeId, nodeLabel, type } = body;

    if (!treeId || !nodeId || !nodeLabel || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type !== 'NODE_COMPLETED' && type !== 'NODE_UNCOMPLETED') {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
    }

    // Verify user owns the tree
    const tree = await prisma.tree.findFirst({
      where: { id: treeId, userId: session.user.id },
    });

    if (!tree) {
      return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
    }

    // Only create activities for completions (not un-completions)
    if (type === 'NODE_COMPLETED') {
      const activity = await prisma.activity.create({
        data: {
          userId: session.user.id,
          treeId,
          nodeId,
          nodeLabel,
          type,
        },
      });

      return NextResponse.json({ success: true, activity });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
