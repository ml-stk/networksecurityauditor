import React, { useState } from 'react';
import {
  ParsedNetworkConfig,
  InterfaceConfig,
  StaticRoute
} from '../types';
import {
  Network,
  Globe,
  Radio,
  Sliders,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';

interface RouteInspectorProps {
  configs: ParsedNetworkConfig[];
}

export const RouteInspector: React.FC<RouteInspectorProps> = ({ configs }) => {
  const [activeSubTab, setActiveSubTab] = useState<'interfaces' | 'static' | 'ospf' | 'bgp' | 'sdwan'>('static');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md space-y-0">
      
      {/* Sub-tab Controls */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('static')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeSubTab === 'static'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Network className="h-3.5 w-3.5" />
          <span>Static Routes</span>
        </button>

        <button
          onClick={() => setActiveSubTab('interfaces')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeSubTab === 'interfaces'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Interfaces & Subnets</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ospf')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeSubTab === 'ospf'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          <span>OSPF Dynamic Routing</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bgp')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeSubTab === 'bgp'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>BGP Peers</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sdwan')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            activeSubTab === 'sdwan'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>SD-WAN & SLA Probes</span>
        </button>
      </div>

      {/* Tab Content Display */}
      <div className="p-4 overflow-x-auto">
        
        {/* Static Routes Table */}
        {activeSubTab === 'static' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/50">
                <th className="p-2.5">Device</th>
                <th className="p-2.5">Vendor</th>
                <th className="p-2.5">Destination Prefix</th>
                <th className="p-2.5">Gateway IP</th>
                <th className="p-2.5">Interface</th>
                <th className="p-2.5">Distance</th>
                <th className="p-2.5">Priority / Track</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
              {configs.flatMap(c => c.staticRoutes.map(sr => ({ ...sr, devName: c.hostname }))).length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-500 font-sans">
                    No static routes detected in parsed configuration.
                  </td>
                </tr>
              ) : (
                configs.flatMap(c => c.staticRoutes.map(sr => ({ ...sr, devName: c.hostname }))).map((sr, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-sans font-bold text-blue-300">{sr.devName}</td>
                    <td className="p-2.5 font-sans uppercase text-[10px] text-slate-400">{sr.vendor}</td>
                    <td className="p-2.5 font-bold text-white">{sr.destination}</td>
                    <td className="p-2.5 text-emerald-400">{sr.gateway || 'N/A'}</td>
                    <td className="p-2.5 text-sky-300">{sr.device || 'N/A'}</td>
                    <td className="p-2.5 font-bold text-amber-300">{sr.distance}</td>
                    <td className="p-2.5 text-purple-300">
                      {sr.priority ? `Priority: ${sr.priority}` : sr.trackId ? `Track: ${sr.trackId}` : 'Default'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* Interfaces & Subnets Table */}
        {activeSubTab === 'interfaces' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/50">
                <th className="p-2.5">Device</th>
                <th className="p-2.5">Interface Name</th>
                <th className="p-2.5">IP Address</th>
                <th className="p-2.5">Subnet Mask</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
              {configs.flatMap(c => c.interfaces.map(iface => ({ ...iface, devName: c.hostname }))).length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500 font-sans">
                    No interfaces explicitly detected in configuration.
                  </td>
                </tr>
              ) : (
                configs.flatMap(c => c.interfaces.map(iface => ({ ...iface, devName: c.hostname }))).map((iface, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-sans font-bold text-blue-300">{iface.devName}</td>
                    <td className="p-2.5 font-bold text-white">{iface.name}</td>
                    <td className="p-2.5 text-emerald-400">{iface.ip || 'Unassigned'}</td>
                    <td className="p-2.5 text-slate-400">{iface.mask || 'N/A'}</td>
                    <td className="p-2.5 font-sans text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        iface.status === 'down'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {iface.status === 'down' ? 'SHUTDOWN' : 'UP'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* OSPF Dynamic Routing View */}
        {activeSubTab === 'ospf' && (
          <div className="space-y-4">
            {configs.filter(c => c.ospf).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No OSPF routing configurations detected.</p>
            ) : (
              configs.filter(c => c.ospf).map((c, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-xs text-white flex items-center space-x-2">
                      <Cpu className="h-4 w-4 text-indigo-400" />
                      <span>{c.hostname} - OSPF Process {c.ospf?.processId || '1'}</span>
                    </span>
                    <span className="text-xs font-mono text-emerald-400">Router-ID: {c.ospf?.routerId || 'Not set'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Advertised Networks & Areas:</span>
                      <ul className="space-y-1 font-mono text-slate-300">
                        {c.ospf?.areas.flatMap(a => a.networks).map((net, nIdx) => (
                          <li key={nIdx} className="bg-slate-900 p-1.5 rounded border border-slate-800">
                            {net.network} / {net.maskOrWildcard} <span className="text-amber-400 ml-2">(Area {net.area})</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Passive Interfaces:</span>
                      {c.ospf?.passiveInterfaces && c.ospf.passiveInterfaces.length > 0 ? (
                        <ul className="space-y-1 font-mono text-rose-300">
                          {c.ospf.passiveInterfaces.map((pIface, pIdx) => (
                            <li key={pIdx} className="bg-slate-900 p-1.5 rounded border border-slate-800">
                              {pIface} <span className="text-slate-500 text-[10px]">(Hello Suppressed)</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 italic">None configured</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* BGP Peers View */}
        {activeSubTab === 'bgp' && (
          <div className="space-y-4">
            {configs.filter(c => c.bgp).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No BGP configurations detected.</p>
            ) : (
              configs.filter(c => c.bgp).map((c, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-xs text-white">
                      {c.hostname} - Local BGP AS {c.bgp?.localAs}
                    </span>
                    <span className="text-xs font-mono text-blue-400">Router-ID: {c.bgp?.routerId || 'Auto'}</span>
                  </div>

                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="p-2">Neighbor IP</th>
                        <th className="p-2">Remote AS</th>
                        <th className="p-2">eBGP Multihop</th>
                        <th className="p-2">Inbound Route-Map</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {c.bgp?.neighbors.map((nbr, nIdx) => (
                        <tr key={nIdx}>
                          <td className="p-2 font-bold text-white">{nbr.ip}</td>
                          <td className="p-2 text-amber-400">AS {nbr.remoteAs}</td>
                          <td className="p-2 text-sky-300">{nbr.ebgpMultihop ? `TTL ${nbr.ebgpMultihop}` : 'Default TTL 1'}</td>
                          <td className="p-2 text-purple-300">{nbr.routeMapIn || 'None'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        )}

        {/* SD-WAN & SLA Probes */}
        {activeSubTab === 'sdwan' && (
          <div className="space-y-4">
            {configs.filter(c => c.sdwan).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No SD-WAN or IP SLA configurations detected.</p>
            ) : (
              configs.filter(c => c.sdwan).map((c, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-xs text-white">
                      {c.hostname} - {c.vendor === 'fortigate' ? 'FortiGate SD-WAN Engine' : 'Cisco IP SLA Tracking'}
                    </span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                      Active Engine
                    </span>
                  </div>

                  {c.sdwan?.healthChecks && c.sdwan.healthChecks.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-bold block mb-1 text-xs">Configured Health Check Probes:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        {c.sdwan.healthChecks.map((hc, hIdx) => (
                          <div key={hIdx} className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between">
                            <span className="text-white font-bold">{hc.name}</span>
                            <span className="text-emerald-400">Target: {hc.server || '8.8.8.8'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {c.sdwan?.rules && c.sdwan.rules.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-bold block mb-1 text-xs">SD-WAN Steering Service Rules:</span>
                      <div className="space-y-1.5 text-xs font-mono">
                        {c.sdwan.rules.map((rule, rIdx) => (
                          <div key={rIdx} className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                            <div className="font-bold text-sky-300">{rule.name}</div>
                            <div className="text-[11px] text-slate-400">
                              Dst: {rule.dstPrefix || 'All'} | HealthCheck: {rule.healthCheckName || 'Default'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>

    </div>
  );
};
