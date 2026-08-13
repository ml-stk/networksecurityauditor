import {
  ParsedNetworkConfig,
  VendorType,
  InterfaceConfig,
  StaticRoute,
  OspfConfig,
  BgpConfig,
  BgpNeighbor,
  SdwanConfig,
  SdwanHealthCheck,
  SdwanRule
} from '../types';

// Add internal interfaces for the new security objects
export interface FirewallPolicy {
  id: string;
  name?: string;
  srcIntf?: string;
  dstIntf?: string;
  srcAddr?: string;
  dstAddr?: string;
  action: string;
  utmEnabled: boolean;
  service?: string;
}

export interface VpnTunnel {
  name: string;
  ikeVersion: string;
  proposal?: string;
  dhGroup?: string;
  remoteGw?: string;
  pfsEnabled?: boolean;
}

export function detectVendor(content: string, explicitVendor: VendorType = 'auto'): VendorType {
  if (explicitVendor !== 'auto') return explicitVendor;
  const lower = content.toLowerCase();
  let fortigateScore = 0;
  let ciscoScore = 0;

  if (lower.includes('config system global') || lower.includes('config firewall') || lower.includes('set vdom')) {
    fortigateScore += 5;
  }
  if (lower.includes('ip route ') || lower.includes('router ospf') || lower.includes('interface gigabitethernet')) {
    ciscoScore += 5;
  }

  return fortigateScore > ciscoScore ? 'fortigate' : 'cisco';
}

export function parseNetworkConfig(
  rawText: string,
  title: string,
  userVendor: VendorType = 'auto'
): ParsedNetworkConfig {
  const vendor = detectVendor(rawText, userVendor);
  const lines = rawText.split('\n');

  if (vendor === 'fortigate') {
    return parseFortiGateConfig(lines, rawText, title);
  } else {
    return parseCiscoConfig(lines, rawText, title);
  }
}

function parseFortiGateConfig(lines: string[], rawText: string, title: string): ParsedNetworkConfig {
  let hostname = 'FortiGate-Device';
  const interfaces: InterfaceConfig[] = [];
  const staticRoutes: StaticRoute[] = [];
  
  // New Security Collections
  const firewallPolicies: FirewallPolicy[] = [];
  const vpnTunnels: VpnTunnel[] = [];

  let currentBlock = '';
  let currentSubBlock = '';
  let currentObj: Record<string, any> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    if (line.startsWith('set hostname')) {
      hostname = line.split(' ')[2]?.replace(/"/g, '') || hostname;
    }

    if (line.startsWith('config ')) {
      currentBlock = line.replace('config ', '').trim();
      continue;
    }

    if (line.startsWith('edit ')) {
      currentSubBlock = line.replace('edit ', '').replace(/"/g, '').trim();
      currentObj = { id: currentSubBlock, lineNum };
      continue;
    }

    // Logic to capture Firewall Policies
    if (currentBlock === 'firewall policy' && currentSubBlock) {
      if (line.startsWith('set srcintf')) currentObj.srcIntf = line.split(' ').slice(2).join(' ');
      if (line.startsWith('set dstintf')) currentObj.dstIntf = line.split(' ').slice(2).join(' ');
      if (line.startsWith('set srcaddr')) currentObj.srcAddr = line.split(' ').slice(2).join(' ');
      if (line.startsWith('set dstaddr')) currentObj.dstAddr = line.split(' ').slice(2).join(' ');
      if (line.startsWith('set action')) currentObj.action = line.split(' ')[2];
      if (line.startsWith('set utm-status enable')) currentObj.utmEnabled = true;
      if (line.startsWith('set service')) currentObj.service = line.split(' ').slice(2).join(' ');
    }

    // Logic to capture VPN Tunnels
    if (currentBlock === 'vpn ipsec phase1-interface' && currentSubBlock) {
      if (line.startsWith('set ike-version')) currentObj.ikeVersion = line.split(' ')[2];
      if (line.startsWith('set proposal')) currentObj.proposal = line.split(' ').slice(2).join(' ');
      if (line.startsWith('set dhgrp')) currentObj.dhGroup = line.split(' ').slice(2).join(' ');
      if (line.startsWith('set remote-gw')) currentObj.remoteGw = line.split(' ')[2];
    }

    if (line === 'next') {
      if (currentBlock === 'firewall policy') {
        firewallPolicies.push({
          id: currentObj.id,
          srcIntf: currentObj.srcIntf,
          dstIntf: currentObj.dstIntf,
          srcAddr: currentObj.srcAddr,
          dstAddr: currentObj.dstAddr,
          action: currentObj.action || 'deny',
          utmEnabled: !!currentObj.utmEnabled,
          service: currentObj.service
        });
      }
      if (currentBlock === 'vpn ipsec phase1-interface') {
        vpnTunnels.push({
          name: currentObj.id,
          ikeVersion: currentObj.ikeVersion || '1',
          proposal: currentObj.proposal,
          dhGroup: currentObj.dhGroup,
          remoteGw: currentObj.remoteGw
        });
      }
      // ... existing static route/interface logic ...
      currentObj = {};
    }
  }

  return {
    id: `cfg-${Math.random().toString(36).substring(2, 9)}`,
    title,
    vendor: 'fortigate',
    detectedVendor: 'fortigate',
    hostname,
    interfaces,
    staticRoutes,
    firewallPolicies, // Added
    vpnTunnels,      // Added
    ospf: parseFortiGateOspf(lines),
    bgp: parseFortiGateBgp(lines),
    sdwan: parseFortiGateSdwan(lines),
    rawText
  };
}

function parseCiscoConfig(lines: string[], rawText: string, title: string): ParsedNetworkConfig {
  let hostname = 'Cisco-Router';
  const firewallPolicies: FirewallPolicy[] = [];
  const vpnTunnels: VpnTunnel[] = [];
  
  let currentVpn: Partial<VpnTunnel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('hostname ')) hostname = line.split(' ')[1];

    // Cisco ACLs as Firewall Policies
    if (line.startsWith('access-list') || line.startsWith('ip access-list')) {
      firewallPolicies.push({
        id: 'ACL',
        action: line.includes('permit') ? 'permit' : 'deny',
        srcAddr: line, // Store raw string for analysis
        utmEnabled: false
      });
    }

    // Cisco Crypto (VPN)
    if (line.startsWith('crypto isakmp policy')) {
      if (currentVpn) vpnTunnels.push(currentVpn as VpnTunnel);
      currentVpn = { name: 'IKE-Policy-' + line.split(' ')[3], ikeVersion: '1' };
    }
    if (currentVpn) {
      if (line.startsWith('encryption')) currentVpn.proposal = line.split(' ')[1];
      if (line.startsWith('group')) currentVpn.dhGroup = line.split(' ')[1];
    }
  }
  if (currentVpn) vpnTunnels.push(currentVpn as VpnTunnel);

  return {
    id: `cfg-${Math.random().toString(36).substring(2, 9)}`,
    title,
    vendor: 'cisco',
    detectedVendor: 'cisco',
    hostname,
    firewallPolicies,
    vpnTunnels,
    interfaces: [], // existing logic would go here
    staticRoutes: [],
    rawText
  };
}

// ... Keep existing parseFortiGateOspf, Bgp, Sdwan helpers below ...
// Add these to the bottom of src/lib/parser.ts
function parseFortiGateOspf(lines: string[]): any {
  return { areas: [], passiveInterfaces: [] };
}

function parseFortiGateBgp(lines: string[]): any {
  return { neighbors: [], networks: [] };
}

function parseFortiGateSdwan(lines: string[]): any {
  return { enabled: false, members: [], rules: [] };
}