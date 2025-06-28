// Volume Types for DocSee

export interface Volume {
	created_at: string;
	driver: VolumeDriver;
	labels: Record<string, string>;
	mountpoint: string;
	name: string;
	options: Record<string, string>;
	scope: "local" | "global";
	status?: Record<string, any>;
	usage_data?: {
		ref_count: number;
		size: number;
	};
}

export interface VolumeInspect {
	created_at: string;
	driver: VolumeDriver;
	labels: Record<string, string>;
	mountpoint: string;
	name: string;
	options: Record<string, string>;
	scope: "local" | "global";
	status?: Record<string, any>;
	usage_data?: {
		ref_count: number;
		size: number;
	};
}

export interface CreateVolumeOptions {
	name?: string;
	driver?: VolumeDriver;
	driver_opts?: Record<string, string>;
	labels?: Record<string, string>;
}

export interface VolumeListOptions {
	filters?: {
		dangling?: boolean;
		driver?: string[];
		label?: string[];
		name?: string[];
	};
}

export interface VolumePruneOptions {
	filters?: {
		label?: string[];
	};
}

export interface VolumePruneResult {
	volumes_deleted: string[];
	space_reclaimed: number;
}

export interface VolumeUsage {
	name: string;
	driver: VolumeDriver;
	mountpoint: string;
	created_at: string;
	size: number;
	ref_count: number;
	containers: string[];
	last_used?: string;
}

export interface VolumeStats {
	name: string;
	driver: VolumeDriver;
	mountpoint: string;
	size: number;
	used: number;
	available: number;
	usage_percentage: number;
	ref_count: number;
	containers: Array<{
		id: string;
		name: string;
		mount_point: string;
	}>;
}

export interface VolumeBackup {
	volume_name: string;
	backup_name: string;
	created_at: string;
	size: number;
	compression: "none" | "gzip" | "bzip2" | "xz";
	file_path: string;
}

export interface VolumeBackupOptions {
	volume_name: string;
	backup_name?: string;
	compression?: "none" | "gzip" | "bzip2" | "xz";
	exclude_patterns?: string[];
	include_patterns?: string[];
}

export interface VolumeRestoreOptions {
	volume_name: string;
	backup_path: string;
	overwrite?: boolean;
	preserve_permissions?: boolean;
}

export interface VolumeMountInfo {
	source: string;
	destination: string;
	type: "bind" | "volume" | "tmpfs";
	read_only: boolean;
	consistency: "default" | "consistent" | "cached" | "delegated";
	bind_options?: {
		propagation:
			| "private"
			| "rprivate"
			| "shared"
			| "rshared"
			| "slave"
			| "rslave";
		non_recursive: boolean;
	};
	volume_options?: {
		no_copy: boolean;
		labels: Record<string, string>;
		driver_config?: {
			name: string;
			options: Record<string, string>;
		};
	};
	tmpfs_options?: {
		size_bytes: number;
		mode: number;
	};
}

export interface VolumeFile {
	name: string;
	path: string;
	type: "file" | "directory" | "symlink";
	size: number;
	mode: string;
	uid: number;
	gid: number;
	modified: string;
	accessed: string;
	created: string;
}

export interface VolumeDirectory {
	name: string;
	path: string;
	files: VolumeFile[];
	directories: VolumeDirectory[];
	total_files: number;
	total_size: number;
}

// Re-export from docker.ts
export type VolumeDriver = "local" | "nfs" | "cifs" | "sshfs";
