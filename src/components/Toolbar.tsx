import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Compass, 
  FileJson, 
  Layers, 
  Split, 
  HelpCircle,
  Settings,
  Grid,
  Target,
  Network,
  Table,
  LayoutGrid,
  Users,
  Monitor,
  FileText,
  Upload,
  Download
} from 'lucide-react';
import { ChartSettings } from '../types';

interface ToolbarProps {
  settings: ChartSettings;
  onUpdateSettings: (settings: ChartSettings) => void;
  searchQuery: string;
  onUpdateSearchQuery: (query: string) => void;
  onAddContact: () => void;
  onResetToDefault: () => void;
  onClearChart: () => void;
  zoomScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitScreen: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onCenterView: () => void;
  onCollapseOneLevel: () => void;
  onSetExpandLevel?: (level: number) => void;
  viewMode: 'chart' | 'table' | 'card';
  onViewModeChange: (mode: 'chart' | 'table' | 'card') => void;
  onExportCsv?: () => void;
  onImportCsv?: (csvData: string) => void;
  onDownloadCsvSample?: () => void;
}

export default function Toolbar({
  settings,
  onUpdateSettings,
  searchQuery,
  onUpdateSearchQuery,
  onResetToDefault,
  zoomScale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitScreen,
  isSidebarOpen,
  onToggleSidebar,
  onExpandAll,
  onCenterView,
  onSetExpandLevel,
  viewMode,
  onViewModeChange,
  onExportCsv,
  onImportCsv,
  onDownloadCsvSample
}: ToolbarProps) {
  const csvInputRef = useRef<HTMLInputElement>(null);
  
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

  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  
  const levelMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (levelMenuRef.current && !levelMenuRef.current.contains(event.target as Node)) {
        setShowLevelMenu(false);
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setShowViewMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDirection = () => {
    onUpdateSettings({
      ...settings,
      layoutDirection: settings.layoutDirection === 'TB' ? 'LR' : 'TB'
    });
  };

  return (
    <div id="toolbar-panel" className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-5 py-3 shrink-0 gap-4 z-40">
      
      <div className="flex items-center gap-3 w-full">
        {settings.companyLogoUrl && (
          <img 
            src={settings.companyLogoUrl} 
            alt="Company Logo" 
            className="h-10 w-auto object-contain rounded" 
          />
        )}
        {/* 1. Search Bar */}
        <div className="flex items-center gap-2 max-w-sm w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
          id="search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onUpdateSearchQuery(e.target.value)}
          placeholder="Tìm kiếm đồng nghiệp, chức danh, phòng ban..."
          className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
        />
        </div>
      </div>

      {/* 2. Scale Navigator Widget */}
      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 shrink-0">
        <button
          onClick={onCenterView}
          title="Về trung tâm"
          className="p-1.5 hover:bg-white text-slate-600 rounded hover:shadow-xs transition-all cursor-pointer"
        >
          <Target className="w-4 h-4" />
        </button>
        <div className="h-4 w-[1px] bg-slate-200 mx-1" />
        <button
          id="btn-zoom-out"
          onClick={onZoomOut}
          title="Thu nhỏ"
          className="p-1.5 hover:bg-white text-slate-600 rounded hover:shadow-xs transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="btn-reset-zoom"
          onClick={onResetZoom}
          className="text-[10px] font-mono font-bold text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded transition-all cursor-pointer"
          title="Đặt lại mức phóng 100%"
        >
          {Math.round(zoomScale * 100)}%
        </button>
        <button
          id="btn-zoom-in"
          onClick={onZoomIn}
          title="Phóng to"
          className="p-1.5 hover:bg-white text-slate-600 rounded hover:shadow-xs transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="h-4 w-[1px] bg-slate-200 mx-1" />
        <button
          id="btn-fit-screen"
          onClick={onFitScreen}
          title="Thu gọn vừa màn hình"
          className="p-1.5 hover:bg-white text-slate-600 rounded hover:shadow-xs transition-colors cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Action Group */}
      <div className="flex items-center gap-2">
        {/* CSV Actions */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          <button onClick={onDownloadCsvSample} title="Tải CSV Mẫu" className="p-1.5 text-slate-500 hover:text-slate-800">
            <FileText className="w-4 h-4" />
          </button>
          <button onClick={() => csvInputRef.current?.click()} title="Nhập CSV" className="p-1.5 text-slate-500 hover:text-slate-800">
            <Upload className="w-4 h-4" />
          </button>
          <input type="file" ref={csvInputRef} accept=".csv" onChange={handleCsvUpload} className="hidden" />
          <button onClick={onExportCsv} title="Xuất CSV" className="p-1.5 text-slate-500 hover:text-slate-800">
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Orientation Swap Toggle */}
        <button
          id="btn-quick-orientation"
          type="button"
          onClick={toggleDirection}
          title="Chuyển đổi hướng hiển thị sơ đồ (Dọc / Ngang)"
          className="p-2 text-slate-700 bg-white hover:bg-white border border-slate-200 rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <Split className="w-4 h-4 text-slate-500" />
        </button>
        
        {/* Level Menu */}
        <div className="relative" ref={levelMenuRef}>
          <button
            onClick={() => setShowLevelMenu(!showLevelMenu)}
            title="Cấp độ hiển thị"
            className="p-2 text-slate-700 bg-white hover:bg-white border border-slate-200 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-500" />
          </button>
          
          {showLevelMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 p-2 py-3 z-50">
              <div className="text-xs font-semibold text-slate-500 px-2 mb-2">Show Levels</div>
              <div className="flex items-center justify-between px-2">
                {[1, 2, 3, 4].map(level => (
                  <button
                    key={level}
                    onClick={() => {
                      if (onSetExpandLevel) onSetExpandLevel(level);
                      setShowLevelMenu(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-indigo-50 text-indigo-700 font-semibold transition-colors"
                  >
                    {level}
                  </button>
                ))}
                <button
                  onClick={() => {
                    onExpandAll();
                    setShowLevelMenu(false);
                  }}
                  className="px-2 h-8 flex items-center justify-center rounded hover:bg-indigo-50 text-indigo-700 font-semibold transition-colors"
                >
                  All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Mode Menu */}
        <div className="relative border-l border-slate-200 pl-2 ml-1" ref={viewMenuRef}>
          <button
            onClick={() => setShowViewMenu(!showViewMenu)}
            title="Chế độ xem"
            className="p-2 text-slate-700 bg-white hover:bg-white border border-slate-200 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Monitor className="w-4 h-4 text-slate-500" />
          </button>
          
          {showViewMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
              <button
                onClick={() => { onViewModeChange('chart'); setShowViewMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${viewMode === 'chart' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <Network className="w-4 h-4" />
                <span>Sơ đồ tổ chức</span>
              </button>
              <button
                onClick={() => { onViewModeChange('table'); setShowViewMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${viewMode === 'table' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <Table className="w-4 h-4" />
                <span>Dạng bảng</span>
              </button>
              <button
                onClick={() => { onViewModeChange('card'); setShowViewMenu(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${viewMode === 'card' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Dạng danh thiếp</span>
              </button>
            </div>
          )}
        </div>

        {/* Quản lý nhân sự Colored Icon Button */}
        <button
          onClick={() => onViewModeChange('table')}
          title="Quản lý nhân sự"
          className="p-2 ml-1 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <Users className="w-4 h-4" />
        </button>

        {/* Secondary Template Triggers */}
        <div className="flex items-center border-l border-slate-200 pl-2 ml-1 gap-1">
          <button
            id="btn-templet-reset"
            type="button"
            onClick={onResetToDefault}
            title="Khôi phục sơ đồ mẫu"
            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Sidebar */}
        <div className="flex items-center border-l border-slate-200 pl-2 ml-1 gap-1">
          <button
            id="btn-toggle-sidebar"
            type="button"
            onClick={onToggleSidebar}
            title="Đóng/Mở bảng Cài đặt"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${isSidebarOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
