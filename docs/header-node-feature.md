# Header Node Feature - Product Requirements

## Overview
Header nodes are a new node type that serves as logical groupings of related skills. They cannot be completed directly but provide visual organization and hierarchy.

## Node Types
The system will have **three node types**:
1. **Root Node** - Single top-level node (existing)
2. **Header Node** - Logical grouping nodes (new)
3. **Regular Node** - Standard completable skills (existing)

## Header Node Behavior

### Completion Logic
- Header nodes **cannot be completed directly** (no completion toggle)
- They are **logical groupings only**
- Coloring is based on children's completion:
  - **Colored (full opacity)**: When ANY direct children are completed
  - **Grayed out (low opacity)**: When NO direct children are completed

### Toggle Mechanism
- Modern-looking **checkbox in the node details panel**
- Allows users to convert any regular node to/from header node
- When toggled to header: completion status is cleared (headers can't be completed)
- **Default**: New nodes are NOT headers (regular nodes by default)

## Visual Design

### Size & Shape
- **Larger than regular nodes**
- **Rectangular shape** (not circular like regular nodes)
- Distinct from both circular regular nodes and square root node

### Display
- Shows **icon + title together** (e.g., "🎯 Advanced Skills")
- Unlike regular nodes which show icon OR title

### Background Pattern
- **Repeating pattern using the node's icon emoji** in a two-tone design
- Pattern creates visual texture using the emoji itself
- Two-tone: alternating opacity or color variations of the emoji
- Pattern only visible when children are completed (grayed out nodes have no pattern)
- **Gradient overlay** that fades like a shadow for depth
- Creates visual richness and hierarchy

### Technical Specs
- Size: Approximately 200x80px (larger and wider than regular nodes)
- Shape: `roundrectangle` in Cytoscape
- Border: Slightly thinner than regular nodes
- Font: Bold text for prominence

## AI Generation Integration
- When AI generates a new skill tree, the **top/root node is ALWAYS a header node**
- This creates clear visual hierarchy: Header → Regular skills beneath
- AI prompt must specify: `isHeader: true` for the top node only
- All other generated nodes: `isHeader: false`

## Implementation Notes

### Data Model
- Add `isHeader?: boolean` to `NodeData` and `CytoscapeNodeData` interfaces
- Default value: `false` (regular nodes)

### Styling Priority
Cytoscape selector order matters:
1. Base `node` selector - common styles
2. `node[!isHeader]` - ensure regular nodes stay circular
3. `node[parentId = null]` - root node overrides
4. `node[isHeader = true]` - header node overrides

### Pattern Generation
Create SVG with:
- Repeating grid of the icon emoji
- Two-tone effect through opacity variations
- Base color layer
- Gradient overlay for depth
- Encode as data URI for `background-image`

## User Experience

### Creating Headers
1. User creates a regular node
2. Opens node details panel
3. Toggles "Header Node" checkbox
4. Node transforms into header style
5. Completion button disappears

### Visual Feedback
- Headers visually group related skills
- Gray headers indicate "nothing started yet"
- Colored headers indicate "work in progress"
- Creates intuitive visual hierarchy in the tree

## Summary
Header nodes provide **visual hierarchy** and **logical organization** without requiring direct completion, becoming colored as their children make progress. They're visually distinct with rectangular shape, larger size, and beautiful emoji-patterned backgrounds.
