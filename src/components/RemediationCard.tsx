// src/components/RemediationCard.tsx
import React from 'react';
import { AuditFinding } from '../types';

interface RemediationCardProps {
  finding: AuditFinding;
}

export const RemediationCard: React.FC<RemediationCardProps> = ({ finding }) => {
  const copyFix = () => {
    if (finding.remediation) {
      navigator.clipboard.writeText(finding.remediation);
      alert('Remediation script copied to clipboard!');
    }
  };

  return (
    <div className={`p-4 border-l-4 mb-4 rounded bg-slate-900 border-${finding.severity === 'critical' ? 'red' : 'yellow'}-500 shadow-lg`}>
      <div className="flex justify-between items-start">
        <h3 className="text-md font-bold text-white">{finding.title}</h3>
        <span className="text-[10px] uppercase font-mono px-2 py-1 rounded bg-slate-800 text-slate-400">
          {finding.category}
        </span>
      </div>
      <p className="text-xs text-slate-400 mt-2">{finding.description}</p>
      {finding.remediation && (
        <div className="mt-4 bg-black p-3 rounded border border-slate-700 relative group">
          <code className="text-emerald-400 text-xs block whitespace-pre overflow-x-auto">
            {finding.remediation}
          </code>
          <button 
            onClick={copyFix}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white text-[10px] px-2 py-1 rounded"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
};