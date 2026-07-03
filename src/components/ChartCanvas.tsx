/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Minus,
  Edit3, 
  MapPin, 
  UserPlus, 
  User, 
  Clock, 
  Mail, 
  HelpCircle,
  Sparkles,
  Link2,
  Trash2,
  Building2,
  Briefcase,
  ChevronRight,
  ChevronDown,
  Scale,
  Calculator,
  Megaphone,
  Monitor,
  BarChart2,
  Users,
  ShieldCheck
} from 'lucide-react';
import { ContactNode, ChartSettings } from '../types';
import { calculateLayout, LayoutNode, Connector } from '../utils/layout';
import { customPatterns } from '../wallpapers';

interface ChartCanvasProps {
  nodes: ContactNode[];
  settings: ChartSettings;
  searchQuery: string;
  panX: number;
  panY: number;
  zoomScale: number;
  onSetPanX: (x: number) => void;
  onSetPanY: (y: number) => void;
  onSetZoom: (scale: number) => void;
  onSelectNode: (node: ContactNode) => void;
  selectedNode: ContactNode | null;
  onEditNode: (node: ContactNode) => void;
  onAddDirectReport: (parentId: string) => void;
  onReparentNode: (nodeId: string, newManagerId: string | null) => void;
  expandedNodes: Set<string>;
  setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
}

import { NODE_THEMES, getThemeById } from '../theme';

const getDeptTheme = (node: ContactNode) => {
  const isFunctionNode = node.title === 'Nhánh chức năng';
  
  // If explicitly selected color:
  if (node.themeColor) {
    const matched = getThemeById(node.themeColor);
    if (matched) return isFunctionNode ? matched.sub : matched.main;
  }
  
  // Fallback to hashing department name
  const dept = node.department;
  if (!dept) return isFunctionNode ? NODE_THEMES[0].sub : NODE_THEMES[0].main;
  
  let hash = 0;
  for (let i = 0; i < dept.length; i++) {
    hash = dept.charCodeAt(i) + ((hash << 5) - hash);
  }
  const theme = NODE_THEMES[Math.abs(hash) % NODE_THEMES.length];
  return isFunctionNode ? theme.sub : theme.main;
};


const getTitleIcon = (text: string) => {
  if (!text) return null;
  const t = text.toLowerCase();
  if (t.includes('pháp chế') || t.includes('legal')) return <Scale className="w-3.5 h-3.5 shrink-0 text-current opacity-75" />;
  if (t.includes('kế toán') || t.includes('tài chính') || t.includes('finance')) return <Calculator className="w-3.5 h-3.5 shrink-0 text-current opacity-75" />;
  if (t.includes('marketing') || t.includes('truyền thông')) return <Megaphone className="w-3.5 h-3.5 shrink-0 text-current opacity-75" />;
  if (t.includes('nhân sự') || t.includes('hr')) return <Users className="w-3.5 h-3.5 shrink-0 text-current opacity-75" />;
  if (t.includes('it') || t.includes('công nghệ') || t.includes('kỹ thuật')) return <Monitor className="w-3.5 h-3.5 shrink-0 text-current opacity-75" />;
  if (t.includes('kinh doanh') || t.includes('sales') || t.includes('bán hàng')) return <BarChart2 className="w-3.5 h-3.5 shrink-0 text-current opacity-75" />;
  if (t.includes('giám đốc') || t.includes('ceo') || t.includes('quản lý') || t.includes('trưởng')) return <Briefcase className="w-3.5 h-3.5 shrink-0 text-current opacity-75" />;
  if (t.includes('bảo vệ') || t.includes('an ninh')) return <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-current opacity-75" />;
  return null;
};
export default function ChartCanvas({
  nodes,
  settings,
  searchQuery,
  panX,
  panY,
  zoomScale,
  onSetPanX,
  onSetPanY,
  onSetZoom,
  onSelectNode,
  selectedNode,
  onEditNode,
  onAddDirectReport,
  onReparentNode,
  expandedNodes,
  setExpandedNodes
}: ChartCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showHint, setShowHint] = useState(true);

  // 30 Seconds Auto Hide Timer for floating interactive advice / help panel
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 30000);
    return () => clearTimeout(timer);
  }, []);
  
  // Drag & Drop visual drag over highlight states
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);

  // Snap-to-Grid dimension configuration
  const GRID_SIZE = 20;

  const getCanvasStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      transition: 'background-color 0.3s ease'
    };
    
    // Always transparent for the base canvas so the website wallpaper shows through,
    // unless we are specifically dragging, then we might want a slight tint.
    baseStyle.backgroundColor = draggedNodeId ? 'rgba(241, 245, 249, 0.5)' : 'transparent';
    if (settings.backgroundType === 'grid') {
      baseStyle.backgroundImage = `
        linear-gradient(to right, ${draggedNodeId ? '#cbd5e1' : '#e2e8f0'} 1px, transparent 1px),
        linear-gradient(to bottom, ${draggedNodeId ? '#cbd5e1' : '#e2e8f0'} 1px, transparent 1px)
      `;
      baseStyle.backgroundSize = `${GRID_SIZE * zoomScale}px ${GRID_SIZE * zoomScale}px`;
      baseStyle.backgroundPosition = `${panX}px ${panY}px`;
    }
    return baseStyle;
  };

  // Build Children Map to determine hasChildren and visible nodes
  const childrenMap = new Map<string, ContactNode[]>();
  const rootNodes: ContactNode[] = [];
  const validNodeIds = new Set(nodes.map(n => n.id));

  nodes.forEach(n => {
    if (n.managerId && validNodeIds.has(n.managerId)) {
      if (!childrenMap.has(n.managerId)) childrenMap.set(n.managerId, []);
      childrenMap.get(n.managerId)!.push(n);
    } else {
      rootNodes.push(n);
    }
  });

  const isSearchActive = searchQuery.trim().length > 0;
  
  // Filter visible nodes based on expanded state or search query
  const getVisibleNodes = () => {
    if (isSearchActive) {
      // In search mode, show everything or maybe just the hierarchy
      return nodes;
    }
    
    const visible: ContactNode[] = [];
    const stack = [...rootNodes];
    
    while (stack.length > 0) {
      const current = stack.shift()!;
      visible.push(current);
      
      if (expandedNodes.has(current.id)) {
        const children = childrenMap.get(current.id) || [];
        // Add children to the beginning to maintain depth-first if desired, 
        // but for just collection it doesn't matter.
        stack.push(...children);
      }
    }
    return visible;
  };

  const visibleNodes = getVisibleNodes();

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Generate tree layouts based on settings using visibleNodes
  const { layoutNodes, connectors } = calculateLayout(
    visibleNodes,
    settings.layoutDirection,
    280, // Card Width (grid aligned)
    settings.cardSize === 'detailed' ? 140 : 80, // Card Height (grid aligned)
    120, // Level Spacing (snaps directly centered on 60px half-gap)
    40,  // Sibling Spacing (grid aligned)
    GRID_SIZE
  );

  // Filter positions based on active search criteria
  const isMatch = (node: ContactNode): boolean => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    
    const fieldsToSearch = [
      node.name,
      node.title,
      node.department,
      node.email,
      node.phone,
      node.relationship,
      node.influence,
      node.notes || ''
    ];

    if (node.customFields) {
      Object.values(node.customFields).forEach(val => {
        fieldsToSearch.push(val);
      });
    }

    return fieldsToSearch.some(f => f.toLowerCase().includes(q));
  };

  // Canvas Mouse events for board panning
  const handleMouseDown = (e: React.MouseEvent) => {
    // Left click only + not clicking a card button or interactive elements
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-card') || target.closest('button') || target.closest('select')) return;

    setIsPanning(true);
    setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    onSetPanX(e.clientX - panStart.x);
    onSetPanY(e.clientY - panStart.y);
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Wheel zooming around board
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.05;
    let nextScale = zoomScale;
    if (e.deltaY < 0) {
      nextScale = Math.min(2.0, zoomScale + zoomFactor);
    } else {
      nextScale = Math.max(0.2, zoomScale - zoomFactor);
    }
    onSetZoom(nextScale);
  };

  // Drag-and-drop hierarchy adjustments handlers
  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    setDraggedNodeId(nodeId);
    e.dataTransfer.setData('text/plain', nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    // Do not allow dragging a node onto itself or into a self circular report
    if (draggedNodeId === nodeId) return;
    setDragOverNodeId(nodeId);
  };

  const handleDragLeave = () => {
    setDragOverNodeId(null);
  };

  const handleDrop = (e: React.DragEvent, targetManagerId: string) => {
    e.preventDefault();
    const sourceNodeId = e.dataTransfer.getData('text/plain');
    setDragOverNodeId(null);
    setDraggedNodeId(null);

    if (sourceNodeId && sourceNodeId !== targetManagerId) {
      onReparentNode(sourceNodeId, targetManagerId);
      setExpandedNodes(prev => {
        const next = new Set(prev);
        next.add(targetManagerId);
        return next;
      });
    }
  };

  const handleDropToCanvasBackground = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceNodeId = e.dataTransfer.getData('text/plain');
    setDragOverNodeId(null);
    setDraggedNodeId(null);

    if (sourceNodeId) {
      // Re-parent to null means they become independent tree leader nodes!
      onReparentNode(sourceNodeId, null);
    }
  };

  return (
    <div 
      id="canvas-boundary"
      ref={canvasRef}
      className={`flex-1 relative overflow-hidden h-full cursor-grab ${isPanning ? 'cursor-grabbing select-none' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropToCanvasBackground}
      style={getCanvasStyle()}
    >
      {/* Zoomable Whiteboard Transform Layer */}
      <div 
        id="canvas-workspace"
        className="absolute origin-top-left transition-all duration-75"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoomScale})`
        }}
      >
        
        {/* SVG Bezier Connector Pathways */}
        <svg 
          id="connector-paths-svg" 
          className="absolute inset-0 pointer-events-none overflow-visible"
          style={{ width: '100%', height: '100%', minWidth: '4000px', minHeight: '4000px' }}
        >
          <g>
            {connectors.map((c) => {
              // Path Generation depending on Selected Style
              const dx = c.to.x - c.from.x;
              const dy = c.to.y - c.from.y;
              let pathStr = '';

              const currentStyle = settings.connectorStyle || 'smooth';

              if (currentStyle === 'straight') {
                // Direct straight connection line
                pathStr = `M ${c.from.x} ${c.from.y} L ${c.to.x} ${c.to.y}`;
              } else if (currentStyle === 'squared') {
                // Stepped orthogonal squared corner line
                if (settings.layoutDirection === 'TB') {
                  const midY = c.from.y + dy * 0.5;
                  pathStr = `M ${c.from.x} ${c.from.y} L ${c.from.x} ${midY} L ${c.to.x} ${midY} L ${c.to.x} ${c.to.y}`;
                } else {
                  const midX = c.from.x + dx * 0.5;
                  pathStr = `M ${c.from.x} ${c.from.y} L ${midX} ${c.from.y} L ${midX} ${c.to.y} L ${c.to.x} ${c.to.y}`;
                }
              } else if (currentStyle === 'rounded') {
                // Orthogonal with rounded corners (10px radius)
                const r = Math.min(10, Math.abs(dx) / 2, Math.abs(dy) / 2);
                const dirX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
                const dirY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
                
                if (r === 0) {
                  if (settings.layoutDirection === 'TB') {
                    const midY = c.from.y + dy * 0.5;
                    pathStr = `M ${c.from.x} ${c.from.y} L ${c.from.x} ${midY} L ${c.to.x} ${midY} L ${c.to.x} ${c.to.y}`;
                  } else {
                    const midX = c.from.x + dx * 0.5;
                    pathStr = `M ${c.from.x} ${c.from.y} L ${midX} ${c.from.y} L ${midX} ${c.to.y} L ${c.to.x} ${c.to.y}`;
                  }
                } else {
                  if (settings.layoutDirection === 'TB') {
                    const midY = c.from.y + dy * 0.5;
                    pathStr = `M ${c.from.x} ${c.from.y} L ${c.from.x} ${midY - r * dirY} Q ${c.from.x} ${midY} ${c.from.x + r * dirX} ${midY} L ${c.to.x - r * dirX} ${midY} Q ${c.to.x} ${midY} ${c.to.x} ${midY + r * dirY} L ${c.to.x} ${c.to.y}`;
                  } else {
                    const midX = c.from.x + dx * 0.5;
                    pathStr = `M ${c.from.x} ${c.from.y} L ${midX - r * dirX} ${c.from.y} Q ${midX} ${c.from.y} ${midX} ${c.from.y + r * dirY} L ${midX} ${c.to.y - r * dirY} Q ${midX} ${c.to.y} ${midX + r * dirX} ${c.to.y} L ${c.to.x} ${c.to.y}`;
                  }
                }
              } else {
                // Smooth S-Curve Bezier (Default)
                if (settings.layoutDirection === 'TB') {
                  const midY = c.from.y + dy * 0.5;
                  pathStr = `M ${c.from.x} ${c.from.y} C ${c.from.x} ${midY}, ${c.to.x} ${midY}, ${c.to.x} ${c.to.y}`;
                } else {
                  const midX = c.from.x + dx * 0.5;
                  pathStr = `M ${c.from.x} ${c.from.y} C ${midX} ${c.from.y}, ${midX} ${c.to.y}, ${c.to.x} ${c.to.y}`;
                }
              }

              // Determine classes for coloring connectors
              let colorStroke = '#cbd5e1'; // slate standard
              let connectorClass = 'org-line';
              
              if (settings.showRelationshipColors) {
                if (c.relationship === 'champion') {
                  colorStroke = '#10b981'; // green champion
                  connectorClass += ' champion';
                } else if (c.relationship === 'supporter') {
                  colorStroke = '#3b82f6'; // blue supporter
                  connectorClass += ' supporter';
                } else if (c.relationship === 'detractor') {
                  colorStroke = '#f59e0b'; // orange detractor
                  connectorClass += ' detractor';
                } else if (c.relationship === 'blocker') {
                  colorStroke = '#ef4444'; // red blocker
                  connectorClass += ' blocker';
                }
              }

              const isFocused = selectedNode?.id === c.toNodeId || selectedNode?.id === c.fromNodeId;

              return (
                <path 
                  id={c.id}
                  key={c.id}
                  d={pathStr}
                  className={connectorClass}
                  style={{
                    stroke: isFocused ? settings.themeColor : colorStroke,
                    strokeWidth: isFocused ? 2.5 : undefined,
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round',
                    opacity: searchQuery && (!isMatch(nodes.find(n => n.id === c.toNodeId)!) || !isMatch(nodes.find(n => n.id === c.fromNodeId)!)) ? 0.2 : 0.85
                  }}
                />
              );
            })}
          </g>
        </svg>

        {/* Floating Node Cards list */}
        <div id="nodes-canvas-container" className="absolute top-0 left-0">
          {layoutNodes.map((ln) => {
            const isSelected = selectedNode?.id === ln.id;
            const matchesSearch = isMatch(ln.node);
            const isTargetedForDrag = dragOverNodeId === ln.id;
            const isBeingDragged = draggedNodeId === ln.id;

            // Relationship color banding mappings
            const getRelColor = (rel: string) => {
              switch (rel) {
                case 'champion': return { top: 'bg-emerald-500', bg: 'bg-emerald-50/20', text: 'text-emerald-700', border: 'border-emerald-200' };
                case 'supporter': return { top: 'bg-blue-500', bg: 'bg-blue-50/20', text: 'text-blue-700', border: 'border-blue-200' };
                case 'detractor': return { top: 'bg-amber-500', bg: 'bg-amber-50/20', text: 'text-amber-700', border: 'border-amber-200' };
                case 'blocker': return { top: 'bg-red-500', bg: 'bg-red-50/20', text: 'text-red-700', border: 'border-red-200' };
                default: return { top: 'bg-slate-400', bg: 'bg-slate-50/40', text: 'text-slate-600', border: 'border-slate-200' };
              }
            };
            
            const rc = getRelColor(ln.node.relationship);

            // Fetch dynamic display label cards
            const getFieldVal = (key: string) => {
              if (key === 'name') return ln.node.name;
              if (key === 'title') return ln.node.title;
              if (key === 'department') return ln.node.department;
              if (key === 'email') return ln.node.email;
              return ln.node.customFields?.[key] || '';
            };

            const headerField = getFieldVal(settings.primaryField);
            const subField = getFieldVal(settings.secondaryField);
            const badgeField = getFieldVal(settings.tertiaryField);

            // User initials generator
            const initials = ln.node.isPlaceholder 
              ? '??'
              : ln.node.name.split(' ').map(n => n[0]).slice(0, 2).join('');

            const childCount = childrenMap.get(ln.id)?.length || 0;
            const hasChildren = childCount > 0;
            const isExpanded = expandedNodes.has(ln.id);

            const deptTheme = getDeptTheme(ln.node);
            
            return (
              <motion.div layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                id={`card-${ln.id}`}
                key={ln.id}
                draggable
                onDragStart={(e) => handleDragStart(e, ln.id)}
                onDragOver={(e) => handleDragOver(e, ln.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, ln.id)}
                onClick={() => onSelectNode(ln.node)}
                onDoubleClick={() => onEditNode(ln.node)}
                className={`interactive-card absolute rounded-[10px] text-xs flex flex-col group float-3d ${
                  ln.node.isPlaceholder
                    ? 'bg-amber-50 shadow-md'
                    : 'bg-white shadow-md'
                } ${
                  isSelected 
                    ? 'ring-2 ring-indigo-500/30 scale-[1.01] shadow-xl' 
                    : 'hover:shadow-xl hover:-translate-y-0.5'
                } ${
                  matchesSearch ? 'opacity-100 scale-100' : 'opacity-20 scale-95 pointer-events-none'
                } ${
                  isTargetedForDrag ? 'ring-4 ring-dashed ring-blue-500 bg-blue-50/60 scale-105' : ''
                } ${
                  isBeingDragged ? 'opacity-40 animate-pulse' : ''
                }`}
                style={{
                  left: ln.x,
                  top: ln.y,
                  width: ln.width,
                  height: ln.height,
                  cursor: 'grab',
                  backgroundColor: ln.node.isPlaceholder 
                    ? `rgba(254, 252, 232, ${(settings.cardTransparency ?? 100) / 100})`
                    : `rgba(255, 255, 255, ${(settings.cardTransparency ?? 100) / 100})`
                }}
              >
                
                {/* 1. Card Top Accent Ribbon */}
                {settings.showRelationshipColors ? (
                  <div className={`h-1.5 w-full rounded-t-[8px] shrink-0 ${ln.node.isDepartment ? deptTheme.top : rc.top}`} id={`card-ribbon-${ln.id}`} />
                ) : (
                  <div className="h-1.5 w-full rounded-t-[8px] shrink-0 bg-slate-300" id={`card-ribbon-${ln.id}`} style={{ backgroundColor: settings.themeColor }} />
                )}

                {/* 2. Card Interior Layout */}
                <div className="flex-1 p-[15px] flex flex-col justify-between relative">
                  
                  {/* Avatar + Main text panel */}
                  <div className="flex gap-3 items-start min-w-0">
                    
                    {/* Circle initials / Vacancy layout */}
                    {settings.showAvatars && (
                      <div 
                        id={`card-avatar-${ln.id}`}
                        className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden font-bold text-[11px] shrink-0 uppercase select-none ${
                          ln.node.isDepartment
                            ? `${deptTheme.iconBg} border ${deptTheme.iconBorder} ${deptTheme.iconText}`
                            : ln.node.isPlaceholder 
                            ? 'bg-slate-100 border border-dashed border-slate-300 text-slate-400' 
                            : `${settings.showRelationshipColors ? rc.bg : 'bg-slate-50'} ${settings.showRelationshipColors ? rc.text : 'text-slate-700'} border ${settings.showRelationshipColors ? rc.border : 'border-slate-200'}`
                        }`}
                      >
                        {ln.node.isDepartment ? (
                          <Building2 className={`w-5 h-5 ${deptTheme.iconText}`} />
                        ) : ln.node.isPlaceholder ? (
                          <span className="text-[10px] font-black">OPEN</span>
                        ) : ln.node.avatarUrl ? (
                          <img 
                            src={ln.node.avatarUrl} 
                            alt={ln.node.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          initials
                        )}
                      </div>
                    )}

                    {/* Text block */}
                    <div className="min-w-0 flex-1">
                      <h4 
                        id={`card-header-${ln.id}`}
                        className={`font-semibold tracking-tight text-slate-900 truncate leading-snug font-display ${
                          settings.cardSize === 'compact' ? 'text-xs' : 'text-[13px]'
                        }`}
                      >
                        {headerField}
                      </h4>
                      {ln.node.isDepartment ? (
                        <p id={`card-subfield-${ln.id}`} className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-sm inline-flex leading-none mt-0.5 uppercase tracking-wider ${deptTheme.iconText} ${deptTheme.iconBg}`}>
                          {getTitleIcon(ln.node.title || 'Phòng Ban')}<span>{ln.node.title || 'Phòng Ban'}</span>
                        </p>
                      ) : (
                        <p id={`card-subfield-${ln.id}`} className="text-[10.5px] text-slate-500 font-semibold truncate leading-tight mt-0.5">
                          {getTitleIcon(subField)}<span>{subField}</span>
                        </p>
                      )}
                    </div>

                    {/* Quick Edit button (Hover only) */}
                    <button
                      id={`card-btn-edit-${ln.id}`}
                      type="button"
                      title="Edit stakeholder parameters"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditNode(ln.node);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 bg-white/80 backdrop-blur-xs hover:bg-slate-100 text-slate-600 rounded border border-slate-200/50 shadow-xs transition-all cursor-pointer absolute right-3 mt-0.5"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* 3. Detailed Card Extras Panel */}
                  {settings.cardSize === 'detailed' && (
                    ln.node.isDepartment ? (
                      <div className={`border-t pt-2 flex flex-col justify-start mt-2 shrink-0 gap-0.5 overflow-hidden ${deptTheme.iconBorder}`}>
                        <span className={`text-[8px] font-bold uppercase tracking-wider block ${deptTheme.iconText}`}>Chức năng & Nhiệm vụ:</span>
                        <p className="text-[10px] text-slate-600 leading-normal font-medium line-clamp-3">
                          {ln.node.notes || 'Chưa cập nhật mô tả chức năng nhiệm vụ...'}
                        </p>
                      </div>
                    ) : (
                      <div className="border-t border-slate-100/80 pt-2.5 flex items-center justify-between mt-auto shrink-0 gap-2">
                        <div className="flex gap-1 items-center min-w-0">
                          {/* Render Badge field if active */}
                          {badgeField && (
                            <span 
                              id={`card-badge-${ln.id}`}
                              className="bg-slate-100/90 text-[9.5px] font-semibold text-slate-600 px-1.5 py-0.5 rounded-md truncate max-w-[120px]"
                            >
                              {badgeField}
                            </span>
                          )}
                          
                          {/* Influence dot indicator */}
                          {settings.visibleFields.includes('influence') && ln.node.influence !== 'none' && (
                            <span 
                              id={`card-influence-badge-${ln.id}`}
                              className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                ln.node.influence === 'high' ? 'bg-red-50 text-red-600 border border-red-200' :
                                ln.node.influence === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-250' : 
                                'bg-green-50 text-green-600 border border-green-200'
                              }`}
                            >
                              Ảnh hưởng: {ln.node.influence === 'high' ? 'Cao' : ln.node.influence === 'medium' ? 'T.Bình' : 'Thấp'}
                            </span>
                          )}
                        </div>

                        {/* Relationship Pill badge label */}
                        {settings.visibleFields.includes('relationship') && (
                          <span 
                            id={`card-rel-badge-${ln.id}`}
                            className={`text-[9px] font-extrabold uppercase leading-none px-1.5 py-0.5 rounded ${
                              ln.node.relationship === 'champion' ? 'bg-emerald-500/10 text-emerald-600' :
                              ln.node.relationship === 'supporter' ? 'bg-blue-500/10 text-blue-600' :
                              ln.node.relationship === 'detractor' ? 'bg-amber-500/10 text-amber-600' :
                              ln.node.relationship === 'blocker' ? 'bg-red-500/10 text-red-600' :
                              'bg-slate-300/30 text-slate-550'
                            }`}
                          >
                            {ln.node.relationship === 'champion' ? 'Ủng hộ cốt lõi' :
                             ln.node.relationship === 'supporter' ? 'Ủng hộ' :
                             ln.node.relationship === 'neutral' ? 'Trung lập' :
                             ln.node.relationship === 'detractor' ? 'Phản đối' :
                             ln.node.relationship === 'blocker' ? 'Cản trở' :
                             ln.node.relationship}
                          </span>
                        )}
                      </div>
                    )
                  )}

                  {/* 4. Canvas Floating Quick Linker tools & Expand Toggle */}
                  {hasChildren && !isSearchActive && (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(ln.id, e)}
                      className={`absolute pointer-events-auto z-20 ${settings.layoutDirection === 'LR' ? '-right-8 top-1/2 -translate-y-1/2' : '-bottom-8 left-1/2 -translate-x-1/2'} bg-white text-slate-700 rounded-full w-6 h-6 border border-slate-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md shadow-sm transition-all focus:outline-none flex items-center justify-center cursor-pointer ${
                        !isExpanded ? 'ring-2 ring-indigo-500/30 shadow-md bg-indigo-50 text-indigo-700' : ''
                      }`}
                      title={isExpanded ? 'Thu gọn' : `Mở rộng (${childCount})`}
                    >
                      {isExpanded 
                        ? (settings.layoutDirection === 'LR' ? <ChevronRight className="w-4 h-4 rotate-180" /> : <ChevronDown className="w-4 h-4 rotate-180" />) 
                        : (settings.layoutDirection === 'LR' ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)
                      }
                    </button>
                  )}
                  <button
                    id={`card-quick-report-${ln.id}`}
                    type="button"
                    title="Thêm nhanh báo cáo cấp dưới"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedNodes(prev => {
                        const next = new Set(prev);
                        next.add(ln.id);
                        return next;
                      });
                      onAddDirectReport(ln.id);
                    }}
                    className={`absolute pointer-events-auto z-10 ${settings.layoutDirection === 'LR' ? '-right-8 top-1/2 -translate-y-1/2 translate-y-8' : '-bottom-8 left-1/2 -translate-x-1/2 translate-x-8'} opacity-0 group-hover:opacity-100 bg-blue-600 text-white rounded-full w-6 h-6 border-2 border-white hover:bg-blue-700 hover:shadow-lg shadow-md transition-all scale-90 hover:scale-110 cursor-pointer flex items-center justify-center`}
                  >
                    <Plus className="w-4 h-4" />
                  <Plus className="w-4 h-4" />
                  </button>
                  {childCount > 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-30 pointer-events-none">
                      {childCount}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Floating interactive advice overlay when searching / panning */}
      {showHint && (
        <div id="whiteboard-grid-hint" className="absolute bottom-4 right-4 bg-white/95 border border-slate-200/50 backdrop-blur-md text-[10px] text-slate-500 p-3 rounded-xl pointer-events-none shadow-lg font-sans select-none flex flex-col gap-1 leading-snug animate-fade-in transition-all duration-500 z-50 max-w-sm">
          <span className="font-extrabold text-slate-700 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
            Hướng dẫn điều khiển (Tự động ẩn sau 30s):
          </span>
          <span>• <b>Kéo thả chuột trái:</b> Di chuyển vùng vẽ</span>
          <span>• <b>Cuộn chuột (Wheel):</b> Phóng to / Thu nhỏ sơ đồ</span>
          <span>• <b>Kéo & Thả thẻ:</b> Thay đổi tuyến báo cáo</span>
          <span>• <b>Nhấp đúp chuột:</b> Thay đổi thông tin</span>
        </div>
      )}
    </div>
  );
}
