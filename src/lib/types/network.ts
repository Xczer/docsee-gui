// Network Types for DocSee

export interface Network {
  name: string;
  id: string;
  created: string;
  scope: 'local' | 'global' | 'swarm';
  driver: NetworkDriver;
  enable_ipv6: boolean;
  ipam: {
    driver: string;
    options: Record<string, string>;
    config: Array<{
      subnet?: string;
      ip_range?: string;
      gateway?: string;
      aux_addresses?: Record<string, string>;
    }>;
  };
  internal: boolean;
  attachable: boolean;
  ingress: boolean;
  config_from: {
    network: string;
  };
  config_only: boolean;
  containers: Record<string, NetworkContainer>;
  options: Record<string, string>;
  labels: Record<string, string>;
}

export interface NetworkInspect {
  name: string;
  id: string;
  created: string;
  scope: 'local' | 'global' | 'swarm';
  driver: NetworkDriver;
  enable_ipv6: boolean;
  ipam: {
    driver: string;
    options: Record<string, string>;
    config: Array<{
      subnet?: string;
      ip_range?: string;
      gateway?: string;
      aux_addresses?: Record<string, string>;
    }>;
  };
  internal: boolean;
  attachable: boolean;
  ingress: boolean;
  config_from: {
    network: string;
  };
  config_only: boolean;
  containers: Record<string, NetworkContainer>;
  options: Record<string, string>;
  labels: Record<string, string>;
  peers?: Array<{
    name: string;
    ip: string;
  }>;
  services?: Record<string, {
    vip: string;
    ports: string[];
    local_lbs: Array<{
      ip: string;
      port: number;
    }>;
    tasks: Array<{
      name: string;
      endpoint_id: string;
      endpoint_ip: string;
      info: Record<string, string>;
    }>;
  }>;
}

export interface NetworkContainer {
  name: string;
  endpoint_id: string;
  mac_address: string;
  ipv4_address: string;
  ipv6_address: string;
}

export interface CreateNetworkOptions {
  name: string;
  check_duplicate?: boolean;
  driver?: NetworkDriver;
  internal?: boolean;
  attachable?: boolean;
  ingress?: boolean;
  ipam?: {
    driver?: string;
    config?: Array<{
      subnet?: string;
      ip_range?: string;
      gateway?: string;
      aux_addresses?: Record<string, string>;
    }>;
    options?: Record<string, string>;
  };
  enable_ipv6?: boolean;
  options?: Record<string, string>;
  labels?: Record<string, string>;
}

export interface ConnectNetworkOptions {
  container: string;
  endpoint_config?: {
    ipam_config?: {
      ipv4_address?: string;
      ipv6_address?: string;
      link_local_ips?: string[];
    };
    links?: string[];
    aliases?: string[];
    network_id?: string;
    endpoint_id?: string;
    gateway?: string;
    ip_address?: string;
    ip_prefix_len?: number;
    ipv6_gateway?: string;
    global_ipv6_address?: string;
    global_ipv6_prefix_len?: number;
    mac_address?: string;
    driver_opts?: Record<string, string>;
  };
}

export interface DisconnectNetworkOptions {
  container: string;
  force?: boolean;
}

export interface NetworkPruneResult {
  networks_deleted: string[];
}

export interface NetworkStats {
  network_id: string;
  name: string;
  containers_count: number;
  driver: NetworkDriver;
  scope: string;
  created: string;
  size: number;
  subnet: string;
  gateway: string;
  ip_range: string;
}

export interface NetworkUsage {
  network_id: string;
  name: string;
  containers: string[];
  driver: NetworkDriver;
  created: string;
  last_used: string;
}

// Re-export from docker.ts
export type NetworkDriver = 'bridge' | 'host' | 'overlay' | 'macvlan' | 'ipvlan' | 'none';
