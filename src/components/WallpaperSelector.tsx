import React, { useState } from 'react';
import { ChartSettings } from '../types';
import { Check, Image as ImageIcon, Video, Palette, Grid } from 'lucide-react';
import { imageWallpapers, specialAndVideoWallpapers, darkGradientWallpapers, customPatterns } from '../wallpapers';

interface WallpaperSelectorProps {
  settings: ChartSettings;
  onUpdateSettings: (settings: ChartSettings) => void;
}

export default function WallpaperSelector({ settings, onUpdateSettings }: WallpaperSelectorProps) {
  const [activeTab, setActiveTab] = useState<'solid' | 'image' | 'video' | 'gradient' | 'pattern'>('solid');

  const updateBackground = (type: ChartSettings['backgroundType'], url?: string) => {
    onUpdateSettings({
      ...settings,
      backgroundType: type,
      wallpaperUrl: url
    });
  };

  const isSelected = (type: string, url?: string) => {
    if (settings.backgroundType !== type) return false;
    if (url !== undefined && settings.wallpaperUrl !== url) return false;
    return true;
  };

  return (
    <div className="space-y-4">
      <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
        <button
          onClick={() => setActiveTab('solid')}
          className={`flex-1 py-1.5 rounded-md transition-colors ${activeTab === 'solid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Cơ bản
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-1.5 rounded-md transition-colors ${activeTab === 'image' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Ảnh tĩnh
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex-1 py-1.5 rounded-md transition-colors ${activeTab === 'video' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Động (Video)
        </button>
        <button
          onClick={() => setActiveTab('gradient')}
          className={`flex-1 py-1.5 rounded-md transition-colors ${activeTab === 'gradient' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Dải màu
        </button>
        <button
          onClick={() => setActiveTab('pattern')}
          className={`flex-1 py-1.5 rounded-md transition-colors ${activeTab === 'pattern' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Họa tiết
        </button>
      </div>

      <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {activeTab === 'solid' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateBackground('grid')}
              className={`h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                isSelected('grid') ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Grid className={`w-5 h-5 ${isSelected('grid') ? 'text-blue-500' : 'text-slate-400'}`} />
              <span className="text-xs font-semibold text-slate-700">Lưới (Grid)</span>
            </button>
            <button
              onClick={() => updateBackground('white')}
              className={`h-24 rounded-xl border-2 bg-white flex flex-col items-center justify-center gap-2 transition-all ${
                isSelected('white') ? 'border-blue-500' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded ${isSelected('white') ? 'bg-blue-50' : 'bg-slate-50 border border-slate-200'}`} />
              <span className="text-xs font-semibold text-slate-700">Trắng trơn</span>
            </button>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="grid grid-cols-3 gap-2">
            {imageWallpapers.map((url, i) => (
              <button
                key={i}
                onClick={() => updateBackground('image', url)}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected('image', url) ? 'border-blue-500' : 'border-transparent hover:border-slate-300'
                }`}
              >
                <img src={url} alt={`Wallpaper ${i}`} className="w-full h-full object-cover" />
                {isSelected('image', url) && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'video' && (
          <div className="grid grid-cols-2 gap-2">
            {specialAndVideoWallpapers.map((item, i) => (
              <button
                key={i}
                onClick={() => updateBackground('video', item.url)}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all bg-slate-100 ${
                  isSelected('video', item.url) ? 'border-blue-500' : 'border-transparent hover:border-slate-300'
                }`}
              >
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={`Video thumbnail ${i}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Video className="w-6 h-6" />
                  </div>
                )}
                {isSelected('video', item.url) && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'gradient' && (
          <div className="grid grid-cols-3 gap-2">
            {darkGradientWallpapers.map((grad, i) => (
              <button
                key={i}
                onClick={() => updateBackground('gradient', grad)}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected('gradient', grad) ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-slate-300 hover:shadow-sm'
                }`}
                style={{ background: grad }}
              >
                {isSelected('gradient', grad) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'pattern' && (
          <div className="grid grid-cols-2 gap-3">
            {customPatterns.map((pat, i) => (
              <button
                key={i}
                onClick={() => updateBackground('pattern', pat.id)}
                className={`relative h-24 rounded-xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                  isSelected('pattern', pat.id) ? 'border-blue-500' : 'border-slate-200 hover:border-slate-300'
                }`}
                style={
                  pat.patternCss 
                    ? { backgroundColor: pat.patternBg, backgroundImage: pat.patternCss, backgroundSize: pat.patternSize }
                    : pat.thumbnail ? { backgroundImage: `url(${pat.thumbnail})`, backgroundSize: 'cover' } : {}
                }
              >
                {isSelected('pattern', pat.id) && (
                  <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                    <div className="bg-white/80 p-1 rounded-full backdrop-blur-sm">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
