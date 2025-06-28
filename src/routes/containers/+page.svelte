<!-- src/routes/containers/+page.svelte -->
<script lang="ts">
import {
	Activity,
	AlertCircle,
	CheckCircle2,
	Clock,
	Container,
	Download,
	FileText,
	Filter,
	MoreHorizontal,
	Pause,
	Play,
	Plus,
	RefreshCw,
	RotateCcw,
	Search,
	Settings,
	Square,
	StopCircle,
	Terminal,
	Trash2,
} from "lucide-svelte";
import { onDestroy, onMount } from "svelte";

import * as Alert from "$lib/components/ui/alert";
import { Badge } from "$lib/components/ui/badge";
// Import shadcn-svelte components
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
import { Input } from "$lib/components/ui/input";
import * as Select from "$lib/components/ui/select";
import { Separator } from "$lib/components/ui/separator";
import { Skeleton } from "$lib/components/ui/skeleton";
import * as Table from "$lib/components/ui/table";

import {
	LogsViewer,
	ShellAccess,
	StatsViewer,
} from "$lib/components/containers";
// Import stores and types
import { containersStore } from "$lib/stores/containers.svelte";
import { dockerStore } from "$lib/stores/docker.svelte";
import type { Container as ContainerType } from "$lib/types/container";
import { toast } from "svelte-sonner";

// Reactive state using runes
// biome-ignore lint/style/useConst: <explanation>
let searchTerm = $state("");
// biome-ignore lint/style/useConst: <explanation>
let statusFilter = $state<string>("all");
// biome-ignore lint/style/useConst: <explanation>
let sortBy = $state("name");
let logsViewerOpen = $state(false);
let selectedContainerForLogs = $state<ContainerType | null>(null);
let statsViewerOpen = $state(false);
let selectedContainerForStats = $state<ContainerType | null>(null);
let shellAccessOpen = $state(false);
let selectedContainerForShell = $state<ContainerType | null>(null);

// Derived values from stores
const containers = $derived(containersStore.containers);
const isLoadingContainers = $derived(containersStore.isLoadingContainers);
const containerError = $derived(containersStore.containerError);
const containerOperationInProgress = $derived(
	containersStore.containerOperationInProgress,
);
const connectionStatus = $derived(dockerStore.connectionStatus);

// Update store filters when local state changes
$effect(() => {
	containersStore.setContainerSearchTerm(searchTerm);
});

$effect(() => {
	containersStore.setContainerFilter(statusFilter);
});

$effect(() => {
	containersStore.setContainerSortBy(sortBy);
});

// Filtered and sorted containers
const filteredContainers = $derived(() => {
	let filtered = containers;

	// Apply status filter
	if (statusFilter !== "all") {
		filtered = filtered.filter((container) => {
			switch (statusFilter) {
				case "running":
					return container.state === "running";
				case "stopped":
					return container.state === "exited" || container.state === "created";
				case "paused":
					return container.state === "paused";
				default:
					return true;
			}
		});
	}

	// Apply search filter
	if (searchTerm.trim()) {
		const term = searchTerm.toLowerCase();
		filtered = filtered.filter(
			(container) =>
				container.names.some((name) => name.toLowerCase().includes(term)) ||
				container.image.toLowerCase().includes(term) ||
				container.id.toLowerCase().includes(term),
		);
	}

	// Apply sorting
	const sorted = [...filtered];
	sorted.sort((a, b) => {
		switch (sortBy) {
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
});

// Status badge configuration
function getStatusBadge(status: string) {
	switch (status) {
		case "running":
			return {
				variant: "default" as const,
				class: "bg-green-600 text-white hover:bg-green-700",
				icon: Play,
			};
		case "exited":
		case "stopped":
			return {
				variant: "secondary" as const,
				class: "bg-gray-500 text-white hover:bg-gray-600",
				icon: StopCircle,
			};
		case "paused":
			return {
				variant: "default" as const,
				class: "bg-yellow-600 text-white hover:bg-yellow-700",
				icon: Pause,
			};
		case "created":
			return {
				variant: "outline" as const,
				class: "border-blue-500 text-blue-600",
				icon: Clock,
			};
		case "restarting":
			return {
				variant: "default" as const,
				class: "bg-blue-600 text-white hover:bg-blue-700",
				icon: RotateCcw,
			};
		default:
			return {
				variant: "secondary" as const,
				class: "",
				icon: AlertCircle,
			};
	}
}

// Get container display name
function getContainerDisplayName(container: ContainerType) {
	return (
		container.names[0]?.replace(/^\//, "") || container.id.substring(0, 12)
	);
}

// Format container ports
function getContainerPorts(container: ContainerType) {
	if (!container.ports || container.ports.length === 0) {
		return "-";
	}

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

// Container actions
async function handleContainerAction(
	action: "start" | "stop" | "restart" | "remove" | "kill",
	container: ContainerType,
) {
	try {
		const success = await containersStore.performContainerAction(
			action,
			container.id,
		);

		if (success) {
			toast.success(
				`Successfully ${action === "remove" ? "removed" : `${action}ed`} container ${getContainerDisplayName(container)}`,
			);
		} else {
			throw new Error(containerError || `Failed to ${action} container`);
		}
	} catch (error: any) {
		console.error(`Failed to ${action} container:`, error);
		toast.error(`Failed to ${action} container: ${error.message}`);
	}
}

// Refresh containers
async function handleRefresh() {
	try {
		await containersStore.loadContainers(true);
		toast.success("Containers refreshed successfully");
	} catch (error) {
		console.error("Failed to refresh containers:", error);
		toast.error("Failed to refresh containers");
	}
}

// Export containers (placeholder)
function handleExport() {
	toast.info("Export functionality coming soon!");
}

// Create container (placeholder)
function handleCreateContainer() {
	toast.info("Container creation functionality coming soon!");
}

// View logs
function handleViewLogs(container: ContainerType) {
	selectedContainerForLogs = container;
	logsViewerOpen = true;
}

// View stats
function handleViewStats(container: ContainerType) {
	selectedContainerForStats = container;
	statsViewerOpen = true;
}

// Shell access
function handleShellAccess(container: ContainerType) {
	selectedContainerForShell = container;
	shellAccessOpen = true;
}

// Initialize on mount
onMount(async () => {
	// Load containers if not already loaded
	if (containers.length === 0 && !isLoadingContainers) {
		await containersStore.loadContainers(true);
	}

	// Start auto-refresh
	containersStore.startAutoRefresh(5000);
});

// Effect to pause containers auto-refresh when any viewer is open
$effect(() => {
	if (logsViewerOpen || statsViewerOpen || shellAccessOpen) {
		// Pause containers auto-refresh when any viewer is open
		containersStore.stopAutoRefresh();
	} else {
		// Resume containers auto-refresh when all viewers are closed
		if (typeof window !== "undefined") {
			containersStore.startAutoRefresh(5000);
		}
	}
});

// Cleanup on destroy
onDestroy(() => {
	containersStore.stopAutoRefresh();
});
</script>

<svelte:head>
  <title>Containers - DocSee</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Containers</h1>
      <p class="text-muted-foreground">
        Manage and monitor your Docker containers
      </p>

      <!-- Connection Status -->
      {#if !connectionStatus.connected}
        <div class="flex items-center gap-2 text-sm">
          <div class="h-2 w-2 rounded-full bg-red-500"></div>
          <span class="text-red-600">Disconnected from Docker</span>
        </div>
      {:else}
        <div class="flex items-center gap-2 text-sm">
          <div class="h-2 w-2 rounded-full bg-green-500"></div>
          <span class="text-green-600">Connected</span>
          <span class="text-muted-foreground">•</span>
          <span class="text-muted-foreground"
            >{filteredContainers().length} containers</span
          >
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onclick={handleRefresh}
        disabled={isLoadingContainers}
      >
        <RefreshCw
          class="mr-2 h-4 w-4 {isLoadingContainers ? 'animate-spin' : ''}"
        />
        Refresh
      </Button>
      <Button variant="outline" size="sm" onclick={handleExport}>
        <Download class="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button size="sm" onclick={handleCreateContainer}>
        <Plus class="mr-2 h-4 w-4" />
        Create Container
      </Button>
    </div>
  </div>

  <!-- Error Alert -->
  {#if containerError}
    <Alert.Root variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <Alert.Title>Error</Alert.Title>
      <Alert.Description>{containerError}</Alert.Description>
    </Alert.Root>
  {/if}

  <!-- Filters -->
  <Card.Root>
    <Card.Content class="p-4">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <!-- Search -->
        <div class="relative flex-1">
          <Search
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search containers by name, image, or ID..."
            bind:value={searchTerm}
            class="pl-10"
          />
        </div>

        <!-- Status Filter -->
        <Select.Root type="single" bind:value={statusFilter}>
          <Select.Trigger class="w-full sm:w-[180px]">
            <Filter class="mr-2 h-4 w-4" />
            <span class="truncate">
              {statusFilter === "all"
                ? "All Status"
                : statusFilter === "running"
                  ? "Running"
                  : statusFilter === "stopped"
                    ? "Stopped"
                    : statusFilter === "paused"
                      ? "Paused"
                      : "All Status"}
            </span>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all" label="All Status">All Status</Select.Item>
            <Select.Item value="running" label="Running">Running</Select.Item>
            <Select.Item value="stopped" label="Stopped">Stopped</Select.Item>
            <Select.Item value="paused" label="Paused">Paused</Select.Item>
          </Select.Content>
        </Select.Root>

        <!-- Sort By -->
        <Select.Root type="single" bind:value={sortBy}>
          <Select.Trigger class="w-full sm:w-[140px]">
            <span class="truncate">
              Sort by {sortBy === "name"
                ? "Name"
                : sortBy === "status"
                  ? "Status"
                  : sortBy === "created"
                    ? "Created"
                    : "Image"}
            </span>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="name">Name</Select.Item>
            <Select.Item value="status">Status</Select.Item>
            <Select.Item value="created">Created</Select.Item>
            <Select.Item value="image">Image</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Containers Table -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Container class="h-5 w-5" />
        Container List
      </Card.Title>
      <Card.Description>
        {#if isLoadingContainers}
          Loading containers...
        {:else}
          {filteredContainers().length} of {containers.length} containers
          {#if statusFilter !== "all"}
            • Filtered by {statusFilter}
          {/if}
          {#if searchTerm.trim()}
            • Search: "{searchTerm}"
          {/if}
        {/if}
      </Card.Description>
    </Card.Header>

    <Card.Content class="p-0">
      {#if isLoadingContainers}
        <!-- Loading State -->
        <div class="p-6 space-y-4">
          {#each Array(4) as _}
            <div class="flex items-center space-x-4">
              <Skeleton class="h-10 w-10 rounded-lg" />
              <div class="flex-1 space-y-2">
                <Skeleton class="h-4 w-[200px]" />
                <Skeleton class="h-3 w-[300px]" />
              </div>
              <Skeleton class="h-6 w-16 rounded-full" />
              <Skeleton class="h-8 w-8 rounded" />
            </div>
          {/each}
        </div>
      {:else if filteredContainers().length === 0}
        <!-- Empty State -->
        <div
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <Container class="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 class="mb-2 text-lg font-semibold">No containers found</h3>
          <p class="mb-4 text-sm text-muted-foreground max-w-md">
            {searchTerm || statusFilter !== "all"
              ? "No containers match your current filters. Try adjusting your search or filter criteria."
              : connectionStatus.connected
                ? "No containers are currently available. Create your first container to get started."
                : "Connect to Docker to see your containers."}
          </p>
          {#if searchTerm || statusFilter !== "all"}
            <Button
              variant="outline"
              size="sm"
              onclick={() => {
                searchTerm = "";
                statusFilter = "all";
              }}
            >
              Clear Filters
            </Button>
          {:else if connectionStatus.connected}
            <Button size="sm" onclick={handleCreateContainer}>
              <Plus class="mr-2 h-4 w-4" />
              Create Your First Container
            </Button>
          {/if}
        </div>
      {:else}
        <!-- Containers Table -->
        <div class="overflow-x-auto">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head class="min-w-[200px]">Container</Table.Head>
                <Table.Head class="min-w-[120px]">Status</Table.Head>
                <Table.Head class="min-w-[180px]">Image</Table.Head>
                <Table.Head class="min-w-[140px]">Ports</Table.Head>
                <Table.Head class="min-w-[100px]">Created</Table.Head>
                <Table.Head class="w-[100px] text-right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each filteredContainers() as container (container.id)}
                {@const statusBadge = getStatusBadge(container.state)}
                {@const StatusIcon = statusBadge.icon}
                {@const displayName = getContainerDisplayName(container)}
                {@const isOperationInProgress =
                  containerOperationInProgress?.includes(container.id)}

                <Table.Row class="group hover:bg-muted/50">
                  <!-- Container Info -->
                  <Table.Cell class="font-medium">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-background"
                      >
                        <Container class="h-4 w-4" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="font-medium truncate" title={displayName}>
                          {displayName}
                        </div>
                        <div
                          class="text-xs text-muted-foreground font-mono truncate"
                          title={container.id}
                        >
                          {container.id.substring(0, 12)}
                        </div>
                      </div>
                    </div>
                  </Table.Cell>

                  <!-- Status -->
                  <Table.Cell>
                    <Badge
                      variant={statusBadge.variant}
                      class="{statusBadge.class} gap-1.5 font-medium"
                    >
                      <StatusIcon class="h-3 w-3" />
                      {container.state}
                    </Badge>
                  </Table.Cell>

                  <!-- Image -->
                  <Table.Cell>
                    <div
                      class="font-mono text-sm truncate"
                      title={container.image}
                    >
                      {container.image}
                    </div>
                    {#if container.image_id}
                      <div
                        class="text-xs text-muted-foreground font-mono truncate"
                        title={container.image_id}
                      >
                        {container.image_id.substring(7, 19)}
                      </div>
                    {/if}
                  </Table.Cell>

                  <!-- Ports -->
                  <Table.Cell>
                    <div
                      class="font-mono text-sm truncate"
                      title={getContainerPorts(container)}
                    >
                      {getContainerPorts(container)}
                    </div>
                  </Table.Cell>

                  <!-- Created -->
                  <Table.Cell class="text-muted-foreground">
                    <span
                      class="text-sm"
                      title={new Date(
                        container.created * 1000,
                      ).toLocaleString()}
                    >
                      {formatTimeSince(container.created)}
                    </span>
                  </Table.Cell>

                  <!-- Actions -->
                  <Table.Cell class="text-right">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8"
                          disabled={isOperationInProgress}
                        >
                          {#if isOperationInProgress}
                            <RefreshCw class="h-4 w-4 animate-spin" />
                          {:else}
                            <MoreHorizontal class="h-4 w-4" />
                          {/if}
                          <span class="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end" class="w-[160px]">
                        <!-- Container State Actions -->
                        {#if container.state === "running"}
                          <DropdownMenu.Item
                            onclick={() =>
                              handleContainerAction("stop", container)}
                          >
                            <Square class="mr-2 h-4 w-4" />
                            Stop
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onclick={() =>
                              handleContainerAction("restart", container)}
                          >
                            <RotateCcw class="mr-2 h-4 w-4" />
                            Restart
                          </DropdownMenu.Item>
                        {:else if container.state === "exited" || container.state === "created"}
                          <DropdownMenu.Item
                            onclick={() =>
                              handleContainerAction("start", container)}
                          >
                            <Play class="mr-2 h-4 w-4" />
                            Start
                          </DropdownMenu.Item>
                        {:else if container.state === "paused"}
                          <DropdownMenu.Item
                            onclick={() =>
                              handleContainerAction("start", container)}
                          >
                            <Play class="mr-2 h-4 w-4" />
                            Unpause
                          </DropdownMenu.Item>
                        {/if}

                        <DropdownMenu.Separator />

                        <!-- Inspection Actions -->
                        <DropdownMenu.Item
                          onclick={() => handleShellAccess(container)}
                        >
                          <Terminal class="mr-2 h-4 w-4" />
                          Shell
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onclick={() => handleViewLogs(container)}
                        >
                          <FileText class="mr-2 h-4 w-4" />
                          Logs
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onclick={() => handleViewStats(container)}
                        >
                          <Activity class="mr-2 h-4 w-4" />
                          Stats
                        </DropdownMenu.Item>
                        <DropdownMenu.Item>
                          <Settings class="mr-2 h-4 w-4" />
                          Inspect
                        </DropdownMenu.Item>

                        <DropdownMenu.Separator />

                        <!-- Destructive Actions -->
                        <DropdownMenu.Item
                          class="text-destructive focus:text-destructive"
                          onclick={() =>
                            handleContainerAction("remove", container)}
                        >
                          <Trash2 class="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>

<!-- Logs Viewer -->
{#if selectedContainerForLogs}
  <LogsViewer
    containerId={selectedContainerForLogs.id}
    containerName={getContainerDisplayName(selectedContainerForLogs)}
    open={logsViewerOpen}
    onOpenChange={(open) => {
      logsViewerOpen = open;
      if (!open) {
        selectedContainerForLogs = null;
      }
    }}
  />
{/if}

<!-- Stats Viewer -->
{#if selectedContainerForStats}
  <StatsViewer
    containerId={selectedContainerForStats.id}
    containerName={getContainerDisplayName(selectedContainerForStats)}
    open={statsViewerOpen}
    onOpenChange={(open) => {
      statsViewerOpen = open;
      if (!open) {
        selectedContainerForStats = null;
      }
    }}
  />
{/if}

<!-- Shell Access -->
{#if selectedContainerForShell}
  <ShellAccess
    containerId={selectedContainerForShell.id}
    containerName={getContainerDisplayName(selectedContainerForShell)}
    open={shellAccessOpen}
    onOpenChange={(open) => {
      shellAccessOpen = open;
      if (!open) {
        selectedContainerForShell = null;
      }
    }}
  />
{/if}
