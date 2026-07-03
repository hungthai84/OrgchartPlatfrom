export const NODE_THEMES = [
  { id: 'blue', main: { bg: 'bg-blue-100/90', top: 'bg-blue-600', iconBg: 'bg-blue-100/80', iconBorder: 'border-blue-200', iconText: 'text-blue-700' }, sub: { bg: 'bg-blue-50/90', top: 'bg-blue-300', iconBg: 'bg-blue-50/80', iconBorder: 'border-blue-100', iconText: 'text-blue-500' } },
  { id: 'emerald', main: { bg: 'bg-emerald-100/90', top: 'bg-emerald-600', iconBg: 'bg-emerald-100/80', iconBorder: 'border-emerald-200', iconText: 'text-emerald-700' }, sub: { bg: 'bg-emerald-50/90', top: 'bg-emerald-300', iconBg: 'bg-emerald-50/80', iconBorder: 'border-emerald-100', iconText: 'text-emerald-500' } },
  { id: 'purple', main: { bg: 'bg-purple-100/90', top: 'bg-purple-600', iconBg: 'bg-purple-100/80', iconBorder: 'border-purple-200', iconText: 'text-purple-700' }, sub: { bg: 'bg-purple-50/90', top: 'bg-purple-300', iconBg: 'bg-purple-50/80', iconBorder: 'border-purple-100', iconText: 'text-purple-500' } },
  { id: 'rose', main: { bg: 'bg-rose-100/90', top: 'bg-rose-600', iconBg: 'bg-rose-100/80', iconBorder: 'border-rose-200', iconText: 'text-rose-700' }, sub: { bg: 'bg-rose-50/90', top: 'bg-rose-300', iconBg: 'bg-rose-50/80', iconBorder: 'border-rose-100', iconText: 'text-rose-500' } },
  { id: 'amber', main: { bg: 'bg-amber-100/90', top: 'bg-amber-600', iconBg: 'bg-amber-100/80', iconBorder: 'border-amber-200', iconText: 'text-amber-700' }, sub: { bg: 'bg-amber-50/90', top: 'bg-amber-300', iconBg: 'bg-amber-50/80', iconBorder: 'border-amber-100', iconText: 'text-amber-500' } },
  { id: 'cyan', main: { bg: 'bg-cyan-100/90', top: 'bg-cyan-600', iconBg: 'bg-cyan-100/80', iconBorder: 'border-cyan-200', iconText: 'text-cyan-700' }, sub: { bg: 'bg-cyan-50/90', top: 'bg-cyan-300', iconBg: 'bg-cyan-50/80', iconBorder: 'border-cyan-100', iconText: 'text-cyan-500' } },
  { id: 'fuchsia', main: { bg: 'bg-fuchsia-100/90', top: 'bg-fuchsia-600', iconBg: 'bg-fuchsia-100/80', iconBorder: 'border-fuchsia-200', iconText: 'text-fuchsia-700' }, sub: { bg: 'bg-fuchsia-50/90', top: 'bg-fuchsia-300', iconBg: 'bg-fuchsia-50/80', iconBorder: 'border-fuchsia-100', iconText: 'text-fuchsia-500' } },
  { id: 'lime', main: { bg: 'bg-lime-100/90', top: 'bg-lime-600', iconBg: 'bg-lime-100/80', iconBorder: 'border-lime-200', iconText: 'text-lime-700' }, sub: { bg: 'bg-lime-50/90', top: 'bg-lime-300', iconBg: 'bg-lime-50/80', iconBorder: 'border-lime-100', iconText: 'text-lime-500' } },
  { id: 'teal', main: { bg: 'bg-teal-100/90', top: 'bg-teal-600', iconBg: 'bg-teal-100/80', iconBorder: 'border-teal-200', iconText: 'text-teal-700' }, sub: { bg: 'bg-teal-50/90', top: 'bg-teal-300', iconBg: 'bg-teal-50/80', iconBorder: 'border-teal-100', iconText: 'text-teal-500' } },
  { id: 'orange', main: { bg: 'bg-orange-100/90', top: 'bg-orange-600', iconBg: 'bg-orange-100/80', iconBorder: 'border-orange-200', iconText: 'text-orange-700' }, sub: { bg: 'bg-orange-50/90', top: 'bg-orange-300', iconBg: 'bg-orange-50/80', iconBorder: 'border-orange-100', iconText: 'text-orange-500' } },
  { id: 'slate', main: { bg: 'bg-slate-100/90', top: 'bg-slate-600', iconBg: 'bg-slate-100/80', iconBorder: 'border-slate-200', iconText: 'text-slate-700' }, sub: { bg: 'bg-slate-50/90', top: 'bg-slate-300', iconBg: 'bg-slate-50/80', iconBorder: 'border-slate-100', iconText: 'text-slate-500' } }
];

export const getThemeById = (id?: string) => {
  if (!id) return null;
  return NODE_THEMES.find(t => t.id === id) || null;
};
