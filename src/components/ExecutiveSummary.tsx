import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  TrendingDown,
  Sparkles,
  Layers,
  Award
} from 'lucide-react';
import { AnalysisSummary } from '../types';

interface ExecutiveSummaryProps {
  summary: AnalysisSummary;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ summary }) => {
  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'B':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'C':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'D':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Health Grade & Risk Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Health Status</span>
            <Award className="h-4 w-4 text-slate-500" />
          </div>

          <div className="my-3 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {summary.riskScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Network Risk Score</p>
            </div>

            <div className={`px-3 py-1 rounded-lg border font-extrabold text-2xl ${getGradeBadge(summary.healthGrade)}`}>
              {summary.healthGrade}
            </div>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                summary.riskScore < 20 ? 'bg-emerald-500' :
                summary.riskScore < 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, summary.riskScore))}%` }}
            />
          </div>
        </div>

        {/* Critical & High Issues */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical & High</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>

          <div className="my-2 flex items-baseline space-x-3">
            <span className="text-3xl font-extrabold text-rose-400">
              {summary.criticalCount + summary.highCount}
            </span>
            <span className="text-xs text-slate-400">
              ({summary.criticalCount} Critical, {summary.highCount} High)
            </span>
          </div>

          <p className="text-xs text-slate-400">Requires immediate admin remediation before production deployment.</p>
        </div>

        {/* Medium & Low Issues */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Medium & Low</span>
            <AlertCircle className="h-4 w-4 text-amber-400" />
          </div>

          <div className="my-2 flex items-baseline space-x-3">
            <span className="text-3xl font-extrabold text-amber-400">
              {summary.mediumCount + summary.lowCount}
            </span>
            <span className="text-xs text-slate-400">
              ({summary.mediumCount} Medium, {summary.lowCount} Low)
            </span>
          </div>

          <p className="text-xs text-slate-400">Operational sub-optimizations or fallback route hygiene gaps.</p>
        </div>

        {/* Parsed Devices Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Devices Inspected</span>
            <Layers className="h-4 w-4 text-blue-400" />
          </div>

          <div className="my-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {summary.parsedDevices.length}
            </span>
            <span className="text-xs text-slate-400">configs analyzed</span>
          </div>

          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <span className="bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded border border-blue-800/60">
              FortiGate & Cisco
            </span>
          </div>
        </div>

      </div>

      {/* AI Executive Assessment & Recommendations */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
        
        <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Executive Diagnostic Overview</h3>
            <p className="text-xs text-slate-400">AI-assisted network architecture evaluation & risk posture</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {summary.aiOverview || "Comprehensive multi-vendor routing and SD-WAN analysis completed successfully."}
        </p>

        {summary.keyRecommendations && summary.keyRecommendations.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Key Strategic Recommendations:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {summary.keyRecommendations.map((rec, i) => (
                <div
                  key={i}
                  className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 flex items-start space-x-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
