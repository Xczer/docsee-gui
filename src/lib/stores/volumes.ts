import { writable, derived } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';

export interface DockerVolume {
	name: string;
	driver: string;
	mountpoint: string;
	created_at?: string;
	scope: string;
	status?: Record<string, string>;
	labels?: Record<string, string>;
	options?: Record<string, string>;
	usage_data?: VolumeUsageData;
}

export interface VolumeUsageData {
	size?: number;
	ref_count?: number;
}

export interface VolumePruneResponse {
	volumes_deleted?: string[];
	space_reclaimed?: number;
}

export interface VolumesState {
	volumes: DockerVolume[];
	isLoading: boolean;
	error: string | null;
	selectedVolume: DockerVolume | null;
}

// Store state
const initialState: VolumesState = {
	volumes: [],
	isLoading: false,
	error: null,
	selectedVolume: null
};

export const volumesState = writable<VolumesState>(initialState);

// Derived stores
export const volumes = derived(volumesState, (state) => state.volumes);
export const isLoadingVolumes = derived(volumesState, (state) => state.isLoading);
export const volumesError = derived(volumesState, (state) => state.error);
export const selectedVolume = derived(volumesState, (state) => state.selectedVolume);

// Search and filter
export const volumeSearchTerm = writable<string>('');
export const volumeDriverFilter = writable<'all' | string>('all');

// Filtered volumes
export const filteredVolumes = derived(
	[volumes, volumeSearchTerm, volumeDriverFilter],
	([volumes, searchTerm, driverFilter]) => {
		let filtered = volumes;

		// Filter by driver
		if (driverFilter !== 'all') {
			filtered = filtered.filter(volume => volume.driver === driverFilter);
		}

		// Filter by search term
		if (searchTerm.trim()) {
			const search = searchTerm.toLowerCase();
			filtered = filtered.filter(volume => 
				volume.name.toLowerCase().includes(search) ||
				volume.driver.toLowerCase().includes(search) ||
				volume.mountpoint.toLowerCase().includes(search)
			);
		}

		return filtered;
	}
);

// Actions
export async function loadVolumes(): Promise<void> {
	volumesState.update(state => ({
		...state,
		isLoading: true,
		error: null
	}));

	try {
		const volumes: DockerVolume[] = await invoke('get_volumes');
		
		volumesState.update(state => ({
			...state,
			volumes,
			isLoading: false
		}));
	} catch (error) {
		console.error('Failed to load volumes:', error);
		volumesState.update(state => ({
			...state,
			isLoading: false,
			error: error as string
		}));
	}
}

export async function loadVolumeDetails(name: string): Promise<void> {
	volumesState.update(state => ({
		...state,
		isLoading: true,
		error: null
	}));

	try {
		const volume: DockerVolume = await invoke('get_volume_details', { name });
		
		volumesState.update(state => ({
			...state,
			selectedVolume: volume,
			isLoading: false
		}));
	} catch (error) {
		console.error('Failed to load volume details:', error);
		volumesState.update(state => ({
			...state,
			isLoading: false,
			error: error as string
		}));
	}
}

export async function removeVolume(name: string, force: boolean = false): Promise<void> {
	try {
		await invoke('remove_volume_cmd', { name, force });
		
		// Remove from local state
		volumesState.update(state => ({
			...state,
			volumes: state.volumes.filter(volume => volume.name !== name),
			selectedVolume: state.selectedVolume?.name === name ? null : state.selectedVolume
		}));
	} catch (error) {
		console.error('Failed to remove volume:', error);
		throw error;
	}
}

export async function pruneVolumes(): Promise<VolumePruneResponse> {
	try {
		const result: VolumePruneResponse = await invoke('prune_volumes_cmd');
		
		// Reload volumes after pruning
		await loadVolumes();
		
		return result;
	} catch (error) {
		console.error('Failed to prune volumes:', error);
		throw error;
	}
}

export function clearVolumeSelection(): void {
	volumesState.update(state => ({
		...state,
		selectedVolume: null
	}));
}

export function clearVolumesError(): void {
	volumesState.update(state => ({
		...state,
		error: null
	}));
}

// Utility functions
export function formatVolumeCreated(created?: string): string {
	if (!created) return 'Unknown';
	try {
		return new Date(created).toLocaleString();
	} catch {
		return created;
	}
}

export function formatVolumeSize(size?: number): string {
	if (size == null) return 'Unknown';
	if (size === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(size) / Math.log(k));
	return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getVolumeRefCount(volume: DockerVolume): number {
	return volume.usage_data?.ref_count ?? 0;
}

export function isVolumeInUse(volume: DockerVolume): boolean {
	return getVolumeRefCount(volume) > 0;
}
