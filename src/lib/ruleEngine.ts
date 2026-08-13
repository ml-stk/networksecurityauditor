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
      deviceName, // Updated from 'device' to 'deviceName'
      title,
      description,
      severity,
      category,
      recommendation,
      snippet
    });
  };

  for (const device of parsedDevices) {
    const rawContent = device.rawText; // Updated from 'content' to 'rawText'
    const lowerContent = rawContent.toLowerCase();
    
    // Vendor detection logic using the harmonized 'fortigate' string
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
      if (/snmp-server\s+community\