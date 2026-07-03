/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Settings, 
  HelpCircle, 
  RotateCcw, 
  Award,
  Link,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot, collection, serverTimestamp, writeBatch, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { useAuth } from './lib/AuthContext';

import { ContactNode, ChartSettings, GoalItem } from './types';
import { customPatterns } from "./wallpapers";
import { DEFAULT_NODES, DEFAULT_SETTINGS } from './defaultData';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import ChartCanvas from './components/ChartCanvas';
import ContactEditor from './components/ContactEditor';
import SelectedNodePopup from './components/SelectedNodePopup';
import PersonnelManager from './components/PersonnelManager';

export default function App() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<ContactNode[]>([]);
  const [settings, setSettings] = useState<ChartSettings>(DEFAULT_SETTINGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'card'>('chart');

  // --- WHITEBOARD GRAPH NAVIGATION STATES ---
  const [panX, setPanX] = useState(60);
  const [panY, setPanY] = useState(40);
  const [zoomScale, setZoomScale] = useState(0.9);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleExpandAll = () => {
    setExpandedNodes(new Set(nodes.map(n => n.id)));
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
  };

  const handleSetExpandLevel = (level: number) => {
    const depthMap = new Map<string, number>();
    const childrenMap = new Map<string, string[]>();
    const roots: string[] = [];
    const validIds = new Set(nodes.map(n => n.id));
    
    nodes.forEach(n => {
      if (n.managerId && validIds.has(n.managerId)) {
        if (!childrenMap.has(n.managerId)) childrenMap.set(n.managerId, []);
        childrenMap.get(n.managerId)!.push(n.id);
      } else {
        roots.push(n.id);
      }
    });

    const stack: { id: string, depth: number }[] = roots.map(id => ({ id, depth: 1 }));
    while (stack.length > 0) {
      const current = stack.shift()!;
      depthMap.set(current.id, current.depth);
      const children = childrenMap.get(current.id) || [];
      for (const child of children) {
        stack.push({ id: child, depth: current.depth + 1 });
      }
    }

    const next = new Set<string>();
    nodes.forEach(n => {
      const d = depthMap.get(n.id);
      if (d !== undefined && d <= level) {
        // Expand nodes up to the specified level (meaning show their children)
        // If a node is at level, we want its children to be visible, so it should be expanded.
        // Wait, if we want to show level 2, root is level 1, its children are level 2.
        // So root should be expanded to show level 2.
        // To show up to level L, we expand all nodes at depth < L.
        if (d < level) {
          next.add(n.id);
        }
      }
    });
    setExpandedNodes(next);
  };

  const handleCollapseOneLevel = () => {
    const depthMap = new Map<string, number>();
    const childrenMap = new Map<string, string[]>();
    const roots: string[] = [];
    const validIds = new Set(nodes.map(n => n.id));
    
    nodes.forEach(n => {
      if (n.managerId && validIds.has(n.managerId)) {
        if (!childrenMap.has(n.managerId)) childrenMap.set(n.managerId, []);
        childrenMap.get(n.managerId)!.push(n.id);
      } else {
        roots.push(n.id);
      }
    });

    const stack: { id: string, depth: number }[] = roots.map(id => ({ id, depth: 0 }));
    while (stack.length > 0) {
      const current = stack.shift()!;
      depthMap.set(current.id, current.depth);
      const children = childrenMap.get(current.id) || [];
      for (const child of children) {
        stack.push({ id: child, depth: current.depth + 1 });
      }
    }

    let maxDepth = -1;
    expandedNodes.forEach(id => {
      const d = depthMap.get(id);
      if (d !== undefined && d > maxDepth) {
        maxDepth = d;
      }
    });

    if (maxDepth >= 0) {
      const next = new Set(expandedNodes);
      expandedNodes.forEach(id => {
        if (depthMap.get(id) === maxDepth) {
          next.delete(id);
        }
      });
      setExpandedNodes(next);
    }
  };

  const handleCenterView = () => {
    setPanX(40);
    setPanY(40);
    setZoomScale(0.85);
  };

  // --- INTERACTIVE PROFILE EDITOR STATES ---
  const [selectedNode, setSelectedNode] = useState<ContactNode | null>(null);
  const [editorNode, setEditorNode] = useState<ContactNode | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [suggestedParentId, setSuggestedParentId] = useState<string | null>(null);

  // Firebase references
  const getChartRef = () => user ? doc(db, 'orgCharts', user.uid) : null;
  const getNodesRef = () => user ? collection(db, 'orgCharts', user.uid, 'nodes') : null;

  // Load baseline on startup
  useEffect(() => {
    if (!user) {
      // Local storage cache retrieval for persistence
      const cachedNodes = localStorage.getItem('orgchart_cached_nodes_v3');
      const cachedSettings = localStorage.getItem('orgchart_cached_settings_v3');
      
      if (cachedNodes && cachedSettings) {
        try {
          setNodes(JSON.parse(cachedNodes));
          setSettings(JSON.parse(cachedSettings));
        } catch (err) {
          setNodes(DEFAULT_NODES);
          setSettings(DEFAULT_SETTINGS);
        }
      } else {
        setNodes(DEFAULT_NODES);
        setSettings(DEFAULT_SETTINGS);
      }
      return;
    }

    // Authenticated Sync
    const chartRef = getChartRef();
    const nodesRef = getNodesRef();
    if (!chartRef || !nodesRef) return;

    let initMode = false;
    
    // Subscribe to chart settings
    const unsubChart = onSnapshot(chartRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.settings) setSettings(data.settings as ChartSettings);
      } else {
        // Create initial
        if (!initMode) {
          initMode = true;
          const initialNodes = localStorage.getItem('orgchart_cached_nodes_v3') 
            ? JSON.parse(localStorage.getItem('orgchart_cached_nodes_v3')!) 
            : DEFAULT_NODES;
          const initialSettings = localStorage.getItem('orgchart_cached_settings_v3') 
            ? JSON.parse(localStorage.getItem('orgchart_cached_settings_v3')!) 
            : DEFAULT_SETTINGS;
            
          setDoc(chartRef, {
            ownerId: user.uid,
            settings: initialSettings,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }).catch(e => handleFirestoreError(e, OperationType.CREATE, chartRef.path));

          // Batch add nodes
          const batch = writeBatch(db);
          initialNodes.forEach((node: ContactNode) => {
            const nodeDoc = doc(nodesRef, node.id);
            batch.set(nodeDoc, {
              ...node,
              ownerId: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          });
          batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, nodesRef.path));
        }
      }
    }, (e) => handleFirestoreError(e, OperationType.GET, chartRef.path));

    // Subscribe to nodes collection
    const unsubNodes = onSnapshot(nodesRef, (snapshot) => {
      const netNodes: ContactNode[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        netNodes.push({
          id: docSnap.id,
          name: data.name,
          title: data.title,
          department: data.department,
          email: data.email,
          phone: data.phone,
          managerId: data.managerId,
          relationship: data.relationship,
          influence: data.influence,
          notes: data.notes,
          isPlaceholder: data.isPlaceholder,
          isDepartment: data.isDepartment,
          customFields: data.customFields || {},
          avatarUrl: data.avatarUrl || '',
          goals: data.goals || []
        });
      });
      setNodes(netNodes);
    }, (e) => handleFirestoreError(e, OperationType.LIST, nodesRef.path));

    return () => {
      unsubChart();
      unsubNodes();
    };
  }, [user]);

  // Save changes to cache representation
  const saveToCache = async (updatedNodes: ContactNode[], updatedSettings: ChartSettings) => {
    localStorage.setItem('orgchart_cached_nodes_v3', JSON.stringify(updatedNodes));
    localStorage.setItem('orgchart_cached_settings_v3', JSON.stringify(updatedSettings));
    
    if (user) {
      const chartRef = getChartRef();
      if (chartRef) {
        try {
          await setDoc(chartRef, {
            ownerId: user.uid,
            settings: updatedSettings,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, chartRef.path);
        }
      }
    }
  };

  const syncNodeToFirestore = async (node: ContactNode) => {
    if (!user) return;
    const nodesRef = getNodesRef();
    if (nodesRef) {
      try {
        const nodeDoc = doc(nodesRef, node.id);
        const existingDoc = await getDoc(nodeDoc);
        if (existingDoc.exists()) {
          await setDoc(nodeDoc, {
            ...node,
            ownerId: user.uid,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } else {
          await setDoc(nodeDoc, {
            ...node,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `nodes/${node.id}`);
      }
    }
  };

  const deleteNodeFromFirestore = async (nodeId: string) => {
    if (!user) return;
    const nodesRef = getNodesRef();
    if (nodesRef) {
      try {
        await deleteDoc(doc(nodesRef, nodeId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `nodes/${nodeId}`);
      }
    }
  };

  const handleUpdateSettings = (updated: ChartSettings) => {
    if (!user) {
      setSettings(updated);
    }
    saveToCache(nodes, updated);
  };

  // --- NODE CRUD HANDLERS ---
  const handleAddDirectReport = (parentId: string) => {
    setSuggestedParentId(parentId);
    setEditorNode(null); // Creating fresh
    setIsEditorOpen(true);
  };

  const handleCreateFreshMember = () => {
    setSuggestedParentId(null);
    setEditorNode(null);
    setIsEditorOpen(true);
  };

  const handleSelectNode = (node: ContactNode | null) => {
    setSelectedNode(node);
  };

  const handleEditNodeTrigger = (node: ContactNode) => {
    setEditorNode(node);
    setIsEditorOpen(true);
  };

  const handleSaveNode = (nodeToSave: ContactNode) => {
    let updatedNodesList: ContactNode[];
    const alreadyExists = nodes.some(n => n.id === nodeToSave.id);

    if (alreadyExists) {
      updatedNodesList = nodes.map(n => n.id === nodeToSave.id ? nodeToSave : n);
    } else {
      updatedNodesList = [...nodes, nodeToSave];
    }

    if (!user) {
      setNodes(updatedNodesList);
      saveToCache(updatedNodesList, settings);
    } else {
      // Optimistic update
      setNodes(updatedNodesList);
      syncNodeToFirestore(nodeToSave);
    }

    if (selectedNode && selectedNode.id === nodeToSave.id) {
      setSelectedNode(nodeToSave);
    }
  };

  const handleUpdateGoals = (nodeId: string, updatedGoals: GoalItem[]) => {
    const updatedNodesList = nodes.map(n => {
      if (n.id === nodeId) {
        const updated = { ...n, goals: updatedGoals };
        if (user) {
          syncNodeToFirestore(updated);
        }
        return updated;
      }
      return n;
    });

    setNodes(updatedNodesList);
    saveToCache(updatedNodesList, settings);

    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({ ...selectedNode, goals: updatedGoals });
    }
  };

  const handleDeleteNode = (idToDel: string) => {
    const updated = nodes
      .map(n => {
        if (n.managerId === idToDel) {
          const reparentedNode = { ...n, managerId: null };
          if (user) syncNodeToFirestore(reparentedNode);
          return reparentedNode;
        }
        return n;
      })
      .filter(n => n.id !== idToDel);

    if (!user) {
      setNodes(updated);
      saveToCache(updated, settings);
    } else {
      setNodes(updated);
      deleteNodeFromFirestore(idToDel);
    }

    if (selectedNode?.id === idToDel) {
      setSelectedNode(null);
    }
  };

  const handleReparentNode = (nodeId: string, targetManagerId: string | null) => {
    if (nodeId === targetManagerId) return;

    const descendantIds = new Set<string>();
    let checkingListObj = true;
    while (checkingListObj) {
      checkingListObj = false;
      nodes.forEach(n => {
        if (n.managerId === nodeId || descendantIds.has(n.managerId || '')) {
          if (!descendantIds.has(n.id)) {
            descendantIds.add(n.id);
            checkingListObj = true;
          }
        }
      });
    }

    if (targetManagerId && descendantIds.has(targetManagerId)) {
      alert("Phát hiện lỗi báo cáo vòng lặp! Một cấp trên quản lý không thể báo cáo ngược lại cho cấp dưới trực tiếp của họ.");
      return;
    }

    const targetNode = nodes.find(n => n.id === nodeId);
    if (targetNode) {
      const reparented = { ...targetNode, managerId: targetManagerId };
      const updated = nodes.map(n => n.id === nodeId ? reparented : n);
      if (!user) {
        setNodes(updated);
        saveToCache(updated, settings);
      } else {
        setNodes(updated);
        syncNodeToFirestore(reparented);
      }
    }
  };

  // --- BULK CONTEXT OPERATIONS ---
  const handleAddNodesBulk = (newNodes: ContactNode[]) => {
    const updated = [...nodes, ...newNodes];
    if (!user) {
      setNodes(updated);
      saveToCache(updated, settings);
    } else {
      setNodes(updated);
      const batch = writeBatch(db);
      const nodesRef = getNodesRef();
      if (nodesRef) {
        newNodes.forEach((node) => {
          const nodeDoc = doc(nodesRef, node.id);
          batch.set(nodeDoc, {
            ...node,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });
        batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, nodesRef.path));
      }
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Bạn có chắc muốn khôi phục sơ đồ về dữ liệu mẫu mặc định của Công ty Bán lẻ sản phẩm RetailPro Việt Nam không? Mọi thay đổi hiện tại của bạn sẽ bị ghi đè.')) {
      if (!user) {
        setNodes(DEFAULT_NODES);
        setSettings(DEFAULT_SETTINGS);
        saveToCache(DEFAULT_NODES, DEFAULT_SETTINGS);
      } else {
        // In Firestore, we must delete everything existing and set new
        const deleteBatch = writeBatch(db);
        const nodesRef = getNodesRef();
        if (nodesRef) {
          nodes.forEach(n => deleteBatch.delete(doc(nodesRef, n.id)));
          deleteBatch.commit().then(() => {
            const addBatch = writeBatch(db);
            DEFAULT_NODES.forEach((node) => {
              const nodeDoc = doc(nodesRef, node.id);
              addBatch.set(nodeDoc, {
                ...node,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            });
            handleUpdateSettings(DEFAULT_SETTINGS);
            addBatch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, nodesRef.path));
          }).catch(e => handleFirestoreError(e, OperationType.DELETE, nodesRef.path));
        }
      }
      setSelectedNode(null);
      setPanX(60);
      setPanY(40);
      setZoomScale(0.9);
    }
  };

  const handleClearAllNodes = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ và bắt đầu lại với một sơ đồ trắng không?')) {
      if (!user) {
        setNodes([]);
        saveToCache([], settings);
      } else {
        const deleteBatch = writeBatch(db);
        const nodesRef = getNodesRef();
        if (nodesRef) {
          nodes.forEach(n => deleteBatch.delete(doc(nodesRef, n.id)));
          deleteBatch.commit().catch(e => handleFirestoreError(e, OperationType.DELETE, nodesRef.path));
        }
      }
      setSelectedNode(null);
    }
  };

  // --- WHITEBOARD ZOOM MODIFIERS ---
  const handleZoomIn = () => setZoomScale(s => Math.min(2.0, s + 0.1));
  const handleZoomOut = () => setZoomScale(s => Math.max(0.2, s - 0.1));
  const handleResetZoom = () => setZoomScale(1.0);
  const handleFitScreen = () => {
    setPanX(40);
    setPanY(40);
    setZoomScale(0.85);
  };

  // --- FILE IO SHARING ENGINES ---
  const handleExportJsonStructure = () => {
    const payload = JSON.stringify({
      version: "1.0.0",
      settings,
      nodes
    }, null, 2);

    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const tempAnchor = document.createElement('a');
    tempAnchor.href = url;
    tempAnchor.download = `${settings.chartName.replace(/\s+/g, '-').toLowerCase()}-orgchart.json`;
    document.body.appendChild(tempAnchor);
    tempAnchor.click();
    document.body.removeChild(tempAnchor);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsvSample = () => {
    const csvContent = "id,name,title,department,email,phone,managerId,relationship,influence,notes,isPlaceholder\n" +
      "1,Nguyễn Văn A,Giám đốc,Khối Kinh doanh,a.nguyen@pro.vn,0901234567,,champion,high,Ghi chú,false\n" +
      "2,Trần Thị B,Chuyên viên,Khối Kinh doanh,b.tran@pro.vn,0907654321,1,neutral,none,Ghi chú,false";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const tempAnchor = document.createElement('a');
    tempAnchor.href = url;
    tempAnchor.download = "mau-csv-nhan-su.csv";
    document.body.appendChild(tempAnchor);
    tempAnchor.click();
    document.body.removeChild(tempAnchor);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = ["id", "name", "title", "department", "email", "phone", "managerId", "relationship", "influence", "notes", "isPlaceholder"];
    const rows = nodes.map(n => 
      headers.map(h => {
        const val = (n as any)[h] || '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const tempAnchor = document.createElement('a');
    tempAnchor.href = url;
    tempAnchor.download = `${settings.chartName.replace(/\s+/g, '-').toLowerCase()}-orgchart.csv`;
    document.body.appendChild(tempAnchor);
    tempAnchor.click();
    document.body.removeChild(tempAnchor);
    URL.revokeObjectURL(url);
  };

  const handleImportJsonFile = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        const newSettings = parsed.settings || settings;
        
        if (!user) {
          setNodes(parsed.nodes);
          setSettings(newSettings);
          saveToCache(parsed.nodes, newSettings);
        } else {
          setNodes(parsed.nodes);
          setSettings(newSettings);
          
          const chartRef = getChartRef();
          const nodesRef = getNodesRef();
          
          if (chartRef && nodesRef) {
            setDoc(chartRef, {
              ownerId: user.uid,
              settings: newSettings,
              updatedAt: serverTimestamp()
            }, { merge: true });
            
            // Delete old nodes and insert new ones
            const deleteBatch = writeBatch(db);
            nodes.forEach(n => deleteBatch.delete(doc(nodesRef, n.id)));
            deleteBatch.commit().then(() => {
              const addBatch = writeBatch(db);
              parsed.nodes.forEach((node: ContactNode) => {
                const nodeDoc = doc(nodesRef, node.id);
                addBatch.set(nodeDoc, {
                  ...node,
                  ownerId: user.uid,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              });
              addBatch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, nodesRef.path));
            });
          }
        }
        
        alert(`Tải lên cấu trúc sơ đồ thành công! Đã thêm ${parsed.nodes.length} thẻ nhân sự.`);
      } else {
        alert('Định dạng không hợp lệ, thiếu mảng danh sách "nodes".');
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi phân tích cú pháp tệp JSON tải lên.');
    }
  };

  const handleImportCsvFile = (csvString: string) => {
    try {
      const lines = csvString.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        alert('Tệp CSV trống hoặc thiếu dòng tiêu đề.');
        return;
      }

      // Read header keys and positions
      const headers = lines[0].toLowerCase().split(',').map(h => h.replace(/["\r]/g, '').trim());
      
      const parsedEmployees: ContactNode[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Simple comma split supporting quoted entities
        const row = lines[i];
        const cells: string[] = [];
        let insideQuoteStr = false;
        let currentCell = '';

        for (let charIdx = 0; charIdx < row.length; charIdx++) {
          const char = row[charIdx];
          if (char === '"') {
            insideQuoteStr = !insideQuoteStr;
          } else if (char === ',' && !insideQuoteStr) {
            cells.push(currentCell.trim());
            currentCell = '';
          } else {
            currentCell += char;
          }
        }
        cells.push(currentCell.trim());

        // Extract key cells using matched column indexing positions
        const getCellVal = (colName: string): string => {
          const idx = headers.indexOf(colName);
          return idx !== -1 && cells[idx] ? cells[idx].replace(/^"|"$/g, '').trim() : '';
        };

        const parsedId = getCellVal('id') || `csv-import-${Date.now()}-${i}`;
        const nameVal = getCellVal('name');
        
        if (!nameVal) continue; // Skip blanks

        parsedEmployees.push({
          id: parsedId,
          name: nameVal,
          title: getCellVal('title') || 'Chuyên viên',
          department: getCellVal('department') || 'Khối Vận hành',
          email: getCellVal('email') || '',
          phone: getCellVal('phone') || '',
          managerId: getCellVal('managerid') || getCellVal('manager_id') || null,
          relationship: (getCellVal('relationship') || 'neutral').toLowerCase() as any,
          influence: (getCellVal('influence') || 'none').toLowerCase() as any,
          notes: getCellVal('notes') || 'Nhập bản ghi hàng loạt thông qua tệp CSV tải lên.',
          isPlaceholder: getCellVal('isplaceholder')?.toLowerCase() === 'true' || getCellVal('vacant')?.toLowerCase() === 'true',
          customFields: {}
        });
      }

      if (!user) {
        setNodes(parsedEmployees);
        saveToCache(parsedEmployees, settings);
      } else {
        setNodes(parsedEmployees);
        const nodesRef = getNodesRef();
        if (nodesRef) {
          const deleteBatch = writeBatch(db);
          nodes.forEach(n => deleteBatch.delete(doc(nodesRef, n.id)));
          deleteBatch.commit().then(() => {
            const addBatch = writeBatch(db);
            parsedEmployees.forEach((node: ContactNode) => {
              const nodeDoc = doc(nodesRef, node.id);
              addBatch.set(nodeDoc, {
                ...node,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            });
            addBatch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, nodesRef.path));
          });
        }
      }

      alert(`Nhập danh sách nhân sự từ CSV thành công! Đã thêm ${parsedEmployees.length} nhân viên vào sơ đồ.`);
    } catch (err) {
      alert('Tải dữ liệu CSV thất bại. Xin vui lòng kiểm tra lại cấu trúc cột chuẩn trong tệp: id, name, title, department, email, phone, managerId, relationship, influence, vacant');
    }
  };

  const getWebsiteBackgroundStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      transition: 'background-color 0.3s ease'
    };
    
    if (settings.backgroundType === 'white') {
      baseStyle.backgroundColor = '#ffffff';
      baseStyle.backgroundImage = 'none';
    } else if (settings.backgroundType === 'image' && settings.wallpaperUrl) {
      baseStyle.backgroundImage = `url(${settings.wallpaperUrl})`;
      baseStyle.backgroundSize = 'cover';
      baseStyle.backgroundPosition = 'center';
      baseStyle.backgroundAttachment = 'fixed';
    } else if (settings.backgroundType === 'gradient' && settings.wallpaperUrl) {
      baseStyle.backgroundImage = settings.wallpaperUrl;
      baseStyle.backgroundSize = 'cover';
      baseStyle.backgroundPosition = 'center';
      baseStyle.backgroundAttachment = 'fixed';
    } else if (settings.backgroundType === 'pattern' && settings.wallpaperUrl) {
      const pat = customPatterns.find(p => p.id === settings.wallpaperUrl);
      if (pat) {
        baseStyle.backgroundColor = pat.patternBg;
        baseStyle.backgroundImage = pat.patternCss;
        baseStyle.backgroundSize = pat.patternSize;
      }
    } else {
      // Default to white if grid or anything else not matched
      baseStyle.backgroundColor = '#ffffff';
    }
    // "grid" falls through to default website background without drawing grid (grid will stay in Canvas)
    return baseStyle;
  };

  return (
    <div className="flex h-screen w-screen p-[15px] bg-white overflow-hidden font-sans" style={getWebsiteBackgroundStyle()}>
      {/* Video Background Layer */}
      {settings.backgroundType === 'video' && settings.wallpaperUrl && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          src={settings.wallpaperUrl}
        />
      )}
      
      <div 
        className="flex-1 flex text-slate-800 overflow-hidden rounded-[10px] relative p-[20px]"
        style={{
          backgroundColor: `rgba(255, 255, 255, ${(settings.cardTransparency ?? 100) / 100})`
        }}
      >
        
        {/* Visual Workspace Container */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Navigation Toolbar */}
        <Toolbar 
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          searchQuery={searchQuery}
          onUpdateSearchQuery={setSearchQuery}
          onAddContact={handleCreateFreshMember}
          onResetToDefault={handleResetToDefault}
          onClearChart={handleClearAllNodes}
          zoomScale={zoomScale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onFitScreen={handleFitScreen}
          isSidebarOpen={isSettingsOpen}
          onToggleSidebar={() => setIsSettingsOpen(!isSettingsOpen)}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onCenterView={handleCenterView}
          onCollapseOneLevel={handleCollapseOneLevel}
          onSetExpandLevel={handleSetExpandLevel}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onExportCsv={handleExportCsv}
          onImportCsv={handleImportCsvFile}
          onDownloadCsvSample={handleDownloadCsvSample}
        />

        {/* Board Canvas Workspace */}
        {viewMode === 'chart' ? (
          <ChartCanvas 
            nodes={nodes}
            settings={settings}
            searchQuery={searchQuery}
            panX={panX}
            panY={panY}
            zoomScale={zoomScale}
            onSetPanX={setPanX}
            onSetPanY={setPanY}
            onSetZoom={setZoomScale}
            onSelectNode={handleSelectNode}
            selectedNode={selectedNode}
            onEditNode={handleEditNodeTrigger}
            onAddDirectReport={handleAddDirectReport}
            onReparentNode={handleReparentNode}
            expandedNodes={expandedNodes}
            setExpandedNodes={setExpandedNodes}
          />
        ) : (
          <PersonnelManager 
            nodes={nodes}
            viewMode={viewMode}
            onSelectNode={handleSelectNode}
            onEditNode={handleEditNodeTrigger}
          />
        )}
      </div>

      {/* Admin Operations Settings Sidebar panel */}
      <Sidebar 
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        nodes={nodes}
        onAddNodes={handleAddNodesBulk}
        selectedNode={selectedNode}
        onSelectNode={handleSelectNode}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onExportJson={handleExportJsonStructure}
        onImportJson={handleImportJsonFile}
        onImportCsv={handleImportCsvFile}
      />

      {/* Dynamic Profile Drawer overlay */}
      <ContactEditor 
        node={editorNode}
        allNodes={nodes}
        customFieldDefinitions={settings.customFieldDefinitions}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSuggestedParentId(null);
        }}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
        suggestedParentId={suggestedParentId}
      />

      {/* Modern Center Modal Profile Popup */}
      <SelectedNodePopup 
        node={selectedNode}
        allNodes={nodes}
        customFieldDefinitions={settings.customFieldDefinitions}
        onClose={() => handleSelectNode(null)}
        onEdit={handleEditNodeTrigger}
        onUpdateGoals={handleUpdateGoals}
        onUpdateNode={handleSaveNode}
      />
      </div>
    </div>
  );
}
