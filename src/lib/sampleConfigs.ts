// ... existing scenarios 1-4 ...

  {
    id: 'security-vpn-firewall-compliance',
    name: 'Scenario 5: Security Audit - VPN & Firewall Compliance',
    subtitle: 'Vulnerable VPN Crypto & Permissive Policy Audit',
    vendor: 'auto',
    description: 'A security-focused scenario involving legacy VPN encryption (3DES/MD5), weak Diffie-Hellman groups, and overly permissive "Any-Any" firewall policies. This scenario is designed to test the Security Auditor and Remediation Engine.',
    configs: [
      {
        title: 'Vulnerable-FortiGate.conf',
        vendor: 'fortigate',
        content: `config system global
    set hostname "FGT-INSECURE-EDGE"
end

config system interface
    edit "wan1"
        set ip 1.1.1.1 255.255.255.0
        # MISCONFIG: Insecure management protocols enabled (HTTP and Telnet)
        set allowaccess ping https ssh http telnet
    next
end

config vpn ipsec phase1-interface
    edit "To-Remote-Office"
        set interface "wan1"
        set peertype any
        # MISCONFIG: Legacy IKEv1 protocol in use
        set ike-version 1
        # MISCONFIG: Weak encryption (3DES) and Hashing (MD5/SHA1)
        set proposal 3des-sha1 3des-md5
        # MISCONFIG: Weak DH Group 2 (1024-bit)
        set dhgrp 2
        set remote-gw 2.2.2.2
    next
end

config vpn ipsec phase2-interface
    edit "To-Remote-Office-P2"
        set phase1name "To-Remote-Office"
        set proposal 3des-sha1
        # MISCONFIG: Perfect Forward Secrecy (PFS) disabled
        set pfs disable
    next
end

config firewall policy
    edit 10
        set name "Permissive-Any-Any"
        set srcintf "wan1"
        set dstintf "internal"
        # MISCONFIG: "Any-Any" rule allowing all traffic from WAN to LAN
        set srcaddr "all"
        set dstaddr "all"
        set action accept
        set schedule "always"
        set service "ALL"
        # MISCONFIG: UTM status disabled (No Antivirus or IPS)
        set utm-status disable
    next
end`
      },
      {
        title: 'Legacy-Cisco-Router.cfg',
        vendor: 'cisco',
        content: `hostname CISCO-LEGACY-EDGE

! Insecure Management Plane
! MISCONFIG: HTTP server enabled (Unencrypted)
ip http server
ip http secure-server

! Weak VPN Configuration
crypto isakmp policy 10
 # MISCONFIG: Weak Encryption and Hashing
 encryption 3des
 hash md5
 # MISCONFIG: Weak DH Group 1 (768-bit)
 group 1
 authentication pre-share

! Permissive ACLs
! MISCONFIG: "Permit IP Any Any" allows all traffic without filtering
access-list 101 permit ip any any
access-list 101 permit tcp any any eq telnet

interface GigabitEthernet0/0
 ip address 1.1.1.2 255.255.255.252
 ip access-group 101 in
`
      }
    ]
  }
];