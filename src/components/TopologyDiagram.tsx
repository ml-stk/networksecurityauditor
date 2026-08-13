import React from 'react';
import { ParsedNetworkConfig, AuditFinding } from '../types';
import { Network, Server, Shield, Globe, AlertTriangle } from 'lucide-react';

interface TopologyDiagramProps {
  configs: ParsedNetworkConfig[];
  findings: AuditFinding[];
}

export const TopologyDiagram: React.FC<TopologyDiagramProps> = ({ configs, findings }) => {
  const hasCritical = findings.some(f => f.severity === 'critical' || f.severity === 'high');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Network className="h-5 w-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Visual Topology & Path Audit Map</h3>
        </div>
        
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Healthy Link</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-400">Misconfiguration Flag</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="w-full bg-slate-950 rounded-xl p-6 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
        
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="relative z-10 w-full max-w-3xl flex flex-col md:flex-row items-center justify-between gap-8 py-4">
          
          {/* Internet / Cloud */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-sky-400 shadow-lg">
              <Globe className="h-8 w-8" />
            </div>
            <span className="text-xs font-bold text-slate-300">Public Internet / WAN</span>
            <span className="text-[10px] text-slate-500 font-mono">198.51.100.0 / 203.0.113.0</span>
          </div>

          {/* WAN Link Connectors */}
          <div className="hidden md:flex flex-col items-center space-y-2 flex-1">
            <div className={`w-full h-1 relative ${hasCritical ? 'bg-rose-500/80 animate-pulse' : 'bg-emerald-500/80'}`}>
              {hasCritical && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-900/90 text-rose-200 border border-rose-700 px-2 py-0.5 rounded text-[9px] font-bold flex items-center space-x-1 shadow-md">
                  <AlertTriangle className="h-2.5 w-2.5 text-rose-300" />
                  <span>Route Conflict</span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-400">Default Gateway Path</span>
          </div>

          {/* Devices Grid */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {configs.map((c, idx) => (
              <div
                key={c.id || idx}
                className="bg-slate-900 border-2 border-blue-600/60 rounded-2xl p-4 w-48 shadow-xl flex flex-col items-center text-center space-y-2 transition-transform hover:scale-105"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  {c.vendor === 'fortigate' ? (
                    <Shield className="h-6 w-6 text-sky-400" />
                  ) : (
                    <Server className="h-6 w-6 text-indigo-400" />
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-white font-mono">{c.hostname}</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{c.vendor} Device</p>
                </div>

                <div className="w-full bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Static Routes:</span>
                    <span className="text-blue-400 font-bold">{c.staticRoutes.length}</span>
                  </div>
                  {c.sdwan?.enabled && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">SD-WAN:</span>
                      <span className="text-emerald-400 font-bold">ACTIVE</span>
                    </div>
                  )}
                  {c.ospf && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">OSPF:</span>
                      <span className="text-amber-400 font-bold">Process {c.ospf.processId || '1'}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
