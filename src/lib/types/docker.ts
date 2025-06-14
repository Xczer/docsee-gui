// Docker API Types for DocSee

export interface DockerInfo {
  id: string;
  containers: number;
  containers_running: number;
  containers_paused: number;
  containers_stopped: number;
  images: number;
  driver: string;
  driver_status: string[][];
  system_status: string[][];
  plugins: {
    volume: string[];
    network: string[];
    authorization: string[];
    log: string[];
  };
  memory_limit: boolean;
  swap_limit: boolean;
  kernel_memory: boolean;
  cpu_cfs_period: boolean;
  cpu_cfs_quota: boolean;
  cpu_shares: boolean;
  cpu_set: boolean;
  pids_limit: boolean;
  ipv4_forwarding: boolean;
  bridge_nf_iptables: boolean;
  bridge_nf_ip6tables: boolean;
  debug: boolean;
  nfd: number;
  oom_kill_disable: boolean;
  n_goroutines: number;
  system_time: string;
  logging_driver: string;
  cgroup_driver: string;
  n_events_listener: number;
  kernel_version: string;
  operating_system: string;
  os_type: string;
  os_version: string;
  architecture: string;
  ncpu: number;
  mem_total: number;
  docker_root_dir: string;
  http_proxy: string;
  https_proxy: string;
  no_proxy: string;
  name: string;
  labels: string[];
  experimental_build: boolean;
  server_version: string;
  cluster_store: string;
  cluster_advertise: string;
  runtimes: Record<string, any>;
  default_runtime: string;
  swarm: {
    node_id: string;
    node_addr: string;
    local_node_state: string;
    control_available: boolean;
    error: string;
    remote_managers: any[];
  };
  live_restore_enabled: boolean;
  isolation: string;
  init_binary: string;
  containerd_commit: {
    id: string;
    expected: string;
  };
  runc_commit: {
    id: string;
    expected: string;
  };
  init_commit: {
    id: string;
    expected: string;
  };
  security_options: string[];
}

export interface DockerVersion {
  platform: {
    name: string;
  };
  components: Array<{
    name: string;
    version: string;
    details?: Record<string, string>;
  }>;
  version: string;
  api_version: string;
  min_api_version: string;
  git_commit: string;
  go_version: string;
  os: string;
  arch: string;
  kernel_version: string;
  experimental: boolean;
  build_time: string;
}

export interface DockerStats {
  read: string;
  preread: string;
  pid_stats: {
    current: number;
  };
  blkio_stats: {
    io_service_bytes_recursive: Array<{
      major: number;
      minor: number;
      op: string;
      value: number;
    }>;
    io_serviced_recursive: Array<{
      major: number;
      minor: number;
      op: string;
      value: number;
    }>;
    io_queue_recursive: any[];
    io_service_time_recursive: any[];
    io_wait_time_recursive: any[];
    io_merged_recursive: any[];
    io_time_recursive: any[];
    sectors_recursive: any[];
  };
  num_procs: number;
  storage_stats: Record<string, any>;
  cpu_stats: {
    cpu_usage: {
      total_usage: number;
      percpu_usage: number[];
      usage_in_kernelmode: number;
      usage_in_usermode: number;
    };
    system_cpu_usage: number;
    online_cpus: number;
    throttling_data: {
      periods: number;
      throttled_periods: number;
      throttled_time: number;
    };
  };
  precpu_stats: {
    cpu_usage: {
      total_usage: number;
      percpu_usage: number[];
      usage_in_kernelmode: number;
      usage_in_usermode: number;
    };
    system_cpu_usage: number;
    online_cpus: number;
    throttling_data: {
      periods: number;
      throttled_periods: number;
      throttled_time: number;
    };
  };
  memory_stats: {
    usage: number;
    max_usage: number;
    stats: {
      active_anon: number;
      active_file: number;
      cache: number;
      dirty: number;
      hierarchical_memory_limit: number;
      hierarchical_memsw_limit: number;
      inactive_anon: number;
      inactive_file: number;
      mapped_file: number;
      pgfault: number;
      pgmajfault: number;
      pgpgin: number;
      pgpgout: number;
      rss: number;
      rss_huge: number;
      total_active_anon: number;
      total_active_file: number;
      total_cache: number;
      total_dirty: number;
      total_inactive_anon: number;
      total_inactive_file: number;
      total_mapped_file: number;
      total_pgfault: number;
      total_pgmajfault: number;
      total_pgpgin: number;
      total_pgpgout: number;
      total_rss: number;
      total_rss_huge: number;
      total_unevictable: number;
      total_writeback: number;
      unevictable: number;
      writeback: number;
    };
    limit: number;
  };
  name: string;
  id: string;
  networks: Record<
    string,
    {
      rx_bytes: number;
      rx_packets: number;
      rx_errors: number;
      rx_dropped: number;
      tx_bytes: number;
      tx_packets: number;
      tx_errors: number;
      tx_dropped: number;
    }
  >;
}

export interface DockerEvent {
  type: 'builder' | 'config' | 'container' | 'daemon' | 'image' | 'network' | 'node' | 'plugin' | 'scope' | 'secret' | 'service' | 'volume';
  action: string;
  actor: {
    id: string;
    attributes: Record<string, string>;
  };
  scope: 'local' | 'swarm';
  time: number;
  time_nano: number;
}

export interface SystemDataUsage {
  layer_size: number;
  images: Array<{
    id: string;
    parent_id: string;
    repo_tags: string[];
    repo_digests: string[];
    created: number;
    size: number;
    virtual_size: number;
    shared_size: number;
    labels: Record<string, string>;
    containers: number;
  }>;
  containers: Array<{
    id: string;
    names: string[];
    image: string;
    image_id: string;
    command: string;
    created: number;
    state: string;
    status: string;
    size_rw: number;
    size_root_fs: number;
    labels: Record<string, string>;
    network_settings: {
      networks: Record<string, any>;
    };
    mounts: Array<{
      type: string;
      name?: string;
      source: string;
      destination: string;
      driver?: string;
      mode: string;
      rw: boolean;
      propagation: string;
    }>;
  }>;
  volumes: Array<{
    created_at: string;
    driver: string;
    labels: Record<string, string>;
    mountpoint: string;
    name: string;
    options: Record<string, string>;
    scope: string;
    status: Record<string, any>;
    usage_data: {
      ref_count: number;
      size: number;
    };
  }>;
  build_cache: Array<{
    id: string;
    parents: string[];
    type: string;
    description: string;
    in_use: boolean;
    shared: boolean;
    size: number;
    created_at: string;
    last_used_at: string;
    usage_count: number;
  }>;
}

export interface DockerDiskUsage {
  images_size: number;
  containers_size: number;
  volumes_size: number;
  build_cache_size: number;
}

// Common status types
export type ContainerState = 'created' | 'restarting' | 'running' | 'removing' | 'paused' | 'exited' | 'dead';
export type NetworkDriver = 'bridge' | 'host' | 'overlay' | 'macvlan' | 'ipvlan' | 'none';
export type VolumeDriver = 'local' | 'nfs' | 'cifs' | 'sshfs';
export type RestartPolicy = 'no' | 'always' | 'unless-stopped' | 'on-failure';

// API Response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}
