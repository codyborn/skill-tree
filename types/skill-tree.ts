/**
 * TypeScript type definitions for Skill Tree data structures
 */

import type { Core, NodeSingular, EdgeSingular, ElementDefinition } from 'cytoscape';

// Icon types
export type IconType = 'emoji' | 'image' | 'svg';

export interface IconData {
  type: IconType;
  icon: string; // Emoji character, image URL, or SVG content
  color?: string; // Hex color code
  backgroundColor?: string;
}

// Node data structure
export interface NodeData {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  locked: boolean;
  parent: string | null; // Parent node ID (null for root)
  prerequisites: string[]; // Array of prerequisite node IDs
  iconData: IconData | null;
  weight: number; // 1-10, complexity/importance
  subtreeCompletion: number; // 0-100 percentage
  subtreeProgress: {
    completed: number;
    total: number;
  };
  metadata: Record<string, any>; // Custom metadata
  isHeader?: boolean; // Whether this is a header node (logical grouping)
}

// Cytoscape node data (stored in Cytoscape instance)
export interface CytoscapeNodeData {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  locked: boolean;
  parentId: string | null;
  prerequisites: string[];
  iconData: IconData | null;
  weight: number;
  subtreeCompletion: number;
  subtreeProgress: {
    completed: number;
    total: number;
  };
  metadata: Record<string, any>;
  isHeader?: boolean; // Whether this is a header node (logical grouping)
}

// Cytoscape node element
export interface CytoscapeNode extends ElementDefinition {
  group: 'nodes';
  data: CytoscapeNodeData;
  position?: {
    x: number;
    y: number;
  };
}

// Edge data structure
export interface EdgeData {
  id: string;
  source: string; // Parent node ID
  target: string; // Child node ID
}

// Cytoscape edge element
export interface CytoscapeEdge extends ElementDefinition {
  group: 'edges';
  data: EdgeData;
}

// Complete tree data structure for serialization
export interface TreeData {
  version: string;
  name: string;
  description?: string;
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    author?: string;
    [key: string]: any;
  };
}

// Tree export format
export interface TreeExport extends TreeData {
  exportedAt: string;
  exportFormat: 'json' | 'compressed';
}

// Theme data
export interface ThemeData {
  id: string;
  name: string;
  colors: {
    background: string;
    nodeDefault: string;
    nodeCompleted: string;
    nodeLocked: string;
    nodeHighlight: string;
    edge: string;
    edgeHighlight: string;
    text: string;
    textCompleted: string;
  };
}

// Context menu option
export interface ContextMenuOption {
  label: string;
  icon?: string;
  action: (node?: NodeSingular) => void | Promise<void>;
  condition?: (node?: NodeSingular) => boolean;
  separator?: boolean;
}

// Detail panel data
export interface DetailPanelData {
  node: NodeSingular;
  title: string;
  description: string;
  completed: boolean;
  locked: boolean;
  weight: number;
  subtreeProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  prerequisites: Array<{
    id: string;
    label: string;
    completed: boolean;
  }>;
}

// AI Generation request
export interface AIGenerationRequest {
  topic: string;
  nodeCount?: number;
  parentNode?: string;
  style?: 'technical' | 'creative' | 'academic' | 'gaming';
}

// AI Generation response
export interface AIGenerationResponse {
  nodes: NodeData[];
  edges: EdgeData[];
}

// Share link data
export interface ShareData {
  shareId: string;
  url: string;
  expiresAt?: Date;
  createdAt: Date;
}

// Database tree record (from Prisma)
export interface DBTree {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  data: TreeData; // JSON field
  thumbnail: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Database share record
export interface DBShare {
  id: string;
  treeId: string;
  shareId: string;
  expiresAt: Date | null;
  views: number;
  createdAt: Date;
}

// API response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TreeListResponse {
  trees: Array<{
    id: string;
    name: string;
    description: string | null;
    thumbnail: string | null;
    updatedAt: Date;
  }>;
}

export interface TreeResponse {
  tree: DBTree;
}

export interface GenerateResponse {
  tree: AIGenerationResponse;
}

export interface ShareResponse {
  shareId: string;
  url: string;
}

// Form data types
export interface TreeMetadataForm {
  name: string;
  description: string;
}

export interface NodeEditForm {
  label: string;
  description: string;
  weight: number;
  iconData: IconData | null;
}

// Event types for SkillTree class
export type SkillTreeEvent =
  | 'nodeAdded'
  | 'nodeRemoved'
  | 'nodeUpdated'
  | 'nodeCompleted'
  | 'treeLoaded'
  | 'treeSaved'
  | 'layoutApplied';

export interface SkillTreeEventData {
  nodeAdded: { node: NodeSingular };
  nodeRemoved: { nodeId: string };
  nodeUpdated: { node: NodeSingular; changes: Partial<CytoscapeNodeData> };
  nodeCompleted: { node: NodeSingular; completed: boolean };
  treeLoaded: { data: TreeData };
  treeSaved: { data: TreeData };
  layoutApplied: { layout: string };
}

// React component props
export interface SkillTreeEditorProps {
  treeId?: string;
  initialData?: TreeData;
  readOnly?: boolean;
  onSave?: (data: TreeData) => void | Promise<void>;
  onLoad?: (treeId: string) => Promise<TreeData>;
}

export interface ToolbarProps {
  treeId?: string;
  onNew?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  onShare?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onExport?: () => void;
  onImport?: () => void;
}

export interface TreeListProps {
  trees: TreeListResponse['trees'];
  onSelect: (treeId: string) => void;
  onDelete?: (treeId: string) => void;
}

export interface ShareDialogProps {
  treeId: string;
  isOpen: boolean;
  onClose: () => void;
  onShare: (treeId: string, expiresIn?: string) => Promise<ShareResponse>;
}

export interface AIGenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (request: AIGenerationRequest) => Promise<AIGenerationResponse>;
  parentNode?: NodeSingular;
}

// Follow/Friend types
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
}

export interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface FollowUser extends UserInfo {
  followingSince: Date;
}

// Notification types
export enum NotificationType {
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  FOLLOW_BACK = 'FOLLOW_BACK',
  TREE_SHARED = 'TREE_SHARED',
  SYSTEM = 'SYSTEM',
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string | null;
  type: NotificationType;
  entityId: string | null;
  entityType: string | null;
  read: boolean;
  createdAt: Date;
}

export interface NotificationWithActor extends Notification {
  actor?: UserInfo;
}

// Share with creator
export interface ShareResponseWithCreator extends ShareResponse {
  creator: UserInfo;
}

// API Request/Response types
export interface FollowRequest {
  targetUserId: string;
}

export interface FollowListResponse {
  users: FollowUser[];
  hasMore: boolean;
  cursor?: string;
}

export interface NotificationListResponse {
  notifications: NotificationWithActor[];
  unreadCount: number;
  hasMore: boolean;
  cursor?: string;
}

export interface MarkNotificationReadRequest {
  read: boolean;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
