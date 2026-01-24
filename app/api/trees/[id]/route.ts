import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/trees/:id - Get tree data
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tree = await prisma.tree.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!tree) {
      return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
    }

    return NextResponse.json({ tree });
  } catch (error) {
    console.error('Error fetching tree:', error);
    return NextResponse.json({ error: 'Failed to fetch tree' }, { status: 500 });
  }
}

// PUT /api/trees/:id - Update tree
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns tree
    const existing = await prisma.tree.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, data, thumbnail } = body;

    const tree = await prisma.tree.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(data !== undefined && { data }),
        ...(thumbnail !== undefined && { thumbnail }),
      },
    });

    return NextResponse.json({ tree });
  } catch (error) {
    console.error('Error updating tree:', error);
    return NextResponse.json({ error: 'Failed to update tree' }, { status: 500 });
  }
}

// DELETE /api/trees/:id - Delete tree
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns tree
    const existing = await prisma.tree.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
    }

    await prisma.tree.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tree:', error);
    return NextResponse.json({ error: 'Failed to delete tree' }, { status: 500 });
  }
}
