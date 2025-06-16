// src/lib/stores/volumes.svelte.ts
import type {
	Volume,
	VolumeInspect,
	CreateVolumeOptions,
} from "../types/volume";
import { invoke } from "@tauri-apps/api/core";
import { handleTauriError } from "../services/tauri-commands";

// Volume API functions
async function getVolumes(): Promise<Volume[]> {
	return await invoke("get_volumes");
}

async function getVolumeDetails(name: string): Promise<VolumeInspect> {
	return await invoke("get_volume_details", { name });
}

async function createVolume(options: CreateVolumeOptions): Promise<Volume> {
	return await invoke("create_volume_cmd", { options });
}

async function removeVolume(name: string, force = false): Promise<void> {
	return await invoke("remove_volume_cmd", { name, force });
}

async function pruneVolumes(): Promise<{
	volumes_deleted: string[];
	space_reclaimed: number;
}> {
	return await invoke("prune_volumes_cmd");
}

// Use a class-based approach to encapsulate the state
class VolumesStore {
	private _volumes = $state<Volume[]>([]);
	private _selectedVolume = $state<Volume | null>(null);
	private _volumeDetails = $state<VolumeInspect | null>(null);

	// Loading states
	private _isLoadingVolumes = $state<boolean>(false);
	private _isLoadingVolumeDetails = $state<boolean>(false);
	private _volumeOperationInProgress = $state<string[]>([]);

	// Filter and sorting
	private _volumeFilter = $state<string>("all");
	private _volumeSortBy = $state<string>("name");
	private _volumeSearchTerm = $state<string>("");

	// Error store
	private _volumeError = $state<string | null>(null);

	// Auto-refresh interval
	private volumeRefreshInterval: ReturnType<typeof setInterval> | null = null;

	// Getters
	get volumes() {
		return this._volumes;
	}

	get selectedVolume() {
		return this._selectedVolume;
	}

	get volumeDetails() {
		return this._volumeDetails;
	}

	get isLoadingVolumes() {
		return this._isLoadingVolumes;
	}

	get isLoadingVolumeDetails() {
		return this._isLoadingVolumeDetails;
	}

	get volumeOperationInProgress() {
		return this._volumeOperationInProgress;
	}

	get volumeFilter() {
		return this._volumeFilter;
	}

	get volumeSortBy() {
		return this._volumeSortBy;
	}

	get volumeSearchTerm() {
		return this._volumeSearchTerm;
	}

	get volumeError() {
		return this._volumeError;
	}

	// Derived getters for filtered and sorted volumes
	get filteredVolumes() {
		let filtered = this._volumes;

		// Apply usage filter
		if (this._volumeFilter !== "all") {
			filtered = filtered.filter((volume) => {
				switch (this._volumeFilter) {
					case "used":
						return this.isVolumeInUse(volume);
					case "unused":
						return !this.isVolumeInUse(volume);
					case "local":
						return volume.driver === "local";
					case "external":
						return volume.driver !== "local";
					default:
						return true;
				}
			});
		}

		// Apply search filter
		if (this._volumeSearchTerm) {
			const term = this._volumeSearchTerm.toLowerCase();
			filtered = filtered.filter((volume) => {
				return (
					volume.name.toLowerCase().includes(term) ||
					volume.driver.toLowerCase().includes(term) ||
					volume.mountpoint.toLowerCase().includes(term)
				);
			});
		}

		return filtered;
	}

	get sortedVolumes() {
		const filtered = this.filteredVolumes;
		const sorted = [...filtered];

		sorted.sort((a, b) => {
			switch (this._volumeSortBy) {
				case "name":
					return a.name.localeCompare(b.name);
				case "driver":
					return a.driver.localeCompare(b.driver);
				case "created":
					return (
						new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
					); // Newest first
				case "size": {
					const aSize = a.usage_data?.size || 0;
					const bSize = b.usage_data?.size || 0;
					return bSize - aSize; // Largest first
				}
				case "usage": {
					const aUsage = a.usage_data?.ref_count || 0;
					const bUsage = b.usage_data?.ref_count || 0;
					return bUsage - aUsage; // Most used first
				}
				default:
					return 0;
			}
		});

		return sorted;
	}

	// Setter methods
	setSelectedVolume(volume: Volume | null) {
		this._selectedVolume = volume;
	}

	setVolumeFilter(filter: string) {
		this._volumeFilter = filter;
	}

	setVolumeSortBy(sortBy: string) {
		this._volumeSortBy = sortBy;
	}

	setVolumeSearchTerm(term: string) {
		this._volumeSearchTerm = term;
	}

	setVolumeError(error: string | null) {
		this._volumeError = error;
	}

	// Volume operations
	async loadVolumes() {
		try {
			this._isLoadingVolumes = true;
			this._volumeError = null;

			const volumeList = await getVolumes();
			this._volumes.length = 0;
			this._volumes.push(...volumeList);
			return volumeList;
		} catch (error) {
			console.error("Failed to load volumes:", error);
			const errorMessage = handleTauriError(error);
			this._volumeError = errorMessage;
			return [];
		} finally {
			this._isLoadingVolumes = false;
		}
	}

	async loadVolumeDetails(name: string) {
		try {
			this._isLoadingVolumeDetails = true;
			this._volumeError = null;

			const details = await getVolumeDetails(name);
			this._volumeDetails = details;
			return details;
		} catch (error) {
			console.error("Failed to load volume details:", error);
			const errorMessage = handleTauriError(error);
			this._volumeError = errorMessage;
			return null;
		} finally {
			this._isLoadingVolumeDetails = false;
		}
	}

	async performVolumeAction(
		action: "create" | "remove" | "prune",
		volumeNameOrOptions: string | CreateVolumeOptions,
		options?: { force?: boolean },
	) {
		try {
			const operationId =
				action === "create"
					? `${action}-${typeof volumeNameOrOptions === "string" ? volumeNameOrOptions : "new"}`
					: `${action}-${volumeNameOrOptions}`;

			// Add to operations in progress
			this._volumeOperationInProgress.push(operationId);
			this._volumeError = null;

			switch (action) {
				case "create":
					if (typeof volumeNameOrOptions === "string") {
						throw new Error("Create action requires CreateVolumeOptions");
					}
					await createVolume(volumeNameOrOptions);
					break;
				case "remove":
					if (typeof volumeNameOrOptions !== "string") {
						throw new Error("Remove action requires volume name");
					}
					await removeVolume(volumeNameOrOptions, options?.force || false);
					break;
				case "prune":
					await pruneVolumes();
					break;
				default:
					throw new Error(`Unknown action: ${action}`);
			}

			// Refresh volumes list after successful operation
			await this.loadVolumes();
			return true;
		} catch (error) {
			console.error(`Failed to ${action} volume:`, error);
			const errorMessage = handleTauriError(error);
			this._volumeError = errorMessage;
			return false;
		} finally {
			// Remove from operations in progress
			const operationId =
				action === "create"
					? `${action}-${typeof volumeNameOrOptions === "string" ? volumeNameOrOptions : "new"}`
					: `${action}-${volumeNameOrOptions}`;
			const index = this._volumeOperationInProgress.indexOf(operationId);
			if (index > -1) {
				this._volumeOperationInProgress.splice(index, 1);
			}
		}
	}

	// Convenience methods for specific actions
	async createVolume(options: CreateVolumeOptions) {
		return this.performVolumeAction("create", options);
	}

	async removeVolume(name: string, force?: boolean) {
		return this.performVolumeAction("remove", name, { force });
	}

	async pruneVolumes() {
		return this.performVolumeAction("prune", "unused");
	}

	// Auto-refresh functionality
	startAutoRefresh(intervalMs = 10000) {
		if (this.volumeRefreshInterval) {
			clearInterval(this.volumeRefreshInterval);
		}

		this.volumeRefreshInterval = setInterval(async () => {
			await this.loadVolumes();
		}, intervalMs);
	}

	stopAutoRefresh() {
		if (this.volumeRefreshInterval) {
			clearInterval(this.volumeRefreshInterval);
			this.volumeRefreshInterval = null;
		}
	}

	// Cleanup function
	cleanup() {
		this.stopAutoRefresh();
	}

	// Helper methods
	getVolumeDisplayName(volume: Volume): string {
		return volume.name;
	}

	formatVolumeSize(bytes?: number): string {
		if (!bytes) return "Unknown";

		const units = ["B", "KB", "MB", "GB", "TB"];
		let size = bytes;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${size.toFixed(1)}${units[unitIndex]}`;
	}

	formatVolumeCreated(createdAt: string): string {
		const now = new Date();
		const created = new Date(createdAt);
		const diff = now.getTime() - created.getTime();
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);
		const months = Math.floor(days / 30);
		const years = Math.floor(days / 365);

		if (seconds < 60) return "Just now";
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 30) return `${days}d ago`;
		if (months < 12) return `${months}mo ago`;
		return `${years}y ago`;
	}

	isVolumeInUse(volume: Volume): boolean {
		return (volume.usage_data?.ref_count || 0) > 0;
	}

	getVolumeRefCount(volume: Volume): number {
		return volume.usage_data?.ref_count || 0;
	}

	getVolumeSize(volume: Volume): number {
		return volume.usage_data?.size || 0;
	}

	getVolumeDriver(volume: Volume): string {
		return volume.driver;
	}

	getVolumeMountPoint(volume: Volume): string {
		return volume.mountpoint;
	}

	hasVolumeLabels(volume: Volume): boolean {
		return Object.keys(volume.labels || {}).length > 0;
	}

	getVolumeLabels(volume: Volume): Record<string, string> {
		return volume.labels || {};
	}
}

// Create and export a singleton instance
export const volumesStore = new VolumesStore();
