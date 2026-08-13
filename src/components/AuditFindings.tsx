import React from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  Lock, 
  Activity, 
  ClipboardCheck, 
  Network,
  Wrench
} from 'lucide-react';
import { AuditFinding, SeverityLevel, CategoryType } from '../types';

interface AuditFindingsProps {
  findings: AuditFinding[];
}

export const AuditFindings: React.FC<AuditFindingsProps> = ({ findings }) => {
  
  const getSeverityStyles = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getSeverityIcon = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Activity className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: CategoryType) => {
    switch (category) {
      case 'firewall':
        return <Shield className="h-4 w-4 text-emerald-400" />;
      case 'vpn':
        return <Lock className="h-4 w-4 text-purple-400" />;
      case 'compliance':
        return <ClipboardCheck className="h-4 w-4 text-blue-400" />;
      case 'sdwan':
        return <Activity className="h-4 w-4 text-cyan-400" />;
      case 'routing':
      case 'static_routing':
      case 'dynamic_routing':
        return <Network className="h-4 w-4 text-indigo-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-slate-400" />;
    }
  };

  const getCategoryLabel = (category: CategoryType) => {
    return category.replace('_', ' ').toUpperCase();
  };

  if (findings.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <Shield className="h-12 w-12 text-slate-700 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No configuration issues detected.</p>
        <p className="text-xs text-slate-500 mt-1">Your network appliance configs are compliant with standard rules.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {findings.map((finding) => (
        <div 
          key={finding.id} 
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-4 flex items-start space-x-4 shadow-sm"
        >
          <div className={`mt-1 p-2 rounded-lg border ${getSeverityStyles(finding.severity)}`}>
            {getSeverityIcon(finding.severity)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h4 className="text-sm font-bold text-white truncate">{finding.title}</h4>
              <div className="flex items-center space-x-2">
                {finding.remediation && (
                   <span className="flex items-center space-x-1 bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                    <Wrench className="h-3 w-3" />
                    <span>FIX AVAILABLE</span>
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {finding.deviceName}
                </span>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              {finding.description}
            </p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
              <div className="flex items-center space-x-1.5">
                {getCategoryIcon(finding.category)}
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                  {getCategoryLabel(finding.category)}
                </span>
              </div>
              
              {finding.recommendation && (
                <div className="text-[10px] text-slate-500 italic flex items-center">
                  <span className="mr-1 opacity-50">Rec:</span> {finding.recommendation}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};