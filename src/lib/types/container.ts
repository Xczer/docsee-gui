// Container Types for DocSee

export interface Container {
  id: string;
  names: string[];
  image: string;
  image_id: string;
  command: string;
  created: number;
  ports: Port[];
  labels: Record<string, string>;
  state: ContainerState;
  status: string;
  host_config: {
    network_mode: string;
    restart_policy: {
      name: RestartPolicy;
      maximum_retry_count: number;
    };
    auto_remove: boolean;
    volume_driver: string;
    volumes_from: string[];
    cap_add: string[];
    cap_drop: string[];
    cgroup_ns_mode: string;
    dns: string[];
    dns_options: string[];
    dns_search: string[];
    extra_hosts: string[];
    group_add: string[];
    ipc_mode: string;
    cgroup: string;
    links: string[];
    log_config: {
      type: string;
      config: Record<string, string>;
    };
    network_mode: string;
    oom_kill_disable: boolean;
    oom_score_adj: number;
    pid_mode: string;
    privileged: boolean;
    publish_all_ports: boolean;
    readonly_rootfs: boolean;
    security_opt: string[];
    storage_opt: Record<string, string>;
    tmpfs: Record<string, string>;
    uts_mode: string;
    userns_mode: string;
    shm_size: number;
    sysctls: Record<string, string>;
    runtime: string;
    console_size: [number, number];
    isolation: string;
    cpu_shares: number;
    memory: number;
    nano_cpus: number;
    cgroup_parent: string;
    blkio_weight: number;
    blkio_weight_device: Array<{
      path: string;
      weight: number;
    }>;
    blkio_device_read_bps: Array<{
      path: string;
      rate: number;
    }>;
    blkio_device_write_bps: Array<{
      path: string;
      rate: number;
    }>;
    blkio_device_read_iops: Array<{
      path: string;
      rate: number;
    }>;
    blkio_device_write_iops: Array<{
      path: string;
      rate: number;
    }>;
    cpu_period: number;
    cpu_quota: number;
    cpu_realtime_period: number;
    cpu_realtime_runtime: number;
    cpuset_cpus: string;
    cpuset_mems: string;
    devices: Array<{
      path_on_host: string;
      path_in_container: string;
      cgroup_permissions: string;
    }>;
    device_cgroup_rules: string[];
    device_requests: Array<{
      driver: string;
      count: number;
      device_ids: string[];
      capabilities: string[][];
      options: Record<string, string>;
    }>;
    kernel_memory: number;
    kernel_memory_tcp: number;
    memory_reservation: number;
    memory_swap: number;
    memory_swappiness: number;
    oom_kill_disable: boolean;
    pids_limit: number;
    ulimits: Array<{
      name: string;
      soft: number;
      hard: number;
    }>;
    cpu_count: number;
    cpu_percent: number;
    io_maximum_iops: number;
    io_maximum_bandwidth: number;
    binds: string[];
    container_id_file: string;
    log_config: {
      type: string;
      config: Record<string, string>;
    };
    network_mode: string;
    port_bindings: Record<string, Array<{
      host_ip: string;
      host_port: string;
    }>>;
    restart_policy: {
      name: RestartPolicy;
      maximum_retry_count: number;
    };
    volume_driver: string;
    volumes_from: string[];
  };
  network_settings: {
    networks: Record<string, ContainerNetwork>;
    ports: Record<string, Array<{
      host_ip: string;
      host_port: string;
    }>>;
    sandbox_id: string;
    sandbox_key: string;
    secondary_ip_addresses: any[];
    secondary_ipv6_addresses: any[];
    endpoint_id: string;
    gateway: string;
    global_ipv6_address: string;
    global_ipv6_prefix_len: number;
    ip_address: string;
    ip_prefix_len: number;
    ipv6_gateway: string;
    mac_address: string;
    bridge: string;
    hairpin_mode: boolean;
    link_local_ipv6_address: string;
    link_local_ipv6_prefix_len: number;
    ports: Record<string, Array<{
      host_ip: string;
      host_port: string;
    }>>;
    sandbox_id: string;
    secondary_ip_addresses: any[];
    secondary_ipv6_addresses: any[];
  };
  mounts: Mount[];
  config: {
    hostname: string;
    domainname: string;
    user: string;
    attach_stdin: boolean;
    attach_stdout: boolean;
    attach_stderr: boolean;
    exposed_ports: Record<string, any>;
    tty: boolean;
    open_stdin: boolean;
    stdin_once: boolean;
    env: string[];
    cmd: string[];
    healthcheck: {
      test: string[];
      interval: number;
      timeout: number;
      retries: number;
      start_period: number;
    };
    args_escaped: boolean;
    image: string;
    volumes: Record<string, any>;
    working_dir: string;
    entrypoint: string[];
    network_disabled: boolean;
    mac_address: string;
    on_build: string[];
    labels: Record<string, string>;
    stop_signal: string;
    stop_timeout: number;
    shell: string[];
  };
  size_rw?: number;
  size_root_fs?: number;
}

export interface ContainerInspect {
  id: string;
  created: string;
  path: string;
  args: string[];
  state: {
    status: ContainerState;
    running: boolean;
    paused: boolean;
    restarting: boolean;
    oom_killed: boolean;
    dead: boolean;
    pid: number;
    exit_code: number;
    error: string;
    started_at: string;
    finished_at: string;
    health?: {
      status: 'starting' | 'healthy' | 'unhealthy';
      failing_streak: number;
      log: Array<{
        start: string;
        end: string;
        exit_code: number;
        output: string;
      }>;
    };
  };
  image: string;
  resolve_conf_path: string;
  hostname_path: string;
  hosts_path: string;
  log_path: string;
  name: string;
  restart_count: number;
  driver: string;
  platform: string;
  mount_label: string;
  process_label: string;
  app_armor_profile: string;
  exec_ids: string[];
  host_config: Container['host_config'];
  graph_driver: {
    data: Record<string, string>;
    name: string;
  };
  size_rw?: number;
  size_root_fs?: number;
  mounts: Mount[];
  config: Container['config'];
  network_settings: Container['network_settings'];
}

export interface Port {
  ip?: string;
  private_port: number;
  public_port?: number;
  type: 'tcp' | 'udp' | 'sctp';
}

export interface Mount {
  type: 'bind' | 'volume' | 'tmpfs' | 'npipe' | 'cluster';
  name?: string;
  source: string;
  destination: string;
  driver?: string;
  mode: string;
  rw: boolean;
  propagation: string;
}

export interface ContainerNetwork {
  ipam_config?: {
    ipv4_address: string;
    ipv6_address: string;
    link_local_ips: string[];
  };
  links?: string[];
  aliases?: string[];
  network_id: string;
  endpoint_id: string;
  gateway: string;
  ip_address: string;
  ip_prefix_len: number;
  ipv6_gateway: string;
  global_ipv6_address: string;
  global_ipv6_prefix_len: number;
  mac_address: string;
  driver_opts?: Record<string, string>;
}

export interface ContainerProcess {
  pid: string;
  ppid: string;
  c: string;
  stime: string;
  tty: string;
  time: string;
  cmd: string;
}

export interface ContainerLog {
  timestamp: string;
  stream: 'stdout' | 'stderr';
  content: string;
}

export interface ContainerStats {
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
    stats: Record<string, number>;
    limit: number;
  };
  name: string;
  id: string;
  networks: Record<string, {
    rx_bytes: number;
    rx_packets: number;
    rx_errors: number;
    rx_dropped: number;
    tx_bytes: number;
    tx_packets: number;
    tx_errors: number;
    tx_dropped: number;
  }>;
}

export interface CreateContainerOptions {
  name?: string;
  hostname?: string;
  domainname?: string;
  user?: string;
  attach_stdin?: boolean;
  attach_stdout?: boolean;
  attach_stderr?: boolean;
  exposed_ports?: Record<string, any>;
  tty?: boolean;
  open_stdin?: boolean;
  stdin_once?: boolean;
  env?: string[];
  cmd?: string[];
  healthcheck?: {
    test?: string[];
    interval?: number;
    timeout?: number;
    retries?: number;
    start_period?: number;
  };
  args_escaped?: boolean;
  image: string;
  volumes?: Record<string, any>;
  working_dir?: string;
  entrypoint?: string[];
  network_disabled?: boolean;
  mac_address?: string;
  on_build?: string[];
  labels?: Record<string, string>;
  stop_signal?: string;
  stop_timeout?: number;
  shell?: string[];
  host_config?: {
    cpu_shares?: number;
    memory?: number;
    cgroup_parent?: string;
    blkio_weight?: number;
    blkio_weight_device?: Array<{
      path: string;
      weight: number;
    }>;
    blkio_device_read_bps?: Array<{
      path: string;
      rate: number;
    }>;
    blkio_device_write_bps?: Array<{
      path: string;
      rate: number;
    }>;
    blkio_device_read_iops?: Array<{
      path: string;
      rate: number;
    }>;
    blkio_device_write_iops?: Array<{
      path: string;
      rate: number;
    }>;
    cpu_period?: number;
    cpu_quota?: number;
    cpu_realtime_period?: number;
    cpu_realtime_runtime?: number;
    cpuset_cpus?: string;
    cpuset_mems?: string;
    devices?: Array<{
      path_on_host: string;
      path_in_container: string;
      cgroup_permissions: string;
    }>;
    device_cgroup_rules?: string[];
    device_requests?: Array<{
      driver: string;
      count: number;
      device_ids: string[];
      capabilities: string[][];
      options: Record<string, string>;
    }>;
    kernel_memory?: number;
    kernel_memory_tcp?: number;
    memory_reservation?: number;
    memory_swap?: number;
    memory_swappiness?: number;
    nano_cpus?: number;
    oom_kill_disable?: boolean;
    init?: boolean;
    pids_limit?: number;
    ulimits?: Array<{
      name: string;
      soft: number;
      hard: number;
    }>;
    cpu_count?: number;
    cpu_percent?: number;
    io_maximum_iops?: number;
    io_maximum_bandwidth?: number;
    binds?: string[];
    container_id_file?: string;
    log_config?: {
      type: string;
      config?: Record<string, string>;
    };
    network_mode?: string;
    port_bindings?: Record<string, Array<{
      host_ip?: string;
      host_port?: string;
    }>>;
    restart_policy?: {
      name: RestartPolicy;
      maximum_retry_count?: number;
    };
    auto_remove?: boolean;
    volume_driver?: string;
    volumes_from?: string[];
    mounts?: Array<{
      target: string;
      source: string;
      type: 'bind' | 'volume' | 'tmpfs';
      read_only?: boolean;
      consistency?: 'default' | 'consistent' | 'cached' | 'delegated';
      bind_options?: {
        propagation?: 'private' | 'rprivate' | 'shared' | 'rshared' | 'slave' | 'rslave';
        non_recursive?: boolean;
      };
      volume_options?: {
        no_copy?: boolean;
        labels?: Record<string, string>;
        driver_config?: {
          name: string;
          options?: Record<string, string>;
        };
      };
      tmpfs_options?: {
        size_bytes?: number;
        mode?: number;
      };
    }>;
    cap_add?: string[];
    cap_drop?: string[];
    cgroup_ns_mode?: string;
    dns?: string[];
    dns_options?: string[];
    dns_search?: string[];
    extra_hosts?: string[];
    group_add?: string[];
    ipc_mode?: string;
    cgroup?: string;
    links?: string[];
    oom_score_adj?: number;
    pid_mode?: string;
    privileged?: boolean;
    publish_all_ports?: boolean;
    readonly_rootfs?: boolean;
    security_opt?: string[];
    storage_opt?: Record<string, string>;
    tmpfs?: Record<string, string>;
    uts_mode?: string;
    userns_mode?: string;
    shm_size?: number;
    sysctls?: Record<string, string>;
    runtime?: string;
    console_size?: [number, number];
    isolation?: string;
  };
  networking_config?: {
    endpoints_config?: Record<string, {
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
    }>;
  };
}

// Re-export from docker.ts
export type ContainerState = 'created' | 'restarting' | 'running' | 'removing' | 'paused' | 'exited' | 'dead';
export type RestartPolicy = 'no' | 'always' | 'unless-stopped' | 'on-failure';
