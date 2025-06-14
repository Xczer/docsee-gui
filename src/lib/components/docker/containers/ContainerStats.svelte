<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { 
		loadContainerStats, 
		clearStats, 
		startStatsMonitoring, 
		stopStatsMonitoring,
		processedContainerStats,
		isLoadingStats,
		statsError,
		isMonitoringStats,
		statsHistory,
		formatBytes,
		formatPercent
	} from '$lib/stores/stats.js';
	import { Activity, Cpu, HardDrive, Network, Users, Play, Square, RotateCcw } from 'lucide-svelte';

	export let containerId: string;
	export let containerName: string = '';

	onMount(async () => {
		if (containerId) {
			await loadContainerStats(containerId);
		}
	});

	onDestroy(() => {
		stopStatsMonitoring();
		clearStats();
	});

	async function handleRefreshStats() {
		if (containerId) {
			await loadContainerStats(containerId);
		}
	}

	async function handleToggleMonitoring() {
		if ($isMonitoringStats) {
			stopStatsMonitoring();
		} else {
			await startStatsMonitoring(containerId);
		}
	}

	function getProgressBarColor(percent: number): string {
		if (percent < 50) return 'bg-green-500';
		if (percent < 80) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	function getTextColor(percent: number): string {
		if (percent < 50) return 'text-green-600';
		if (percent < 80) return 'text-yellow-600';
		return 'text-red-600';
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
	<!-- Header Controls -->
	<div class="lg:col-span-2 flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
		<div class="flex items-center gap-2">
			<Activity class="w-5 h-5 text-gray-600" />
			<h3 class="text-lg font-semibold text-gray-900">
				Container Statistics
			</h3>
			{#if containerName}
				<span class="text-sm text-gray-500">- {containerName}</span>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<button
				on:click={handleRefreshStats}
				disabled={$isLoadingStats}
				class="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
				title="Refresh stats"
			>
				<RotateCcw class="w-4 h-4 {$isLoadingStats ? 'animate-spin' : ''}" />
			</button>

			<button
				on:click={handleToggleMonitoring}
				disabled={$isLoadingStats}
				class="p-1.5 rounded transition-colors disabled:opacity-50 {$isMonitoringStats 
					? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
					: 'text-green-600 hover:text-green-700 hover:bg-green-50'}"
				title={$isMonitoringStats ? 'Stop monitoring' : 'Start monitoring'}
			>
				{#if $isMonitoringStats}
					<Square class="w-4 h-4" />
				{:else}
					<Play class="w-4 h-4" />
				{/if}
			</button>
		</div>
	</div>

	{#if $statsError}
		<div class="lg:col-span-2 p-4 text-center">
			<div class="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
				<p class="font-medium">Failed to load container statistics</p>
				<p class="text-sm mt-1">{$statsError}</p>
			</div>
		</div>
	{:else if $isLoadingStats && !$processedContainerStats}
		<div class="lg:col-span-2 p-4 text-center">
			<div class="inline-flex items-center text-gray-600">
				<svg class="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Loading statistics...
			</div>
		</div>
	{:else if $processedContainerStats}
		<!-- CPU Usage -->
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-2">
					<Cpu class="w-5 h-5 text-blue-600" />
					<h4 class="text-lg font-semibold text-gray-900">CPU Usage</h4>
				</div>
				<span class="text-2xl font-bold {getTextColor($processedContainerStats.cpuPercent)}">
					{formatPercent($processedContainerStats.cpuPercent)}
				</span>
			</div>
			<div class="w-full bg-gray-200 rounded-full h-3">
				<div 
					class="h-3 rounded-full transition-all duration-300 {getProgressBarColor($processedContainerStats.cpuPercent)}"
					style="width: {Math.min(100, $processedContainerStats.cpuPercent)}%"
				></div>
			</div>
		</div>

		<!-- Memory Usage -->
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-2">
					<HardDrive class="w-5 h-5 text-purple-600" />
					<h4 class="text-lg font-semibold text-gray-900">Memory Usage</h4>
				</div>
				<span class="text-2xl font-bold {getTextColor($processedContainerStats.memoryPercent)}">
					{formatPercent($processedContainerStats.memoryPercent)}
				</span>
			</div>
			<div class="w-full bg-gray-200 rounded-full h-3 mb-2">
				<div 
					class="h-3 rounded-full transition-all duration-300 {getProgressBarColor($processedContainerStats.memoryPercent)}"
					style="width: {Math.min(100, $processedContainerStats.memoryPercent)}%"
				></div>
			</div>
			<div class="text-sm text-gray-600">
				{formatBytes($processedContainerStats.memoryUsage)} / {formatBytes($processedContainerStats.memoryLimit)}
			</div>
		</div>

		<!-- Network I/O -->
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<div class="flex items-center gap-2 mb-4">
				<Network class="w-5 h-5 text-green-600" />
				<h4 class="text-lg font-semibold text-gray-900">Network I/O</h4>
			</div>
			<div class="space-y-3">
				<div class="flex justify-between items-center">
					<span class="text-sm text-gray-600">RX (Received)</span>
					<span class="font-semibold text-green-600">{formatBytes($processedContainerStats.networkRx)}</span>
				</div>
				<div class="flex justify-between items-center">
					<span class="text-sm text-gray-600">TX (Transmitted)</span>
					<span class="font-semibold text-blue-600">{formatBytes($processedContainerStats.networkTx)}</span>
				</div>
			</div>
		</div>

		<!-- Block I/O -->
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<div class="flex items-center gap-2 mb-4">
				<HardDrive class="w-5 h-5 text-orange-600" />
				<h4 class="text-lg font-semibold text-gray-900">Block I/O</h4>
			</div>
			<div class="space-y-3">
				<div class="flex justify-between items-center">
					<span class="text-sm text-gray-600">Read</span>
					<span class="font-semibold text-blue-600">{formatBytes($processedContainerStats.blockRead)}</span>
				</div>
				<div class="flex justify-between items-center">
					<span class="text-sm text-gray-600">Write</span>
					<span class="font-semibold text-red-600">{formatBytes($processedContainerStats.blockWrite)}</span>
				</div>
			</div>
		</div>

		<!-- Process Count -->
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<div class="flex items-center gap-2 mb-4">
				<Users class="w-5 h-5 text-indigo-600" />
				<h4 class="text-lg font-semibold text-gray-900">Processes</h4>
			</div>
			<div class="text-center">
				<span class="text-3xl font-bold text-indigo-600">{$processedContainerStats.pids}</span>
				<p class="text-sm text-gray-600 mt-1">Active PIDs</p>
			</div>
		</div>

		<!-- Monitoring Status -->
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
			<div class="flex items-center gap-2 mb-4">
				<Activity class="w-5 h-5 text-gray-600" />
				<h4 class="text-lg font-semibold text-gray-900">Monitoring</h4>
			</div>
			<div class="text-center">
				{#if $isMonitoringStats}
					<div class="flex items-center justify-center gap-2 text-green-600">
						<div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
						<span class="font-semibold">Live Monitoring</span>
					</div>
					<p class="text-sm text-gray-600 mt-1">Updates every 2 seconds</p>
				{:else}
					<div class="text-gray-500">
						<span class="font-semibold">Monitoring Stopped</span>
					</div>
					<p class="text-sm text-gray-600 mt-1">Click play to start monitoring</p>
				{/if}
			</div>
		</div>

		<!-- Simple Historical Chart (if we have history) -->
		{#if $statsHistory.length > 1}
			<div class="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
				<h4 class="text-lg font-semibold text-gray-900 mb-4">Resource Usage History</h4>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- CPU History Mini Chart -->
					<div>
						<h5 class="text-sm font-medium text-gray-700 mb-2">CPU Usage Over Time</h5>
						<div class="h-20 flex items-end space-x-1">
							{#each $statsHistory.slice(-20) as stat, i}
								<div 
									class="flex-1 min-w-0 {getProgressBarColor(stat.cpuPercent)} opacity-80 rounded-t"
									style="height: {Math.max(2, stat.cpuPercent)}%"
									title="{formatPercent(stat.cpuPercent)}"
								></div>
							{/each}
						</div>
						<div class="text-xs text-gray-500 mt-1">Last 20 readings</div>
					</div>

					<!-- Memory History Mini Chart -->
					<div>
						<h5 class="text-sm font-medium text-gray-700 mb-2">Memory Usage Over Time</h5>
						<div class="h-20 flex items-end space-x-1">
							{#each $statsHistory.slice(-20) as stat, i}
								<div 
									class="flex-1 min-w-0 {getProgressBarColor(stat.memoryPercent)} opacity-80 rounded-t"
									style="height: {Math.max(2, stat.memoryPercent)}%"
									title="{formatPercent(stat.memoryPercent)}"
								></div>
							{/each}
						</div>
						<div class="text-xs text-gray-500 mt-1">Last 20 readings</div>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="lg:col-span-2 p-8 text-center text-gray-500">
			<Activity class="w-8 h-8 mx-auto mb-2 text-gray-300" />
			<p>No statistics available</p>
			<p class="text-sm mt-1">Try refreshing to load container stats</p>
		</div>
	{/if}
</div>
