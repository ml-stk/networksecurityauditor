import { ParsedNetworkConfig, AuditFinding } from '../types';

export function runRuleEngine(parsedDevices: ParsedNetworkConfig[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  let findingId = 1;

  // Helper to standardise finding creation
  const addFinding = (
    device: string,
    title: string,
    description: string,
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info',
    category: 'routing' | 'compliance' | 'threat',
    recommendation: string,
    snippet?: string
  ) => {
    findings.push({
      id: `FND-${findingId++}`,
      device,
      title,
      description,
      severity,
      category,
      recommendation,
      snippet
    });
  };

  for (const device of parsedDevices) {
    const rawContent = device.content;
    const lowerContent = rawContent.toLowerCase();
    const isFortiGate = device.vendor === 'fortinet' || lowerContent.includes('config system global');
    const isCisco = device.vendor === 'cisco' || lowerContent.includes('version 15.') || lowerContent.includes('version 12.');

    // ==========================================
    // 1. CISCO IOS COMPLIANCE & ROUTING CHECKS
    // ==========================================
    if (isCisco) {
      // Compliance: Insecure Management (Telnet)
      if (/transport\s+input\s+(all|telnet)/i.test(rawContent)) {
        addFinding(
          device.title,
          'Insecure Management Protocol (Telnet)',
          'Telnet is allowed on VTY lines. This transmits administrative credentials in plaintext, violating basic PCI-DSS access controls.',
          'critical',
          'compliance',
          'Modify VTY line configuration to "transport input ssh".',
          'transport input telnet'
        );
      }

      // Compliance: Weak Privileged Password
      if (/enable\s+password/i.test(rawContent) && !/enable\s+secret/i.test(rawContent)) {
        addFinding(
          device.title,
          'Weak Privileged Exec Password',
          'The device uses "enable password", which stores the privileged mode password in weak Type 7 encryption or plaintext.',
          'high',
          'compliance',
          'Remove "enable password" and implement "enable secret" using Type 8 or 9 (PBKDF2/Scrypt) hashes.',
          'enable password'
        );
      }

      // Compliance: Default SNMP Strings
      if (/snmp-server\s+community\s+(public|private)\s+(ro|rw)/i.test(rawContent)) {
        addFinding(
          device.title,
          'Default SNMP Community String',
          'Default SNMP community strings ("public" or "private") are in use, exposing device metrics and potentially allowing unauthorized configuration changes.',
          'high',
          'compliance',
          'Migrate to SNMPv3 with authPriv, or at minimum, change the community string to a complex alphanumeric value.',
          'snmp-server community public'
        );
      }
    }

    // ==========================================
    // 2. FORTIGATE THREAT & COMPLIANCE CHECKS
    // ==========================================
    if (isFortiGate) {
      // Compliance: Insecure Interface Access
      const allowAccessMatches = rawContent.match(/set\s+allowaccess\s+[^\n]+/ig);
      if (allowAccessMatches) {
        allowAccessMatches.forEach(match => {
          if (/\b(http|telnet)\b/i.test(match)) {
            addFinding(
              device.title,
              'Insecure Interface Access',
              'Administrative access is permitted via unencrypted protocols (HTTP/Telnet) on an interface.',
              'high',
              'compliance',
              'Remove HTTP and Telnet from the interface "set allowaccess" configuration. Enforce HTTPS and SSH only.',
              match.trim()
            );
          }
        });
      }

      // Threat: Policy Level UTM & IPS Checks
      if (lowerContent.includes('config firewall policy')) {
        // Split config into individual policies to evaluate them independently
        const policies = rawContent.split('edit ').slice(1); 
        
        policies.forEach(policy => {
          const isAccept = policy.includes('set action accept');
          
          if (isAccept) {
            // Extract Policy ID for context
            const policyIdMatch = policy.match(/^(\d+)/);
            const policyId = policyIdMatch ? policyIdMatch[1] : 'Unknown';

            // Check for "Any/Any" Accept rules
            if (policy.includes('set srcintf "any"') && policy.includes('set dstintf "any"')) {
              addFinding(
                device.title,
                `Excessively Permissive Policy (ID: ${policyId})`,
                'A firewall policy is set to allow traffic from "any" source interface to "any" destination interface. This breaks zone isolation.',
                'critical',
                'compliance',
                'Restrict source and destination interfaces to specific zones.',
                `edit ${policyId}`
              );
            }

            // Check for missing IPS/UTM on allowed traffic
            const hasIPS = policy.includes('set ips-sensor');
            const hasAppCtrl = policy.includes('set application-list');
            const utmEnabled = policy.includes('set utm-status enable');

            if (!utmEnabled || (!hasIPS && !hasAppCtrl)) {
              addFinding(
                device.title,
                `Missing Threat Protection on Policy (ID: ${policyId})`,
                'Policy allows traffic but lacks deep packet inspection (IPS or Application Control).',
                'medium',
                'threat',
                'Enable UTM status and apply an appropriate IPS sensor profile for inter-zone or WAN-facing traffic.',
                `edit ${policyId}`
              );
            }

            // Check Logging posture
            if (!policy.includes('set logtraffic all') && !policy.includes('set logtraffic utm')) {
              addFinding(
                device.title,
                `Insufficient Logging on Policy (ID: ${policyId})`,
                'Allowed traffic is not fully logged, which limits post-incident forensic capabilities.',
                'low',
                'compliance',
                'Set "logtraffic" to "all" or "utm".',
                `edit ${policyId}`
              );
            }
          }
        });
      }

      // Routing: SD-WAN Blackhole missing
      if (lowerContent.includes('config system sdwan') || lowerContent.includes('config system virtual-wan-link')) {
        const hasBlackholeRoute = lowerContent.includes('set blackhole enable') || lowerContent.includes('blackhole');
        if (!hasBlackholeRoute) {
          addFinding(
            device.title,
            'Missing SD-WAN Blackhole Route',
            'No blackhole route detected for SD-WAN. If SD-WAN rules fail or health checks drop all links, internal traffic might leak out the default route un-NATted.',
            'medium',
            'routing',
            'Configure a default blackhole route with a high administrative distance (e.g., 254).'
          );
        }
      }
    }
  }

  return findings;
}
