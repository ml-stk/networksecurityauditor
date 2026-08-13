import { ParsedNetworkConfig, AuditFinding, SeverityLevel, CategoryType } from '../types';

export function runRuleEngine(parsedDevices: ParsedNetworkConfig[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  let findingIdSequence = 1;

  // Helper to standardise finding creation
  const addFinding = (
    deviceName: string,
    title: string,
    description: string,
    severity: SeverityLevel,
    category: CategoryType,
    recommendation: string,
    snippet?: string
  ) => {
    findings.push({
      id: `RULE-${findingIdSequence++}`,
      deviceName,
      title,
      description,
      severity,
      category,
      recommendation,
      snippet
    });
  };

  for (const device of parsedDevices) {
    const rawContent = device.rawText;
    const lowerContent = rawContent.toLowerCase();
    
    const isFortiGate = device.vendor === 'fortigate' || lowerContent.includes('config system global');
    const isCisco = device.vendor === 'cisco' || lowerContent.includes('hostname');

    // ==========================================
    // 1. CISCO IOS COMPLIANCE & ROUTING CHECKS
    // ==========================================
    if (isCisco) {
      // Compliance: Insecure Management (Telnet)
      if (/transport\s+input\s+(all|telnet)/i.test(rawContent)) {
        addFinding(
          device.title,
          'Insecure Management Protocol (Telnet)',
          'Telnet is allowed on VTY lines. This transmits administrative credentials in plaintext.',
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
          'The device uses "enable password", which stores the password in weak encryption.',
          'high',
          'compliance',
          'Remove "enable password" and implement "enable secret".',
          'enable password'
        );
      }

      // Compliance: Default SNMP Strings
      if (/snmp-server\s+community\s+(public|private)/i.test(rawContent)) {
        addFinding(
          device.title,
          'Default SNMP Community String',
          'Default SNMP community strings ("public" or "private") are in use.',
          'high',
          'compliance',
          'Change the community string to a complex alphanumeric value.',
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
              'Administrative access permitted via unencrypted protocols (HTTP/Telnet).',
              'high',
              'compliance',
              'Remove HTTP and Telnet from allowaccess. Enforce HTTPS and SSH only.',
              match.trim()
            );
          }
        });
      }

      // Threat: Policy Level UTM & IPS Checks
      if (lowerContent.includes('config firewall policy')) {
        const policies = rawContent.split('edit ').slice(1); 
        
        policies.forEach(policy => {
          const isAccept = policy.includes('set action accept');
          
          if (isAccept) {
            const policyIdMatch = policy.match(/^(\d+)/);
            const policyId = policyIdMatch ? policyIdMatch[1] : 'Unknown';

            if (policy.includes('set srcintf "any"') && policy.includes('set dstintf "any"')) {
              addFinding(
                device.title,
                `Excessively Permissive Policy (ID: ${policyId})`,
                'Firewall policy allows traffic from "any" to "any" interface.',
                'critical',
                'compliance',
                'Restrict source and destination interfaces to specific zones.',
                `edit ${policyId}`
              );
            }

            const hasIPS = policy.includes('set ips-sensor');
            const utmEnabled = policy.includes('set utm-status enable');

            if (!utmEnabled || !hasIPS) {
              addFinding(
                device.title,
                `Missing Threat Protection on Policy (ID: ${policyId})`,
                'Policy allows traffic but lacks UTM/IPS inspection.',
                'medium',
                'threat',
                'Enable UTM status and apply an IPS sensor profile.',
                `edit ${policyId}`
              );
            }
          }
        });
      }

      // Routing: SD-WAN Blackhole missing
      if (lowerContent.includes('config system sdwan')) {
        const hasBlackholeRoute = lowerContent.includes('set blackhole enable') || lowerContent.includes('blackhole');
        if (!hasBlackholeRoute) {
          addFinding(
            device.title,
            'Missing SD-WAN Blackhole Route',
            'No blackhole route detected. Traffic may leak if SD-WAN members are down.',
            'medium',
            'routing',
            'Configure a default blackhole route with distance 254.'
          );
        }
      }
    }
  }

  return findings;
}