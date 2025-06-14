// Image Types for DocSee

export interface Image {
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
    exposed_ports: Record<string, any>;
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
  docker_version: string;
  author: string;
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
    healthcheck?: {
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
  architecture: string;
  os: string;
  os_version: string;
  size: number;
  virtual_size: number;
  graph_driver: {
    data: Record<string, string>;
    name: string;
  };
  root_fs: {
    type: string;
    layers: string[];
  };
  metadata: {
    last_tag_time: string;
  };
}

export interface ImageHistory {
  id: string;
  created: number;
  created_by: string;
  tags: string[];
  size: number;
  comment: string;
}

export interface ImageSearchResult {
  name: string;
  description: string;
  star_count: number;
  is_official: boolean;
  is_automated: boolean;
}

export interface BuildInfo {
  id: string;
  stream?: string;
  error?: string;
  error_detail?: {
    message: string;
  };
  status?: string;
  progress?: string;
  progress_detail?: {
    current: number;
    total: number;
  };
  aux?: {
    id: string;
  };
}

export interface BuildContext {
  dockerfile?: string;
  context: string;
  tag?: string;
  labels?: Record<string, string>;
  build_args?: Record<string, string>;
  target?: string;
  network_mode?: string;
  cache_from?: string[];
  pull?: boolean;
  rm?: boolean;
  force_rm?: boolean;
  memory?: number;
  memory_swap?: number;
  cpu_shares?: number;
  cpu_set_cpus?: string;
  cpu_period?: number;
  cpu_quota?: number;
  squash?: boolean;
  platform?: string;
}

export interface PullProgress {
  status: string;
  progress?: string;
  progress_detail?: {
    current: number;
    total: number;
  };
  id?: string;
}

export interface ImageLayer {
  id: string;
  size: number;
  created: number;
  created_by: string;
  comment: string;
  author: string;
}

export interface RegistryAuth {
  username: string;
  password: string;
  email?: string;
  server_address?: string;
}

export interface Registry {
  name: string;
  url: string;
  username?: string;
  password?: string;
  is_default: boolean;
  is_secure: boolean;
  auth_token?: string;
}

export interface ImageTag {
  name: string;
  full_size: number;
  images: Array<{
    architecture: string;
    features: string;
    variant: string;
    digest: string;
    os: string;
    os_features: string;
    os_version: string;
    size: number;
  }>;
  last_updated: string;
  last_updater_username: string;
  tag_status: string;
  tag_last_pulled: string;
  tag_last_pushed: string;
}

export interface ImageManifest {
  schema_version: number;
  media_type: string;
  config: {
    media_type: string;
    size: number;
    digest: string;
  };
  layers: Array<{
    media_type: string;
    size: number;
    digest: string;
    urls?: string[];
  }>;
}

export interface ImagePruneResult {
  images_deleted: Array<{
    untagged?: string;
    deleted?: string;
  }>;
  space_reclaimed: number;
}

export interface CreateImageOptions {
  from_image: string;
  from_src?: string;
  repo?: string;
  tag?: string;
  message?: string;
  changes?: string[];
  platform?: string;
}

export interface TagImageOptions {
  repo: string;
  tag?: string;
  force?: boolean;
}

export interface ExportImageOptions {
  names: string[];
}

export interface ImportImageOptions {
  source: string;
  repo?: string;
  tag?: string;
  message?: string;
  changes?: string[];
  platform?: string;
}

export interface ImageUsage {
  image_id: string;
  containers: number;
  size: number;
  created: number;
  last_used: number;
}

export interface ImageVulnerability {
  id: string;
  package_name: string;
  package_version: string;
  vulnerability_id: string;
  severity: 'unknown' | 'negligible' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
  link: string;
  fixed_by?: string;
}

export interface ImageScanResult {
  image_id: string;
  scan_date: string;
  vulnerabilities: ImageVulnerability[];
  total_vulnerabilities: number;
  vulnerabilities_by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    negligible: number;
    unknown: number;
  };
}
