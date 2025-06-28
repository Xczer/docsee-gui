import { invoke } from "@tauri-apps/api/core";
import { handleTauriError } from "../services/tauri-commands";
// src/lib/stores/networks.svelte.ts
import type {
	ConnectNetworkOptions,
	CreateNetworkOptions,
	DisconnectNetworkOptions,
	Network,
	NetworkInspect,
} from "../types/network";

// Network API functions
async function getNetworks(): Promise<Network[]> {
	return await invoke("get_networks");
}

async function getNetworkDetails(idOrName: string): Promise<NetworkInspect> {
	return await invoke("get_network_details", { idOrName });
}

async function createNetwork(options: CreateNetworkOptions): Promise<Network> {
	return await invoke("create_network_cmd", { options });
}

async function removeNetwork(idOrName: string): Promise<void> {
	return await invoke("remove_network_cmd", { idOrName });
}

async function connectNetwork(
	networkId: string,
	options: ConnectNetworkOptions,
): Promise<void> {
	return await invoke("connect_network_cmd", { networkId, options });
}

async function disconnectNetwork(
	networkId: string,
	options: DisconnectNetworkOptions,
): Promise<void> {
	return await invoke("disconnect_network_cmd", { networkId, options });
}

async function pruneNetworks(): Promise<{ networks_deleted: string[] }> {
	return await invoke("prune_networks_cmd");
}

// Use a class-based approach to encapsulate the state
class NetworksStore {
	private _networks = $state<Network[]>([]);
	private _selectedNetwork = $state<Network | null>(null);
	private _networkDetails = $state<NetworkInspect | null>(null);

	// Loading states
	private _isLoadingNetworks = $state<boolean>(false);
	private _isLoadingNetworkDetails = $state<boolean>(false);
	private _networkOperationInProgress = $state<string[]>([]);

	// Filter and sorting
	private _networkFilter = $state<string>("all");
	private _networkSortBy = $state<string>("name");
	private _networkSearchTerm = $state<string>("");

	// Error store
	private _networkError = $state<string | null>(null);

	// Auto-refresh interval
	private networkRefreshInterval: ReturnType<typeof setInterval> | null = null;

	// Getters
	get networks() {
		return this._networks;
	}

	get selectedNetwork() {
		return this._selectedNetwork;
	}

	get networkDetails() {
		return this._networkDetails;
	}

	get isLoadingNetworks() {
		return this._isLoadingNetworks;
	}

	get isLoadingNetworkDetails() {
		return this._isLoadingNetworkDetails;
	}

	get networkOperationInProgress() {
		return this._networkOperationInProgress;
	}

	get networkFilter() {
		return this._networkFilter;
	}

	get networkSortBy() {
		return this._networkSortBy;
	}

	get networkSearchTerm() {
		return this._networkSearchTerm;
	}

	get networkError() {
		return this._networkError;
	}

	// Derived getters for filtered and sorted networks
	get filteredNetworks() {
		let filtered = this._networks;

		// Apply filter
		if (this._networkFilter !== "all") {
			filtered = filtered.filter((network) => {
				switch (this._networkFilter) {
					case "used":
						return this.getNetworkContainerCount(network) > 0;
					case "unused":
						return this.getNetworkContainerCount(network) === 0;
					case "system":
						return this.isSystemNetwork(network);
					case "custom":
						return !this.isSystemNetwork(network);
					case "bridge":
						return network.driver === "bridge";
					case "overlay":
						return network.driver === "overlay";
					case "host":
						return network.driver === "host";
					case "macvlan":
						return network.driver === "macvlan";
					default:
						return true;
				}
			});
		}

		// Apply search filter
		if (this._networkSearchTerm) {
			const term = this._networkSearchTerm.toLowerCase();
			filtered = filtered.filter((network) => {
				return (
					network.name.toLowerCase().includes(term) ||
					network.id.toLowerCase().includes(term) ||
					network.driver.toLowerCase().includes(term) ||
					this.getNetworkSubnet(network).toLowerCase().includes(term)
				);
			});
		}

		return filtered;
	}

	get sortedNetworks() {
		const filtered = this.filteredNetworks;
		const sorted = [...filtered];

		sorted.sort((a, b) => {
			switch (this._networkSortBy) {
				case "name":
					return a.name.localeCompare(b.name);
				case "driver":
					return a.driver.localeCompare(b.driver);
				case "created":
					return new Date(b.created).getTime() - new Date(a.created).getTime(); // Newest first
				case "containers":
					return (
						this.getNetworkContainerCount(b) - this.getNetworkContainerCount(a)
					); // Most used first
				case "scope":
					return a.scope.localeCompare(b.scope);
				default:
					return 0;
			}
		});

		return sorted;
	}

	// Setter methods
	setSelectedNetwork(network: Network | null) {
		this._selectedNetwork = network;
	}

	setNetworkFilter(filter: string) {
		this._networkFilter = filter;
	}

	setNetworkSortBy(sortBy: string) {
		this._networkSortBy = sortBy;
	}

	setNetworkSearchTerm(term: string) {
		this._networkSearchTerm = term;
	}

	setNetworkError(error: string | null) {
		this._networkError = error;
	}

	// Network operations
	async loadNetworks() {
		try {
			this._isLoadingNetworks = true;
			this._networkError = null;

			const networkList = await getNetworks();
			this._networks.length = 0;
			this._networks.push(...networkList);
			return networkList;
		} catch (error) {
			console.error("Failed to load networks:", error);
			const errorMessage = handleTauriError(error);
			this._networkError = errorMessage;
			return [];
		} finally {
			this._isLoadingNetworks = false;
		}
	}

	async loadNetworkDetails(idOrName: string) {
		try {
			this._isLoadingNetworkDetails = true;
			this._networkError = null;

			const details = await getNetworkDetails(idOrName);
			this._networkDetails = details;
			return details;
		} catch (error) {
			console.error("Failed to load network details:", error);
			const errorMessage = handleTauriError(error);
			this._networkError = errorMessage;
			return null;
		} finally {
			this._isLoadingNetworkDetails = false;
		}
	}

	async performNetworkAction(
		action: "create" | "remove" | "connect" | "disconnect" | "prune",
		networkIdOrOptions: string | CreateNetworkOptions,
		additionalOptions?: ConnectNetworkOptions | DisconnectNetworkOptions,
	) {
		try {
			const operationId =
				action === "create"
					? `${action}-${typeof networkIdOrOptions === "string" ? networkIdOrOptions : "new"}`
					: `${action}-${networkIdOrOptions}`;

			// Add to operations in progress
			this._networkOperationInProgress.push(operationId);
			this._networkError = null;

			switch (action) {
				case "create":
					if (typeof networkIdOrOptions === "string") {
						throw new Error("Create action requires CreateNetworkOptions");
					}
					await createNetwork(networkIdOrOptions);
					break;
				case "remove":
					if (typeof networkIdOrOptions !== "string") {
						throw new Error("Remove action requires network ID or name");
					}
					await removeNetwork(networkIdOrOptions);
					break;
				case "connect":
					if (typeof networkIdOrOptions !== "string" || !additionalOptions) {
						throw new Error(
							"Connect action requires network ID and ConnectNetworkOptions",
						);
					}
					await connectNetwork(
						networkIdOrOptions,
						additionalOptions as ConnectNetworkOptions,
					);
					break;
				case "disconnect":
					if (typeof networkIdOrOptions !== "string" || !additionalOptions) {
						throw new Error(
							"Disconnect action requires network ID and DisconnectNetworkOptions",
						);
					}
					await disconnectNetwork(
						networkIdOrOptions,
						additionalOptions as DisconnectNetworkOptions,
					);
					break;
				case "prune":
					await pruneNetworks();
					break;
				default:
					throw new Error(`Unknown action: ${action}`);
			}

			// Refresh networks list after successful operation
			await this.loadNetworks();
			return true;
		} catch (error) {
			console.error(`Failed to ${action} network:`, error);
			const errorMessage = handleTauriError(error);
			this._networkError = errorMessage;
			return false;
		} finally {
			// Remove from operations in progress
			const operationId =
				action === "create"
					? `${action}-${typeof networkIdOrOptions === "string" ? networkIdOrOptions : "new"}`
					: `${action}-${networkIdOrOptions}`;
			const index = this._networkOperationInProgress.indexOf(operationId);
			if (index > -1) {
				this._networkOperationInProgress.splice(index, 1);
			}
		}
	}

	// Convenience methods for specific actions
	async createNetwork(options: CreateNetworkOptions) {
		return this.performNetworkAction("create", options);
	}

	async removeNetwork(idOrName: string) {
		return this.performNetworkAction("remove", idOrName);
	}

	async connectNetwork(networkId: string, options: ConnectNetworkOptions) {
		return this.performNetworkAction("connect", networkId, options);
	}

	async disconnectNetwork(
		networkId: string,
		options: DisconnectNetworkOptions,
	) {
		return this.performNetworkAction("disconnect", networkId, options);
	}

	async pruneNetworks() {
		return this.performNetworkAction("prune", "unused");
	}

	// Auto-refresh functionality
	startAutoRefresh(intervalMs = 10000) {
		if (this.networkRefreshInterval) {
			clearInterval(this.networkRefreshInterval);
		}

		this.networkRefreshInterval = setInterval(async () => {
			await this.loadNetworks();
		}, intervalMs);
	}

	stopAutoRefresh() {
		if (this.networkRefreshInterval) {
			clearInterval(this.networkRefreshInterval);
			this.networkRefreshInterval = null;
		}
	}

	// Cleanup function
	cleanup() {
		this.stopAutoRefresh();
	}

	// Helper methods
	getNetworkDisplayName(network: Network): string {
		return network.name;
	}

	getNetworkContainerCount(network: Network): number {
		return Object.keys(network.containers || {}).length;
	}

	getNetworkSubnet(network: Network): string {
		const config = network.ipam?.config?.[0];
		return config?.subnet || "No subnet";
	}

	getNetworkGateway(network: Network): string {
		const config = network.ipam?.config?.[0];
		return config?.gateway || "No gateway";
	}

	getNetworkIpRange(network: Network): string {
		const config = network.ipam?.config?.[0];
		return config?.ip_range || "No IP range";
	}

	formatNetworkCreated(created: string): string {
		const now = new Date();
		const createdDate = new Date(created);
		const diff = now.getTime() - createdDate.getTime();
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

	isSystemNetwork(network: Network): boolean {
		// System networks are typically bridge, host, and none
		const systemNetworks = ["bridge", "host", "none"];
		return systemNetworks.includes(network.name);
	}

	isNetworkInUse(network: Network): boolean {
		return this.getNetworkContainerCount(network) > 0;
	}

	isNetworkInternal(network: Network): boolean {
		return network.internal || false;
	}

	isNetworkAttachable(network: Network): boolean {
		return network.attachable || false;
	}

	hasNetworkLabels(network: Network): boolean {
		return Object.keys(network.labels || {}).length > 0;
	}

	getNetworkLabels(network: Network): Record<string, string> {
		return network.labels || {};
	}

	getNetworkContainers(network: Network): string[] {
		return Object.keys(network.containers || {});
	}

	getNetworkScope(network: Network): string {
		return network.scope;
	}

	getNetworkDriver(network: Network): string {
		return network.driver;
	}
}

// Create and export a singleton instance
export const networksStore = new NetworksStore();
