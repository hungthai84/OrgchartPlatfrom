/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContactNode } from '../types';

export interface LayoutNode {
  id: string;
  node: ContactNode;
  x: number;
  y: number;
  width: number; // Subtree width
  height: number;
  level: number;
}

export interface Connector {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromNodeId: string;
  toNodeId: string;
  relationship: string;
}

/**
 * Calculates a clean hierarchical layout for the org chart.
 * Supports both Top-to-Bottom (TB) and Left-to-Right (LR) layouts.
 */
export function calculateLayout(
  nodes: ContactNode[],
  direction: 'TB' | 'LR' = 'TB',
  cardWidth = 280,
  cardHeight = 110,
  levelGap = 100,
  siblingGap = 40,
  gridSize = 20
): { layoutNodes: LayoutNode[]; connectors: Connector[]; canvasSize: { width: number; height: number } } {
  const layoutMap = new Map<string, LayoutNode>();
  const snap = (val: number) => Math.round(val / gridSize) * gridSize;
  if (nodes.length === 0) {
    return { layoutNodes: [], connectors: [], canvasSize: { width: 0, height: 0 } };
  }

  // Group nodes by parent
  const parentToChildren = new Map<string | null, ContactNode[]>();
  const allIds = new Set(nodes.map(n => n.id));
  
  nodes.forEach(node => {
    // If the managerId doesn't exist in our active set of nodes, treat as root (null parent)
    const parentId = node.managerId && allIds.has(node.managerId) ? node.managerId : null;
    if (!parentToChildren.has(parentId)) {
      parentToChildren.set(parentId, []);
    }
    parentToChildren.get(parentId)!.push(node);
  });

  // Sort children by name or id to maintain consistent order
  parentToChildren.forEach((children) => {
    children.sort((a, b) => a.name.localeCompare(b.name));
  });

  const roots = parentToChildren.get(null) || [];

  // Helper structure to track subtree sizes
  const subtreeWidths = new Map<string, number>();

  function calculateSubtreeSize(nodeId: string): number {
    const children = parentToChildren.get(nodeId) || [];
    if (children.length === 0) {
      const size = direction === 'TB' ? cardWidth : cardHeight;
      subtreeWidths.set(nodeId, size);
      return size;
    }

    let totalWidth = 0;
    children.forEach((child, idx) => {
      totalWidth += calculateSubtreeSize(child.id);
      if (idx < children.length - 1) {
        totalWidth += siblingGap;
      }
    });

    const val = Math.max(direction === 'TB' ? cardWidth : cardHeight, totalWidth);
    subtreeWidths.set(nodeId, val);
    return val;
  }

  // Pre-calculate subtree sizes
  roots.forEach(r => calculateSubtreeSize(r.id));

  // Position nodes
  const layoutList: LayoutNode[] = [];

  function layoutNodeRecursive(
    node: ContactNode,
    level: number,
    offset: number // left coordinate boundary for this subtree
  ) {
    const id = node.id;
    const children = parentToChildren.get(id) || [];
    const subtreeWidth = subtreeWidths.get(id) || (direction === 'TB' ? cardWidth : cardHeight);

    let mainCoord = offset + subtreeWidth / 2;
    let crossCoord = level * ((direction === 'TB' ? cardHeight : cardWidth) + levelGap) + 40;

    let x = 0;
    let y = 0;

    if (direction === 'TB') {
      x = mainCoord - cardWidth / 2;
      y = crossCoord;
    } else {
      x = crossCoord;
      y = mainCoord - cardHeight / 2;
    }

    x = snap(x);
    y = snap(y);

    const layoutNode: LayoutNode = {
      id,
      node,
      x,
      y,
      width: cardWidth,
      height: cardHeight,
      level
    };

    layoutMap.set(id, layoutNode);
    layoutList.push(layoutNode);

    // Layout children
    let currentChildOffset = offset;
    children.forEach(child => {
      layoutNodeRecursive(child, level + 1, currentChildOffset);
      currentChildOffset += (subtreeWidths.get(child.id) || 0) + siblingGap;
    });
  }

  // Layout all roots side-by-side
  let currentRootOffset = 20;
  roots.forEach(root => {
    layoutNodeRecursive(root, 0, currentRootOffset);
    currentRootOffset += (subtreeWidths.get(root.id) || 0) + siblingGap * 2;
  });

  // Calculate connectors
  const connectors: Connector[] = [];
  nodes.forEach(node => {
    if (node.managerId && layoutMap.has(node.managerId) && layoutMap.has(node.id)) {
      const parent = layoutMap.get(node.managerId)!;
      const child = layoutMap.get(node.id)!;

      let from = { x: 0, y: 0 };
      let to = { x: 0, y: 0 };

      if (direction === 'TB') {
        // From bottom middle of parent to top middle of child
        from = { x: snap(parent.x + cardWidth / 2), y: snap(parent.y + cardHeight) };
        to = { x: snap(child.x + cardWidth / 2), y: snap(child.y) };
      } else {
        // From right middle of parent to left middle of child
        from = { x: snap(parent.x + cardWidth), y: snap(parent.y + cardHeight / 2) };
        to = { x: snap(child.x), y: snap(child.y + cardHeight / 2) };
      }

      connectors.push({
        id: `conn-${parent.id}-${child.id}`,
        from,
        to,
        fromNodeId: parent.id,
        toNodeId: child.id,
        relationship: child.node.relationship
      });
    }
  });

  // Determine canvas bounds to set panning constraints or container sizing
  let maxX = 500;
  let maxY = 500;
  layoutList.forEach(n => {
    maxX = Math.max(maxX, n.x + cardWidth + 100);
    maxY = Math.max(maxY, n.y + cardHeight + 100);
  });

  return {
    layoutNodes: layoutList,
    connectors,
    canvasSize: { width: maxX, height: maxY }
  };
}
