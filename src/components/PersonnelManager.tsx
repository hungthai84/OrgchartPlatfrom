import React, { useState, useMemo } from 'react';
import { ContactNode } from '../types';
import { Search, Filter, Edit3, MoreHorizontal } from 'lucide-react';

interface PersonnelManagerProps {
  nodes: ContactNode[];
  viewMode: 'table' | 'card';
  onSelectNode: (node: ContactNode) => void;
  onEditNode: (node: ContactNode) => void;
}

export default function PersonnelManager({ nodes, viewMode, onSelectNode, onEditNode }: PersonnelManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [relationshipFilter, setRelationshipFilter] = useState<string>('all');
  const [titleFilter, setTitleFilter] = useState<string>('all');

  const departments = useMemo(() => Array.from(new Set(nodes.map(n => n.department).filter(Boolean))), [nodes]);
  const titles = useMemo(() => Array.from(new Set(nodes.map(n => n.title).filter(Boolean))), [nodes]);

  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = n.name.toLowerCase().includes(term) || 
                              (n.title && n.title.toLowerCase().includes(term)) ||
                              (n.department && n.department.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }
      if (departmentFilter !== 'all' && n.department !== departmentFilter) return false;
      if (titleFilter !== 'all' && n.title !== titleFilter) return false;
      if (relationshipFilter !== 'all' && n.relationship !== relationshipFilter) return false;
      return true;
    });
  }, [nodes, searchTerm, departmentFilter, titleFilter, relationshipFilter]);

  const getRelationshipBadge = (rel?: string) => {
    if (rel === 'champion') return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold">Cốt lõi</span>;
    if (rel === 'supporter') return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">Ủng hộ</span>;
    if (rel === 'detractor') return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">Phản đối</span>;
    if (rel === 'blocker') return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">Cản trở</span>;
    return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-semibold">Trung lập</span>;
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-white/80 backdrop-blur-md p-6 rounded-tl-2xl">
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân sự..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        
        <select
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">Tất cả phòng ban</option>
          {departments.map(d => <option key={d} value={String(d)}>{d}</option>)}
        </select>
        
        <select
          value={titleFilter}
          onChange={e => setTitleFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">Tất cả chức danh</option>
          {titles.map(t => <option key={t} value={String(t)}>{t}</option>)}
        </select>

        <select
          value={relationshipFilter}
          onChange={e => setRelationshipFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">Tất cả mối quan hệ</option>
          <option value="champion">Cốt lõi</option>
          <option value="supporter">Ủng hộ</option>
          <option value="neutral">Trung lập</option>
          <option value="detractor">Phản đối</option>
          <option value="blocker">Cản trở</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-50/50 custom-scrollbar">
        {viewMode === 'table' ? (
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100/80 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Họ và tên</th>
                <th className="px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Chức danh</th>
                <th className="px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Phòng ban</th>
                <th className="px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Quan hệ</th>
                <th className="px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">Liên hệ</th>
                <th className="px-4 py-3 font-semibold text-slate-700 border-b border-slate-200 w-16 text-center">Sửa</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.length > 0 ? filteredNodes.map(node => (
                <tr key={node.id} className="border-b border-slate-100 hover:bg-white transition-colors group">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{node.name}</div>
                    {node.vacant && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded mt-1 inline-block">Đang trống</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{node.title || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{node.department || '-'}</td>
                  <td className="px-4 py-3">{getRelationshipBadge(node.relationship)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {node.email && <div>{node.email}</div>}
                    {node.phone && <div>{node.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => onEditNode(node)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Không tìm thấy nhân sự phù hợp</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNodes.length > 0 ? filteredNodes.map(node => (
              <div key={node.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow relative group">
                <button 
                  onClick={() => onEditNode(node)}
                  className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <div className="flex flex-col h-full">
                  <div className="font-bold text-slate-800 text-base pr-8 mb-1">{node.name}</div>
                  <div className="text-blue-600 text-xs font-semibold mb-2">{node.title || 'Chưa cập nhật'}</div>
                  <div className="text-slate-500 text-xs mb-4">{node.department || '-'}</div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    {getRelationshipBadge(node.relationship)}
                    {(node.email || node.phone) && (
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] text-slate-400 font-medium">Liên hệ có sẵn</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-12 text-center text-slate-500">
                Không tìm thấy nhân sự phù hợp
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
