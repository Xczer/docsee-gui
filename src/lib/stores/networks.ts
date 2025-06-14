import { writable, derived } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';

export interface DockerNetwork {
	id: string;
	name: string;
	driver: string;
	scope: string;
	created?: string;
	ipam?: NetworkIPAM;
	containers?: Record<string, NetworkContainer>;
	options?: Record<string, string>;
	labels?: Record<string, string>;
}

export interface NetworkIPAM {
	driver?: string;
	config?: NetworkIPAMConfig[];
}

export interface NetworkIPAMConfig {
	subnet?: string;
	gateway?: string;
	ip_range?: string;
}

export interface NetworkContainer {
	name?: string;
	endpoint_id?: string;
	mac_address?: string;
	ipv4_address?: string;
	ipv6_address?: string;
}

export interface NetworksState {
	networks: DockerNetwork[];
	isLoading: boolean;
	error: string | null;
	selectedNetwork: DockerNetwork | null;
}

// Store state
const initialState: NetworksState = {
	networks: [],
	isLoading: false,
	error: null,
	selectedNetwork: null
};

export const networksState = writable<NetworksState>(initialState);

// Derived stores
export const networks = derived(networksState, (state) => state.networks);
export const isLoadingNetworks = derived(networksState, (state) => state.isLoading);
export const networksError = derived(networksState, (state) => state.error);
export const selectedNetwork = derived(networksState, (state) => state.selectedNetwork);

// Search and filter
export const networkSearchTerm = writable<string>('');
export const networkDriverFilter = writable<'all' | string>('all');

// Filtered networks
export const filteredNetworks = derived(
	[networks, networkSearchTerm, networkDriverFilter],
	([networks, searchTerm, driverFilter]) => {
		let filtered = networks;

		// Filter by driver
		if (driverFilter !== 'all') {
			filtered = filtered.filter(network => network.driver === driverFilter);
		}

		// Filter by search term
		if (searchTerm.trim()) {
			const search = searchTerm.toLowerCase();
			filtered = filtered.filter(network => 
				network.name.toLowerCase().includes(search) ||
				network.id.toLowerCase().includes(search) ||
				network.driver.toLowerCase().includes(search)
			);
		}

		return filtered;
	}
);

// Actions
export async function loadNetworks(): Promise<void> {
	networksState.update(state => ({
		...state,
		isLoading: true,
		error: null
	}));

	try {
		const networks: DockerNetwork[] = await invoke('get_networks');
		
		networksState.update(state => ({
			...state,
			networks,
			isLoading: false
		}));
	} catch (error) {
		console.error('Failed to load networks:', error);
		networksState.update(state => ({
			...state,
			isLoading: false,
			error: error as string
		}));
	}
}

export async function loadNetworkDetails(id: string): Promise<void> {
	networksState.update(state => ({
		...state,
		isLoading: true,
		error: null
	}));

	try {
		const network: DockerNetwork = await invoke('get_network_details', { id });
		
		networksState.update(state => ({
			...state,
			selectedNetwork: network,
			isLoading: false
		}));
	} catch (error) {
		console.error('Failed to load network details:', error);
		networksState.update(state => ({
			...state,
			isLoading: false,
			error: error as string
		}));
	}
}

export async function removeNetwork(id: string): Promise<void> {
	try {
		await invoke('remove_network_cmd', { id });
		
		// Remove from local state
		networksState.update(state => ({
			...state,
			networks: state.networks.filter(network => network.id !== id),
			selectedNetwork: state.selectedNetwork?.id === id ? null : state.selectedNetwork
		}));
	} catch (error) {
		console.error('Failed to remove network:', error);
		throw error;
	}
}

export async function pruneNetworks(): Promise<void> {
	try {
		await invoke('prune_networks_cmd');
		
		// Reload networks after pruning
		await loadNetworks();
	} catch (error) {
		console.error('Failed to prune networks:', error);
		throw error;
	}
}

export function clearNetworkSelection(): void {
	networksState.update(state => ({
		...state,
		selectedNetwork: null
	}));
}

export function clearNetworksError(): void {
	networksState.update(state => ({
		...state,
		error: null
	}));
}

// Utility functions
export function formatNetworkCreated(created?: string): string {
	if (!created) return 'Unknown';
	try {
		return new Date(created).toLocaleString();
	} catch {
		return created;
	}
}

export function getConnectedContainerCount(network: DockerNetwork): number {
	return network.containers ? Object.keys(network.containers).length : 0;
}

export function getNetworkSubnets(network: DockerNetwork): string[] {
	if (!network.ipam?.config) return [];
	return network.ipam.config
		.map(config => config.subnet)
		.filter(subnet => subnet != null) as string[];
}
