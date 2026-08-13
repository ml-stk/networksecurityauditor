// src/lib/auditEngine.ts

export interface AuditFinding {
  category: 'vpn' | 'firewall' | 'compliance' | 'routing';
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  recommendation: string;
  remediationCmd?: string;
  vendor?: 'fortigate' | 'cisco' | 'unknown';
}

export class SecurityAuditor {
  private static detectVendor(config: string): 'fortigate' | 'cisco' | 'unknown' {
    if (config.includes('config system global') || config.includes('config firewall')) return 'fortigate';
    if (config.includes('hostname') || config.includes('interface GigabitEthernet')) return 'cisco';
    return 'unknown';
  }

  static analyze(config: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const vendor = this.detectVendor(config);

    // --- VPN & CRYPTO CHECKS ---
    
    // Check for IKEv1 (Legacy)
    if ((vendor === 'fortigate' && config.includes('set ike-version 1')) || 
        (vendor === 'cisco' && config.includes('isakmp policy'))) {
      findings.push({
        category: 'vpn',
        severity: 'medium',
        issue: 'Legacy IKEv1 Protocol detected.',
        recommendation: 'Upgrade to IKEv2 for better security and NAT traversal.',
        remediationCmd: vendor === 'fortigate' ? 'set ike-version 2' : 'crypto ikev2 policy 10'
      });
    }

    // Check for Weak Encryption (3DES/DES/AES-128)
    if (/(3des|des|aes128)/i.test(config)) {
      findings.push({
        category: 'vpn',
        severity: 'critical',
        issue: 'Weak/Legacy Encryption in VPN Proposals.',
        recommendation: 'Use AES-256 or AES-GCM for Phase 1 and Phase 2.',
        remediationCmd: vendor === 'fortigate' ? 'set proposal aes256-sha256 aes256gcm' : 'encryption aes 256'
      });
    }

    // Check for Weak DH Groups
    if (/group (1|2|5)\b/i.test(config) || /set dhgrp (1|2|5)\b/i.test(config)) {
      findings.push({
        category: 'vpn',
        severity: 'high',
        issue: 'Weak Diffie-Hellman Group (Short Key Length).',
        recommendation: 'Use DH Group 14 (2048-bit) or higher (19, 21 for Elliptic Curve).',
        remediationCmd: vendor === 'fortigate' ? 'set dhgrp 14' : 'group 14'
      });
    }

    // Check for PFS (Perfect Forward Secrecy) being disabled
    if (vendor === 'fortigate' && config.includes('set pfs disable')) {
      findings.push({
        category: 'vpn',
        severity: 'high',
        issue: 'PFS (Perfect Forward Secrecy) is disabled.',
        recommendation: 'Enable PFS to ensure past sessions are protected if keys are compromised.',
        remediationCmd: 'set pfs enable\nset dhgrp 14'
      });
    }

    // --- FIREWALL & POLICY CHECKS ---

    // Any-Any Permissive Rules
    if (/set srcaddr "all"/i.test(config) && /set dstaddr "all"/i.test(config) && /set action accept/i.test(config)) {
      findings.push({
        category: 'firewall',
        severity: 'high',
        issue: 'Highly Permissive "Any-to-Any" Policy.',
        recommendation: 'Restrict source and destination addresses to specific subnets.',
        remediationCmd: '# Manually define srcaddr and dstaddr objects'
      });
    }

    // Missing UTM Inspection on FortiGate
    if (vendor === 'fortigate' && config.includes('set action accept') && !config.includes('set utm-status enable')) {
      findings.push({
        category: 'firewall',
        severity: 'medium',
        issue: 'Policy allows traffic without UTM/IPS inspection.',
        recommendation: 'Enable UTM status and attach IPS/AntiVirus profiles.',
        remediationCmd: 'set utm-status enable\nset ips-sensor "default"\nset av-profile "default"'
      });
    }

    // --- MANAGEMENT PLANE & COMPLIANCE ---

    // Insecure Protocols
    if (/set allowaccess.*(telnet|http\b)/i.test(config) || /ip http server/i.test(config)) {
      findings.push({
        category: 'compliance',
        severity: 'high',
        issue: 'Insecure Management Access (HTTP/Telnet) enabled.',
        recommendation: 'Disable unencrypted management protocols.',
        remediationCmd: vendor === 'fortigate' ? 'set allowaccess https ssh' : 'no ip http server\nline vty 0 4\n transport input ssh'
      });
    }

    // SNMP Security
    if (/set (community|public)/i.test(config) || /snmp-server community public/i.test(config)) {
      findings.push({
        category: 'compliance',
        severity: 'critical',
        issue: 'Default/Weak SNMP Community String detected.',
        recommendation: 'Use SNMPv3 or change the community string to a complex value.',
        remediationCmd: vendor === 'cisco' ? 'no snmp-server community public' : 'config system snmp community\n delete 1\nend'
      });
    }

    return findings;
  }
}