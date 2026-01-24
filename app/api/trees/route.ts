import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/trees - List user's trees
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trees = await prisma.tree.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ trees });
  } catch (error) {
    console.error('Error fetching trees:', error);
    return NextResponse.json({ error: 'Failed to fetch trees' }, { status: 500 });
  }
}

// POST /api/trees - Create new tree
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, data } = body;

    if (!name || !data) {
      return NextResponse.json({ error: 'Name and data are required' }, { status: 400 });
    }

    const tree = await prisma.tree.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        data,
      },
    });

    return NextResponse.json({ tree }, { status: 201 });
  } catch (error) {
    console.error('Error creating tree:', error);
    return NextResponse.json({ error: 'Failed to create tree' }, { status: 500 });
  }
}
