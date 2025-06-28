// Docker types based on Docker API and Bollard

export interface DockerVersion {
	version: string;
	api_version: string;
	git_commit: string;
	go_version: string;
	os: string;
	arch: string;
	kernel_version: string;
	build_time: string;
}

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
	ngορoutines: number;
	system_time: string;
	logging_driver: string;
	cgroup_driver: string;
	nEvents_listener: number;
	kernel_version: string;
	operating_system: string;
	os_type: string;
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
	runtimes: Record<string, { path: string }>;
	default_runtime: string;
	swarm: {
		node_id: string;
		node_addr: string;
		local_node_state: string;
		control_available: boolean;
		error: string;
		remote_managers: Array<{
			node_id: string;
			addr: string;
		}>;
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

export interface DockerSystemInfo {
	version: DockerVersion;
	info: DockerInfo;
}

export interface DockerConnectionStatus {
	connected: boolean;
	error?: string;
	version?: string;
	api_version?: string;
}

export interface DockerStats {
	containers_total: number;
	containers_running: number;
	containers_stopped: number;
	containers_paused: number;
	images_total: number;
	volumes_total: number;
	networks_total: number;
}

export interface DockerEvent {
	type: string;
	action: string;
	actor: {
		id: string;
		attributes: Record<string, string>;
	};
	scope: string;
	time: number;
	time_nano: number;
}

// Helper type for API responses
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}
