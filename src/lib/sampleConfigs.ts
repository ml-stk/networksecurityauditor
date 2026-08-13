import { AuditScenario } from '../types';

export const SAMPLE_SCENARIOS: AuditScenario[] = [
  {
    id: 'fortigate-sdwan-blackhole',
    name: 'Scenario 1: FortiGate SD-WAN & Static Default Route Blackhole',
    subtitle: 'FortiGate 70F - SD-WAN & Static Route Conflict',
    vendor: 'fortigate',
    description: 'A FortiGate firewall configured with dual-WAN SD-WAN (wan1 and wan2). Includes static routing misconfigurations where default routes bypass SD-WAN, a missing SLA gateway probe, and an unreferenced static blackhole route for internal summaries.',
    configs: [
      {
        title: 'FGT-HQ-Primary.conf',
        vendor: 'fortigate',
        content: `config system global
    set hostname "FGT-HQ-PRIMARY"
    set timezone 04
end

config system interface
    edit "wan1"
        set vdom "root"
        set mode static
        set ip 198.51.100.10 255.255.255.252
        set allowaccess ping
    next
    edit "wan2"
        set vdom "root"
        set mode static
        set ip 203.0.113.10 255.255.255.252
        set allowaccess ping
    next
    edit "port1"
        set vdom "root"
        set mode static
        set ip 10.100.1.1 255.255.255.0
        set allowaccess ping ssh https
    next
end

config system sdwan
    set status enable
    config zone
        edit "virtual-wan-link"
        next
    end
    config members
        edit 1
            set interface "wan1"
            set gateway 198.51.100.9
            set cost 10
        next
        edit 2
            set interface "wan2"
            set gateway 203.0.113.9
            set cost 20
        next
    end
    config health-check
        edit "DNS-SLA"
            set server "8.8.8.8"
            set members 1 2
            set sla-fail-log-period 10
            config sla
                edit 1
                    set latency-threshold 80
                    set packetloss-threshold 5
                next
            end
        next
        edit "ISP2-Probe"
            set server "1.1.1.1"
            set members 2
        next
    end
    config service
        edit 1
            set name "Critical-Voice"
            set mode priority
            set dst "10.200.0.0/16"
            set priority-members 1 3
            set health-check "DNS-SLA"
            set sla-compare-method latency
        next
    end
end

config router static
    edit 1
        set dst 0.0.0.0 0.0.0.0
        set gateway 198.51.100.9
        set device "wan1"
        set distance 10
        set priority 1
    next
    edit 2
        set dst 0.0.0.0 0.0.0.0
        set gateway 203.0.113.9
        set device "wan2"
        set distance 10
        set priority 1
    next
    edit 3
        set dst 10.50.0.0 255.255.0.0
        set gateway 10.255.255.254
        set device "port1"
    next
end
`
      }
    ]
  },
  {
    id: 'cisco-ios-ip-sla-ospf',
    name: 'Scenario 2: Cisco IOS Dual-ISP OSPF & Broken IP SLA Tracking',
    subtitle: 'Cisco ISR4331 - OSPF Area Mismatch & Broken Static Route Track',
    vendor: 'cisco',
    description: 'A Cisco ISR router setup with Dual-ISP WAN failover via IP SLA tracking, and internal OSPF dynamic routing.',
    configs: [
      {
        title: 'Cisco-ISR-Edge.cfg',
        vendor: 'cisco',
        content: `hostname ISR4331-EDGE

interface GigabitEthernet0/0/0
 description WAN1-PRIMARY
 ip address 198.51.100.2 255.255.255.252
 no shutdown

interface GigabitEthernet0/0/1
 description WAN2-BACKUP
 ip address 203.0.113.2 255.255.255.252
 no shutdown

interface GigabitEthernet0/0/2
 description LAN-CORE
 ip address 10.10.10.1 255.255.255.240
 no shutdown

ip sla 100
 icmp-echo 8.8.8.8 source-interface GigabitEthernet0/0/0
 timeout 1000
 threshold 500
 frequency 5

track 10 ip sla 100 reachability
ip route 0.0.0.0 0.0.0.0 198.51.100.1 track 20
ip route 0.0.0.0 0.0.0.0 203.0.113.1 200

router ospf 1
 router-id 1.1.1.1
 log-adjacency-changes
 network 10.10.10.0 0.0.0.15 area 0
 passive-interface GigabitEthernet0/0/2
`
      }
    ]
  },
  {
    id: 'hybrid-fortigate-cisco-hubspoke',
    name: 'Scenario 3: Multi-Vendor Cisco & FortiGate Hub-Spoke Mismatch',
    subtitle: 'FortiGate Hub + Cisco Spoke Router',
    vendor: 'auto',
    description: 'A multi-vendor enterprise WAN environment combining a FortiGate Hub and a Cisco ISR Spoke.',
    configs: [
      {
        title: 'HQ-FortiGate-Hub.conf',
        vendor: 'fortigate',
        content: `config system global
    set hostname "FGT-HQ-HUB"
end
config router ospf
    set router-id 10.254.1.1
    config network
        edit 1
            set prefix 10.254.1.0 255.255.255.252
            set area "0.0.0.0"
        next
    end
end
`
      },
      {
        title: 'Spoke-Cisco-Router.cfg',
        vendor: 'cisco',
        content: `hostname SPOKE-CISCO-01
router ospf 100
 network 10.254.1.0 0.0.0.3 area 10
`
      }
    ]
  },
  {
    id: 'multiwan-bgp-sdwan-complete',
    name: 'Scenario 4: Enterprise Multi-WAN BGP & FortiGate SLA Target Error',
    subtitle: 'FortiGate 200F - Multi-Provider BGP & SD-WAN Route Policy',
    vendor: 'fortigate',
    description: 'An enterprise edge FortiGate running BGP peering with two ISPs.',
    configs: [
      {
        title: 'FGT-DC-EDGE.conf',
        vendor: 'fortigate',
        content: `config system global
    set hostname "FGT-DC-EDGE"
end
config router bgp
    set as 64512
    config neighbor
        edit "192.0.2.1"
            set remote-as 65100
        next
    end
end
`
      }
    ]
  },
  {
    id: 'security-vpn-firewall-compliance',
    name: 'Scenario 5: Security Audit - VPN & Firewall Compliance',
    subtitle: 'Vulnerable VPN Crypto & Permissive Policy Audit',
    vendor: 'auto',
    description: 'A security-focused scenario involving legacy VPN encryption (3DES/MD5), weak Diffie-Hellman groups, and overly permissive "Any-Any" firewall policies.',
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
        set allowaccess ping https ssh http telnet
    next
end
config vpn ipsec phase1-interface
    edit "To-Remote-Office"
        set ike-version 1
        set proposal 3des-sha1 3des-md5
        set dhgrp 2
        set remote-gw 2.2.2.2
    next
end
config firewall policy
    edit 10
        set srcaddr "all"
        set dstaddr "all"
        set action accept
        set utm-status disable
    next
end`
      }
    ]
  }
];