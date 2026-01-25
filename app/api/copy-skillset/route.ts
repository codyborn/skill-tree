import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { CytoscapeNode, TreeData } from '@/types/skill-tree';

// POST /api/copy-skillset - Copy a node and its children to user's tree
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to copy skills' }, { status: 401 });
    }

    const body = await req.json();
    const { shareId, nodeId } = body;

    if (!shareId || !nodeId) {
      return NextResponse.json({ error: 'Share ID and node ID are required' }, { status: 400 });
    }

    // Get the shared tree
    const share = await prisma.share.findUnique({
      where: { shareId },
      include: { tree: true },
    });

    if (!share || (share.expiresAt && share.expiresAt < new Date())) {
      return NextResponse.json({ error: 'Share not found or expired' }, { status: 404 });
    }

    const sourceTreeData = share.tree.data as TreeData;

    // Find the node and all its descendants
    const sourceNodes = sourceTreeData.nodes as CytoscapeNode[];
    const sourceEdges = sourceTreeData.edges;

    // Find the target node
    const targetNode = sourceNodes.find((n) => n.data.id === nodeId);
    if (!targetNode) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    // Get all descendants
    const getAllDescendants = (nodeId: string): string[] => {
      const children = sourceEdges.filter((e) => e.data.source === nodeId).map((e) => e.data.target);
      const descendants: string[] = [...children];
      children.forEach((childId) => {
        descendants.push(...getAllDescendants(childId));
      });
      return descendants;
    };

    const descendantIds = getAllDescendants(nodeId);
    const allNodeIds = [nodeId, ...descendantIds];

    // Get all nodes to copy
    const nodesToCopy = sourceNodes.filter((n) => allNodeIds.includes(n.data.id));
    const edgesToCopy = sourceEdges.filter((e) =>
      allNodeIds.includes(e.data.source) && allNodeIds.includes(e.data.target)
    );

    // Get user's first tree or create new one
    let userTree = await prisma.tree.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    });

    if (!userTree) {
      // Create a new tree for the user
      userTree = await prisma.tree.create({
        data: {
          name: 'My Skill Tree',
          description: 'My imported skills',
          userId: session.user.id,
          data: {
            version: '1.0',
            name: 'My Skill Tree',
            nodes: [
              {
                group: 'nodes',
                data: {
                  id: 'root',
                  label: '',
                  description: 'Right-click to start building your skill tree',
                  completed: false,
                  locked: false,
                  parentId: null,
                  prerequisites: [],
                  iconData: null,
                  weight: 5,
                  subtreeCompletion: 0,
                  subtreeProgress: { completed: 0, total: 1 },
                  metadata: {},
                },
              },
            ],
            edges: [],
          },
        },
      });
    }

    const userTreeData = userTree.data as TreeData;

    // Generate new IDs for copied nodes
    const idMap = new Map<string, string>();
    const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    allNodeIds.forEach((oldId) => {
      idMap.set(oldId, generateId());
    });

    // Create new nodes with new IDs
    const newNodes: CytoscapeNode[] = nodesToCopy.map((node) => {
      const newId = idMap.get(node.data.id)!;
      const newNode = JSON.parse(JSON.stringify(node));
      newNode.data.id = newId;

      // Update parent reference
      if (node.data.id === nodeId) {
        // This is the root of the copied subtree, connect to user's root
        newNode.data.parentId = 'root';
        newNode.data.prerequisites = ['root'];
      } else if (node.data.parentId && idMap.has(node.data.parentId)) {
        newNode.data.parentId = idMap.get(node.data.parentId);
        newNode.data.prerequisites = [idMap.get(node.data.parentId)!];
      }

      return newNode;
    });

    // Create new edges with new IDs
    const newEdges = edgesToCopy.map((edge) => {
      const newEdge = JSON.parse(JSON.stringify(edge));
      newEdge.data.source = idMap.get(edge.data.source)!;
      newEdge.data.target = idMap.get(edge.data.target)!;
      return newEdge;
    });

    // Add edge from root to the copied subtree root
    const copiedRootId = idMap.get(nodeId)!;
    newEdges.push({
      group: 'edges',
      data: {
        source: 'root',
        target: copiedRootId,
      },
    });

    // Merge with existing tree
    const updatedTreeData: TreeData = {
      ...userTreeData,
      nodes: [...(userTreeData.nodes as CytoscapeNode[]), ...newNodes],
      edges: [...userTreeData.edges, ...newEdges],
    };

    // Update tree in database
    await prisma.tree.update({
      where: { id: userTree.id },
      data: { data: updatedTreeData },
    });

    return NextResponse.json({
      success: true,
      treeId: userTree.id,
      copiedNodeCount: newNodes.length,
      message: `Copied ${newNodes.length} skill${newNodes.length > 1 ? 's' : ''} to your tree!`,
    });
  } catch (error) {
    console.error('Error copying skillset:', error);
    return NextResponse.json({ error: 'Failed to copy skillset' }, { status: 500 });
  }
}
