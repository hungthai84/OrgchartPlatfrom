/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Save, 
  User, 
  Briefcase, 
  Network, 
  ClipboardList,
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Info
} from 'lucide-react';
import { ContactNode, CustomFieldDefinition, GoalItem, RelationshipType, InfluenceLevel } from '../types';

interface ContactEditorProps {
  node: ContactNode | null; // Null if creating a new node
  allNodes: ContactNode[];
  customFieldDefinitions: CustomFieldDefinition[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: ContactNode) => void;
  onDelete?: (id: string) => void;
  suggestedParentId?: string | null; // For contextual quick-add
}

export default function ContactEditor({
  node,
  allNodes,
  customFieldDefinitions,
  isOpen,
  onClose,
  onSave,
  onDelete,
  suggestedParentId
}: ContactEditorProps) {
  // Tabs manager
  const [activeTab, setActiveTab] = useState<'info' | 'goals'>('info');

  // Main form states
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [managerId, setManagerId] = useState<string | null>(null);
  const [relationship, setRelationship] = useState<RelationshipType>('neutral');
  const [influence, setInfluence] = useState<InfluenceLevel>('none');
  const [notes, setNotes] = useState('');
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [isDepartment, setIsDepartment] = useState(false);
  const [themeColor, setThemeColor] = useState<string>('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  
  // Associated node goals state
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [newGoalText, setNewGoalText] = useState('');

  // Reset form with loaded node details
  useEffect(() => {
    if (node) {
      setName(node.name || '');
      setTitle(node.title || '');
      setDepartment(node.department || '');
      setEmail(node.email || '');
      setPhone(node.phone || '');
      setManagerId(node.managerId || null);
      setRelationship(node.relationship || 'neutral');
      setInfluence(node.influence || 'none');
      setNotes(node.notes || '');
      setIsPlaceholder(!!node.isPlaceholder);
      setIsDepartment(!!node.isDepartment);
      setThemeColor(node.themeColor || '');
      setCustomFields(node.customFields || {});
      setGoals(node.goals || []);
    } else {
      // Clear for new additions
      setName('');
      setTitle('');
      setDepartment('');
      setEmail('');
      setPhone('');
      setManagerId(suggestedParentId || null);
      setRelationship('neutral');
      setInfluence('none');
      setNotes('');
      setIsPlaceholder(false);
      setIsDepartment(false);
      setThemeColor('');
      setGoals([]);
      
      // Seed default custom fields keys
      const initialCustomValues: Record<string, string> = {};
      customFieldDefinitions.forEach(d => {
        initialCustomValues[d.id] = d.type === 'number' ? '0' : '';
      });
      setCustomFields(initialCustomValues);
    }
    // Default to the information tab when reopening
    setActiveTab('info');
  }, [node, isOpen, suggestedParentId, customFieldDefinitions]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nodeName = isDepartment
      ? (name.trim() || 'Phòng ban mới')
      : (isPlaceholder ? '[Vị Trí Tuyển Dụng]' : (name.trim() || 'Nhân viên chưa đặt tên'));

    const updatedNode: ContactNode = {
      id: node?.id || `node-${Date.now()}`,
      name: nodeName,
      title: isDepartment ? 'Chức năng & Nhiệm vụ' : (title.trim() || 'Chuyên viên'),
      department: department.trim() || 'Khối Vận hành',
      email: isDepartment ? '' : email.trim(),
      phone: isDepartment ? '' : phone.trim(),
      managerId: managerId === 'none' ? null : managerId,
      relationship: isDepartment ? 'neutral' : relationship,
      influence: isDepartment ? 'none' : influence,
      notes: notes.trim(),
      isPlaceholder: isDepartment ? false : isPlaceholder,
      isDepartment,
      themeColor: themeColor || undefined,
      customFields: isDepartment ? {} : customFields,
      createdAt: node?.createdAt || new Date().toISOString(),
      goals: isDepartment ? [] : goals
    };

    onSave(updatedNode);
    onClose();
  };

  const handleCustomFieldChange = (fieldId: string, val: string) => {
    setCustomFields(prev => ({
      ...prev,
      [fieldId]: val
    }));
  };

  // Exclude current node from manager dropdown options to prevent circular loops
  const getEligibleManagers = () => {
    if (!node) return allNodes;

    const circularIds = new Set<string>([node.id]);
    
    // Add all recursive descendants to prevent rendering cycles
    let foundNewDescendants = true;
    while (foundNewDescendants) {
      foundNewDescendants = false;
      allNodes.forEach(n => {
        if (n.managerId && circularIds.has(n.managerId) && !circularIds.has(n.id)) {
          circularIds.add(n.id);
          foundNewDescendants = true;
        }
      });
    }

    return allNodes.filter(n => !circularIds.has(n.id));
  };

  // Goals handling within the form
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    const newGoal: GoalItem = {
      id: `goal-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      text: newGoalText.trim(),
      status: 'pending'
    };
    setGoals([...goals, newGoal]);
    setNewGoalText('');
  };

  const handleToggleGoal = (id: string) => {
    setGoals(goals.map(g => {
      if (g.id === id) {
        return { ...g, status: g.status === 'completed' ? 'pending' : 'completed' };
      }
      return g;
    }));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  return (
    <div 
      id="contact-editor-overlay" 
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[999] animate-fade-in p-4"
    >
      
      {/* Centered Popup Card Container */}
      <div 
        id="contact-editor-drawer" 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
              <ClipboardList className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-800 font-display">
                {node ? 'Chỉnh sửa Thẻ Nhân sự' : 'Tạo Nhân sự Mới'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Xác định phòng ban, quản lý trực tiếp và thiết lập chỉ tiêu KPI</p>
            </div>
          </div>
          <button 
            id="btn-close-editor"
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* EDITOR TABS */}
        <div className="flex border-b border-slate-150 bg-slate-50/50 px-6 shrink-0">
          <button
            id="editor-tab-info"
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Chỉnh sửa Thông tin
          </button>
          
          <button
            id="editor-tab-goals"
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'goals'
                ? 'border-blue-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Mục tiêu được gán
            {goals.length > 0 && (
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold ml-1.5">
                {goals.length}
              </span>
            )}
          </button>
        </div>

        {/* Form Container (Scrollable Scroll Section) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20">
          
          {/* TAB 1: EDIT GENERAL INFORMATION */}
          {activeTab === 'info' && (
            <div className="space-y-5 animate-fade-in">
              {/* Toggle Types Controls */}
              <div className="grid grid-cols-2 gap-4">
                {/* Vacant Open Role Toggle */}
                {!isDepartment && (
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-blue-900 block uppercase tracking-wider">Vị trí Trống</span>
                      <span className="text-[10px] text-blue-700/80">Đặt thẻ làm vị trí trống.</span>
                    </div>
                    <button
                      id="editor-toggle-vacancy"
                      type="button"
                      onClick={() => setIsPlaceholder(!isPlaceholder)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${
                        isPlaceholder ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out transform ${
                        isPlaceholder ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                )}

                {/* Department Toggle */}
                {!isPlaceholder && (
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between col-span-2 md:col-span-1">
                    <div>
                      <span className="text-xs font-bold text-indigo-900 block uppercase tracking-wider">Thẻ Phòng Ban</span>
                      <span className="text-[10px] text-indigo-700/80">Đặt làm thẻ đại diện phòng.</span>
                    </div>
                    <button
                      id="editor-toggle-department"
                      type="button"
                      onClick={() => {
                        setIsDepartment(!isDepartment);
                        if (!isDepartment) {
                          setIsPlaceholder(false);
                        }
                      }}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${
                        isDepartment ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out transform ${
                        isDepartment ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Thông tin Chi tiết</h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">
                    {isDepartment ? 'Tên Phòng Ban' : 'Họ và Tên Nhân sự'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      id="editor-input-name"
                      type="text"
                      required
                      placeholder={isDepartment ? "Ví dụ: Khối Vận hành" : "Nhập đầy đủ họ và tên nhân viên"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs border border-slate-200 pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium bg-white"
                    />
                  </div>
                </div>

                {!isDepartment && (
                  <>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block">Chức danh / Vị trí</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            id="editor-input-title"
                            type="text"
                            placeholder="Ví dụ: Cửa hàng trưởng, Trưởng phòng"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-xs border border-slate-200 pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block">Phòng ban / Nhóm</label>
                        <input
                          id="editor-input-dept"
                          type="text"
                          placeholder="Ví dụ: Khối Vận hành, Khối Thu mua..."
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full text-xs border border-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block">Email Công việc</label>
                        <input
                          id="editor-input-email"
                          type="email"
                          placeholder="nguyenvan@retailpro.vn"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full text-xs border border-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-mono bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 block">Số Điện thoại Trực tiếp</label>
                        <input
                          id="editor-input-phone"
                          type="text"
                          placeholder="Ví dụ: 0901.234.567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full text-xs border border-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 bg-white"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Reporting Hierarchy */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Tuyến báo cáo nội bộ</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">Người Quản lý Trực tiếp</label>
                  <div className="relative">
                    <Network className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <select
                      id="editor-select-manager"
                      value={managerId || 'none'}
                      onChange={(e) => setManagerId(e.target.value === 'none' ? null : e.target.value)}
                      className="w-full text-xs border border-slate-200 pl-9 pr-3 py-2.5 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    >
                      <option value="none">-- Cấp cao nhất (CEO / Chủ tịch / Quản lý độc lập) --</option>
                      {getEligibleManagers().map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.title})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Việc thay đổi quản lý trực tiếp sẽ tự động di chuyển toàn bộ nhánh báo cáo trên sơ đồ ảo.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">Quyền hạn quyết định</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'low', label: 'Thấp', desc: 'Ý kiến đóng góp' },
                      { id: 'medium', label: 'Trung bình', desc: 'Có tiếng phản biện' },
                      { id: 'high', label: 'Cao', desc: 'Thẩm quyền trực tiếp' },
                    ].map((item) => (
                      <button
                        id={`editor-influence-${item.id}`}
                        key={item.id}
                        type="button"
                        onClick={() => setInfluence(item.id as any)}
                        className={`py-2 px-1 border rounded-lg text-[11px] font-semibold text-center transition-all cursor-pointer ${
                          influence === item.id
                            ? 'bg-blue-600 border-blue-700 text-white scale-[1.02] shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold uppercase tracking-wider">{item.label}</div>
                        <div className={`text-[8px] leading-none mt-0.5 ${influence === item.id ? 'text-blue-100' : 'text-slate-400'}`}>{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Fields */}
              {customFieldDefinitions.length > 0 && (
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Thông tin tùy chọn nâng cao</h3>
                  <div className="space-y-3.5">
                    {customFieldDefinitions.map((fd) => {
                      const val = customFields[fd.id] || '';
                      return (
                        <div id={`editor-custom-wrap-${fd.id}`} key={fd.id} className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 block leading-non flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                            {fd.label}
                          </label>
                          
                          {fd.type === 'select' ? (
                            <select
                              id={`editor-custom-el-${fd.id}`}
                              value={val}
                              onChange={(e) => handleCustomFieldChange(fd.id, e.target.value)}
                              className="w-full text-xs border border-slate-200 p-2.5 bg-white rounded-lg focus:outline-none"
                            >
                              <option value="">-- Chọn tùy chọn --</option>
                              {fd.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : fd.type === 'number' ? (
                            <input
                              id={`editor-custom-el-${fd.id}`}
                              type="number"
                              value={val}
                              onChange={(e) => handleCustomFieldChange(fd.id, e.target.value)}
                              className="w-full text-xs border border-slate-200 px-3 py-2 rounded-lg focus:outline-none"
                            />
                          ) : (
                            <input
                              id={`editor-custom-el-${fd.id}`}
                              type="text"
                              value={val}
                              onChange={(e) => handleCustomFieldChange(fd.id, e.target.value)}
                              className="w-full text-xs border border-slate-200 px-3 py-2 rounded-lg focus:outline-none"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Picker */}
              <div className="border-t border-slate-100 pt-5 space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Màu sắc thẻ
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: '', bg: 'bg-slate-200' },
                    { id: 'blue', bg: 'bg-blue-500' },
                    { id: 'emerald', bg: 'bg-emerald-500' },
                    { id: 'purple', bg: 'bg-purple-500' },
                    { id: 'rose', bg: 'bg-rose-500' },
                    { id: 'amber', bg: 'bg-amber-500' },
                    { id: 'cyan', bg: 'bg-cyan-500' },
                    { id: 'fuchsia', bg: 'bg-fuchsia-500' },
                    { id: 'lime', bg: 'bg-lime-500' },
                    { id: 'teal', bg: 'bg-teal-500' },
                    { id: 'orange', bg: 'bg-orange-500' },
                    { id: 'slate', bg: 'bg-slate-500' }
                  ].map(c => (
                    <button
                      key={c.id || 'default'}
                      type="button"
                      onClick={() => setThemeColor(c.id)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${c.bg} ${themeColor === c.id ? 'ring-2 ring-offset-2 ring-slate-800' : 'ring-1 ring-black/10'}`}
                      title={c.id === '' ? 'Mặc định' : c.id}
                    />
                  ))}
                </div>
              </div>

              {/* Bio & Notes */}
              <div className="border-t border-slate-100 pt-5 space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  {isDepartment ? 'Chức Năng & Nhiệm Vụ Phòng Ban' : 'Ghi chú cá nhân & Bio'}
                </label>
                <textarea
                  id="editor-textarea-notes"
                  rows={3}
                  placeholder={isDepartment ? "Mô tả chi tiết các trách nhiệm chính, vai trò kiểm soát và phối hợp..." : "Ví dụ: Đang quan ngại về quy trình phân phối mới trong quá tết, cần giải thích sâu quy cách kiểm duyệt và hỗ trợ kĩ thuật trước."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 leading-normal bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 2: EDIT GOALS LIST */}
          {activeTab === 'goals' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <Target className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Mục tiêu cá nhân (Chỉ tiêu / KPI)</span>
                  <span className="text-[11px] text-slate-500 leading-relaxed block">
                    Danh sách các kết quả then chốt hoặc mục tiêu lớn được cá nhân này phụ trách chính. Bạn có thể thêm, bớt hoặc chuyển đổi trạng thái hoàn thành.
                  </span>
                </div>
              </div>

              {/* Quick Add Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Thêm chỉ tiêu / KPI mới ví dụ: Chạy 5 chiến dịch..."
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                      handleAddGoal(fakeEvent);
                    }
                  }}
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={(e) => handleAddGoal(e as any)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm
                </button>
              </div>

              {/* Goals list */}
              <div className="space-y-2 mt-3">
                {goals.length > 0 ? (
                  goals.map((g) => {
                    const isCompleted = g.status === 'completed';
                    return (
                      <div 
                        key={g.id} 
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isCompleted 
                            ? 'bg-emerald-50/40 border-emerald-100' 
                            : 'bg-white border-slate-150'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0 mr-3">
                          <button
                            type="button"
                            onClick={() => handleToggleGoal(g.id)}
                            className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${
                              isCompleted ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title={isCompleted ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4.5 h-4.5" />
                            ) : (
                              <Circle className="w-4.5 h-4.5" />
                            )}
                          </button>
                          
                          <span className={`text-xs font-semibold leading-relaxed break-all ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-700'
                          }`}>
                            {g.text}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteGoal(g.id)}
                          className="text-slate-350 hover:text-red-500 p-1.5 transition-colors rounded hover:bg-slate-100 shrink-0 cursor-pointer"
                          title="Xóa mục tiêu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-xl">
                    <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">Chưa có mục tiêu gán cho thành viên này</p>
                    <p className="text-[10px] text-slate-400 mt-1">Cáp KPI cho nhân sự bằng cách điền thông tin và nhấp Thêm ở trên.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal/Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 gap-3">
          {node && onDelete ? (
            <button
              id="btn-delete-node"
              type="button"
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn xóa nhân sự này khỏi sơ đồ? Toàn bộ nhân viên báo cáo trực tiếp cho thành viên này sẽ tạm thời chuyển sang trạng thái tự lập (không quản lý).')) {
                  onDelete(node.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1 px-3.5 py-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg font-bold border border-red-200 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Khóa / Xóa bỏ
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              id="btn-cancel-editor"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              id="btn-save-editor"
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {node ? 'Cập nhật' : 'Khởi tạo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
