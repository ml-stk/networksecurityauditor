import React, { useState } from 'react';
import {
  Upload,
  FileCode,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { VendorType } from '../types';

export interface DeviceConfigInput {
  id: string;
  title: string;
  vendor: VendorType;
  content: string;
}

interface ConfigInputProps {
  configs: DeviceConfigInput[];
  onChangeConfigs: (configs: DeviceConfigInput[]) => void;
  onRunAudit: () => void;
  isAnalyzing: boolean;
}

export const ConfigInput: React.FC<ConfigInputProps> = ({
  configs,
  onChangeConfigs,
  onRunAudit,
  isAnalyzing
}) => {
  const [activeTabId, setActiveTabId] = useState<string>(configs[0]?.id || '1');

  const activeConfig = configs.find(c => c.id === activeTabId) || configs[0];

  const handleUpdateActive = (field: keyof DeviceConfigInput, value: any) => {
    if (!activeConfig) return;
    const updated = configs.map(c => c.id === activeConfig.id ? { ...c, [field]: value } : c);
    onChangeConfigs(updated);
  };

  const handleAddDevice = () => {
    const newId = `dev-${Date.now().toString(36)}`;
    const newConfig: DeviceConfigInput = {
      id: newId,
      title: `Device-${configs.length + 1}.cfg`,
      vendor: 'auto',
      content: '# Paste FortiGate CLI or Cisco IOS configuration here...'
    };
    onChangeConfigs([...configs, newConfig]);
    setActiveTabId(newId);
  };

  const handleDeleteDevice = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (configs.length <= 1) return;
    const filtered = configs.filter(c => c.id !== idToDelete);
    onChangeConfigs(filtered);
    if (activeTabId === idToDelete) {
      setActiveTabId(filtered[0].id);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    fileList.forEach((file: File, index: number) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        let vendor: VendorType = 'auto';
        const lower = text.toLowerCase();
        if (lower.includes('config system') || lower.includes('config router')) vendor = 'fortigate';
        else if (lower.includes('ip route') || lower.includes('router ospf')) vendor = 'cisco';

        if (index === 0 && configs.length === 1 && configs[0].content.length < 50) {
          // Replace single empty initial tab
          onChangeConfigs([{
            id: configs[0].id,
            title: file.name,
            vendor,
            content: text
          }]);
        } else {
          // Append new tab
          const newId = `upload-${Date.now()}-${index}`;
          onChangeConfigs(prev => [
            ...prev,
            {
              id: newId,
              title: file.name,
              vendor,
              content: text
            }
          ]);
          setActiveTabId(newId);
        }
      };
      reader.readAsText(file);
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      
      {/* Top Device Tabs Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-3 pt-2 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none">
          {configs.map((cfg) => {
            const isActive = cfg.id === activeTabId;
            return (
              <div
                key={cfg.id}
                onClick={() => setActiveTabId(cfg.id)}
                className={`group flex items-center space-x-2 px-3 py-2 text-xs font-semibold rounded-t-lg border-t border-l border-r transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-slate-900 text-slate-100 border-slate-700 border-b-transparent shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:bg-slate-900/40'
                }`}
              >
                <FileCode className={`h-3.5 w-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="max-w-[140px] truncate">{cfg.title}</span>
                
                {configs.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteDevice(cfg.id, e)}
                    className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove device config"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={handleAddDevice}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-800 rounded-md border border-slate-800 text-xs flex items-center space-x-1 ml-1"
            title="Add another device configuration"
          >
            <Plus className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline text-xs font-medium">Add Device</span>
          </button>
        </div>

        {/* Upload Button */}
        <label className="mb-1 cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors shadow-xs">
          <Upload className="h-3.5 w-3.5 text-sky-400" />
          <span className="hidden sm:inline">Upload .cfg / .txt</span>
          <input
            type="file"
            accept=".txt,.cfg,.conf,.log"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Editor Sub-header Controls */}
      {activeConfig && (
        <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Filename:</span>
              <input
                type="text"
                value={activeConfig.title}
                onChange={(e) => handleUpdateActive('title', e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 px-2 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono w-48"
              />
            </div>

            <div className="flex items-center space-x-1.5">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-slate-400 font-medium">Vendor Syntax:</span>
              <select
                value={activeConfig.vendor}
                onChange={(e) => handleUpdateActive('vendor', e.target.value as VendorType)}
                className="bg-slate-950 border border-slate-700 text-slate-200 px-2 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
              >
                <option value="auto">Auto-Detect</option>
                <option value="fortigate">FortiGate FortiOS CLI</option>
                <option value="cisco">Cisco IOS / XE / NX-OS</option>
              </select>
            </div>
          </div>

          <div className="text-slate-400 text-xs flex items-center space-x-2">
            <span>{activeConfig.content.split('\n').length} Lines</span>
            <span>•</span>
            <span>{Math.round(activeConfig.content.length / 1024 * 10) / 10} KB</span>
          </div>
        </div>
      )}

      {/* Code Textarea Area */}
      {activeConfig && (
        <div className="relative">
          <textarea
            value={activeConfig.content}
            onChange={(e) => handleUpdateActive('content', e.target.value)}
            spellCheck={false}
            placeholder="# Paste your raw FortiGate or Cisco router configuration text here..."
            className="w-full h-80 bg-slate-950 text-slate-200 font-mono text-xs p-4 focus:outline-none resize-y leading-relaxed border-none selection:bg-blue-900 selection:text-white"
          />
          
          <div className="absolute bottom-3 right-4 flex items-center space-x-2">
            <button
              onClick={onRunAudit}
              disabled={isAnalyzing || !activeConfig.content.trim()}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-lg shadow-md hover:shadow-blue-900/50 transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Run Audit Check</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
