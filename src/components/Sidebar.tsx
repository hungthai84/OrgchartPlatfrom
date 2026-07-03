/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Layers, 
  HelpCircle, 
  Sparkles, 
  Users, 
  Plus, 
  Trash2, 
  Globe2, 
  Check, 
  Eye, 
  EyeOff, 
  AlertCircle,
  TrendingUp,
  Sliders,
  PlayCircle,
  Download,
  Upload,
  FileJson
} from 'lucide-react';
import { ChartSettings, ContactNode, CustomFieldDefinition, RelationshipType } from '../types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

import GoogleDriveSync from './GoogleDriveSync';
import WallpaperSelector from './WallpaperSelector';

interface SidebarProps {
  settings: ChartSettings;
  onUpdateSettings: (settings: ChartSettings) => void;
  nodes: ContactNode[];
  onAddNodes: (newNodes: ContactNode[]) => void;
  selectedNode: ContactNode | null;
  onSelectNode: (node: ContactNode | null) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onExportJson?: () => void;
  onImportJson?: (jsonData: string) => void;
  onImportCsv?: (csvContent: string) => void;
}

const THEME_COLORS = [
  { name: 'Blue Sky', color: '#3b82f6' },
  { name: 'Indigo Dream', color: '#6366f1' },
  { name: 'Emerald Growth', color: '#10b981' },
  { name: 'Slate Corporate', color: '#475569' },
  { name: 'Amethyst Stakeholder', color: '#8b5cf6' },
  { name: 'Acme Premium Orange', color: '#f97316' }
];

export default function Sidebar({
  settings,
  onUpdateSettings,
  nodes,
  onAddNodes,
  selectedNode,
  onSelectNode,
  isOpen = true,
  onClose,
  onExportJson,
  onImportJson,
  onImportCsv,
}: SidebarProps) {
  const jsonInputRef = React.useRef<HTMLInputElement>(null);
  const csvInputRef = React.useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'general' | 'fields' | 'legend' | 'ai' | 'dashboard' | 'data'>('general');
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);

  // New Custom Field Temp States
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'select'>('text');
  const [newFieldOpts, setNewFieldOpts] = useState('');

  const updateSetting = <K extends keyof ChartSettings>(key: K, value: ChartSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value
    });
  };

    const onImportData = (newNodes, newSettings) => {
    if (onImportJson) {
      onImportJson(JSON.stringify({ nodes: newNodes, settings: newSettings }));
    }
  };
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (onImportJson) onImportJson(text);
      } catch (err) {
        alert('Định dạng tệp JSON không hợp lệ.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (onImportCsv) onImportCsv(text);
      } catch (err) {
        alert('Không thể tải hoặc phân tích cú pháp tệp CSV.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    const cleanId = newFieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check if custom field ID exists
    if (settings.customFieldDefinitions.some(f => f.id === cleanId)) {
      alert("A field with this name already exists.");
      return;
    }

    const nDefs: CustomFieldDefinition = {
      id: cleanId,
      label: newFieldName,
      type: newFieldType,
      options: newFieldType === 'select' ? newFieldOpts.split(',').map(o => o.trim()).filter(Boolean) : undefined
    };

    const updatedDefs = [...settings.customFieldDefinitions, nDefs];
    updateSetting('customFieldDefinitions', updatedDefs);
    
    // Clear form
    setNewFieldName('');
    setNewFieldOpts('');
  };

  const handleRemoveCustomField = (id: string) => {
    const updated = settings.customFieldDefinitions.filter(f => f.id !== id);
    updateSetting('customFieldDefinitions', updated);
  };

  const handleToggleFieldVisibility = (field: string) => {
    let updated: string[];
    if (settings.visibleFields.includes(field)) {
      updated = settings.visibleFields.filter(f => f !== field);
    } else {
      updated = [...settings.visibleFields, field];
    }
    updateSetting('visibleFields', updated);
  };

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiSuccess(null);

    try {
      const response = await fetch('/api/gemini/parse-orgchart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiInput,
          existingNodes: nodes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process chart context');
      }

      if (data.result && Array.isArray(data.result)) {
        const parsed: any[] = data.result;
        
        // Convert parsed nodes with temporary/matched parent-child reporting IDs
        const newNodesToInsert: ContactNode[] = parsed.map((item, index) => {
          // Generate an elegant ID
          const uid = `parsed-node-${Date.now()}-${index}`;
          // Make best estimate of managerId from parsed managerName
          let matchedManagerId: string | null = null;
          
          if (item.managerName) {
            // Check existing chart nodes first
            const existingManager = nodes.find(n => n.name.toLowerCase().includes(item.managerName.toLowerCase()));
            if (existingManager) {
              matchedManagerId = existingManager.id;
            } else {
              // Check other freshly parsed nodes
              const newlyParsedSibling = parsed.find(n => n.name.toLowerCase().includes(item.managerName.toLowerCase()));
              if (newlyParsedSibling) {
                // We'll bind it using a temporary key pattern
                matchedManagerId = `temp-manager-${newlyParsedSibling.name.replace(/\s+/g, '-').toLowerCase()}`;
              }
            }
          }

          // Build actual node
          return {
            id: uid,
            name: item.name || 'Thành viên mới',
            title: item.title || 'Chuyên viên',
            department: item.department || 'Bộ phận vận hành',
            email: item.email || `${item.name?.toLowerCase().replace(/\s+/g, '.')}@retailpro.vn`,
            phone: item.phone || '',
            managerId: matchedManagerId,
            relationship: (item.relationship || 'neutral').toLowerCase() as RelationshipType,
            influence: (item.influence || 'none').toLowerCase() as any,
            notes: item.notes || `Được trích xuất tự động bằng Trợ lý AI.`,
            createdAt: new Date().toISOString()
          };
        });

        // Resolve cross-references for temporary parent IDs within the freshly parsed list
        const processedNodes = newNodesToInsert.map(node => {
          if (node.managerId?.startsWith('temp-manager-')) {
            const tempNamePart = node.managerId.replace('temp-manager-', '');
            const actualMatchedTarget = newNodesToInsert.find(n => 
              n.name.replace(/\s+/g, '-').toLowerCase() === tempNamePart
            );
            return {
              ...node,
              managerId: actualMatchedTarget ? actualMatchedTarget.id : null
            };
          }
          return node;
        });

        onAddNodes(processedNodes);
        setAiSuccess(`Đã phân tích cấu trúc nhân sự thành công! Đã thêm ${processedNodes.length} thành viên vào sơ đồ.`);
        setAiInput('');
      } else {
        throw new Error('Không phát hiện được thông tin cấu trúc nhân sự hợp lệ trong văn bản.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Có lỗi xảy ra trong quá trình xử lý của AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const loadExampleAiPrompt = (type: string) => {
    if (type === 'sales') {
      setAiInput(`Chúng tôi cần vẽ thêm 3 nhân sự chính:
Trưởng phòng Thu mua là bà Lê Khánh Chi, báo cáo trực tiếp cho Giám đốc Thu mua Lê Văn Hùng. Bà Chi là một người vô cùng nhiệt tình ủng hộ (Champion), làm việc tại Sở Chỉ huy (Hà Nội).
Báo cáo cho bà Chi là ông Phạm Minh Hải, Chuyên viên Mua hàng Cấp cao. Ông Hải có tầm ảnh hưởng Cao (High influence) nhưng trạng thái hiện tại là Trung lập (Neutral).
Ngoài ra còn có ông Vương Đình Tráng, Giám đốc Công nghệ Thông tin (CIO) báo cáo trực tiếp cho Tổng Giám đốc Nguyễn Minh Trí. Ông Tráng có tầm ảnh hưởng Cao (High influence) và là Người cản trở (Blocker) do e ngại vấn đề ngân sách.`);
    } else if (type === 'eng') {
      setAiInput(`Mở rộng sơ đồ khối cửa hàng bán lẻ như sau:
Dưới sự quản lý của Giám đốc Vận hành Phạm Thanh Thủy, chúng tôi bổ nhiệm bà Trần Ngọc Lan làm Quản lý Vùng miền Nam. Bà Lan là Người ủng hộ tích cực (Supporter).
Báo cáo trực tiếp cho bà Lan gồm 2 Cửa hàng trưởng mới:
Nguyễn Hải Đăng (Cửa hàng trưởng Quận 1, làm việc tại Văn phòng TP.HCM) là người Trung lập (Neutral),
và Hoàng Thúy Vy (Cửa hàng trưởng Quận 7, làm việc tại Hệ thống Cửa hàng) là Người ủng hộ cốt lõi (Champion)!`);
    }
  };

  const getDashboardData = () => {
    let totalGoals = 0;
    let completedGoals = 0;
    let pendingGoals = 0;
    
    const departmentStats: Record<string, { total: number, completed: number }> = {};
    const userStats: Record<string, { name: string, total: number, completed: number }> = {};
    
    nodes.forEach(node => {
      if (node.isPlaceholder || node.isDepartment) return;

      const dept = node.department || 'Không xác định';
      const userGoals = node.goals || [];
      
      if (!departmentStats[dept]) {
        departmentStats[dept] = { total: 0, completed: 0 };
      }
      
      let userTotal = 0;
      let userCompleted = 0;
      
      userGoals.forEach(g => {
        totalGoals++;
        userTotal++;
        departmentStats[dept].total++;
        if (g.status === 'completed') {
          completedGoals++;
          userCompleted++;
          departmentStats[dept].completed++;
        } else {
          pendingGoals++;
        }
      });
      
      if (userTotal > 0) {
        userStats[node.id] = { name: node.name, total: userTotal, completed: userCompleted };
      }
    });

    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    
    const pieData = [
      { name: 'Hoàn thành', value: completedGoals, color: '#10b981' },
      { name: 'Chưa xong', value: pendingGoals, color: '#f59e0b' }
    ];

    const barData = Object.keys(departmentStats).map(dept => ({
      name: dept,
      Hoàn_Thành: departmentStats[dept].completed,
      Chưa_Xong: departmentStats[dept].total - departmentStats[dept].completed,
      total: departmentStats[dept].total
    })).sort((a, b) => b.total - a.total).slice(0, 5);

    const topPerformers = Object.values(userStats)
      .sort((a, b) => b.completed - a.completed || b.total - a.total)
      .slice(0, 3);
      
    return {
      totalGoals,
      completedGoals,
      pendingGoals,
      completionRate,
      pieData,
      barData,
      topPerformers
    };
  };

  const dashboardData = activeTab === 'dashboard' ? getDashboardData() : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose}>
      <div 
        id="settings-modal" 
        className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-row w-[90vw] max-w-5xl h-[85vh] overflow-hidden border border-slate-200/50 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Sidebar for Tabs */}
        <div className="w-64 bg-slate-50/80 border-r border-slate-200/60 flex flex-col shrink-0">
          <div className="p-6 border-b border-slate-200/60 shrink-0">
            <h1 className="text-base font-bold text-slate-800 font-display flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <Settings className="w-4 h-4" />
              </div>
              Cài đặt sơ đồ
            </h1>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            
            {settings.showStatistics && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-3 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-3 ${
                  activeTab === 'dashboard' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:bg-slate-200/50 border border-transparent'
                }`}
              >
                <TrendingUp className="w-4 h-4" /> Thống kê
              </button>
            )}
            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-3 ${
                activeTab === 'ai' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200/60' : 'text-slate-600 hover:bg-slate-200/50 border border-transparent'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === 'ai' ? 'text-indigo-600' : 'text-indigo-500'}`} /> Trợ lý AI
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-3 ${
                activeTab === 'data' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:bg-slate-200/50 border border-transparent'
              }`}
            >
              <Globe2 className="w-4 h-4" /> Dữ liệu
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white relative">
          {/* Header with Close */}
          <div className="h-16 border-b border-slate-100 flex justify-between items-center px-8 shrink-0 bg-white">
            <h2 className="text-base font-semibold text-slate-800">
              {activeTab === 'general' && 'Cài đặt cơ bản'}
              {activeTab === 'fields' && 'Tuỳ chỉnh thông tin thẻ'}
              
              {activeTab === 'dashboard' && 'Thống kê tổng quan'}
              {activeTab === 'ai' && 'Trợ lý AI'}
              {activeTab === 'data' && 'Quản lý Dữ liệu'}
            </h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 1L1 13M1 1l12 12"/></svg>
            </button>
          </div>
          
          {/* Main content pane */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
        
        {/* TAB 1: GENERAL & LAYOUT */}
        {activeTab === 'general' && (
          <div className="space-y-5 fade-in">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Tên Tổ chức / Công ty</label>
              <input
                id="input-chart-name"
                type="text"
                value={settings.chartName}
                onChange={(e) => updateSetting('chartName', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium text-slate-800"
              />
            </div>


            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Logo Công ty</label>
              <div className="flex items-center gap-3">
                {settings.companyLogoUrl && (
                  <img src={settings.companyLogoUrl} alt="Logo" className="h-10 w-auto rounded object-contain border border-slate-200" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        updateSetting('companyLogoUrl', ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs w-full text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {settings.companyLogoUrl && (
                  <button onClick={() => updateSetting('companyLogoUrl', '')} className="text-xs text-red-500 hover:text-red-600">Xóa</button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex justify-between">
                <span>Độ trong suốt của thẻ (Background Opacity)</span>
                <span>{settings.cardTransparency ?? 100}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.cardTransparency ?? 100}
                onChange={(e) => updateSetting('cardTransparency', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Mô tả Sơ đồ</label>
              <textarea
                id="input-chart-desc"
                rows={3}
                value={settings.chartDescription}
                onChange={(e) => updateSetting('chartDescription', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-600"
              />
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Bố cục Hiển thị Trực quan</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Hướng dòng chảy sơ đồ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-direction-tb"
                    type="button"
                    onClick={() => updateSetting('layoutDirection', 'TB')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      settings.layoutDirection === 'TB'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Dọc (Trên xuống)
                  </button>
                  <button
                    id="btn-direction-lr"
                    type="button"
                    onClick={() => updateSetting('layoutDirection', 'LR')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      settings.layoutDirection === 'LR'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Ngang (Trái sang)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Kích thước Thẻ nhân sự</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-card-detailed"
                    type="button"
                    onClick={() => updateSetting('cardSize', 'detailed')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      settings.cardSize === 'detailed'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Chi tiết (Đầy đủ)
                  </button>
                  <button
                    id="btn-card-compact"
                    type="button"
                    onClick={() => updateSetting('cardSize', 'compact')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      settings.cardSize === 'compact'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Tối giản (Thu gọn)
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Cấu hình Phong cách</h3>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-700 block">Hiển thị Thống kê</span>
                  <span className="text-[11px] text-slate-400">Ẩn/Hiện bảng tổng quan thống kê</span>
                </div>
                <button
                  id="toggle-statistics"
                  type="button"
                  onClick={() => updateSetting('showStatistics', !settings.showStatistics)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                    settings.showStatistics ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out transform ${
                    settings.showStatistics ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-700 block">Hiển thị Ảnh đại diện</span>
                  <span className="text-[11px] text-slate-400">Hiển thị tên viết tắt hoặc hình đại diện nhân sự</span>
                </div>
                <button
                  id="toggle-avatars"
                  type="button"
                  onClick={() => updateSetting('showAvatars', !settings.showAvatars)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                    settings.showAvatars ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out transform ${
                    settings.showAvatars ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-700 block">Đánh dấu Màu sắc Quan hệ</span>
                  <span className="text-[11px] text-slate-400">Tô viền màu sắc dựa trên mối quan hệ chiến lược</span>
                </div>
                <button
                  id="toggle-relationship-colors"
                  type="button"
                  onClick={() => updateSetting('showRelationshipColors', !settings.showRelationshipColors)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                    settings.showRelationshipColors ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out transform ${
                    settings.showRelationshipColors ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block">Kiểu nền Sơ đồ</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-bg-grid"
                    type="button"
                    onClick={() => updateSetting('backgroundType', 'grid')}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      settings.backgroundType !== 'white'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Họa tiết lưới
                  </button>
                  <button
                    id="btn-bg-white"
                    type="button"
                    onClick={() => updateSetting('backgroundType', 'white')}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      settings.backgroundType === 'white'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Nền màu trắng
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block">Kiểu đường liên kết</span>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    id="btn-line-smooth"
                    type="button"
                    onClick={() => updateSetting('connectorStyle', 'smooth')}
                    className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      (settings.connectorStyle === 'smooth' || !settings.connectorStyle)
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-extrabold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Đường cong
                  </button>
                  <button
                    id="btn-line-squared"
                    type="button"
                    onClick={() => updateSetting('connectorStyle', 'squared')}
                    className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      settings.connectorStyle === 'squared'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-extrabold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Vuông góc
                  </button>
                  <button
                    id="btn-line-rounded"
                    type="button"
                    onClick={() => updateSetting('connectorStyle', 'rounded')}
                    className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      settings.connectorStyle === 'rounded'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-extrabold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Bo góc
                  </button>
                  <button
                    id="btn-line-straight"
                    type="button"
                    onClick={() => updateSetting('connectorStyle', 'straight')}
                    className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      settings.connectorStyle === 'straight'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-extrabold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Đường thẳng
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <label className="text-xs font-bold text-slate-800 tracking-wider uppercase block">Màu sắc Chủ đạo sơ đồ</label>
              <div className="grid grid-cols-3 gap-2">
                {THEME_COLORS.map((colorItem) => (
                  <button
                    id={`btn-color-${colorItem.name.replace(/\s+/g, '-').toLowerCase()}`}
                    key={colorItem.name}
                    type="button"
                    onClick={() => updateSetting('themeColor', colorItem.color)}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all ${
                      settings.themeColor === colorItem.color
                        ? 'border-slate-800 ring-2 ring-slate-800/10'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span 
                      className="w-4 h-4 rounded-md inline-block shrink-0 shadow-sm" 
                      style={{ backgroundColor: colorItem.color }} 
                    />
                    <span className="text-[10px] font-medium text-slate-700 truncate leading-none">{colorItem.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <label className="text-xs font-bold text-slate-800 tracking-wider uppercase block">Hình nền (Wallpaper)</label>
              <WallpaperSelector settings={settings} onUpdateSettings={onUpdateSettings} />
            </div>
          </div>
        )}

        {/* TAB 2: FIELD SETTINGS */}
        {activeTab === 'fields' && (
          <div className="space-y-5 fade-in">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Cấu trúc hiển thị Thẻ</h3>
              <p className="text-[11px] text-slate-500">Thiết lập thông tin nhân sự nào được ghim vào các vị trí chính, phụ hoặc nhãn huy hiệu trên thẻ sơ đồ.</p>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 block">Trường thông tin chính (Dòng trên)</label>
                <select
                  id="select-primary-field"
                  value={settings.primaryField}
                  onChange={(e) => updateSetting('primaryField', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                >
                  <option value="name">Họ và tên nhân viên</option>
                  <option value="title">Chức danh / Chức vụ</option>
                  <option value="department">Phòng ban / Bộ phận</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 block">Trường thông tin phụ (Dòng dưới)</label>
                <select
                  id="select-secondary-field"
                  value={settings.secondaryField}
                  onChange={(e) => updateSetting('secondaryField', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                >
                  <option value="name">Họ và tên nhân viên</option>
                  <option value="title">Chức danh / Chức vụ</option>
                  <option value="department">Phòng ban / Bộ phận</option>
                  <option value="email">Địa chỉ Email</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 block">Trường nhãn huy hiệu (Góc thẻ)</label>
                <select
                  id="select-tertiary-field"
                  value={settings.tertiaryField}
                  onChange={(e) => updateSetting('tertiaryField', e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                >
                  <option value="department">Phòng ban / Bộ phận</option>
                  <option value="workspace">Khu vực làm việc</option>
                  <option value="years_at_company">Thâm niên (Năm)</option>
                  <option value="email">Địa chỉ Email</option>
                  <option value="none">Không hiển thị</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Ẩn / Hiện thông tin chi tiết</h3>
              <p className="text-[11px] text-slate-500">Chọn bật hoặc tắt các mục thông tin bên trong thẻ nhân viên ở chế độ chi tiết.</p>
              
              <div className="space-y-1.5 pt-1.5">
                {[
                  { id: 'title', label: 'Chức danh nhân viên' },
                  { id: 'department', label: 'Phòng ban / Bộ phận' },
                  { id: 'email', label: 'Địa chỉ Email' },
                  { id: 'phone', label: 'Số điện thoại' },
                  { id: 'relationship', label: 'Mối quan hệ chính trị' },
                  { id: 'influence', label: 'Mức độ ảnh hưởng quyết định' },
                ].map((item) => {
                  const visible = settings.visibleFields.includes(item.id);
                  return (
                    <button
                      id={`toggle-field-${item.id}`}
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleFieldVisibility(item.id)}
                      className="w-full flex items-center justify-between text-left py-1.5 px-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-medium text-slate-700">{item.label}</span>
                      {visible ? (
                        <div className="flex items-center gap-1 text-blue-600 font-semibold text-[10px]">
                          <Eye className="w-3.5 h-3.5" />
                          Hiển thị
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                          <EyeOff className="w-3.5 h-3.5" />
                          Đang ẩn
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Field Definitions */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Các trường tùy chỉnh</h3>
              <p className="text-[11px] text-slate-500">Tạo thêm các trường thông tin riêng phục vụ quản trị phân tích. Các trường này sẽ sẵn sàng trên tất cả các thẻ nhân viên lập tức.</p>

              {settings.customFieldDefinitions.length > 0 && (
                <div className="space-y-1.5 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                  {settings.customFieldDefinitions.map((fd) => (
                    <div id={`custom-field-def-${fd.id}`} key={fd.id} className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-slate-150 text-xs">
                      <div>
                        <span className="font-semibold text-slate-700">{fd.label}</span>
                        <span className="text-[9px] text-slate-400 ml-1.5 bg-slate-100 px-1 py-0.5 rounded uppercase">{fd.type}</span>
                      </div>
                      <button
                        id={`btn-delete-custom-${fd.id}`}
                        type="button"
                        onClick={() => handleRemoveCustomField(fd.id)}
                        className="text-slate-400 hover:text-red-500 p-0.5 hover:bg-slate-100 rounded transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom Field Form */}
              <div className="space-y-3 bg-slate-50/70 p-3 rounded-lg border border-slate-150">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase">Tạo Trường Tùy Chỉnh Mới</h4>
                
                <div className="space-y-2">
                  <input
                    id="input-custom-field-name"
                    type="text"
                    placeholder="Tên nhãn (Ví dụ: Số năm công tác)"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded p-1.5 bg-white focus:outline-none"
                  />
                  
                  <div className="grid grid-cols-3 gap-1">
                    {['text', 'number', 'select'].map((type) => (
                      <button
                        id={`btn-fieldtype-${type}`}
                        key={type}
                        type="button"
                        onClick={() => setNewFieldType(type as any)}
                        className={`py-1 px-1.5 text-[10px] font-semibold rounded border text-center transition-all ${
                          newFieldType === type
                            ? 'bg-blue-50 border-blue-600 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        {type === 'text' ? 'CHỮ' : type === 'number' ? 'SỐ' : 'CHỌN'}
                      </button>
                    ))}
                  </div>

                  {newFieldType === 'select' && (
                    <input
                      id="input-custom-field-opts"
                      type="text"
                      placeholder="Các tùy chọn, cách nhau bằng dấu phẩy (Hà Nội, TP.HCM)"
                      value={newFieldOpts}
                      onChange={(e) => setNewFieldOpts(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 bg-white focus:outline-none placeholder-slate-400"
                    />
                  )}

                  <button
                    id="btn-add-custom-field"
                    type="button"
                    onClick={handleAddCustomField}
                    className="w-full py-1.5 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Trường
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RELATIONSHIP LEGEND STRATEGY */}
        {/* TAB 4: DASHBOARD GOALS */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-5 fade-in">
            <div className="space-y-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs font-display">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Tiến độ Thay đổi (Change Management)
                </div>
                <div className="text-2xl font-black text-indigo-700">{dashboardData.completionRate}%</div>
              </div>
              <p className="text-[11px] text-indigo-900/85 flex justify-between pr-1">
                <span>Tổng số chiến lược & nhiệm vụ:</span>
                <span className="font-bold">{dashboardData.totalGoals}</span>
              </p>
            </div>

            {/* Overall Chart */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Tỷ lệ Hoàn thành Chung</h3>
              
              {dashboardData.totalGoals > 0 ? (
                <div className="h-48 border border-slate-100 rounded-xl p-2 bg-white">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dashboardData.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <p className="text-xs text-slate-500 font-medium">Chưa có mục tiêu nào được giao trong sơ đồ.</p>
                </div>
              )}
            </div>

            {/* Department Progress */}
            {dashboardData.barData.length > 0 && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Top 5 Bộ phận Năng động</h3>
                <div className="h-56 border border-slate-100 rounded-xl p-3 bg-white">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboardData.barData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                      <Bar dataKey="Hoàn_Thành" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={30} />
                      <Bar dataKey="Chưa_Xong" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top Performers */}
            {dashboardData.topPerformers.length > 0 && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Cá nhân Ưu tú</h3>
                <div className="space-y-2">
                  {dashboardData.topPerformers.map((user, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-emerald-800 truncate">{user.name}</div>
                        <div className="text-[10px] text-emerald-600 font-medium">{user.completed} / {user.total} nhiệm vụ</div>
                      </div>
                      <div className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                        {Math.round((user.completed/user.total) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SMART AI ASSISTANT / GEMINI */}
        {activeTab === 'ai' && (
          <div className="space-y-5 fade-in">
            <div className="space-y-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs font-display">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Trích xuất Sơ đồ bằng Trợ lý Gemini AI
              </div>
              <p className="text-[11px] text-indigo-900/85 leading-relaxed">
                Hãy dán bất kỳ văn bản danh sách thô, chuỗi email trao đổi, tin nhắn Slack hay nội dung trao đổi mô tả quan hệ báo cáo công việc vào đây. Trợ lý AI sẽ tự động phân tích và vẽ bổ sung nhân viên mới lên sơ đồ ngay lập tức!
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Dán văn bản mô tả sơ đồ tổ chức thô</label>
              
              <div className="space-y-1">
                <div className="flex gap-1.5">
                  <button
                    id="sample-sales-scenario"
                    type="button"
                    onClick={() => loadExampleAiPrompt('sales')}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded transition-all cursor-pointer"
                  >
                    💡 Kịch bản: Phòng Thu mua
                  </button>
                  <button
                    id="sample-eng-scenario"
                    type="button"
                    onClick={() => loadExampleAiPrompt('eng')}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded transition-all cursor-pointer"
                  >
                    💡 Kịch bản: Khối cửa hàng
                  </button>
                </div>
              </div>

              <textarea
                id="textarea-ai-input"
                rows={8}
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ví dụ: Nguyễn Minh Trí là CEO. Phạm Thanh Thủy báo cáo trực tiếp cho Trí điều hành khối cửa hàng..."
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono text-slate-700"
              />

              {aiError && (
                <div className="p-3 bg-red-50 border border-red-150 rounded-lg text-xs text-red-700 flex gap-1.5 items-start">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Trích xuất thất bại:</span> {aiError}
                  </div>
                </div>
              )}

              {aiSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-lg text-xs text-emerald-800 flex gap-1.5 items-start animate-fade-in">
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <div>{aiSuccess}</div>
                </div>
              )}

              <button
                id="btn-trigger-ai-parse"
                type="button"
                onClick={handleAiParse}
                disabled={aiLoading || !aiInput.trim()}
                className={`w-full flex items-center justify-center gap-2 py-2.5 text-white font-semibold rounded-lg text-xs shadow-sm transition-all cursor-pointer select-none ${
                    aiLoading || !aiInput.trim()
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {aiLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Gemini đang phân tích cấu trúc...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Phân tích & Vẽ lên sơ đồ
                  </>
                )}
              </button>
            </div>
            
            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 space-y-1 leading-relaxed">
              <span className="font-bold text-slate-500">Cơ chế tự động liên kết báo cáo:</span>
              <p>Nhân viên có tên người quản lý trùng khớp với thành viên hiện tại trên sơ đồ sẽ tự động báo cáo cho người đó. Nếu không tìm thấy tên người quản lý tương ứng, họ sẽ được hiển thị độc lập ở vị trí đỉnh nhánh báo cáo trực tiếp lên lãnh đạo cấp cao nhất.</p>
            </div>
          </div>
        )}
        {/* TAB 6: DATA / IMPORT EXPORT */}
        {activeTab === 'data' && (
          <div className="space-y-5 fade-in">
            <div className="space-y-4">
              <GoogleDriveSync nodes={nodes} settings={settings} onImport={onImportData} />
              
              <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase mt-6">Nhập / Xuất dữ liệu Local</h3>
              
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={onExportJson}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-sm hover:border-slate-300 transition-all text-left"
                >
                  <div>
                    <span className="font-semibold text-slate-700 text-sm block">Tải xuống (JSON)</span>
                    <span className="text-xs text-slate-500 mt-0.5">Lưu trữ sơ đồ để chia sẻ hoặc backup</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg shadow-xs border border-slate-100">
                    <Download className="w-4 h-4 text-slate-600" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => jsonInputRef.current?.click()}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-sm hover:border-slate-300 transition-all text-left"
                >
                  <div>
                    <span className="font-semibold text-slate-700 text-sm block">Tải lên (JSON)</span>
                    <span className="text-xs text-slate-500 mt-0.5">Phục hồi sơ đồ từ file backup</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg shadow-xs border border-slate-100">
                    <Upload className="w-4 h-4 text-slate-600" />
                  </div>
                </button>
                <input
                  type="file"
                  accept=".json"
                  ref={jsonInputRef}
                  onChange={handleJsonUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => csvInputRef.current?.click()}
                  className="w-full flex items-center justify-between p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-white hover:shadow-sm hover:border-indigo-300 transition-all text-left group"
                >
                  <div>
                    <span className="font-semibold text-indigo-700 text-sm block group-hover:text-indigo-800">Nhập từ tệp CSV</span>
                    <span className="text-xs text-indigo-500/80 mt-0.5">Khởi tạo nhanh danh sách nhiều nhân sự</span>
                  </div>
                  <div className="p-2 bg-indigo-100 rounded-lg shadow-xs border border-indigo-200">
                    <FileJson className="w-4 h-4 text-indigo-600" />
                  </div>
                </button>
                <input
                  type="file"
                  accept=".csv"
                  ref={csvInputRef}
                  onChange={handleCsvUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
  );
}