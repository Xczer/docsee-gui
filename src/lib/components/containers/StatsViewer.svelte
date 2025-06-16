<!-- src/lib/components/containers/StatsViewer.svelte -->
<script lang="ts">
import { onMount, onDestroy } from "svelte";
import {
	Activity,
	Cpu,
	HardDrive,
	MemoryStick,
	Network,
	RefreshCw,
	Play,
	Pause,
	Download,
	Settings,
	AlertCircle,
	TrendingUp,
	TrendingDown,
	Monitor,
	Database,
	Wifi,
	Gauge,
} from "lucide-svelte";

// Import shadcn-svelte components
import { Button } from "$lib/components/ui/button";
import { Badge } from "$lib/components/ui/badge";
import * as Card from "$lib/components/ui/card";
import * as Sheet from "$lib/components/ui/sheet";
import { Progress } from "$lib/components/ui/progress";
import { Separator } from "$lib/components/ui/separator";
import { ScrollArea } from "$lib/components/ui/scroll-area";
import * as Alert from "$lib/components/ui/alert";
import { Skeleton } from "$lib/components/ui/skeleton";

// Import services and types
import { getContainerStats } from "$lib/services/tauri-commands";
import type { ContainerStats } from "$lib/types/container";
import { toast } from "svelte-sonner";

// Props
interface Props {
	containerId: string;
	containerName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const { containerId, containerName, open, onOpenChange }: Props = $props();

// State
let stats: ContainerStats | null = $state(null);
let isLoading = $state(false);
let error = $state<string | null>(null);
let autoRefresh = $state(false);
let autoRefreshInterval: NodeJS.Timeout | null = null;

// Historical data for trends (last 10 readings)
let cpuHistory: number[] = $state([]);
let memoryHistory: number[] = $state([]);
let networkRxHistory: number[] = $state([]);
let networkTxHistory: number[] = $state([]);

// Computed values
const cpuUsagePercent = $derived(() => {
	if (!stats?.cpu_stats || !stats?.precpu_stats) return 0;

	const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
	const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
	const onlineCpus = stats.cpu_stats.online_cpus || 1;

	if (systemDelta > 0 && cpuDelta > 0) {
		return Math.round((cpuDelta / systemDelta) * onlineCpus * 100);
	}
	return 0;
});

const memoryUsagePercent = $derived(() => {
	if (!stats?.memory_stats) return 0;
	const usage = stats.memory_stats.usage || 0;
	const limit = stats.memory_stats.limit || 1;
	return Math.round((usage / limit) * 100);
});

const memoryUsageMB = $derived(() => {
	if (!stats?.memory_stats) return { used: 0, limit: 0 };
	return {
		used: Math.round((stats.memory_stats.usage || 0) / 1024 / 1024),
		limit: Math.round((stats.memory_stats.limit || 0) / 1024 / 1024),
	};
});

const networkStats = $derived(() => {
	if (!stats?.networks) return { rx: 0, tx: 0, rxPackets: 0, txPackets: 0 };

	let rx = 0;
	let tx = 0;
	let rxPackets = 0;
	let txPackets = 0;

	for (const [_, network] of Object.entries(stats.networks)) {
		rx += network.rx_bytes || 0;
		tx += network.tx_bytes || 0;
		rxPackets += network.rx_packets || 0;
		txPackets += network.tx_packets || 0;
	}

	return { rx, tx, rxPackets, txPackets };
});

const blockIOStats = $derived(() => {
	if (!stats?.blkio_stats?.io_service_bytes_recursive) return { read: 0, write: 0 };

	let read = 0;
	let write = 0;

	for (const io of stats.blkio_stats.io_service_bytes_recursive) {
		if (io.op === "Read") read += io.value;
		if (io.op === "Write") write += io.value;
	}

	return { read, write };
});

// Format bytes
function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}

// Load stats function
async function loadStats(isRefresh = false) {
	if (isLoading && !isRefresh) return;

	try {
		isLoading = true;
		error = null;

		const statsData = await getContainerStats(containerId);
		stats = statsData;

		// Update historical data
		if (stats) {
			// Update CPU history
			const cpu = cpuUsagePercent();
			cpuHistory = [...cpuHistory.slice(-9), cpu];

			// Update memory history
			const memory = memoryUsagePercent();
			memoryHistory = [...memoryHistory.slice(-9), memory];

			// Update network history
			const network = networkStats();
			networkRxHistory = [...networkRxHistory.slice(-9), network.rx];
			networkTxHistory = [...networkTxHistory.slice(-9), network.tx];
		}

		// Don't show toast for auto-refresh to avoid spam
		if (isRefresh && !autoRefresh) {
			toast.success("Stats refreshed successfully");
		}
	} catch (err: any) {
		console.error("Failed to load stats:", err);
		error = err.message || "Failed to load container stats";
		if (isRefresh && !autoRefresh) {
			toast.error("Failed to refresh stats");
		}
	} finally {
		isLoading = false;
	}
}

// Auto refresh functionality
function startAutoRefresh() {
	stopAutoRefresh();
	if (autoRefresh) {
		autoRefreshInterval = setInterval(() => {
			loadStats(true);
		}, 2000); // Refresh every 2 seconds for real-time stats
	}
}

function stopAutoRefresh() {
	if (autoRefreshInterval) {
		clearInterval(autoRefreshInterval);
		autoRefreshInterval = null;
	}
}

function toggleAutoRefresh() {
	autoRefresh = !autoRefresh;
	if (autoRefresh) {
		startAutoRefresh();
	} else {
		stopAutoRefresh();
	}
}

// Export stats
function exportStats() {
	if (!stats) return;

	try {
		const exportData = {
			container_id: stats.id,
			container_name: stats.name,
			timestamp: new Date().toISOString(),
			cpu_usage_percent: cpuUsagePercent(),
			memory_usage_percent: memoryUsagePercent(),
			memory_usage_mb: memoryUsageMB(),
			network_stats: networkStats(),
			block_io_stats: blockIOStats(),
			processes: stats.pids_stats.current,
			raw_stats: stats,
		};

		const jsonString = JSON.stringify(exportData, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });
		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = `${containerName}_stats_${new Date().toISOString().split("T")[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast.success("Stats exported successfully");
	} catch (err) {
		console.error("Failed to export stats:", err);
		toast.error("Failed to export stats");
	}
}

// Get trend indicator
function getTrendIcon(history: number[]) {
	if (history.length < 2) return TrendingUp;
	const current = history[history.length - 1];
	const previous = history[history.length - 2];
	return current > previous ? TrendingUp : TrendingDown;
}

function getTrendColor(history: number[]) {
	if (history.length < 2) return "text-muted-foreground";
	const current = history[history.length - 1];
	const previous = history[history.length - 2];
	return current > previous ? "text-red-500" : "text-green-500";
}

// Initialize when sheet opens
$effect(() => {
	if (open && containerId) {
		loadStats();
	}
});

// Cleanup auto refresh
$effect(() => {
	if (autoRefresh && open) {
		startAutoRefresh();
	} else {
		stopAutoRefresh();
	}
});

// Cleanup on destroy
onDestroy(() => {
	stopAutoRefresh();
});
</script>

<Sheet.Root {open} {onOpenChange}>
	<Sheet.Content side="right" class="w-full sm:max-w-4xl flex flex-col">
		<Sheet.Header class="space-y-4 flex-shrink-0">
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<Sheet.Title class="flex items-center gap-2">
						<Activity class="h-5 w-5" />
						Container Stats
					</Sheet.Title>
					<Sheet.Description>
						Real-time performance metrics for <span class="font-mono font-medium">{containerName}</span>
					</Sheet.Description>
				</div>

				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onclick={() => loadStats(true)}
						disabled={isLoading}
					>
						<RefreshCw class="mr-2 h-4 w-4 {isLoading ? 'animate-spin' : ''}" />
						Refresh
					</Button>
					<Button
						variant={autoRefresh ? "default" : "outline"}
						size="sm"
						onclick={toggleAutoRefresh}
					>
						{#if autoRefresh}
							<Pause class="mr-2 h-4 w-4" />
							Stop Auto
						{:else}
							<Play class="mr-2 h-4 w-4" />
							Live Updates
						{/if}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onclick={exportStats}
						disabled={!stats}
					>
						<Download class="mr-2 h-4 w-4" />
						Export
					</Button>
				</div>
			</div>

			{#if autoRefresh}
				<div class="flex items-center gap-2">
					<Badge variant="default" class="gap-1">
						<div class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
						Live Updates (2s)
					</Badge>
				</div>
			{/if}
		</Sheet.Header>

		<!-- Error Display -->
		{#if error}
			<Alert.Root variant="destructive" class="my-4 flex-shrink-0">
				<AlertCircle class="h-4 w-4" />
				<Alert.Title>Error</Alert.Title>
				<Alert.Description>{error}</Alert.Description>
			</Alert.Root>
		{/if}

		<!-- Stats Content -->
		<div class="flex-1 min-h-0">
			<ScrollArea class="h-full">
				<div class="space-y-6 p-1">
					{#if isLoading && !stats}
						<!-- Loading State -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							{#each Array(4) as _}
								<Card.Root>
									<Card.Header class="pb-2">
										<div class="flex items-center space-x-2">
											<Skeleton class="h-5 w-5 rounded" />
											<Skeleton class="h-5 w-24 rounded" />
										</div>
									</Card.Header>
									<Card.Content>
										<Skeleton class="h-8 w-full rounded mb-2" />
										<Skeleton class="h-4 w-3/4 rounded" />
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					{:else if !stats}
						<!-- Empty State -->
						<div class="flex flex-col items-center justify-center h-64 text-center">
							<Monitor class="mb-4 h-12 w-12 text-muted-foreground/50" />
							<h3 class="mb-2 text-lg font-semibold">No stats available</h3>
							<p class="text-sm text-muted-foreground max-w-md">
								Unable to retrieve stats for this container. Make sure the container is running.
							</p>
						</div>
					{:else}
						<!-- Stats Display -->

						<!-- Overview Cards -->
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							<!-- CPU Usage -->
							<Card.Root>
								<Card.Header class="pb-2">
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-2">
											<Cpu class="h-4 w-4 text-blue-600" />
											<span class="text-sm font-medium">CPU</span>
										</div>
										{#if cpuHistory.length >= 2}
											{@const TrendIcon = getTrendIcon(cpuHistory)}
											<TrendIcon class="h-3 w-3 {getTrendColor(cpuHistory)}" />
										{/if}
									</div>
								</Card.Header>
								<Card.Content>
									<div class="space-y-2">
										<div class="text-2xl font-bold">{cpuUsagePercent()}%</div>
										<Progress value={cpuUsagePercent()} class="h-2" />
										<div class="text-xs text-muted-foreground">
											{stats.cpu_stats.online_cpus || 1} CPU{stats.cpu_stats.online_cpus !== 1 ? 's' : ''}
										</div>
									</div>
								</Card.Content>
							</Card.Root>

							<!-- Memory Usage -->
							<Card.Root>
								<Card.Header class="pb-2">
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-2">
											<MemoryStick class="h-4 w-4 text-green-600" />
											<span class="text-sm font-medium">Memory</span>
										</div>
										{#if memoryHistory.length >= 2}
											{@const TrendIcon = getTrendIcon(memoryHistory)}
											<TrendIcon class="h-3 w-3 {getTrendColor(memoryHistory)}" />
										{/if}
									</div>
								</Card.Header>
								<Card.Content>
									<div class="space-y-2">
										<div class="text-2xl font-bold">{memoryUsagePercent()}%</div>
										<Progress value={memoryUsagePercent()} class="h-2" />
										<div class="text-xs text-muted-foreground">
											{memoryUsageMB().used} MB / {memoryUsageMB().limit} MB
										</div>
									</div>
								</Card.Content>
							</Card.Root>

							<!-- Network I/O -->
							<Card.Root>
								<Card.Header class="pb-2">
									<div class="flex items-center space-x-2">
										<Network class="h-4 w-4 text-purple-600" />
										<span class="text-sm font-medium">Network</span>
									</div>
								</Card.Header>
								<Card.Content>
									<div class="space-y-2">
										<div class="flex justify-between text-sm">
											<span class="text-muted-foreground">RX:</span>
											<span class="font-mono">{formatBytes(networkStats().rx)}</span>
										</div>
										<div class="flex justify-between text-sm">
											<span class="text-muted-foreground">TX:</span>
											<span class="font-mono">{formatBytes(networkStats().tx)}</span>
										</div>
										<div class="text-xs text-muted-foreground">
											{networkStats().rxPackets + networkStats().txPackets} packets
										</div>
									</div>
								</Card.Content>
							</Card.Root>

							<!-- Processes -->
							<Card.Root>
								<Card.Header class="pb-2">
									<div class="flex items-center space-x-2">
										<Gauge class="h-4 w-4 text-orange-600" />
										<span class="text-sm font-medium">Processes</span>
									</div>
								</Card.Header>
								<Card.Content>
									<div class="space-y-2">
										<div class="text-2xl font-bold">{stats.pids_stats.current}</div>
										{#if stats.pids_stats.limit}
											<div class="text-xs text-muted-foreground">
												Limit: {stats.pids_stats.limit}
											</div>
										{:else}
											<div class="text-xs text-muted-foreground">No limit</div>
										{/if}
									</div>
								</Card.Content>
							</Card.Root>
						</div>

						<!-- Detailed Stats -->
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<!-- Block I/O -->
							<Card.Root>
								<Card.Header>
									<Card.Title class="flex items-center gap-2">
										<HardDrive class="h-5 w-5" />
										Block I/O
									</Card.Title>
								</Card.Header>
								<Card.Content class="space-y-4">
									<div class="grid grid-cols-2 gap-4">
										<div class="text-center p-3 bg-muted/50 rounded-lg">
											<div class="text-lg font-semibold">{formatBytes(blockIOStats().read)}</div>
											<div class="text-sm text-muted-foreground">Read</div>
										</div>
										<div class="text-center p-3 bg-muted/50 rounded-lg">
											<div class="text-lg font-semibold">{formatBytes(blockIOStats().write)}</div>
											<div class="text-sm text-muted-foreground">Write</div>
										</div>
									</div>
								</Card.Content>
							</Card.Root>

							<!-- Network Details -->
							<Card.Root>
								<Card.Header>
									<Card.Title class="flex items-center gap-2">
										<Wifi class="h-5 w-5" />
										Network Details
									</Card.Title>
								</Card.Header>
								<Card.Content class="space-y-4">
									<div class="space-y-3">
										{#each Object.entries(stats.networks || {}) as [name, network]}
											<div class="border rounded-lg p-3">
												<div class="font-medium text-sm mb-2">{name}</div>
												<div class="grid grid-cols-2 gap-2 text-xs">
													<div>RX: {formatBytes(network.rx_bytes)}</div>
													<div>TX: {formatBytes(network.tx_bytes)}</div>
													<div>RX Packets: {network.rx_packets}</div>
													<div>TX Packets: {network.tx_packets}</div>
													{#if network.rx_errors + network.tx_errors > 0}
														<div class="col-span-2 text-red-500">
															Errors: RX {network.rx_errors}, TX {network.tx_errors}
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</Card.Content>
							</Card.Root>
						</div>

						<!-- CPU Details -->
						<Card.Root>
							<Card.Header>
								<Card.Title class="flex items-center gap-2">
									<Cpu class="h-5 w-5" />
									CPU Details
								</Card.Title>
							</Card.Header>
							<Card.Content>
								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
									<div class="text-center p-3 bg-muted/50 rounded-lg">
										<div class="text-lg font-semibold">{stats.cpu_stats.online_cpus}</div>
										<div class="text-sm text-muted-foreground">Online CPUs</div>
									</div>
									<div class="text-center p-3 bg-muted/50 rounded-lg">
										<div class="text-lg font-semibold">{Math.round((stats.cpu_stats.cpu_usage.usage_in_usermode / 1000000) * 100) / 100}ms</div>
										<div class="text-sm text-muted-foreground">User Mode</div>
									</div>
									<div class="text-center p-3 bg-muted/50 rounded-lg">
										<div class="text-lg font-semibold">{Math.round((stats.cpu_stats.cpu_usage.usage_in_kernelmode / 1000000) * 100) / 100}ms</div>
										<div class="text-sm text-muted-foreground">Kernel Mode</div>
									</div>
									<div class="text-center p-3 bg-muted/50 rounded-lg">
										<div class="text-lg font-semibold">{stats.cpu_stats.throttling_data.throttled_periods}</div>
										<div class="text-sm text-muted-foreground">Throttled</div>
									</div>
								</div>
							</Card.Content>
						</Card.Root>

						<!-- Memory Details -->
						<Card.Root>
							<Card.Header>
								<Card.Title class="flex items-center gap-2">
									<Database class="h-5 w-5" />
									Memory Details
								</Card.Title>
							</Card.Header>
							<Card.Content>
								<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
									<div class="space-y-1">
										<div class="text-muted-foreground">RSS</div>
										<div class="font-mono">{formatBytes(stats.memory_stats.stats.rss)}</div>
									</div>
									<div class="space-y-1">
										<div class="text-muted-foreground">Cache</div>
										<div class="font-mono">{formatBytes(stats.memory_stats.stats.cache)}</div>
									</div>
									<div class="space-y-1">
										<div class="text-muted-foreground">Max Usage</div>
										<div class="font-mono">{formatBytes(stats.memory_stats.max_usage)}</div>
									</div>
									<div class="space-y-1">
										<div class="text-muted-foreground">Limit</div>
										<div class="font-mono">{formatBytes(stats.memory_stats.limit)}</div>
									</div>
									<div class="space-y-1">
										<div class="text-muted-foreground">Page Faults</div>
										<div class="font-mono">{stats.memory_stats.stats.pgfault}</div>
									</div>
									<div class="space-y-1">
										<div class="text-muted-foreground">Major Faults</div>
										<div class="font-mono">{stats.memory_stats.stats.pgmajfault}</div>
									</div>
									<div class="space-y-1">
										<div class="text-muted-foreground">Active</div>
										<div class="font-mono">{formatBytes(stats.memory_stats.stats.total_active_anon)}</div>
									</div>
									<div class="space-y-1">
										<div class="text-muted-foreground">Inactive</div>
										<div class="font-mono">{formatBytes(stats.memory_stats.stats.total_inactive_anon)}</div>
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					{/if}
				</div>
			</ScrollArea>
		</div>
	</Sheet.Content>
</Sheet.Root>
