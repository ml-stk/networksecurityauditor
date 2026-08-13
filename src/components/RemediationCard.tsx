// src/components/RemediationCard.tsx
import React from 'react';

export const RemediationCard = ({ finding }: { finding: any }) => {
  const copyFix = () => navigator.clipboard.writeText(finding.remediation);

  return (
    <div className={`p-4 border-l-4 mb-4 rounded bg-slate-800 ${
      finding.severity === 'Critical' ? 'border-red-500' : 'border-yellow-500'
    }`}>
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-white">{finding.issue}</h3>
        <span className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">{finding.severity}</span>
      </div>
      <p className="text-slate-400 mt-2">{finding.impact}</p>
      <div className="mt-4 bg-black p-3 rounded relative">
        <code className="text-green-400 text-sm block whitespace-pre">
          {finding.remediation}
        </code>
        <button 
          onClick={copyFix}
          className="absolute top-2 right-2 text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded"
        >
          Copy Fix
        </button>
      </div>
    </div>
  );
};