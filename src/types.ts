// src/types.ts

export type VendorType = 'fortigate' | 'cisco' | 'auto';
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type CategoryType = 'routing' | 'compliance' | 'threat' | 'vpn' | 'firewall';

export interface InterfaceConfig {
  name: string;
  ip?: string;
  mask?: string;
  status?: 'up' | 'down';
  rawLine?: number;
}

export interface StaticRoute {
  id: string;
  destination: string;
  gateway?: string;
  device?: string;
  distance: number;
  priority?: number;
  rawLine?: number;
  rawConfig?: string;
}

export interface AuditFinding {
  id: string;
  category: CategoryType;
  severity: SeverityLevel;
  title: string;
  description: string;
  deviceName: string; // Harmonized name
  recommendation?: string;
  remediation?: string;
  impact?: string;
  snippet?: string;
}

export interface AuditScenario {
  id: string;
  name: string;
  subtitle: string;
  vendor: VendorType;
  description: string;
  configs: { title: string; vendor: VendorType; content: string }[];
}

export interface OspfConfig {
  routerId?: string;
  processId?: string;
  areas: { areaId: string; networks: any[] }[];
  passiveInterfaces: string[];
}

export interface BgpNeighbor {
  ip: string;
  remoteAs: number;
  ebgpMultihop?: number;
  activated: boolean;
}

export interface BgpConfig {
  localAs?: number;
  routerId?: string;
  neighbors: BgpNeighbor[];
  networks: string[];
}

export interface ParsedNetworkConfig {
  id: string;
  title: string;
  vendor: VendorType;
  detectedVendor: VendorType;
  hostname: string;
  interfaces: InterfaceConfig[];
  staticRoutes: StaticRoute[];
  rawText: string; // Use rawText consistently
  vpnTunnels?: any[];
  firewallPolicies?: any[];
  ospf?: OspfConfig;
  bgp?: BgpConfig;
  sdwan?: any;
}

export interface AnalysisSummary {
  riskScore: number;
  healthGrade: string;
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