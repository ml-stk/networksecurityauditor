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

export function detectVendor(content: string, explicitVendor: VendorType = 'auto'): VendorType {
  if (explicitVendor !== 'auto') return explicitVendor;

  const lower = content.toLowerCase();
  let fortigateScore = 0;
  let ciscoScore = 0;

  if (lower.includes('config system global') || lower.includes('config router static') || lower.includes('config system interface') || lower.includes('set vdom')) {
    fortigateScore += 5;
  }
  if (lower.includes('end') && lower.includes('edit ') && lower.includes('set ')) {
    fortigateScore += 3;
  }

  if (lower.includes('ip route ') || lower.includes('router ospf') || lower.includes('router bgp') || lower.includes('interface gigabitethernet') || lower.includes('interface loopback')) {
    ciscoScore += 5;
  }
  if (lower.includes('no shutdown') || lower.includes('ip address ') || lower.includes('address-family ipv4')) {
    ciscoScore += 3;
  }

  if (fortigateScore > ciscoScore) return 'fortigate';
  if (ciscoScore > fortigateScore) return 'cisco';
  
  return lower.includes('config ') ? 'fortigate' : 'cisco';
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
  let ospf: OspfConfig | undefined;
  let bgp: BgpConfig | undefined;
  let sdwan: SdwanConfig | undefined;

  let currentBlock = '';
  let currentSubBlock = '';
  let currentObj: Record<string, any> = {};

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    const lineNum = i + 1;

    // Hostname
    if (line.startsWith('set hostname')) {
      const parts = line.split(' ');
      if (parts.length >= 3) {
        hostname = parts[2].replace(/"/g, '');
      }
    }

    // Top-level block enter
    if (line.startsWith('config ')) {
      currentBlock = line.replace('config ', '').trim();
      currentSubBlock = '';
      currentObj = {};
      continue;
    }

    if (line === 'end') {
      currentBlock = '';
      currentSubBlock = '';
      currentObj = {};
      continue;
    }

    // Sub-block edit
    if (line.startsWith('edit ')) {
      currentSubBlock = line.replace('edit ', '').replace(/"/g, '').trim();
      currentObj = { id: currentSubBlock, lineNum };
      continue;
    }

    if (line === 'next') {
      // Flush object depending on current block
      if (currentBlock === 'system interface' && currentSubBlock) {
        interfaces.push({
          name: currentSubBlock,
          ip: currentObj.ip,
          mask: currentObj.mask,
          zone: currentObj.zone,
          rawLine: currentObj.lineNum
        });
      } else if (currentBlock === 'router static' && currentSubBlock) {
        let dst = currentObj.dst || '0.0.0.0 0.0.0.0';
        // Normalize 0.0.0.0 0.0.0.0 or CIDR
        staticRoutes.push({
          id: currentSubBlock,
          vendor: 'fortigate',
          destination: dst,
          gateway: currentObj.gateway,
          device: currentObj.device,
          distance: currentObj.distance ? parseInt(currentObj.distance) : 10,
          priority: currentObj.priority ? parseInt(currentObj.priority) : 0,
          weight: currentObj.weight ? parseInt(currentObj.weight) : undefined,
          comment: currentObj.comment,
          blackhole: currentObj.blackhole === 'enable',
          rawLine: currentObj.lineNum,
          rawConfig: `edit ${currentSubBlock}\nset dst ${dst}\nset gateway ${currentObj.gateway || ''}`
        });
      } else if (currentBlock === 'system sdwan' && currentSubBlock) {
        // SDWAN members/health-checks/rules handled separately below
      }

      currentSubBlock = '';
      currentObj = {};
      continue;
    }

    // Parse 'set' key-value statements inside blocks
    if (line.startsWith('set ')) {
      const setLine = line.replace(/^set\s+/, '');
      const firstSpace = setLine.indexOf(' ');
      if (firstSpace !== -1) {
        const key = setLine.substring(0, firstSpace).trim();
        let val = setLine.substring(firstSpace + 1).trim().replace(/"/g, '');

        if (key === 'ip' && currentBlock === 'system interface') {
          const ipParts = val.split(' ');
          currentObj.ip = ipParts[0];
          currentObj.mask = ipParts[1] || '255.255.255.255';
        } else if (key === 'dst' && currentBlock === 'router static') {
          currentObj.dst = val;
        } else if (key === 'gateway') {
          currentObj.gateway = val;
        } else if (key === 'device') {
          currentObj.device = val;
        } else if (key === 'distance') {
          currentObj.distance = val;
        } else if (key === 'priority') {
          currentObj.priority = val;
        } else if (key === 'comment') {
          currentObj.comment = val;
        } else if (key === 'blackhole') {
          currentObj.blackhole = val;
        }
      }
    }
  }

  // Parse FortiGate OSPF, BGP, SDWAN dedicated passes
  ospf = parseFortiGateOspf(lines);
  bgp = parseFortiGateBgp(lines);
  sdwan = parseFortiGateSdwan(lines);

  return {
    id: `cfg-${Math.random().toString(36).substring(2, 9)}`,
    title,
    vendor: 'fortigate',
    detectedVendor: 'fortigate',
    hostname,
    interfaces,
    staticRoutes,
    ospf,
    bgp,
    sdwan,
    rawText
  };
}

function parseFortiGateOspf(lines: string[]): OspfConfig | undefined {
  let inOspf = false;
  let routerId: string | undefined;
  const networks: { network: string; maskOrWildcard: string; area: string }[] = [];
  const passiveInterfaces: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === 'config router ospf') {
      inOspf = true;
      continue;
    }
    if (inOspf && line === 'end') {
      inOspf = false;
      break;
    }

    if (inOspf) {
      if (line.startsWith('set router-id')) {
        routerId = line.split(' ')[2]?.replace(/"/g, '');
      }
      if (line.startsWith('set prefix')) {
        const parts = line.split(' ');
        if (parts.length >= 3) {
          networks.push({
            network: parts[2],
            maskOrWildcard: parts[3] || '255.255.255.255',
            area: '0.0.0.0'
          });
        }
      }
    }
  }

  if (!inOspf && !routerId && networks.length === 0) return undefined;

  return {
    routerId,
    areas: [{ areaId: '0.0.0.0', networks }],
    passiveInterfaces,
    costSettings: []
  };
}

function parseFortiGateBgp(lines: string[]): BgpConfig | undefined {
  let inBgp = false;
  let localAs: number | undefined;
  let routerId: string | undefined;
  const neighbors: BgpNeighbor[] = [];
  const networks: string[] = [];

  let currentNeighborIp = '';
  let currentRemoteAs = 0;
  let currentEbgpMultihop = 0;
  let currentRouteMapIn: string | undefined;
  let currentRouteMapOut: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === 'config router bgp') {
      inBgp = true;
      continue;
    }
    if (inBgp && line === 'end') {
      inBgp = false;
      break;
    }

    if (inBgp) {
      if (line.startsWith('set as ')) {
        localAs = parseInt(line.split(' ')[2]);
      }
      if (line.startsWith('set router-id ')) {
        routerId = line.split(' ')[2].replace(/"/g, '');
      }
      if (line.startsWith('edit ') && lines[i - 1]?.trim().startsWith('config neighbor')) {
        currentNeighborIp = line.split(' ')[1].replace(/"/g, '');
        currentRemoteAs = 0;
        currentEbgpMultihop = 0;
        currentRouteMapIn = undefined;
        currentRouteMapOut = undefined;
      }
      if (line.startsWith('set remote-as ')) {
        currentRemoteAs = parseInt(line.split(' ')[2]);
      }
      if (line.startsWith('set ebgp-multihop ')) {
        currentEbgpMultihop = line.includes('enable') ? 255 : parseInt(line.split(' ')[2]) || 0;
      }
      if (line.startsWith('set route-map-in ')) {
        currentRouteMapIn = line.split(' ')[2].replace(/"/g, '');
      }
      if (line.startsWith('set route-map-out ')) {
        currentRouteMapOut = line.split(' ')[2].replace(/"/g, '');
      }
      if (line === 'next' && currentNeighborIp) {
        neighbors.push({
          ip: currentNeighborIp,
          remoteAs: currentRemoteAs,
          ebgpMultihop: currentEbgpMultihop,
          routeMapIn: currentRouteMapIn,
          routeMapOut: currentRouteMapOut,
          activated: true
        });
        currentNeighborIp = '';
      }
    }
  }

  if (!localAs && neighbors.length === 0) return undefined;

  return {
    localAs,
    routerId,
    neighbors,
    networks
  };
}

function parseFortiGateSdwan(lines: string[]): SdwanConfig | undefined {
  let enabled = false;
  const members: { name: string; interfaceName: string; gateway?: string; cost?: number }[] = [];
  const healthChecks: SdwanHealthCheck[] = [];
  const rules: SdwanRule[] = [];

  let inSdwan = false;
  let currentSection = '';
  let currentObj: Record<string, any> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    if (line === 'config system sdwan') {
      inSdwan = true;
      enabled = true;
      continue;
    }
    if (inSdwan && line === 'end' && currentSection === '') {
      inSdwan = false;
      break;
    }

    if (inSdwan) {
      if (line === 'config members') {
        currentSection = 'members';
        continue;
      }
      if (line === 'config health-check') {
        currentSection = 'health-check';
        continue;
      }
      if (line === 'config service') {
        currentSection = 'service';
        continue;
      }

      if (line.startsWith('edit ')) {
        currentObj = { id: line.split(' ')[1].replace(/"/g, ''), lineNum };
      }

      if (line.startsWith('set interface ')) {
        currentObj.interfaceName = line.split(' ')[2].replace(/"/g, '');
      }
      if (line.startsWith('set gateway ')) {
        currentObj.gateway = line.split(' ')[2];
      }
      if (line.startsWith('set server ')) {
        currentObj.server = line.split(' ')[2].replace(/"/g, '');
      }
      if (line.startsWith('set members ')) {
        currentObj.members = line.replace('set members ', '').replace(/"/g, '').split(' ');
      }
      if (line.startsWith('set priority-members ')) {
        currentObj.priorityMembers = line.replace('set priority-members ', '').replace(/"/g, '').split(' ');
      }
      if (line.startsWith('set name ')) {
        currentObj.name = line.split(' ')[2].replace(/"/g, '');
      }
      if (line.startsWith('set dst ')) {
        currentObj.dst = line.split(' ')[2].replace(/"/g, '');
      }
      if (line.startsWith('set health-check ')) {
        currentObj.healthCheckName = line.split(' ')[2].replace(/"/g, '');
      }

      if (line === 'next') {
        if (currentSection === 'members' && currentObj.interfaceName) {
          members.push({
            name: currentObj.id,
            interfaceName: currentObj.interfaceName,
            gateway: currentObj.gateway
          });
        } else if (currentSection === 'health-check' && currentObj.id) {
          healthChecks.push({
            name: currentObj.id,
            server: currentObj.server,
            members: currentObj.members || []
          });
        } else if (currentSection === 'service' && currentObj.id) {
          rules.push({
            id: currentObj.id,
            name: currentObj.name || `Rule-${currentObj.id}`,
            dstPrefix: currentObj.dst,
            healthCheckName: currentObj.healthCheckName,
            members: currentObj.members || [],
            priorityMembers: currentObj.priorityMembers || [],
            rawLine: currentObj.lineNum
          });
        }
        currentObj = {};
      }

      if (line === 'end' && currentSection !== '') {
        currentSection = '';
      }
    }
  }

  if (!enabled && members.length === 0) return undefined;

  return {
    enabled,
    members,
    healthChecks,
    rules
  };
}

function parseCiscoConfig(lines: string[], rawText: string, title: string): ParsedNetworkConfig {
  let hostname = 'Cisco-Router';
  const interfaces: InterfaceConfig[] = [];
  const staticRoutes: StaticRoute[] = [];
  let ospf: OspfConfig | undefined;
  let bgp: BgpConfig | undefined;
  let sdwan: SdwanConfig | undefined;

  let currentInt: InterfaceConfig | null = null;
  let inOspf = false;
  let ospfProcess = '';
  let ospfRouterId = '';
  const ospfNetworks: { network: string; maskOrWildcard: string; area: string }[] = [];
  const ospfPassives: string[] = [];

  let inBgp = false;
  let bgpAs = 0;
  let bgpRouterId = '';
  const bgpNeighbors: BgpNeighbor[] = [];
  const bgpNetworks: string[] = [];

  const ipSlaList: SdwanHealthCheck[] = [];
  const ipSlaScheduled: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    const lineNum = i + 1;

    // Hostname
    if (line.startsWith('hostname ')) {
      hostname = line.split(' ')[1];
    }

    // Interface parsing
    if (line.startsWith('interface ')) {
      if (currentInt) interfaces.push(currentInt);
      currentInt = {
        name: line.replace('interface ', ''),
        rawLine: lineNum
      };
      continue;
    }

    if (currentInt) {
      if (line.startsWith('ip address ')) {
        const parts = line.split(' ');
        currentInt.ip = parts[2];
        currentInt.mask = parts[3];
      }
      if (line === 'shutdown') {
        currentInt.status = 'down';
      }
      if (line.startsWith('!') || line.startsWith('interface ') || line.startsWith('router ')) {
        interfaces.push(currentInt);
        currentInt = null;
      }
    }

    // Static Routes: ip route <prefix> <mask> <next-hop|int> [distance/track]
    if (line.startsWith('ip route ')) {
      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        const dst = `${parts[2]} ${parts[3]}`;
        const gwOrDev = parts[4];
        let distance = 1;
        let trackId: number | undefined;

        for (let p = 5; p < parts.length; p++) {
          if (!isNaN(parseInt(parts[p]))) {
            distance = parseInt(parts[p]);
          }
          if (parts[p] === 'track' && parts[p + 1]) {
            trackId = parseInt(parts[p + 1]);
          }
        }

        staticRoutes.push({
          id: `sr-${staticRoutes.length + 1}`,
          vendor: 'cisco',
          destination: dst,
          gateway: gwOrDev.match(/^\d+\.\d+\.\d+\.\d+$/) ? gwOrDev : undefined,
          device: !gwOrDev.match(/^\d+\.\d+\.\d+\.\d+$/) ? gwOrDev : undefined,
          distance,
          trackId,
          rawLine: lineNum,
          rawConfig: line
        });
      }
    }

    // IP SLA Parsing
    if (line.startsWith('ip sla ')) {
      const slaNum = parseInt(line.split(' ')[2]);
      if (!isNaN(slaNum)) {
        ipSlaList.push({
          name: `SLA-${slaNum}`,
          server: '8.8.8.8',
          members: []
        });
      }
    }
    if (line.startsWith('ip sla schedule ')) {
      const slaNum = parseInt(line.split(' ')[3]);
      if (!isNaN(slaNum)) {
        ipSlaScheduled.push(slaNum);
      }
    }

    // OSPF Parsing
    if (line.startsWith('router ospf ')) {
      inOspf = true;
      inBgp = false;
      ospfProcess = line.split(' ')[2];
      continue;
    }
    if (inOspf) {
      if (line.startsWith('router-id ')) {
        ospfRouterId = line.split(' ')[1];
      }
      if (line.startsWith('network ')) {
        const parts = line.split(' ');
        // network 10.10.10.0 0.0.0.15 area 0
        if (parts.length >= 5) {
          ospfNetworks.push({
            network: parts[1],
            maskOrWildcard: parts[2],
            area: parts[4]
          });
        }
      }
      if (line.startsWith('passive-interface ')) {
        ospfPassives.push(line.split(' ')[1]);
      }
      if (line.startsWith('!') || line.startsWith('router ') || line.startsWith('ip route')) {
        inOspf = false;
      }
    }

    // BGP Parsing
    if (line.startsWith('router bgp ')) {
      inBgp = true;
      inOspf = false;
      bgpAs = parseInt(line.split(' ')[2]);
      continue;
    }
    if (inBgp) {
      if (line.startsWith('bgp router-id ')) {
        bgpRouterId = line.split(' ')[1];
      }
      if (line.startsWith('neighbor ') && line.includes(' remote-as ')) {
        const parts = line.split(' ');
        const nbrIp = parts[1];
        const remoteAs = parseInt(parts[3]);
        bgpNeighbors.push({
          ip: nbrIp,
          remoteAs,
          ebgpMultihop: 0,
          activated: true
        });
      }
      if (line.startsWith('neighbor ') && line.includes(' ebgp-multihop')) {
        const parts = line.split(' ');
        const nbrIp = parts[1];
        const hops = parseInt(parts[3]) || 255;
        const existing = bgpNeighbors.find(n => n.ip === nbrIp);
        if (existing) existing.ebgpMultihop = hops;
      }
      if (line.startsWith('!') || line.startsWith('router ')) {
        inBgp = false;
      }
    }
  }

  if (currentInt) interfaces.push(currentInt);

  if (ospfProcess || ospfNetworks.length > 0) {
    ospf = {
      processId: ospfProcess,
      routerId: ospfRouterId,
      areas: [{ areaId: '0', networks: ospfNetworks }],
      passiveInterfaces: ospfPassives,
      costSettings: []
    };
  }

  if (bgpAs > 0 || bgpNeighbors.length > 0) {
    bgp = {
      localAs: bgpAs,
      routerId: bgpRouterId,
      neighbors: bgpNeighbors,
      networks: bgpNetworks
    };
  }

  if (ipSlaList.length > 0) {
    sdwan = {
      enabled: true,
      members: [],
      healthChecks: ipSlaList,
      rules: []
    };
  }

  return {
    id: `cfg-${Math.random().toString(36).substring(2, 9)}`,
    title,
    vendor: 'cisco',
    detectedVendor: 'cisco',
    hostname,
    interfaces,
    staticRoutes,
    ospf,
    bgp,
    sdwan,
    rawText
  };
}
