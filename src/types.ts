// src/types.ts

export type VendorType = 'fortigate' | 'cisco' | 'auto';

export interface NetworkInterface {
  name: string;
  ip?: string;
  mask?: string; // Added mask to match parser
  status?: 'up' | 'down';
  vlan?: number;
  zone?: string; // Added for FortiGate zones
  rawLine?: number;
}

export interface StaticRoute {
  id?: string;
  vendor: VendorType;
  destination: string;
  gateway?: string;
  device?: string;
  distance: number;
  priority?: number;
  weight?: number;
  comment?: string;
  blackhole?: boolean;
  trackId?: number;
  rawLine?: number;
  rawConfig?: string;
}

export interface FirewallPolicy {
  id: string;
  name?: string;
  srcIntf?: string | string[]; // Flexible for single or multi-interface
  dstIntf?: string | string[];
  srcAddr?: string;
  dstAddr?: string;
  action: string; // 'accept' | 'deny' | 'permit'
  utmEnabled: boolean;
  service?: string;
  ipsSensor?: string;
  logTraffic?: string;
}

export interface VpnTunnel {
  name: string;
  ikeVersion: string;
  proposal?: string;
  dhGroup?: string;
  remoteGw?: string;
  pfsEnabled?: boolean;
}

export interface SdwanRule {
  id: string;
  name: string;
  dstPrefix?: string;
  healthCheckName?: string;
  members?: string[];
  priorityMembers?: string[];
  rawLine?: number;
}

export interface ParsedNetworkConfig {
  id: string;
  title: string;
  vendor: VendorType;
  detectedVendor: VendorType;
  hostname: string;
  interfaces: NetworkInterface[];
  staticRoutes: StaticRoute[];
  firewallPolicies?: FirewallPolicy[]; // Added
  vpnTunnels?: VpnTunnel[];           // Added
  ospf?: any; // Keeping simple for now
  bgp?: any;
  sdwan?: any;
  rawText: string;
}

export interface AuditFinding {
  id: string;
  category: 'routing' | 'compliance' | 'threat' | 'vpn' | 'firewall'; // Expanded
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  deviceName: string; // Used to identify which device the bug belongs to
  recommendation?: string;
  remediation?: string; // New: CLI Fix Commands
  impact?: string;
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