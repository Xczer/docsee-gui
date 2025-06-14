import { writable, derived } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';

export interface ContainerStatsData {
	id: string;
	name: string;
	read: string;
	preread: string;
	pids_stats: any;
	blkio_stats: any;
	num_procs: number;
	storage_stats: any;
	cpu_stats: any;
	precpu_stats: any;
	memory_stats: any;
	networks: Record<string, any>;
}

export interface ProcessedStats {
	cpuPercent: number;
	memoryUsage: number;
	memoryLimit: number;
	memoryPercent: number;
	networkRx: number;
	networkTx: number;
	blockRead: number;
	blockWrite: number;
	pids: number;
}

export interface StatsState {
	stats: ContainerStatsData | null;
	processedStats: ProcessedStats | null;
	isLoading: boolean;
	error: string | null;
	isMonitoring: boolean;
	containerId: string | null;
	history: ProcessedStats[];
}

// Store state
const initialState: StatsState = {
	stats: null,
	processedStats: null,
	isLoading: false,
	error: null,
	isMonitoring: false,
	containerId: null,
	history: []
};

export const statsState = writable<StatsState>(initialState);

// Derived stores
export const containerStats = derived(statsState, (state) => state.stats);
export const processedContainerStats = derived(statsState, (state) => state.processedStats);
export const isLoadingStats = derived(statsState, (state) => state.isLoading);
export const statsError = derived(statsState, (state) => state.error);
export const isMonitoringStats = derived(statsState, (state) => state.isMonitoring);
export const statsHistory = derived(statsState, (state) => state.history);

// Actions
export async function loadContainerStats(containerId: string): Promise<void> {
	statsState.update(state => ({
		...state,
		isLoading: true,
		error: null,
		containerId
	}));

	try {
		const stats: ContainerStatsData = await invoke('get_container_stats_cmd', {
			id: containerId
		});

		const processedStats = processStats(stats);

		statsState.update(state => ({
			...state,
			stats,
			processedStats,
			isLoading: false,
			history: [...state.history, processedStats].slice(-60) // Keep last 60 data points
		}));
	} catch (error) {
		console.error('Failed to load container stats:', error);
		statsState.update(state => ({
			...state,
			isLoading: false,
			error: error as string
		}));
	}
}

export function clearStats(): void {
	statsState.update(state => ({
		...state,
		stats: null,
		processedStats: null,
		history: [],
		error: null
	}));
}

// Real-time stats monitoring
let monitoringInterval: number | null = null;

export async function startStatsMonitoring(containerId: string, intervalMs: number = 2000): Promise<void> {
	if (monitoringInterval) {
		clearInterval(monitoringInterval);
	}

	// Initial load
	await loadContainerStats(containerId);

	// Start monitoring
	monitoringInterval = setInterval(async () => {
		try {
			let state: StatsState;
			const unsubscribe = statsState.subscribe(value => {
				state = value;
			});
			unsubscribe();

			if (state!.isMonitoring && state!.containerId === containerId && !state!.isLoading) {
				await loadContainerStats(containerId);
			}
		} catch (error) {
			console.error('Failed to fetch stats:', error);
			stopStatsMonitoring();
		}
	}, intervalMs);

	statsState.update(state => ({
		...state,
		isMonitoring: true
	}));
}

export function stopStatsMonitoring(): void {
	if (monitoringInterval) {
		clearInterval(monitoringInterval);
		monitoringInterval = null;
	}

	statsState.update(state => ({
		...state,
		isMonitoring: false
	}));
}

// Helper function to process raw stats into useful metrics
function processStats(stats: ContainerStatsData): ProcessedStats {
	// CPU Percentage calculation
	let cpuPercent = 0;
	if (stats.cpu_stats && stats.precpu_stats) {
		const cpuDelta = (stats.cpu_stats.cpu_usage?.total_usage || 0) - (stats.precpu_stats.cpu_usage?.total_usage || 0);
		const systemDelta = (stats.cpu_stats.system_cpu_usage || 0) - (stats.precpu_stats.system_cpu_usage || 0);
		const numberCpus = stats.cpu_stats.online_cpus || 1;

		if (systemDelta > 0) {
			cpuPercent = (cpuDelta / systemDelta) * numberCpus * 100;
		}
	}

	// Memory calculation
	const memoryUsage = stats.memory_stats?.usage || 0;
	const memoryLimit = stats.memory_stats?.limit || 0;
	const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;

	// Network calculation
	let networkRx = 0;
	let networkTx = 0;
	if (stats.networks) {
		Object.values(stats.networks).forEach((network: any) => {
			networkRx += network.rx_bytes || 0;
			networkTx += network.tx_bytes || 0;
		});
	}

	// Block I/O calculation
	let blockRead = 0;
	let blockWrite = 0;
	if (stats.blkio_stats?.io_service_bytes_recursive) {
		stats.blkio_stats.io_service_bytes_recursive.forEach((item: any) => {
			if (item.op === 'Read') blockRead += item.value || 0;
			if (item.op === 'Write') blockWrite += item.value || 0;
		});
	}

	return {
		cpuPercent: Math.max(0, Math.min(100, cpuPercent)),
		memoryUsage,
		memoryLimit,
		memoryPercent: Math.max(0, Math.min(100, memoryPercent)),
		networkRx,
		networkTx,
		blockRead,
		blockWrite,
		pids: stats.pids_stats?.current || 0
	};
}

// Utility functions for formatting
export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatPercent(percent: number): string {
	return `${percent.toFixed(1)}%`;
}
