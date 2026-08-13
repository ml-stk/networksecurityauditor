import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ConfigInput, DeviceConfigInput } from './components/ConfigInput';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { AuditFindings } from './components/AuditFindings';
import { RouteInspector } from './components/RouteInspector';
import { TopologyDiagram } from './components/TopologyDiagram';
import { PdfExportModal } from './components/PdfExportModal';
import { SAMPLE_SCENARIOS } from './lib/sampleConfigs';
import { parseNetworkConfig } from './lib/parser';
import { runRuleEngine } from './lib/ruleEngine';
import { AnalysisSummary, ParsedNetworkConfig, AuditFinding } from './types';
import { ShieldCheck, Layers, Target, AlertCircle } from 'lucide-react';

export default function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('fortigate-sdwan-blackhole');
  const [auditFocus, setAuditFocus] = useState<string>('comprehensive');

  const [inputConfigs, setInputConfigs] = useState<DeviceConfigInput[]>([
    {
      id: '1',
      title: SAMPLE_SCENARIOS[0].configs[0].title,
      vendor: SAMPLE_SCENARIOS[0].configs[0].vendor,
      content: SAMPLE_SCENARIOS[0].configs[0].content
    }
  ]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    if (scenarioId === 'custom') return;

    const scenario = SAMPLE_SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      const newConfigs: DeviceConfigInput[] = scenario.configs.map((cfg, idx) => ({
        id: `scen-${idx + 1}`,
        title: cfg.title,
        vendor: cfg.vendor,
        content: cfg.content
      }));
      setInputConfigs(newConfigs);
    }
  };

  const handleReset = () => {
    setSelectedScenarioId('custom');
    setInputConfigs([
      {
        id: '1',
        title: 'Device-1.cfg',
        vendor: 'auto',
        content: '# Paste raw FortiGate or Cisco router config here...'
      }
    ]);
    setAnalysisSummary(null);
    setErrorMessage(null);
  };

  const executeAudit = () => {
    if (inputConfigs.length === 0 || !inputConfigs.some(c => c.content.trim())) {
      setErrorMessage('Please paste or upload at least one valid network configuration.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      // Step 1: Parse the configurations
      const parsedDevices: ParsedNetworkConfig[] = inputConfigs.map(c =>
        parseNetworkConfig(c.content, c.title, c.vendor)
      );

      // Step 2: Run local deterministic rule engine
      let allFindings: AuditFinding[] = runRuleEngine(parsedDevices);

      // Filter findings based on selected focus mode if applicable
      if (auditFocus !== 'comprehensive') {
        allFindings = allFindings.filter(f => f.category === auditFocus);
      }

      // Step 3: Compute risk metrics and counts
      let critical = 0, high = 0, medium = 0, low = 0, info = 0;
      allFindings.forEach(f => {
        if (f.severity === 'critical') critical++;
        else if (f.severity === 'high') high++;
        else if (f.severity === 'medium') medium++;
        else if (f.severity === 'low') low++;
        else info++;
      });

      const riskScore = Math.min(100, critical * 35 + high * 20 + medium * 10 + low * 2);
      const healthGrade = riskScore < 15 ? 'A' : riskScore < 40 ? 'B' : riskScore < 70 ? 'C' : riskScore < 90 ? 'D' : 'F';

      const summaryResult: AnalysisSummary = {
        riskScore,
        healthGrade,
        criticalCount: critical,
        highCount: high,
        mediumCount: medium,
        lowCount: low,
        infoCount: info,
        parsedDevices,
        findings: allFindings,
        aiOverview: `Local offline audit completed successfully for ${parsedDevices.length} device(s) under focus mode '${auditFocus}'. Evaluated against routing baseline, PCI-DSS compliance checks, and threat posture rules.`,
        keyRecommendations: [
          'Verify that all edge firewall policies explicitly enforce UTM inspection sensors.',
          'Review routing tables to eliminate potential blackholes or asymmetric paths.',
          'Ensure administrative access is restricted to secure management subnets.'
        ]
      };

      setAnalysisSummary(summaryResult);
    } catch (err: any) {
      console.error('Audit execution error:', err);
      setErrorMessage(`Failed to process configuration: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    executeAudit();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-900 selection:text-white">
      <Header
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={handleSelectScenario}
        onRunAudit={executeAudit}
        onReset={handleReset}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        isAnalyzing={isAnalyzing}
        hasAnalyzed={!!analysisSummary}
        healthGrade={analysisSummary?.healthGrade}
        riskScore={analysisSummary?.riskScore}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Target className="h-6 w-6 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Offline Audit Focus Mode</h3>
              <p className="text-xs text-slate-400">Filter deterministic checks across routing, compliance, or threat posturing.</p>
            </div>
          </div>
          <select
            className="bg-slate-950 border border-slate-700 text-sm text-white rounded-lg px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
            value={auditFocus}
            onChange={(e) => setAuditFocus(e.target.value)}
            disabled={isAnalyzing}
          >
            <option value="comprehensive">Comprehensive Audit (All Categories)</option>
            <option value="routing">Routing & SD-WAN Analysis</option>
            <option value="compliance">Security Compliance (PCI-DSS/CIS)</option>
            <option value="threat">Threat Profile & UTM Audit</option>
          </select>
        </div>

        <section>
          <ConfigInput
            configs={inputConfigs}
            onChangeConfigs={setInputConfigs}
            onRunAudit={executeAudit}
            isAnalyzing={isAnalyzing}
          />
        </section>

        {analysisSummary && (
          <>
            <section>
              <ExecutiveSummary summary={analysisSummary} />
            </section>

            <section>
              <TopologyDiagram
                configs={analysisSummary.parsedDevices}
                findings={analysisSummary.findings}
              />
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  <span>Categorized Misconfiguration Audit Findings ({analysisSummary.findings.length})</span>
                </h3>
              </div>
              <AuditFindings findings={analysisSummary.findings} />
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  <span>Parsed Routing Table & SD-WAN Rule Inspector</span>
                </h3>
              </div>
              <RouteInspector configs={analysisSummary.parsedDevices} />
            </section>
          </>
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-xs py-4 text-center">
        <p>NetRoute Audit • 100% Client-Side Multi-Vendor Firewall & Routing Compliance Engine</p>
      </footer>

      {analysisSummary && (
        <PdfExportModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          summary={analysisSummary}
        />
      )}
    </div>
  );
}
