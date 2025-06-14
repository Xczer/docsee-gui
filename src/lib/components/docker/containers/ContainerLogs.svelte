<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { 
		loadContainerLogs, 
		clearLogs, 
		startFollowingLogs, 
		stopFollowingLogs,
		toggleAutoScroll,
		filteredLogs,
		isLoadingLogs,
		logsError,
		isFollowingLogs,
		autoScrollLogs,
		logSearchTerm,
		logStreamFilter,
		logTailLines
	} from '$lib/stores/logs.js';
	import { Logs, Download, Square, Play, RotateCcw, Search, Filter } from 'lucide-svelte';

	export let containerId: string;
	export let containerName: string = '';

	let logsContainer: HTMLElement;
	let shouldAutoScroll = true;

	onMount(async () => {
		if (containerId) {
			await loadContainerLogs(containerId, { tail: $logTailLines });
		}
	});

	onDestroy(() => {
		stopFollowingLogs();
		clearLogs();
	});

	// Auto-scroll to bottom when new logs arrive
	$: if ($filteredLogs && shouldAutoScroll && $autoScrollLogs && logsContainer) {
		tick().then(() => {
			logsContainer.scrollTop = logsContainer.scrollHeight;
		});
	}

	async function handleRefreshLogs() {
		if (containerId) {
			await loadContainerLogs(containerId, { tail: $logTailLines });
		}
	}

	async function handleToggleFollow() {
		if ($isFollowingLogs) {
			stopFollowingLogs();
		} else {
			await startFollowingLogs(containerId);
		}
	}

	function handleClearLogs() {
		clearLogs();
	}

	function handleDownloadLogs() {
		const logsText = $filteredLogs
			.map(log => `[${log.timestamp || 'N/A'}] [${log.stream}] ${log.content}`)
			.join('\n');
		
		const blob = new Blob([logsText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${containerName || containerId}-logs.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function formatTimestamp(timestamp: string | null): string {
		if (!timestamp) return 'N/A';
		try {
			return new Date(timestamp).toLocaleTimeString();
		} catch {
			return timestamp;
		}
	}

	function getStreamColor(stream: string): string {
		switch (stream) {
			case 'stdout':
				return 'text-blue-600';
			case 'stderr':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	}

	// Handle scroll to detect manual scrolling
	function handleScroll() {
		if (logsContainer) {
			const { scrollTop, scrollHeight, clientHeight } = logsContainer;
			shouldAutoScroll = scrollTop + clientHeight >= scrollHeight - 10;
		}
	}
</script>

<div class="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
	<!-- Header -->
	<div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
		<div class="flex items-center gap-2">
			<Logs class="w-5 h-5 text-gray-600" />
			<h3 class="text-lg font-semibold text-gray-900">
				Container Logs
			</h3>
			{#if containerName}
				<span class="text-sm text-gray-500">- {containerName}</span>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<!-- Tail Lines Input -->
			<div class="flex items-center gap-1">
				<label for="tail-lines" class="text-xs text-gray-600">Lines:</label>
				<select 
					id="tail-lines"
					bind:value={$logTailLines}
					class="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="50">50</option>
					<option value="100">100</option>
					<option value="500">500</option>
					<option value="1000">1000</option>
					<option value="all">All</option>
				</select>
			</div>

			<!-- Stream Filter -->
			<div class="flex items-center gap-1">
				<Filter class="w-3 h-3 text-gray-600" />
				<select 
					bind:value={$logStreamFilter}
					class="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="all">All</option>
					<option value="stdout">STDOUT</option>
					<option value="stderr">STDERR</option>
				</select>
			</div>

			<!-- Controls -->
			<button
				on:click={handleRefreshLogs}
				disabled={$isLoadingLogs}
				class="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
				title="Refresh logs"
			>
				<RotateCcw class="w-4 h-4 {$isLoadingLogs ? 'animate-spin' : ''}" />
			</button>

			<button
				on:click={handleToggleFollow}
				disabled={$isLoadingLogs}
				class="p-1.5 rounded transition-colors disabled:opacity-50 {$isFollowingLogs 
					? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
					: 'text-green-600 hover:text-green-700 hover:bg-green-50'}"
				title={$isFollowingLogs ? 'Stop following' : 'Follow logs'}
			>
				{#if $isFollowingLogs}
					<Square class="w-4 h-4" />
				{:else}
					<Play class="w-4 h-4" />
				{/if}
			</button>

			<button
				on:click={handleClearLogs}
				class="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
				title="Clear logs"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
			</button>

			<button
				on:click={handleDownloadLogs}
				disabled={$filteredLogs.length === 0}
				class="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
				title="Download logs"
			>
				<Download class="w-4 h-4" />
			</button>
		</div>
	</div>

	<!-- Search Bar -->
	<div class="p-3 border-b border-gray-200 bg-gray-50">
		<div class="relative">
			<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
			<input
				type="text"
				placeholder="Search logs..."
				bind:value={$logSearchTerm}
				class="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			/>
		</div>
	</div>

	<!-- Logs Content -->
	<div class="flex-1 relative">
		{#if $logsError}
			<div class="p-4 text-center">
				<div class="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
					<p class="font-medium">Failed to load logs</p>
					<p class="text-sm mt-1">{$logsError}</p>
				</div>
			</div>
		{:else if $isLoadingLogs}
			<div class="p-4 text-center">
				<div class="inline-flex items-center text-gray-600">
					<svg class="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Loading logs...
				</div>
			</div>
		{:else if $filteredLogs.length === 0}
			<div class="p-8 text-center text-gray-500">
				<Logs class="w-8 h-8 mx-auto mb-2 text-gray-300" />
				<p>No logs found</p>
				{#if $logSearchTerm}
					<p class="text-sm mt-1">Try adjusting your search term</p>
				{/if}
			</div>
		{:else}
			<div 
			bind:this={logsContainer}
			on:scroll={handleScroll}
			class="h-full overflow-auto p-4 font-mono text-sm space-y-1 bg-gray-900 dark:bg-gray-950 text-gray-100"
			>
			{#each $filteredLogs as log, index}
			<div class="flex gap-3 hover:bg-gray-800 dark:hover:bg-gray-900 px-2 py-1 rounded group">
			<span class="text-gray-400 text-xs shrink-0 w-20">
			{formatTimestamp(log.timestamp)}
			</span>
			<span class="shrink-0 text-xs font-medium w-16 {getStreamColor(log.stream)}">
			[{log.stream.toUpperCase()}]
			</span>
			<span class="break-all whitespace-pre-wrap leading-relaxed">
			{log.content}
			</span>
			</div>
			{/each}
			</div>
		{/if}

		<!-- Auto-scroll indicator -->
		{#if $isFollowingLogs}
			<div class="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
				<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
				Following
			</div>
		{/if}

		<!-- Scroll to bottom button -->
		{#if !shouldAutoScroll && $filteredLogs.length > 0}
			<button
				on:click={() => {
					shouldAutoScroll = true;
					logsContainer.scrollTop = logsContainer.scrollHeight;
				}}
				class="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors text-sm font-medium"
			>
				Scroll to bottom
			</button>
		{/if}
	</div>

	<!-- Footer -->
	<div class="px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
		<div class="flex items-center justify-between text-xs text-gray-600">
			<span>
				{$filteredLogs.length} log{$filteredLogs.length !== 1 ? 's' : ''}
				{#if $logSearchTerm}
					(filtered)
				{/if}
			</span>
			<div class="flex items-center gap-4">
				{#if $isFollowingLogs}
					<span class="text-green-600">● Live</span>
				{/if}
				<label class="flex items-center gap-1">
					<input
						type="checkbox"
						checked={$autoScrollLogs}
						on:change={toggleAutoScroll}
						class="w-3 h-3"
					/>
					Auto-scroll
				</label>
			</div>
		</div>
	</div>
</div>

<style>
	/* Custom scrollbar for logs container */
	.overflow-auto::-webkit-scrollbar {
		width: 8px;
	}

	.overflow-auto::-webkit-scrollbar-track {
		background: #374151;
	}

	.overflow-auto::-webkit-scrollbar-thumb {
		background: #6b7280;
		border-radius: 4px;
	}

	.overflow-auto::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}
</style>
