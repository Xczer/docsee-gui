import {
	getContainerDetails,
	getContainerLogs,
	getContainerStats,
	getContainers,
	handleTauriError,
	killContainer,
	removeContainer,
	restartContainer,
	startContainer,
	stopContainer,
} from "../services/tauri-commands";
// src/lib/stores/containers.svelte.ts
import type {
	Container,
	ContainerInspect,
	ContainerLogLine,
	ContainerStats,
} from "../types/container";

// Use a class-based approach to encapsulate the state
class ContainersStore {
	private _containers = $state<Container[]>([]);
	private _selectedContainer = $state<Container | null>(null);
	private _containerDetails = $state<ContainerInspect | null>(null);
	private _containerStats = $state<ContainerStats | null>(null);

	// Loading states
	private _isLoadingContainers = $state<boolean>(false);
	private _isLoadingContainerDetails = $state<boolean>(false);
	private _isLoadingContainerStats = $state<boolean>(false);
	private _containerOperationInProgress = $state<string | null>(null);

	// Filter and sorting
	private _containerFilter = $state<string>("all");
	private _containerSortBy = $state<string>("name");
	private _containerSearchTerm = $state<string>("");

	// Error store
	private _containerError = $state<string | null>(null);

	// Auto-refresh interval
	private containerRefreshInterval: ReturnType<typeof setInterval> | null =
		null;

	// Getters
	get containers() {
		return this._containers;
	}

	get selectedContainer() {
		return this._selectedContainer;
	}

	get containerDetails() {
		return this._containerDetails;
	}

	get containerStats() {
		return this._containerStats;
	}

	get isLoadingContainers() {
		return this._isLoadingContainers;
	}

	get isLoadingContainerDetails() {
		return this._isLoadingContainerDetails;
	}

	get isLoadingContainerStats() {
		return this._isLoadingContainerStats;
	}

	get containerOperationInProgress() {
		return this._containerOperationInProgress;
	}

	get containerFilter() {
		return this._containerFilter;
	}

	get containerSortBy() {
		return this._containerSortBy;
	}

	get containerSearchTerm() {
		return this._containerSearchTerm;
	}

	get containerError() {
		return this._containerError;
	}

	// Derived getters for filtered and sorted containers
	get filteredContainers() {
		let filtered = this._containers;

		// Apply status filter
		if (this._containerFilter !== "all") {
			filtered = filtered.filter((container) => {
				switch (this._containerFilter) {
					case "running":
						return container.state === "running";
					case "stopped":
						return (
							container.state === "exited" || container.state === "created"
						);
					default:
						return true;
				}
			});
		}

		// Apply search filter
		if (this._containerSearchTerm) {
			const term = this._containerSearchTerm.toLowerCase();
			filtered = filtered.filter(
				(container) =>
					container.names.some((name) => name.toLowerCase().includes(term)) ||
					container.image.toLowerCase().includes(term) ||
					container.id.toLowerCase().includes(term),
			);
		}

		return filtered;
	}

	get sortedContainers() {
		const filtered = this.filteredContainers;
		const sorted = [...filtered];

		sorted.sort((a, b) => {
			switch (this._containerSortBy) {
				case "name":
					return (a.names[0] || "").localeCompare(b.names[0] || "");
				case "status":
					return a.state.localeCompare(b.state);
				case "created":
					return b.created - a.created; // Newest first
				case "image":
					return a.image.localeCompare(b.image);
				default:
					return 0;
			}
		});

		return sorted;
	}

	// Setter methods
	setSelectedContainer(container: Container | null) {
		this._selectedContainer = container;
	}

	setContainerFilter(filter: string) {
		this._containerFilter = filter;
	}

	setContainerSortBy(sortBy: string) {
		this._containerSortBy = sortBy;
	}

	setContainerSearchTerm(term: string) {
		this._containerSearchTerm = term;
	}

	setContainerError(error: string | null) {
		this._containerError = error;
	}

	// Container operations
	async loadContainers(showAll = true) {
		try {
			this._isLoadingContainers = true;
			this._containerError = null;

			const containerList = await getContainers(showAll);
			this._containers.length = 0;
			this._containers.push(...containerList);
			return containerList;
		} catch (error) {
			console.error("Failed to load containers:", error);
			const errorMessage = handleTauriError(error);
			this._containerError = errorMessage;
			return [];
		} finally {
			this._isLoadingContainers = false;
		}
	}

	async loadContainerDetails(id: string) {
		try {
			this._isLoadingContainerDetails = true;
			this._containerError = null;

			const details = await getContainerDetails(id);
			this._containerDetails = details;
			return details;
		} catch (error) {
			console.error("Failed to load container details:", error);
			const errorMessage = handleTauriError(error);
			this._containerError = errorMessage;
			return null;
		} finally {
			this._isLoadingContainerDetails = false;
		}
	}

	async loadContainerStats(id: string) {
		try {
			this._isLoadingContainerStats = true;
			this._containerError = null;

			const stats = await getContainerStats(id);
			this._containerStats = stats;
			return stats;
		} catch (error) {
			console.error("Failed to load container stats:", error);
			const errorMessage = handleTauriError(error);
			this._containerError = errorMessage;
			return null;
		} finally {
			this._isLoadingContainerStats = false;
		}
	}

	async performContainerAction(
		action: "start" | "stop" | "restart" | "remove" | "kill",
		id: string,
		options?: {
			timeout?: number;
			force?: boolean;
			removeVolumes?: boolean;
			signal?: string;
		},
	) {
		try {
			this._containerOperationInProgress = `${action}-${id}`;
			this._containerError = null;

			switch (action) {
				case "start":
					await startContainer(id);
					break;
				case "stop":
					await stopContainer(id, options?.timeout);
					break;
				case "restart":
					await restartContainer(id, options?.timeout);
					break;
				case "remove":
					await removeContainer(
						id,
						options?.force || false,
						options?.removeVolumes || false,
					);
					break;
				case "kill":
					await killContainer(id, options?.signal);
					break;
				default:
					throw new Error(`Unknown action: ${action}`);
			}

			// Refresh containers list after successful operation
			await this.loadContainers();
			return true;
		} catch (error) {
			console.error(`Failed to ${action} container:`, error);
			const errorMessage = handleTauriError(error);
			this._containerError = errorMessage;
			return false;
		} finally {
			this._containerOperationInProgress = null;
		}
	}

	// Convenience methods for specific actions
	async startContainer(id: string) {
		return this.performContainerAction("start", id);
	}

	async stopContainer(id: string, timeout?: number) {
		return this.performContainerAction("stop", id, { timeout });
	}

	async restartContainer(id: string, timeout?: number) {
		return this.performContainerAction("restart", id, { timeout });
	}

	async removeContainer(id: string, force?: boolean, removeVolumes?: boolean) {
		return this.performContainerAction("remove", id, { force, removeVolumes });
	}

	async killContainer(id: string, signal?: string) {
		return this.performContainerAction("kill", id, { signal });
	}

	// Auto-refresh functionality
	startAutoRefresh(intervalMs = 3000) {
		if (this.containerRefreshInterval) {
			clearInterval(this.containerRefreshInterval);
		}

		this.containerRefreshInterval = setInterval(async () => {
			await this.loadContainers();
		}, intervalMs);
	}

	stopAutoRefresh() {
		if (this.containerRefreshInterval) {
			clearInterval(this.containerRefreshInterval);
			this.containerRefreshInterval = null;
		}
	}

	// Cleanup function
	cleanup() {
		this.stopAutoRefresh();
	}
}

// Create and export a singleton instance
export const containersStore = new ContainersStore();
