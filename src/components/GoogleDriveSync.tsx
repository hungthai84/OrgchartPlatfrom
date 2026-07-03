import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Cloud, Check, Loader2, Save, DownloadCloud } from 'lucide-react';
import { ContactNode, ChartSettings } from '../types';

interface GoogleDriveSyncProps {
  nodes: ContactNode[];
  settings: ChartSettings;
  onImport: (nodes: ContactNode[], settings: ChartSettings) => void;
}

const FILE_NAME = 'orgchart_backup.json';

export default function GoogleDriveSync({ nodes, settings, onImport }: GoogleDriveSyncProps) {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const loginForSave = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      saveToDrive(tokenResponse.access_token);
    },
    scope: 'https://www.googleapis.com/auth/drive.file',
  });

  const loginForLoad = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      loadFromDrive(tokenResponse.access_token);
    },
    scope: 'https://www.googleapis.com/auth/drive.file',
  });

  const saveToDrive = async (token: string) => {
    setIsLoading(true);
    setStatus('Đang lưu vào Google Drive...');
    
    try {
      // 1. Check if file exists
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const searchData = await searchRes.json();
      
      const fileData = {
        nodes,
        settings,
        exportDate: new Date().toISOString()
      };
      
      const metadata = {
        name: FILE_NAME,
        mimeType: 'application/json'
      };
      
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([JSON.stringify(fileData)], { type: 'application/json' }));

      let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      let method = 'POST';

      if (searchData.files && searchData.files.length > 0) {
        // File exists, update it
        const fileId = searchData.files[0].id;
        uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
        method = 'PATCH';
      }

      const res = await fetch(uploadUrl, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      if (!res.ok) throw new Error('Upload failed');
      
      setStatus('Lưu thành công!');
      setTimeout(() => setStatus(''), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('Lỗi: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromDrive = async (token: string) => {
    setIsLoading(true);
    setStatus('Đang tải từ Google Drive...');
    
    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const searchData = await searchRes.json();
      
      if (!searchData.files || searchData.files.length === 0) {
        throw new Error('Không tìm thấy tệp sao lưu trên Drive');
      }
      
      const fileId = searchData.files[0].id;
      const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!fileRes.ok) throw new Error('Download failed');
      
      const data = await fileRes.json();
      if (data.nodes && data.settings) {
        onImport(data.nodes, data.settings);
        setStatus('Tải dữ liệu thành công!');
        setTimeout(() => setStatus(''), 3000);
      } else {
        throw new Error('Dữ liệu không hợp lệ');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('Lỗi: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
          <Cloud className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">Đồng bộ Google Drive</h4>
      </div>
      
      <p className="text-xs text-slate-500 mb-4">Lưu trữ an toàn dữ liệu sơ đồ của bạn trên Google Drive để có thể truy cập từ mọi nơi.</p>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => loginForSave()}
          disabled={isLoading}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-5 h-5 text-slate-600 mb-1.5" />
          <span className="text-xs font-semibold text-slate-700">Lưu lên Drive</span>
        </button>
        
        <button
          onClick={() => loginForLoad()}
          disabled={isLoading}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <DownloadCloud className="w-5 h-5 text-slate-600 mb-1.5" />
          <span className="text-xs font-semibold text-slate-700">Tải từ Drive</span>
        </button>
      </div>
      
      {status && (
        <div className="mt-3 text-xs font-medium text-blue-700 bg-blue-100/50 py-1.5 px-3 rounded flex items-center justify-center gap-1.5">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {!isLoading && status.includes('thành công') && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          {status}
        </div>
      )}
    </div>
  );
}
