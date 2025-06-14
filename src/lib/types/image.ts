// Image types

export interface ImageSummary {
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
}

export interface ImageInspect {
  id: string;
  repo_tags: string[];
  repo_digests: string[];
  parent: string;
  comment: string;
  created: string;
  container: string;
  container_config: {
    hostname: string;
    domainname: string;
    user: string;
    attach_stdin: boolean;
    attach_stdout: boolean;
    attach_stderr: boolean;
    exposed_ports?: Record<string, {}>;
    tty: boolean;
    open_stdin: boolean;
    stdin_once: boolean;
    env: string[];
    cmd: string[];
    healthcheck?: {
      test: string[];
      interval: number;
      timeout: number;
      retries: number;
      start_period: number;
    };
    args_escaped: boolean;
    image: string;
    volumes?: Record<string, {}>;
    working_dir: string;
    entrypoint: string[] | null;
    network_disabled: boolean;
    mac_address: string;
    on_build: string[] | null;
    labels: Record<string, string>;
    stop_signal: string;
    stop_timeout: number;
    shell: string[];
  };
  docker_version: string;
  author: string;
  config: {
    hostname: string;
    domainname: string;
    user: string;
    attach_stdin: boolean;
    attach_stdout: boolean;
    attach_stderr: boolean;
    exposed_ports?: Record<string, {}>;
    tty: boolean;
    open_stdin: boolean;
    stdin_once: boolean;
    env: string[];
    cmd: string[];
    healthcheck?: {
      test: string[];
      interval: number;
      timeout: number;
      retries: number;
      start_period: number;
    };
    args_escaped: boolean;
    image: string;
    volumes?: Record<string, {}>;
    working_dir: string;
    entrypoint: string[] | null;
    network_disabled: boolean;
    mac_address: string;
    on_build: string[] | null;
    labels: Record<string, string>;
    stop_signal: string;
    stop_timeout: number;
    shell: string[];
  };
  architecture: string;
  os: string;
  size: number;
  virtual_size: number;
  graph_driver: {
    name: string;
    data: Record<string, string>;
  };
  root_fs: {
    type: string;
    layers: string[];
  };
  metadata: {
    last_tag_time: string;
  };
}

export interface ImageHistoryEntry {
  id: string;
  created: number;
  created_by: string;
  tags: string[];
  size: number;
  comment: string;
}

export interface ImageBuildOptions {
  dockerfile?: string;
  t?: string[]; // tags
  extrahosts?: string;
  remote?: string;
  q?: boolean; // quiet
  nocache?: boolean;
  cachefrom?: string[];
  pull?: boolean;
  rm?: boolean;
  forcerm?: boolean;
  memory?: number;
  memswap?: number;
  cpushares?: number;
  cpusetcpus?: string;
  cpuperiod?: number;
  cpuquota?: number;
  buildargs?: Record<string, string>;
  shmsize?: number;
  squash?: boolean;
  labels?: Record<string, string>;
  networkmode?: string;
  platform?: string;
  target?: string;
  outputs?: string;
}

export interface ImagePullOptions {
  tag?: string;
  platform?: string;
  all?: boolean;
}

export interface ImagePushOptions {
  tag?: string;
}

export interface ImageSearchResult {
  name: string;
  description: string;
  star_count: number;
  is_official: boolean;
  is_automated: boolean;
}

export interface ImageAction {
  id: string;
  action: 'remove' | 'tag' | 'push' | 'save' | 'load';
  force?: boolean;
  no_prune?: boolean;
  tag?: string;
  repo?: string;
}

export interface ImagePruneResult {
  images_deleted: Array<{
    untagged?: string;
    deleted?: string;
  }>;
  space_reclaimed: number;
}

export interface RegistryAuth {
  username?: string;
  password?: string;
  email?: string;
  serveraddress?: string;
  identitytoken?: string;
  registrytoken?: string;
}

export interface BuildProgress {
  id?: string;
  status?: string;
  progress?: string;
  progress_detail?: {
    current?: number;
    total?: number;
  };
  stream?: string;
  error?: string;
  error_detail?: {
    message: string;
  };
  aux?: {
    id: string;
  };
}

export type ImageStatus = 'available' | 'pulling' | 'building' | 'pushing' | 'error';
