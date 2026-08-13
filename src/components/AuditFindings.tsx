import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  Copy,
  Terminal,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Cpu,
  CornerDownRight
} from 'lucide-react';
import { AuditFinding, SeverityLevel, CategoryType, VendorType } from '../types';

interface AuditFindingsProps {
  findings: AuditFinding[];
}

export const AuditFindings: React.FC<AuditFindingsProps> = ({ findings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const filtered = findings.filter(f => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.deviceName && f.deviceName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = selectedSeverity === 'all' || f.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;

    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'low':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getCategoryLabel = (cat: CategoryType) => {
    switch (cat) {
      case 'static_routing':
        return 'Static Routing';
      case 'dynamic_routing':
        return 'Dynamic Routing (OSPF/BGP)';
      case 'sdwan':
        return 'SD-WAN & SLA';
      default:
        return 'Hygiene & Security';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      
      {/* Search & Filters Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search findings by title, impact, gateway, device..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-slate-400 font-medium">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="static_routing">Static Routing</option>
            <option value="dynamic_routing">Dynamic Routing (OSPF/BGP)</option>
            <option value="sdwan">SD-WAN & SLA</option>
            <option value="hygiene_security">Hygiene & Security</option>
          </select>
        </div>

      </div>

      {/* Findings List */}
      <div className="divide-y divide-slate-800">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No audit findings match your selected filter criteria.
          </div>
        ) : (
          filtered.map((f, idx) => {
            const isExpanded = expandedIds[f.id] ?? true; // Default open for quick visibility

            return (
              <div key={f.id || idx} className="bg-slate-900 hover:bg-slate-800/40 transition-colors">
                
                {/* Accordion Row Header */}
                <div
                  onClick={() => toggleExpand(f.id)}
                  className="p-4 cursor-pointer flex items-start justify-between gap-3 select-none"
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <button className="mt-0.5 text-slate-400 hover:text-slate-200">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${getSeverityBadge(f.severity)}`}>
                          {f.severity}
                        </span>

                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-700">
                          {getCategoryLabel(f.category)}
                        </span>

                        {f.deviceName && (
                          <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded text-[10px] font-mono border border-blue-800/60">
                            Device: {f.deviceName}
                          </span>
                        )}

                        {f.affectedLine && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Line #{f.affectedLine}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 truncate">{f.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{f.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Accordion Body details */}
                {isExpanded && (
                  <div className="px-11 pb-5 space-y-4 border-t border-slate-800/60 pt-3">
                    
                    {/* Impact & Root Cause */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                        <span className="font-bold text-rose-400 uppercase tracking-wider text-[10px]">
                          Operational Impact
                        </span>
                        <p className="text-slate-300 leading-relaxed">{f.impact}</p>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                        <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
                          Root Cause Analysis
                        </span>
                        <p className="text-slate-300 leading-relaxed">{f.rootCause}</p>
                      </div>
                    </div>

                    {/* Remediation Steps */}
                    {f.remediationSteps && f.remediationSteps.length > 0 && (
                      <div className="space-y-1.5 text-xs">
                        <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                          Recommended Action Steps:
                        </span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-300">
                          {f.remediationSteps.map((step, sIdx) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CLI Remediation Script Blocks */}
                    {f.remediationCommands && f.remediationCommands.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-400">
                          <Terminal className="h-3.5 w-3.5" />
                          <span>Exact Administrator Remediation CLI Commands:</span>
                        </div>

                        {f.remediationCommands.map((cmd, cIdx) => {
                          const cliText = cmd.cliCommands.join('\n');
                          const copyKey = `${f.id}-cmd-${cIdx}`;
                          const isCopied = copiedIndex === copyKey;

                          return (
                            <div
                              key={cIdx}
                              className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden"
                            >
                              <div className="bg-slate-900/80 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-300 flex items-center space-x-1.5">
                                  <Cpu className="h-3 w-3 text-indigo-400" />
                                  <span className="uppercase text-[10px] font-bold text-indigo-300">
                                    {cmd.vendor} CLI
                                  </span>
                                  <span>-</span>
                                  <span className="text-slate-400">{cmd.explanation}</span>
                                </span>

                                <button
                                  onClick={() => copyToClipboard(cliText, copyKey)}
                                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium flex items-center space-x-1 border border-slate-700 transition-colors cursor-pointer"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3 text-slate-400" />
                                      <span>Copy CLI</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <pre className="p-3 text-[11px] font-mono text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre selection:bg-blue-900 selection:text-white">
                                {cliText}
                              </pre>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
