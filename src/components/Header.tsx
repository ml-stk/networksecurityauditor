import React from 'react';
import {
  ShieldAlert,
  FileText,
  Play,
  RotateCcw,
  Sparkles,
  Download,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { SAMPLE_SCENARIOS } from '../lib/sampleConfigs';

interface HeaderProps {
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  onRunAudit: () => void;
  onReset: () => void;
  onOpenPdfModal: () => void;
  isAnalyzing: boolean;
  hasAnalyzed: boolean;
  healthGrade?: 'A' | 'B' | 'C' | 'D' | 'F';
  riskScore?: number;
}

export const Header: React.FC<HeaderProps> = ({
  selectedScenarioId,
  onSelectScenario,
  onRunAudit,
  onReset,
  onOpenPdfModal,
  isAnalyzing,
  hasAnalyzed,
  healthGrade,
  riskScore
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-inner font-bold text-xl tracking-wider">
            <ShieldAlert className="h-6 w-6 text-sky-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">STK ApplianceSentry</span>
              <span className="bg-blue-900/80 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded border border-blue-700/50">
                Audit v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400">Network Appliances Configuration Analyzer</p>
          </div>
        </div>

        {/* Center Preset Selector */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60">
          <Layers className="h-4 w-4 text-blue-400 ml-1.5" />
          <span className="text-xs text-slate-300 font-medium whitespace-nowrap">Preset Scenario:</span>
          <select
            value={selectedScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-slate-900 text-xs text-slate-200 font-medium px-2.5 py-1 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-xs truncate"
          >
            <option value="custom">Custom pasted / uploaded config</option>
            {SAMPLE_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onReset}
            title="Reset All Configurations"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700 text-xs flex items-center space-x-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden lg:inline">Reset</span>
          </button>

          {hasAnalyzed && (
            <button
              onClick={onOpenPdfModal}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              <span>Export PDF Report</span>
            </button>
          )}

          <button
            onClick={onRunAudit}
            disabled={isAnalyzing}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 shadow-sm ${
              isAnalyzing
                ? 'bg-blue-800 text-blue-200 cursor-not-allowed opacity-80'
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95 shadow-blue-900/40'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Auditing Network...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Analyze Configurations</span>
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
