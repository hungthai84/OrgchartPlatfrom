/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  Briefcase, 
  Building, 
  Crown,
  Edit2, 
  MessageSquare,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Target,
  Info
} from 'lucide-react';
import { ContactNode, CustomFieldDefinition, GoalItem } from '../types';

interface SelectedNodePopupProps {
  node: ContactNode | null;
  allNodes: ContactNode[];
  customFieldDefinitions: CustomFieldDefinition[];
  onClose: () => void;
  onEdit: (node: ContactNode) => void;
  onUpdateGoals?: (nodeId: string, goals: GoalItem[]) => void;
  onUpdateNode?: (node: ContactNode) => void;
}

export default function SelectedNodePopup({
  node,
  allNodes,
  customFieldDefinitions,
  onClose,
  onEdit,
  onUpdateGoals,
  onUpdateNode
}: SelectedNodePopupProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'goals'>('info');
  const [newGoalText, setNewGoalText] = useState('');

  if (!node) return null;

  // Retrieve manager info
  const manager = node.managerId ? allNodes.find(n => n.id === node.managerId) : null;

  // Count direct reports
  const directReports = allNodes.filter(n => n.managerId === node.id);

  // Create avatar initials
  const initials = node.isPlaceholder
    ? '??'
    : node.name.split(' ').map(n => n[0]).slice(0, 2).join('');

  // Node goals list safely fetched
  const goalsList = node.goals || [];

  // Count completed and pending goals
  const totalGoalsCount = goalsList.length;
  const completedGoalsCount = goalsList.filter(g => g.status === 'completed').length;

  const handleToggleGoal = (goalId: string) => {
    if (!onUpdateGoals) return;
    const updated: GoalItem[] = goalsList.map(g => {
      if (g.id === goalId) {
        return { ...g, status: g.status === 'completed' ? 'pending' : 'completed' };
      }
      return g;
    });
    onUpdateGoals(node.id, updated);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim() || !onUpdateGoals) return;
    const newGoal: GoalItem = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: newGoalText.trim(),
      status: 'pending'
    };
    onUpdateGoals(node.id, [...goalsList, newGoal]);
    setNewGoalText('');
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!onUpdateGoals) return;
    const updated = goalsList.filter(g => g.id !== goalId);
    onUpdateGoals(node.id, updated);
  };

  return (
    <div 
      id="profile-popup-overlay" 
      onClick={onClose}
      className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4"
    >
      <div 
        id="profile-popup-card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative flex flex-col max-h-[85vh]"
      >
        {/* Banner/Header Block - Premium Corporate Blue/Indigo Gradient */}
        <div className="h-24 shrink-0 relative flex items-end px-6 bg-gradient-to-r from-blue-600 to-indigo-700">
          {/* Subtle geometric pattern overlay */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <button 
            id="btn-close-popup"
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-1.5 rounded-full transition-colors cursor-pointer z-10"
            title="Đóng bản chi tiết"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Info Details Header */}
        <div className="px-6 pb-2 pt-1 flex flex-col sm:flex-row gap-4 items-start relative border-b border-slate-100 shrink-0 bg-white">
          {/* Bigger avatar with thick white border */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-md relative -mt-10 shrink-0 flex items-center justify-center font-bold text-slate-700 tracking-wider text-xl uppercase select-none">
            {node.isDepartment ? (
              <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building className="w-8 h-8" />
              </div>
            ) : node.isPlaceholder ? (
              <span className="text-sm font-black text-slate-400">OPEN</span>
            ) : node.avatarUrl ? (
              <div className="relative w-full h-full group">
                <img 
                  src={node.avatarUrl} 
                  alt={node.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
                <label className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer text-white">
                  <span className="text-[10px] font-bold">Sửa</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onUpdateNode) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        onUpdateNode({ ...node, avatarUrl: ev.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
            ) : (
              <div className="relative w-full h-full bg-slate-100 text-slate-600 flex items-center justify-center font-display group">
                {initials}
                <label className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer text-white">
                  <span className="text-[10px] font-bold">Thêm</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onUpdateNode) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        onUpdateNode({ ...node, avatarUrl: ev.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
            )}
          </div>

          {/* Names block */}
          <div className="flex-1 min-w-0 pr-4 mt-2 sm:mt-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="popup-stakeholder-name" className="text-lg font-bold text-slate-900 leading-tight font-display">
                {node.name}
              </h2>
              {node.isPlaceholder && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Vị trí trống</span>
              )}
              {node.isDepartment && (
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Phòng ban</span>
              )}
            </div>
            
            <div className="flex flex-col gap-1 mt-1">
              {node.isDepartment ? (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Thẻ Phòng Ban Chức Năng</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs font-semibold">{node.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs">{node.department}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* BEAUTIFUL MODAL TABS */}
        {!node.isDepartment && (
          <div className="flex border-b border-slate-150 bg-slate-50/50 px-6 shrink-0">
            <button
              id="tab-popup-info"
              type="button"
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              Thông tin cá nhân
            </button>
            
            <button
              id="tab-popup-goals"
              type="button"
              onClick={() => setActiveTab('goals')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'goals'
                  ? 'border-blue-600 text-blue-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Mục tiêu được giao
              {totalGoalsCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                  completedGoalsCount === totalGoalsCount 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {completedGoalsCount}/{totalGoalsCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Main Body (Scrollable depending on tab) */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 bg-slate-50/20">
          
          {/* TAB 1: THÔNG TIN (INFORMATION) */}
          {(activeTab === 'info' || node.isDepartment) && (
            <div className="space-y-4 animate-fade-in">
              {/* Influence levels indicator (only for people) */}
              {!node.isDepartment && (
                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-xs">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Mức độ thẩm quyền quyết định</span>
                  <div className="flex items-center gap-1.5">
                    <Crown className={`w-4 h-4 ${
                      node.influence === 'high' ? 'text-amber-500 fill-amber-500/20' : 
                      node.influence === 'medium' ? 'text-slate-500' : 'text-slate-300'
                    }`} />
                    <span className="text-xs font-bold text-slate-800">
                      {node.influence === 'high' ? 'Quyết định trực tiếp (Thẩm quyền Cao)' :
                       node.influence === 'medium' ? 'Phản biện chính (Tầm ảnh hưởng vừa)' :
                       node.influence === 'low' ? 'Chỉ có ý kiến đóng góp (Thấp)' : 'Không có thẩm quyền trực tiếp'}
                    </span>
                  </div>
                </div>
              )}

              {/* Contact Details Panel */}
              {!node.isPlaceholder && !node.isDepartment && (
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thông tin liên hệ</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Email */}
                    {node.email ? (
                      <a 
                        href={`mailto:${node.email}`}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-slate-400 block font-medium uppercase">Email</span>
                          <span className="text-xs text-slate-700 truncate block font-mono group-hover:text-blue-600 transition-colors">{node.email}</span>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-100 text-slate-350 bg-slate-50/20">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs italic text-slate-400">(Chưa cập nhật email)</span>
                      </div>
                    )}

                    {/* Phone */}
                    {node.phone ? (
                      <a 
                        href={`tel:${node.phone}`}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-md bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-slate-400 block font-medium uppercase">Số điện thoại</span>
                          <span className="text-xs text-slate-700 truncate block group-hover:text-green-600 transition-colors">{node.phone}</span>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-100 text-slate-350 bg-slate-50/20">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs italic text-slate-400">(Chưa cập nhật điện thoại)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reporting Line Context */}
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-3">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sơ đồ và Tuyến báo cáo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-medium uppercase">Cấp trên trực tiếp</span>
                    {manager ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                          {manager.avatarUrl ? (
                            <img src={manager.avatarUrl} alt={manager.name} className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                          ) : (
                            manager.name[0]
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-700 truncate block leading-tight">{manager.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate leading-none mt-0.5">{manager.title}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1.5 text-xs font-semibold text-slate-500 italic flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Cấp lãnh đạo cao nhất
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 block font-medium uppercase">Đội ngũ dưới quyền trực tiếp</span>
                    <span className="text-xs font-semibold text-slate-700 block mt-1.5">
                      {directReports.length > 0 ? (
                        <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[11px]">
                          {directReports.length} Nhân viên trực tiếp
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium italic">Không có nhân sự báo cáo</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom Info Fields Section */}
              {customFieldDefinitions.length > 0 && !node.isDepartment && (
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thông tin mở rộng</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {customFieldDefinitions.map((df) => {
                      const val = node.customFields?.[df.id];
                      return (
                        <div key={df.id} className="min-w-0">
                          <span className="text-[9px] text-slate-400 block font-semibold uppercase">{df.label}</span>
                          <span className="text-xs text-slate-700 font-bold truncate block mt-0.5">
                            {val || <span className="text-slate-350 italic font-medium">Chưa cập nhật</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bio & Description Notes Block */}
              {node.notes && (
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {node.isDepartment ? 'Chức năng & Nhiệm vụ' : 'Ghi chú & Định hướng'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal font-medium bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    {node.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MỤC TIÊU (GOALS / OBJECTIVES) */}
          {activeTab === 'goals' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Goals Progress Bar Indicator */}
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Tiến độ mục tiêu</span>
                  <span>
                    {totalGoalsCount > 0 
                      ? `${Math.round((completedGoalsCount / totalGoalsCount) * 100)}%` 
                      : '0%'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${totalGoalsCount > 0 ? (completedGoalsCount / totalGoalsCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                  Đã hoàn thành {completedGoalsCount} trên tổng số {totalGoalsCount} mục tiêu chiến lược của cá nhân.
                </span>
              </div>

              {/* Add New Goal Box Form */}
              {onUpdateGoals && (
                <form onSubmit={handleAddGoal} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Thêm mục tiêu hoặc KPI mới..."
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm
                  </button>
                </form>
              )}

              {/* Goals list */}
              <div className="space-y-2">
                {goalsList.length > 0 ? (
                  goalsList.map((g) => {
                    const isCompleted = g.status === 'completed';
                    return (
                      <div 
                        key={g.id} 
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isCompleted 
                            ? 'bg-emerald-50/40 border-emerald-100 text-slate-600' 
                            : 'bg-white border-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0 mr-3">
                          <button
                            type="button"
                            onClick={() => handleToggleGoal(g.id)}
                            className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${
                              isCompleted ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title={isCompleted ? "Đánh dấu là chưa hoàn thành" : "Đánh dấu là hoàn thành"}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4.5 h-4.5" />
                            ) : (
                              <Circle className="w-4.5 h-4.5" />
                            )}
                          </button>
                          
                          <span className={`text-xs font-semibold leading-relaxed break-words ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-700'
                          }`}>
                            {g.text}
                          </span>
                        </div>

                        {onUpdateGoals && (
                          <button
                            type="button"
                            onClick={() => handleDeleteGoal(g.id)}
                            className="text-slate-350 hover:text-red-500 p-1.5 transition-colors rounded hover:bg-slate-100 shrink-0 cursor-pointer"
                            title="Xóa mục tiêu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 bg-white border border-dashed border-slate-200 rounded-xl">
                    <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">Chưa có mục tiêu gán cho thẻ này</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Nhập thông tin ở trên để bổ sung</p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
          <button
            id="popup-btn-edit"
            type="button"
            onClick={() => {
              onEdit(node);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Chỉnh sửa thẻ
          </button>
          
          <button
            id="popup-btn-close"
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
}
