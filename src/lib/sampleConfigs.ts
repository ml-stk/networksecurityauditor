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
            # MISCONFIG: Missing gateway-ip parameter causes SLA probe to fail silently
        next
    end
    config service
        edit 1
            set name "Critical-Voice"
            set mode priority
            set dst "10.200.0.0/16"
            # MISCONFIG: Referencing non-existent SD-WAN member edit ID 3
            set priority-members 1 3
            set health-check "DNS-SLA"
            set sla-compare-method latency
        next
    end
end

config router static
    edit 1
        # MISCONFIG: Static default route pointed directly to physical interface wan1 bypassing SD-WAN engine!
        set dst 0.0.0.0 0.0.0.0
        set gateway 198.51.100.9
        set device "wan1"
        set distance 10
        set priority 1
    next
    edit 2
        # MISCONFIG: Second default route with same distance/priority but set to wan2, causing packet duplication & route flapping
        set dst 0.0.0.0 0.0.0.0
        set gateway 203.0.113.9
        set device "wan2"
        set distance 10
        set priority 1
    next
    edit 3
        # MISCONFIG: Internal subnet static route with unreachable next-hop IP (10.255.255.254 is not in local subnet)
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
    description: 'A Cisco ISR router setup with Dual-ISP WAN failover via IP SLA tracking, and internal OSPF dynamic routing. Contains IP SLA schedule missing, undefined track object binding, and OSPF subnet mask / area mismatch with core switch.',
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

! IP SLA Configuration
ip sla 100
 icmp-echo 8.8.8.8 source-interface GigabitEthernet0/0/0
 timeout 1000
 threshold 500
 frequency 5
! MISCONFIG: 'ip sla schedule 100 life forever start-time now' is missing! SLA probe is not running.

! Track Object
track 10 ip sla 100 reachability
! MISCONFIG: Static route references track 20 which does NOT exist!
ip route 0.0.0.0 0.0.0.0 198.51.100.1 track 20
ip route 0.0.0.0 0.0.0.0 203.0.113.1 200

! Overlapping static route issue
ip route 172.16.0.0 255.255.0.0 10.10.10.5
ip route 172.16.10.0 255.255.255.0 10.10.10.6
! MISCONFIG: Overlapping static route without Null0 summary protection or blackhole drop

! OSPF Configuration
router ospf 1
 router-id 1.1.1.1
 log-adjacency-changes
 network 10.10.10.0 0.0.0.15 area 0
 ! MISCONFIG: Passive interface set on the primary LAN interface connecting to OSPF core switch!
 passive-interface GigabitEthernet0/0/2
`
      }
    ]
  },
  {
    id: 'hybrid-fortigate-cisco-hubspoke',
    name: 'Scenario 3: Multi-Vendor Cisco & FortiGate OSPF/BGP Hub-Spoke Mismatch',
    subtitle: 'FortiGate Hub + Cisco Spoke Router',
    vendor: 'auto',
    description: 'A multi-vendor enterprise WAN environment combining a FortiGate Firewall Hub and a Cisco ISR Spoke. Includes OSPF Area ID mismatch, BGP eBGP Multihop missing on loopback peerings, and conflicting administrative distances.',
    configs: [
      {
        title: 'HQ-FortiGate-Hub.conf',
        vendor: 'fortigate',
        content: `config system global
    set hostname "FGT-HQ-HUB"
end

config system interface
    edit "port1"
        set vdom "root"
        set ip 10.254.1.1 255.255.255.252
    next
    edit "loopback1"
        set vdom "root"
        set ip 172.16.255.1 255.255.255.255
    next
end

config router ospf
    set router-id 10.254.1.1
    config area
        edit "0.0.0.0"
        next
    end
    config ospf-interface
        edit "port1-ospf"
            set interface "port1"
            set cost 10
        next
    end
    config network
        edit 1
            set prefix 10.254.1.0 255.255.255.252
            set area "0.0.0.0"
        next
    end
end

config router bgp
    set as 65001
    set router-id 172.16.255.1
    config neighbor
        edit "172.16.255.2"
            set remote-as 65002
            # MISCONFIG: eBGP peering to Spoke Loopback (172.16.255.2) without ebgp-multihop enabled!
            set update-source "loopback1"
        next
    end
end

config router static
    edit 1
        set dst 172.16.2.0 255.255.255.0
        set gateway 10.254.1.2
        set device "port1"
        set distance 20
    next
end
`
      },
      {
        title: 'Spoke-Cisco-Router.cfg',
        vendor: 'cisco',
        content: `hostname SPOKE-CISCO-01

interface GigabitEthernet0/0/0
 description WAN-TO-HUB
 ip address 10.254.1.2 255.255.255.252
 no shutdown

interface Loopback0
 ip address 172.16.255.2 255.255.255.255

! OSPF Configuration on Spoke
router ospf 100
 router-id 10.254.1.2
 ! MISCONFIG: OSPF Area mismatch! Hub is configured in Area 0, but Cisco Spoke is in Area 10
 network 10.254.1.0 0.0.0.3 area 10

! BGP Configuration
router bgp 65002
 bgp router-id 172.16.255.2
 neighbor 172.16.255.1 remote-as 65001
 neighbor 172.16.255.1 update-source Loopback0
 ! MISCONFIG: eBGP multihop missing on Cisco router side as well (TTL is default 1)
 neighbor 172.16.255.1 ebgp-multihop 1
 address-family ipv4
  neighbor 172.16.255.1 activate
  network 172.16.2.0 mask 255.255.255.0
 exit-address-family

! Static Route
ip route 0.0.0.0 0.0.0.0 10.254.1.1
! MISCONFIG: Missing summary Null0 route for local LAN 172.16.2.0/24 advertised in BGP
`
      }
    ]
  },
  {
    id: 'multiwan-bgp-sdwan-complete',
    name: 'Scenario 4: Enterprise Multi-WAN BGP & FortiGate SLA Target Error',
    subtitle: 'FortiGate 200F - Multi-Provider BGP & SD-WAN Route Policy',
    vendor: 'fortigate',
    description: 'An enterprise edge FortiGate running BGP peering with two ISPs alongside FortiGate SD-WAN rules. Contains route-map syntax errors, missing BGP neighbor activation, and static default route preference inversions.',
    configs: [
      {
        title: 'FGT-DC-EDGE.conf',
        vendor: 'fortigate',
        content: `config system global
    set hostname "FGT-DC-EDGE"
end

config system interface
    edit "wan1"
        set ip 192.0.2.2 255.255.255.252
    next
    edit "wan2"
        set ip 198.51.100.2 255.255.255.252
    next
end

config router route-map
    edit "PREFER-ISP1-IN"
        config rule
            edit 1
                set set-local-preference 200
            next
        end
    next
end

config router bgp
    set as 64512
    set router-id 192.0.2.2
    config neighbor
        edit "192.0.2.1"
            set remote-as 65100
            set route-map-in "PREFER-ISP1-IN"
        next
        edit "198.51.100.1"
            set remote-as 65200
            # MISCONFIG: Referencing non-existent route-map "FILTER-ISP2-IN"
            set route-map-in "FILTER-ISP2-IN"
        next
    end
    config network
        edit 1
            set prefix 203.0.113.0 255.255.255.0
        next
    end
end

config router static
    edit 1
        set dst 0.0.0.0 0.0.0.0
        set gateway 192.0.2.1
        set device "wan1"
        # MISCONFIG: Higher distance (200) on primary link than backup link (distance 10), causing backup link to usurp primary traffic
        set distance 200
        set priority 10
    next
    edit 2
        set dst 0.0.0.0 0.0.0.0
        set gateway 198.51.100.1
        set device "wan2"
        set distance 10
        set priority 10
    next
end
`
      }
    ]
  }
];
