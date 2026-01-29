import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/activities/[id]/kudos - Give kudos to an activity
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: activityId } = await params;

    // Check if activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Check if already gave kudos
    const existingKudo = await prisma.kudo.findUnique({
      where: {
        userId_activityId: {
          userId: session.user.id,
          activityId,
        },
      },
    });

    if (existingKudo) {
      return NextResponse.json({ error: 'Already gave kudos' }, { status: 400 });
    }

    // Create kudos
    const kudo = await prisma.kudo.create({
      data: {
        userId: session.user.id,
        activityId,
      },
    });

    return NextResponse.json({ success: true, kudo });
  } catch (error) {
    console.error('Error giving kudos:', error);
    return NextResponse.json({ error: 'Failed to give kudos' }, { status: 500 });
  }
}

// DELETE /api/activities/[id]/kudos - Remove kudos from an activity
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: activityId } = await params;

    // Delete kudos
    const result = await prisma.kudo.deleteMany({
      where: {
        userId: session.user.id,
        activityId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Kudos not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing kudos:', error);
    return NextResponse.json({ error: 'Failed to remove kudos' }, { status: 500 });
  }
}
