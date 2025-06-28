// Container types

export interface ContainerPort {
	ip?: string;
	private_port: number;
	public_port?: number;
	type: string;
}

export interface ContainerMount {
	type: string;
	name?: string;
	source: string;
	destination: string;
	driver?: string;
	mode: string;
	rw: boolean;
	propagation: string;
}

export interface ContainerNetworkSettings {
	networks: Record<
		string,
		{
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
	>;
}

export interface ContainerState {
	status: string;
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
}

export interface ContainerConfig {
	hostname: string;
	domainname: string;
	user: string;
	attach_stdin: boolean;
	attach_stdout: boolean;
	attach_stderr: boolean;
	exposed_ports?: Record<string, Record<string, unknown>>;
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
	volumes?: Record<string, Record<string, unknown>>;
	working_dir: string;
	entrypoint: string[] | null;
	network_disabled: boolean;
	mac_address: string;
	on_build: string[] | null;
	labels: Record<string, string>;
	stop_signal: string;
	stop_timeout: number;
	shell: string[];
}

export interface ContainerHostConfig {
	binds: string[];
	container_id_file: string;
	log_config: {
		type: string;
		config: Record<string, string>;
	};
	network_mode: string;
	port_bindings?: Record<
		string,
		Array<{
			host_ip: string;
			host_port: string;
		}>
	>;
	restart_policy: {
		name: string;
		maximum_retry_count: number;
	};
	auto_remove: boolean;
	volume_driver: string;
	volumes_from: string[];
	mounts: ContainerMount[];
	cap_add: string[];
	cap_drop: string[];
	dns: string[];
	dns_options: string[];
	dns_search: string[];
	extra_hosts: string[];
	group_add: string[];
	ipc_mode: string;
	cgroup: string;
	links: string[];
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
	disk_quota: number;
	kernel_memory: number;
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
}

export interface Container {
	id: string;
	names: string[];
	image: string;
	image_id: string;
	command: string;
	created: number;
	ports: ContainerPort[];
	size_rw?: number;
	size_root_fs?: number;
	labels: Record<string, string>;
	state: string;
	status: string;
	host_config: {
		network_mode: string;
	};
	network_settings: {
		networks: Record<
			string,
			{
				network_id: string;
				endpoint_id: string;
				gateway: string;
				ip_address: string;
				ip_prefix_len: number;
				ipv6_gateway: string;
				global_ipv6_address: string;
				global_ipv6_prefix_len: number;
				mac_address: string;
			}
		>;
	};
	mounts: ContainerMount[];
}

export interface ContainerInspect {
	id: string;
	created: string;
	path: string;
	args: string[];
	state: ContainerState;
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
	exec_ids: string[] | null;
	host_config: ContainerHostConfig;
	graph_driver: {
		name: string;
		data: Record<string, string>;
	};
	size_rw?: number;
	size_root_fs?: number;
	mounts: ContainerMount[];
	config: ContainerConfig;
	network_settings: ContainerNetworkSettings;
}

export interface ContainerStats {
	id: string;
	name: string;
	read: string;
	preread: string;
	pids_stats: {
		current: number;
		limit?: number;
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
		io_queue_recursive: Array<{
			major: number;
			minor: number;
			op: string;
			value: number;
		}>;
		io_service_time_recursive: Array<{
			major: number;
			minor: number;
			op: string;
			value: number;
		}>;
		io_wait_time_recursive: Array<{
			major: number;
			minor: number;
			op: string;
			value: number;
		}>;
		io_merged_recursive: Array<{
			major: number;
			minor: number;
			op: string;
			value: number;
		}>;
		io_time_recursive: Array<{
			major: number;
			minor: number;
			op: string;
			value: number;
		}>;
		sectors_recursive: Array<{
			major: number;
			minor: number;
			op: string;
			value: number;
		}>;
	};
	num_procs: number;
	storage_stats: Record<string, unknown>;
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

export interface ContainerCreateOptions {
	name?: string;
	image: string;
	hostname?: string;
	user?: string;
	attach_stdin?: boolean;
	attach_stdout?: boolean;
	attach_stderr?: boolean;
	exposed_ports?: Record<string, Record<string, unknown>>;
	tty?: boolean;
	open_stdin?: boolean;
	stdin_once?: boolean;
	env?: string[];
	cmd?: string[];
	healthcheck?: {
		test: string[];
		interval?: number;
		timeout?: number;
		retries?: number;
		start_period?: number;
	};
	args_escaped?: boolean;
	volumes?: Record<string, Record<string, unknown>>;
	working_dir?: string;
	entrypoint?: string[] | null;
	network_disabled?: boolean;
	mac_address?: string;
	on_build?: string[] | null;
	labels?: Record<string, string>;
	stop_signal?: string;
	stop_timeout?: number;
	shell?: string[];
	host_config?: Partial<ContainerHostConfig>;
	networking_config?: {
		endpoints_config: Record<
			string,
			{
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
			}
		>;
	};
}

export interface ContainerAction {
	id: string;
	action:
		| "start"
		| "stop"
		| "restart"
		| "pause"
		| "unpause"
		| "kill"
		| "remove";
	signal?: string;
	timeout?: number;
	force?: boolean;
}

export interface ContainerLogOptions {
	follow?: boolean;
	stdout?: boolean;
	stderr?: boolean;
	since?: number;
	until?: number;
	timestamps?: boolean;
	tail?: string;
}

export interface ContainerLogLine {
	timestamp?: string;
	stream: "stdout" | "stderr";
	content: string;
}

export type ContainerStatus =
	| "created"
	| "restarting"
	| "running"
	| "removing"
	| "paused"
	| "exited"
	| "dead";
