import { writable, derived } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';

export interface ContainerLogLine {
	timestamp: string | null;
	stream: string; // "stdout" or "stderr"
	content: string;
}

export interface LogsState {
	logs: ContainerLogLine[];
	isLoading: boolean;
	error: string | null;
	isFollowing: boolean;
	containerId: string | null;
	autoScroll: boolean;
}

// Store state
const initialState: LogsState = {
	logs: [],
	isLoading: false,
	error: null,
	isFollowing: false,
	containerId: null,
	autoScroll: true
};

export const logsState = writable<LogsState>(initialState);

// Derived stores
export const logs = derived(logsState, (state) => state.logs);
export const isLoadingLogs = derived(logsState, (state) => state.isLoading);
export const logsError = derived(logsState, (state) => state.error);
export const isFollowingLogs = derived(logsState, (state) => state.isFollowing);
export const autoScrollLogs = derived(logsState, (state) => state.autoScroll);

// Log filtering options
export const logSearchTerm = writable<string>('');
export const logStreamFilter = writable<'all' | 'stdout' | 'stderr'>('all');
export const logTailLines = writable<string>('100');

// Filtered logs
export const filteredLogs = derived(
	[logs, logSearchTerm, logStreamFilter],
	([logs, searchTerm, streamFilter]) => {
		let filtered = logs;

		// Filter by stream
		if (streamFilter !== 'all') {
			filtered = filtered.filter(log => log.stream === streamFilter);
		}

		// Filter by search term
		if (searchTerm.trim()) {
			const search = searchTerm.toLowerCase();
			filtered = filtered.filter(log => 
				log.content.toLowerCase().includes(search)
			);
		}

		return filtered;
	}
);

// Actions
export async function loadContainerLogs(
	containerId: string,
	options: {
		follow?: boolean;
		tail?: string;
		since?: string;
		until?: string;
	} = {}
): Promise<void> {
	logsState.update(state => ({
		...state,
		isLoading: true,
		error: null,
		containerId
	}));

	try {
		const logs: ContainerLogLine[] = await invoke('get_container_logs_cmd', {
			id: containerId,
			follow: options.follow || false,
			tail: options.tail || '100',
			since: options.since,
			until: options.until
		});

		logsState.update(state => ({
			...state,
			logs,
			isLoading: false,
			isFollowing: options.follow || false
		}));
	} catch (error) {
		console.error('Failed to load container logs:', error);
		logsState.update(state => ({
			...state,
			isLoading: false,
			error: error as string
		}));
	}
}

export function clearLogs(): void {
	logsState.update(state => ({
		...state,
		logs: [],
		error: null
	}));
}

export function toggleAutoScroll(): void {
	logsState.update(state => ({
		...state,
		autoScroll: !state.autoScroll
	}));
}

export function stopFollowing(): void {
	logsState.update(state => ({
		...state,
		isFollowing: false
	}));
}

// Note: Real-time log streaming will be implemented when Tauri supports streaming commands
// For now, we'll implement a polling mechanism for "follow" mode
let followInterval: number | null = null;

export async function startFollowingLogs(containerId: string, intervalMs: number = 2000): Promise<void> {
	if (followInterval) {
		clearInterval(followInterval);
	}

	// Initial load
	await loadContainerLogs(containerId, { follow: false, tail: '100' });

	// Start polling for new logs
	followInterval = setInterval(async () => {
		try {
			let state: LogsState;
			const unsubscribe = logsState.subscribe(value => {
				state = value;
			});
			unsubscribe();

			if (state!.isFollowing && state!.containerId === containerId && !state!.isLoading) {
				// Get new logs since last fetch
				const newLogs: ContainerLogLine[] = await invoke('get_container_logs_cmd', {
					id: containerId,
					follow: false,
					tail: '50' // Get last 50 lines and merge with existing
				});

				// Simple deduplication by checking if content is different
				if (newLogs.length > 0) {
					logsState.update(currentState => {
						const combinedLogs = [...currentState.logs, ...newLogs];
						// Keep only unique logs and last 1000 lines
						const uniqueLogs = combinedLogs.filter((log, index, arr) => 
							index === arr.findIndex(l => l.content === log.content && l.timestamp === log.timestamp)
						).slice(-1000);
						return {
							...currentState,
							logs: uniqueLogs
						};
					});
				}
			}
		} catch (error) {
			console.error('Failed to fetch new logs:', error);
			stopFollowingLogs();
		}
	}, intervalMs);

	logsState.update(state => ({
		...state,
		isFollowing: true
	}));
}

export function stopFollowingLogs(): void {
	if (followInterval) {
		clearInterval(followInterval);
		followInterval = null;
	}

	logsState.update(state => ({
		...state,
		isFollowing: false
	}));
}
