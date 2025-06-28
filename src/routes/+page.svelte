<!-- src/routes/+page.svelte -->
<script lang="ts">
import * as Alert from "$lib/components/ui/alert";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "$lib/components/ui/card";
import { Progress } from "$lib/components/ui/progress";
import { Separator } from "$lib/components/ui/separator";
import * as Table from "$lib/components/ui/table";
import {
	Activity,
	AlertCircle,
	AlertTriangle,
	CheckCircle,
	Container as ContainerIcon,
	Database,
	HardDrive,
	Info,
	Network,
	Play,
	RefreshCw,
	Square,
	Trash2,
} from "lucide-svelte";
import { onDestroy, onMount } from "svelte";
import { toast } from "svelte-sonner";

import { containersStore } from "$lib/stores/containers.svelte";
// Import stores
import { dockerStore } from "$lib/stores/docker.svelte";
import type { Container } from "$lib/types/container";

// Reactive state
let isRefreshing = $state(false);
let connectionAttempts = $state(0);
const maxRetries = 3;

// Derived values for easier access
const connectionStatus = $derived(dockerStore.connectionStatus);
const systemStats = $derived(dockerStore.systemStats);
const systemInfo = $derived(dockerStore.systemInfo);
const dockerError = $derived(dockerStore.dockerError);
const isConnecting = $derived(dockerStore.isConnecting);

const containers = $derived(containersStore.containers);
const isLoadingContainers = $derived(containersStore.isLoadingContainers);
const containerError = $derived(containersStore.containerError);

// Computed dashboard stats
const dashboardStats = $derived(() => {
	if (!systemStats) {
		return {
			totalContainers: containers.length,
			runningContainers: containers.filter((c) => c.state === "running").length,
			stoppedContainers: containers.filter(
				(c) => c.state === "exited" || c.state === "created",
			).length,
			pausedContainers: containers.filter((c) => c.state === "paused").length,
			totalImages: 0,
			totalVolumes: 0,
			totalNetworks: 0,
		};
	}

	return {
		totalContainers: systemStats.containers_total,
		runningContainers: systemStats.containers_running,
		stoppedContainers: systemStats.containers_stopped,
		pausedContainers: systemStats.containers_paused,
		totalImages: systemStats.images_total,
		totalVolumes: systemStats.volumes_total,
		totalNetworks: systemStats.networks_total,
	};
});

// Recent containers for display (limit to 5)
const recentContainers = $derived(
	containers
		.slice()
		.sort((a, b) => b.created - a.created)
		.slice(0, 5),
);

// Connection status color and text
const connectionStatusInfo = $derived(() => {
	if (isConnecting) {
		return {
			color: "text-blue-600",
			text: "Connecting...",
			variant: "default" as const,
		};
	}
	if (connectionStatus.connected) {
		return {
			color: "text-green-600",
			text: "Connected",
			variant: "default" as const,
		};
	}
	return {
		color: "text-red-600",
		text: "Disconnected",
		variant: "destructive" as const,
	};
});

// Calculate disk usage estimate (mock calculation for now)
const diskUsageEstimate = $derived(() => {
	if (!systemInfo?.info) return 0;
	// This is a simplified estimation - in reality you'd want to calculate based on actual Docker data
	const stats = dashboardStats();
	const containerCount = stats.totalContainers;
	const imageCount = stats.totalImages;
	// Rough estimation: assume each container uses ~100MB, each image ~500MB
	const estimatedUsageGB = containerCount * 0.1 + imageCount * 0.5;
	// Assume total system has 100GB available (you might want to get this from system info)
	const totalGB = 100;
	return Math.min(Math.round((estimatedUsageGB / totalGB) * 100), 100);
});

// Initialize Docker connection and load data
async function initializeDashboard() {
	isRefreshing = true;
	connectionAttempts++;

	try {
		// Initialize Docker connection
		await dockerStore.initializeDockerConnection();

		if (dockerStore.connectionStatus.connected) {
			// Load system information and stats
			await Promise.all([
				dockerStore.loadSystemInfo(),
				dockerStore.loadSystemStats(),
				containersStore.loadContainers(true),
			]);

			toast.success("Dashboard refreshed successfully");
			connectionAttempts = 0; // Reset on successful connection
		} else {
			throw new Error(
				dockerStore.connectionStatus.error || "Failed to connect to Docker",
			);
		}
	} catch (error) {
		console.error("Failed to initialize dashboard:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		if (connectionAttempts < maxRetries) {
			toast.error(
				`Connection failed. Retrying... (${connectionAttempts}/${maxRetries})`,
			);
			// Retry after a delay
			setTimeout(() => initializeDashboard(), 2000);
		} else {
			toast.error(`Failed to connect to Docker: ${errorMessage}`);
		}
	} finally {
		isRefreshing = false;
	}
}

// Manual refresh function
async function handleRefresh() {
	if (isRefreshing) return;

	connectionAttempts = 0; // Reset retry counter for manual refresh
	await initializeDashboard();
}

// Container action handler
async function handleContainerAction(action: string, container: any) {
	try {
		const success = await containersStore.performContainerAction(
			action as any,
			container.id,
		);

		if (success) {
			toast.success(
				`${action} action completed for ${container.names[0] || container.id}`,
			);
			// Refresh system stats after action
			if (connectionStatus.connected) {
				await dockerStore.loadSystemStats();
			}
		} else {
			throw new Error(
				containersStore.containerError || `Failed to ${action} container`,
			);
		}
	} catch (error: any) {
		console.error(`Failed to ${action} container:`, error);
		toast.error(`Failed to ${action} container: ${error.message}`);
	}
}

// Format container name
function getContainerDisplayName(container: any) {
	return (
		container.names[0]?.replace(/^\//, "") || container.id.substring(0, 12)
	);
}

// Format container port
function getContainerPorts(container: Container) {
	if (!container.ports || container.ports.length === 0) {
		return "No ports";
	}

	// Use a Set to eliminate duplicates
	const uniquePorts = new Set<string>();

	for (const port of container.ports) {
		if (port.public_port) {
			uniquePorts.add(`${port.public_port}:${port.private_port}`);
		} else {
			uniquePorts.add(`${port.private_port}/${port.type}`);
		}
	}

	return Array.from(uniquePorts).join(", ");
}

// Format time since created
function formatTimeSince(timestamp: number) {
	const now = Date.now() / 1000;
	const diff = now - timestamp;

	if (diff < 60) return "Just now";
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	return `${Math.floor(diff / 86400)}d ago`;
}

// Lifecycle
onMount(async () => {
	await initializeDashboard();

	// Start auto-refresh for system stats
	dockerStore.startAutoRefresh(10000); // Every 10 seconds
	containersStore.startAutoRefresh(5000); // Every 5 seconds
});

onDestroy(() => {
	dockerStore.stopAutoRefresh();
	containersStore.stopAutoRefresh();
});
</script>

<svelte:head>
  <title>DocSee - Docker Dashboard</title>
</svelte:head>

<div class="space-y-8">
  <!-- Header Section -->
  <div class="flex items-start justify-between">
    <div class="space-y-2">
      <h1 class="text-4xl font-bold tracking-tight">Docker Dashboard</h1>
      <p class="text-lg text-muted-foreground">
        Monitor and manage your Docker containers, images, and volumes
      </p>

      <!-- Connection Status -->
      <div class="flex items-center gap-3 mt-4">
        <div class="flex items-center gap-2">
          <div
            class="h-2 w-2 rounded-full {connectionStatus.connected
              ? 'bg-green-500'
              : 'bg-red-500'}"
          ></div>
          <span class="text-sm font-medium {connectionStatusInfo().color}">
            {connectionStatusInfo().text}
          </span>
        </div>

        {#if connectionStatus.version}
          <Badge variant="outline" class="text-xs">
            Docker {connectionStatus.version}
          </Badge>
        {/if}

        {#if connectionStatus.api_version}
          <Badge variant="outline" class="text-xs">
            API {connectionStatus.api_version}
          </Badge>
        {/if}
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-3">
      <Button
        onclick={handleRefresh}
        disabled={isRefreshing}
        variant="outline"
        class="min-w-[120px]"
      >
        <RefreshCw class="mr-2 h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </Button>

      {#if !connectionStatus.connected}
        <Button
          onclick={() => dockerStore.connectToDocker()}
          disabled={isConnecting}
        >
          <Activity class="mr-2 h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect"}
        </Button>
      {/if}
    </div>
  </div>

  <!-- Error Alerts -->
  {#if dockerError || containerError}
    <Alert.Root variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <Alert.Title>Error</Alert.Title>
      <Alert.Description>
        {dockerError || containerError}
      </Alert.Description>
    </Alert.Root>
  {/if}

  <!-- Stats Cards -->
  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    <!-- Total Containers -->
    <Card class="border-2 hover:border-muted-foreground/20 transition-colors">
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-3"
      >
        <CardTitle class="text-sm font-medium text-muted-foreground"
          >Total Containers</CardTitle
        >
        <ContainerIcon class="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent class="space-y-2">
        <div class="text-3xl font-bold">{dashboardStats().totalContainers}</div>
        {#if dashboardStats().runningContainers > 0}
          <Badge variant="default" class="bg-green-600 hover:bg-green-600/80">
            {dashboardStats().runningContainers} running
          </Badge>
        {:else}
          <Badge variant="secondary">No containers running</Badge>
        {/if}
      </CardContent>
    </Card>

    <!-- Running Containers -->
    <Card class="border-2 hover:border-muted-foreground/20 transition-colors">
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-3"
      >
        <CardTitle class="text-sm font-medium text-muted-foreground"
          >Running</CardTitle
        >
        <CheckCircle class="h-5 w-5 text-green-600" />
      </CardHeader>
      <CardContent class="space-y-2">
        <div class="text-3xl font-bold text-green-600">
          {dashboardStats().runningContainers}
        </div>
        <div class="flex gap-2">
          {#if dashboardStats().stoppedContainers > 0}
            <Badge variant="outline" class="text-xs">
              {dashboardStats().stoppedContainers} stopped
            </Badge>
          {/if}
          {#if dashboardStats().pausedContainers > 0}
            <Badge variant="outline" class="text-xs">
              {dashboardStats().pausedContainers} paused
            </Badge>
          {/if}
        </div>
      </CardContent>
    </Card>

    <!-- Images -->
    <Card class="border-2 hover:border-muted-foreground/20 transition-colors">
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-3"
      >
        <CardTitle class="text-sm font-medium text-muted-foreground"
          >Images</CardTitle
        >
        <HardDrive class="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent class="space-y-2">
        <div class="text-3xl font-bold">{dashboardStats().totalImages}</div>
        <div class="flex gap-2">
          <Badge variant="outline" class="text-xs">
            <Database class="w-3 h-3 mr-1" />
            {dashboardStats().totalVolumes} volumes
          </Badge>
          <Badge variant="outline" class="text-xs">
            <Network class="w-3 h-3 mr-1" />
            {dashboardStats().totalNetworks} networks
          </Badge>
        </div>
      </CardContent>
    </Card>

    <!-- Disk Usage -->
    <Card class="border-2 hover:border-muted-foreground/20 transition-colors">
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-3"
      >
        <CardTitle class="text-sm font-medium text-muted-foreground"
          >Estimated Disk Usage</CardTitle
        >
        <AlertTriangle
          class="h-5 w-5 {diskUsageEstimate() > 80
            ? 'text-red-600'
            : diskUsageEstimate() > 60
              ? 'text-yellow-600'
              : 'text-muted-foreground'}"
        />
      </CardHeader>
      <CardContent class="space-y-3">
        <div
          class="text-3xl font-bold {diskUsageEstimate() > 80
            ? 'text-red-600'
            : diskUsageEstimate() > 60
              ? 'text-yellow-600'
              : ''}"
        >
          {diskUsageEstimate()}%
        </div>
        <Progress value={diskUsageEstimate()} class="h-2" />
        <Badge
          variant={diskUsageEstimate() > 80
            ? "destructive"
            : diskUsageEstimate() > 60
              ? "default"
              : "outline"}
          class="text-xs"
        >
          {diskUsageEstimate() > 80
            ? "High usage"
            : diskUsageEstimate() > 60
              ? "Moderate usage"
              : "Normal usage"}
        </Badge>
      </CardContent>
    </Card>
  </div>

  <!-- System Info Alert -->
  {#if systemInfo}
    <Alert.Root>
      <Info class="h-4 w-4" />
      <Alert.Title>System Information</Alert.Title>
      <Alert.Description class="mt-2">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="font-medium">OS:</span>
            {systemInfo.info.operating_system}
          </div>
          <div>
            <span class="font-medium">Architecture:</span>
            {systemInfo.info.architecture}
          </div>
          <div>
            <span class="font-medium">CPUs:</span>
            {systemInfo.info.ncpu}
          </div>
          <div>
            <span class="font-medium">Memory:</span>
            {Math.round(systemInfo.info.mem_total / (1024 * 1024 * 1024))}GB
          </div>
        </div>
      </Alert.Description>
    </Alert.Root>
  {/if}

  <Separator />

  <!-- Recent Containers Table -->
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>Recent Containers</CardTitle>
          <CardDescription class="mt-2">
            {#if isLoadingContainers}
              Loading container information...
            {:else}
              {recentContainers.length > 0
                ? `Showing ${recentContainers.length} of ${containers.length} containers`
                : "No containers found"}
            {/if}
          </CardDescription>
        </div>

        {#if containers.length > 5}
          <Button href="/containers" variant="outline" size="sm">
            View All ({containers.length})
          </Button>
        {/if}
      </div>
    </CardHeader>

    <CardContent>
      {#if isLoadingContainers}
        <div class="flex items-center justify-center py-8">
          <RefreshCw class="h-6 w-6 animate-spin mr-2" />
          <span>Loading containers...</span>
        </div>
      {:else if recentContainers.length === 0}
        <div class="text-center py-8 text-muted-foreground">
          <ContainerIcon class="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No containers found</p>
          <p class="text-sm">
            {connectionStatus.connected
              ? "Create your first container to get started"
              : "Connect to Docker to see containers"}
          </p>
        </div>
      {:else}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Container</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Image</Table.Head>
              <Table.Head>Ports</Table.Head>
              <Table.Head>Created</Table.Head>
              <Table.Head class="text-right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each recentContainers as container (container.id)}
              <Table.Row class="hover:bg-muted/50">
                <Table.Cell>
                  <div class="font-medium">
                    {getContainerDisplayName(container)}
                  </div>
                  <div class="text-xs text-muted-foreground font-mono">
                    {container.id.substring(0, 12)}
                  </div>
                </Table.Cell>

                <Table.Cell>
                  <Badge
                    variant={container.state === "running"
                      ? "default"
                      : "secondary"}
                    class={container.state === "running"
                      ? "bg-green-600 hover:bg-green-600/80"
                      : ""}
                  >
                    {container.state}
                  </Badge>
                </Table.Cell>

                <Table.Cell>
                  <div class="font-mono text-sm">{container.image}</div>
                  {#if container.image_id}
                    <div class="text-xs text-muted-foreground">
                      {container.image_id.substring(7, 19)}
                    </div>
                  {/if}
                </Table.Cell>

                <Table.Cell>
                  <span class="font-mono text-sm"
                    >{getContainerPorts(container)}</span
                  >
                </Table.Cell>

                <Table.Cell>
                  <span class="text-sm"
                    >{formatTimeSince(container.created)}</span
                  >
                </Table.Cell>

                <Table.Cell class="text-right">
                  <div class="flex justify-end gap-2">
                    {#if container.state === "running"}
                      <Button
                        size="sm"
                        variant="outline"
                        onclick={() => handleContainerAction("stop", container)}
                        disabled={containersStore.containerOperationInProgress ===
                          `stop-${container.id}`}
                      >
                        <Square class="h-3 w-3" />
                        <span class="sr-only">Stop container</span>
                      </Button>
                    {:else if container.state === "exited" || container.state === "created"}
                      <Button
                        size="sm"
                        variant="outline"
                        onclick={() =>
                          handleContainerAction("start", container)}
                        disabled={containersStore.containerOperationInProgress ===
                          `start-${container.id}`}
                      >
                        <Play class="h-3 w-3" />
                        <span class="sr-only">Start container</span>
                      </Button>
                    {/if}

                    <Button
                      size="sm"
                      variant="destructive"
                      onclick={() => handleContainerAction("remove", container)}
                      disabled={containersStore.containerOperationInProgress ===
                        `remove-${container.id}`}
                    >
                      <Trash2 class="h-3 w-3" />
                      <span class="sr-only">Remove container</span>
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {/if}
    </CardContent>
  </Card>
</div>
