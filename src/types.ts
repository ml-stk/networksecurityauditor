export interface ParsedNetworkConfig {
  id: string;
  title: string;
  vendor: 'cisco' | 'fortinet' | 'auto' | string;
  content: string;
  interfaces?: NetworkInterface[];
  routes?: StaticRoute[];
  firewallPolicies?: FirewallPolicy[];
  sdwanRules?: SdwanRule[];
}

export interface NetworkInterface {
  name: string;
  ip?: string;
  subnet?: string;
  status?: 'up' | 'down';
  vlan?: number;
}

export interface StaticRoute {
  destination: string;
  gateway: string;
  interface?: string;
  distance?: number;
}

export interface FirewallPolicy {
  id: string;
  name?: string;
  srcIntf: string[];
  dstIntf: string[];
  action: 'accept' | 'deny';
  utmEnabled?: boolean;
  ipsSensor?: string;
  logTraffic?: string;
}

export interface SdwanRule {
  id: string;
  name: string;
  status: string;
}

export interface AuditFinding {
  id: string;
  device: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'routing' | 'compliance' | 'threat'; // Supports all three audit modes
  recommendation: string;
  snippet?: string;
}

export interface AnalysisSummary {
  riskScore: number;
  healthGrade: string; // 'A' | 'B' | 'C' | 'D' | 'F'
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  parsedDevices: ParsedNetworkConfig[];
  findings: AuditFinding[];
  aiOverview: string;
  keyRecommendations: string[];
}
