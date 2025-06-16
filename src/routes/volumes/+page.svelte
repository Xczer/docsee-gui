<!-- src/routes/volumes/+page.svelte -->
<script lang="ts">
import { onMount, onDestroy } from "svelte";
import {
	HardDrive,
	Search,
	Filter,
	MoreHorizontal,
	Plus,
	RefreshCw,
	AlertCircle,
	CheckCircle2,
	Clock,
	Trash2,
	FolderOpen,
	Database,
	Server,
	Archive,
	Download,
	Settings,
	Copy,
} from "lucide-svelte";

// Import shadcn-svelte components
import { Button } from "$lib/components/ui/button";
import { Badge } from "$lib/components/ui/badge";
import * as Card from "$lib/components/ui/card";
import * as Table from "$lib/components/ui/table";
import { Input } from "$lib/components/ui/input";
import * as Select from "$lib/components/ui/select";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
import { Skeleton } from "$lib/components/ui/skeleton";
import { Separator } from "$lib/components/ui/separator";
import * as Alert from "$lib/components/ui/alert";

// Import stores and types
import { volumesStore } from "$lib/stores/volumes.svelte";
import { dockerStore } from "$lib/stores/docker.svelte";
import type { Volume } from "$lib/types/volume";
import { toast } from "svelte-sonner";

// Reactive state using runes
// biome-ignore lint/style/useConst: <explanation>
let searchTerm = $state("");
// biome-ignore lint/style/useConst: <explanation>
let usageFilter = $state<string>("all");
// biome-ignore lint/style/useConst: <explanation>
let sortBy = $state("name");

// Derived values from stores
const volumes = $derived(volumesStore.volumes);
const isLoadingVolumes = $derived(volumesStore.isLoadingVolumes);
const volumeError = $derived(volumesStore.volumeError);
const volumeOperationInProgress = $derived(
	volumesStore.volumeOperationInProgress,
);
const connectionStatus = $derived(dockerStore.connectionStatus);

// Update store filters when local state changes
$effect(() => {
	volumesStore.setVolumeSearchTerm(searchTerm);
});

$effect(() => {
	volumesStore.setVolumeFilter(usageFilter);
});

$effect(() => {
	volumesStore.setVolumeSortBy(sortBy);
});

// Filtered and sorted volumes
const filteredVolumes = $derived(() => {
	let filtered = volumes;

	// Apply usage filter
	if (usageFilter !== "all") {
		filtered = filtered.filter((volume) => {
			switch (usageFilter) {
				case "used":
					return volumesStore.isVolumeInUse(volume);
				case "unused":
					return !volumesStore.isVolumeInUse(volume);
				case "local":
					return volume.driver === "local";
				case "external":
					return volume.driver !== "local";
				default:
					return true;
			}
		});
	}

	// Apply search filter
	if (searchTerm.trim()) {
		const term = searchTerm.toLowerCase();
		filtered = filtered.filter((volume) => {
			return (
				volume.name.toLowerCase().includes(term) ||
				volume.driver.toLowerCase().includes(term) ||
				volume.mountpoint.toLowerCase().includes(term)
			);
		});
	}

	// Apply sorting
	const sorted = [...filtered];
	sorted.sort((a, b) => {
		switch (sortBy) {
			case "name":
				return a.name.localeCompare(b.name);
			case "driver":
				return a.driver.localeCompare(b.driver);
			case "created":
				return (
					new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
				); // Newest first
			case "size": {
				const aSize = a.usage_data?.size || 0;
				const bSize = b.usage_data?.size || 0;
				return bSize - aSize; // Largest first
			}
			case "usage": {
				const aUsage = a.usage_data?.ref_count || 0;
				const bUsage = b.usage_data?.ref_count || 0;
				return bUsage - aUsage; // Most used first
			}
			default:
				return 0;
		}
	});

	return sorted;
});

// Dashboard stats
const dashboardStats = $derived(() => {
	const totalVolumes = volumes.length;
	const usedVolumes = volumes.filter((vol) =>
		volumesStore.isVolumeInUse(vol),
	).length;
	const unusedVolumes = totalVolumes - usedVolumes;
	const totalSize = volumes.reduce(
		(sum, vol) => sum + (vol.usage_data?.size || 0),
		0,
	);
	const localVolumes = volumes.filter((vol) => vol.driver === "local").length;
	const externalVolumes = totalVolumes - localVolumes;

	return {
		totalVolumes,
		usedVolumes,
		unusedVolumes,
		totalSize,
		localVolumes,
		externalVolumes,
	};
});

// Status badge configuration
function getStatusBadge(volume: Volume) {
	const inUse = volumesStore.isVolumeInUse(volume);
	const isLocal = volume.driver === "local";

	if (inUse) {
		return {
			variant: "default" as const,
			class: "bg-green-600 text-white hover:bg-green-700",
			icon: CheckCircle2,
			text: "In Use",
		};
	}
	if (isLocal) {
		return {
			variant: "secondary" as const,
			class: "bg-gray-500 text-white hover:bg-gray-600",
			icon: Archive,
			text: "Available",
		};
	}
	return {
		variant: "outline" as const,
		class: "border-blue-500 text-blue-600",
		icon: Server,
		text: "External",
	};
}

// Driver badge configuration
function getDriverBadge(driver: string) {
	switch (driver) {
		case "local":
			return {
				variant: "outline" as const,
				class: "border-green-500 text-green-600",
				icon: HardDrive,
			};
		case "nfs":
			return {
				variant: "outline" as const,
				class: "border-blue-500 text-blue-600",
				icon: Server,
			};
		default:
			return {
				variant: "outline" as const,
				class: "border-purple-500 text-purple-600",
				icon: Database,
			};
	}
}

// Volume actions
async function handleVolumeAction(
	action: "remove" | "prune",
	volume?: Volume,
	options?: { force?: boolean },
) {
	try {
		let success = false;
		let actionName = "";

		switch (action) {
			case "remove":
				if (!volume) throw new Error("Volume is required for remove action");
				success = await volumesStore.removeVolume(volume.name, options?.force);
				actionName = "removed";
				break;
			case "prune":
				success = await volumesStore.pruneVolumes();
				actionName = "pruned";
				break;
		}

		if (success) {
			toast.success(
				`Successfully ${actionName} ${action === "remove" && volume ? `volume ${volume.name}` : "unused volumes"}`,
			);
		} else {
			throw new Error(volumeError || `Failed to ${action} volume`);
		}
	} catch (error: any) {
		console.error(`Failed to ${action} volume:`, error);
		toast.error(`Failed to ${action} volume: ${error.message}`);
	}
}

// Refresh volumes
async function handleRefresh() {
	try {
		await volumesStore.loadVolumes();
		toast.success("Volumes refreshed successfully");
	} catch (error) {
		console.error("Failed to refresh volumes:", error);
		toast.error("Failed to refresh volumes");
	}
}

// Create volume (placeholder)
function handleCreateVolume() {
	toast.info("Create volume functionality coming soon!");
}

// Browse volume (placeholder)
function handleBrowseVolume(volume: Volume) {
	toast.info(`Browse volume ${volume.name} functionality coming soon!`);
}

// Backup volume (placeholder)
function handleBackupVolume(volume: Volume) {
	toast.info(`Backup volume ${volume.name} functionality coming soon!`);
}

// Clone volume (placeholder)
function handleCloneVolume(volume: Volume) {
	toast.info(`Clone volume ${volume.name} functionality coming soon!`);
}

// Initialize on mount
onMount(async () => {
	// Load volumes if not already loaded
	if (volumes.length === 0 && !isLoadingVolumes) {
		await volumesStore.loadVolumes();
	}

	// Start auto-refresh
	volumesStore.startAutoRefresh(10000);
});

// Cleanup on destroy
onDestroy(() => {
	volumesStore.stopAutoRefresh();
});
</script>

<svelte:head>
  <title>Volumes - DocSee</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Volumes</h1>
      <p class="text-muted-foreground">
        Manage and monitor your Docker volumes and persistent storage
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
          <span class="text-muted-foreground">{filteredVolumes().length} volumes</span>
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm" onclick={handleRefresh} disabled={isLoadingVolumes}>
        <RefreshCw class="mr-2 h-4 w-4 {isLoadingVolumes ? 'animate-spin' : ''}" />
        Refresh
      </Button>
      <Button variant="outline" size="sm" onclick={() => handleVolumeAction("prune")}>
        <Trash2 class="mr-2 h-4 w-4" />
        Prune Unused
      </Button>
      <Button size="sm" onclick={handleCreateVolume}>
        <Plus class="mr-2 h-4 w-4" />
        Create Volume
      </Button>
    </div>
  </div>

  <!-- Error Alert -->
  {#if volumeError}
    <Alert.Root variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <Alert.Title>Error</Alert.Title>
      <Alert.Description>{volumeError}</Alert.Description>
    </Alert.Root>
  {/if}

  <!-- Stats Cards -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">
              Total Volumes
            </p>
            <p class="text-2xl font-bold">{dashboardStats().totalVolumes}</p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <HardDrive class="h-5 w-5" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">In Use</p>
            <p class="text-2xl font-bold text-green-600">
              {dashboardStats().usedVolumes}
            </p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/10 text-green-600"
          >
            <CheckCircle2 class="h-5 w-5" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Unused</p>
            <p class="text-2xl font-bold text-gray-600">
              {dashboardStats().unusedVolumes}
            </p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-600/10 text-gray-600"
          >
            <Archive class="h-5 w-5" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Total Size</p>
            <p class="text-2xl font-bold">{volumesStore.formatVolumeSize(dashboardStats().totalSize)}</p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600"
          >
            <Database class="h-5 w-5" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  </div>

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
            placeholder="Search volumes by name, driver, or mount point..."
            bind:value={searchTerm}
            class="pl-10"
          />
        </div>

        <!-- Usage Filter -->
        <Select.Root type="single" bind:value={usageFilter}>
          <Select.Trigger class="w-full sm:w-[180px]">
            <Filter class="mr-2 h-4 w-4" />
            <span class="truncate">
              {usageFilter === "all"
                ? "All Volumes"
                : usageFilter === "used"
                  ? "In Use"
                  : usageFilter === "unused"
                    ? "Unused"
                    : usageFilter === "local"
                      ? "Local"
                      : usageFilter === "external"
                        ? "External"
                        : "All Volumes"}
            </span>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all" label="All Volumes">All Volumes</Select.Item>
            <Select.Item value="used" label="In Use">In Use</Select.Item>
            <Select.Item value="unused" label="Unused">Unused</Select.Item>
            <Select.Item value="local" label="Local">Local</Select.Item>
            <Select.Item value="external" label="External">External</Select.Item>
          </Select.Content>
        </Select.Root>

        <!-- Sort By -->
        <Select.Root type="single" bind:value={sortBy}>
          <Select.Trigger class="w-full sm:w-[140px]">
            <span class="truncate">
              Sort by {sortBy === "name" ? "Name" : sortBy === "driver" ? "Driver" : sortBy === "created" ? "Created" : sortBy === "size" ? "Size" : "Usage"}
            </span>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="name">Name</Select.Item>
            <Select.Item value="driver">Driver</Select.Item>
            <Select.Item value="created">Created</Select.Item>
            <Select.Item value="size">Size</Select.Item>
            <Select.Item value="usage">Usage</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Volumes Table -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <HardDrive class="h-5 w-5" />
        Volume Storage
      </Card.Title>
      <Card.Description>
        {#if isLoadingVolumes}
          Loading volumes...
        {:else}
          {filteredVolumes().length} of {volumes.length} volumes
          {#if usageFilter !== "all"}
            • Filtered by {usageFilter}
          {/if}
          {#if searchTerm.trim()}
            • Search: "{searchTerm}"
          {/if}
        {/if}
      </Card.Description>
    </Card.Header>

    <Card.Content class="p-0">
      {#if isLoadingVolumes}
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
      {:else if filteredVolumes().length === 0}
        <!-- Empty State -->
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <HardDrive class="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 class="mb-2 text-lg font-semibold">No volumes found</h3>
          <p class="mb-4 text-sm text-muted-foreground max-w-md">
            {searchTerm || usageFilter !== "all"
              ? "No volumes match your current filters. Try adjusting your search or filter criteria."
              : connectionStatus.connected
                ? "No volumes are currently available. Create your first volume to get started."
                : "Connect to Docker to see your volumes."}
          </p>
          {#if searchTerm || usageFilter !== "all"}
            <Button
              variant="outline"
              size="sm"
              onclick={() => {
                searchTerm = "";
                usageFilter = "all";
              }}
            >
              Clear Filters
            </Button>
          {:else if connectionStatus.connected}
            <Button size="sm" onclick={handleCreateVolume}>
              <Plus class="mr-2 h-4 w-4" />
              Create Your First Volume
            </Button>
          {/if}
        </div>
      {:else}
        <!-- Volumes Table -->
        <div class="overflow-x-auto">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head class="min-w-[200px]">Volume Name</Table.Head>
                <Table.Head class="min-w-[100px]">Driver</Table.Head>
                <Table.Head class="min-w-[100px]">Status</Table.Head>
                <Table.Head class="min-w-[80px]">Size</Table.Head>
                <Table.Head class="min-w-[80px]">Usage</Table.Head>
                <Table.Head class="min-w-[100px]">Created</Table.Head>
                <Table.Head class="min-w-[200px]">Mount Point</Table.Head>
                <Table.Head class="w-[100px] text-right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each filteredVolumes() as volume (volume.name)}
                {@const statusBadge = getStatusBadge(volume)}
                {@const StatusIcon = statusBadge.icon}
                {@const driverBadge = getDriverBadge(volume.driver)}
                {@const DriverIcon = driverBadge.icon}
                {@const isOperationInProgress = volumeOperationInProgress?.some(op => op.includes(volume.name))}

                <Table.Row class="group hover:bg-muted/50">
                  <!-- Volume Name -->
                  <Table.Cell class="font-medium">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-background"
                      >
                        <HardDrive class="h-4 w-4" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="font-medium truncate" title={volume.name}>
                          {volume.name}
                        </div>
                        {#if volumesStore.hasVolumeLabels(volume)}
                          <div class="text-xs text-muted-foreground">
                            {Object.keys(volumesStore.getVolumeLabels(volume)).length} label{Object.keys(volumesStore.getVolumeLabels(volume)).length !== 1 ? 's' : ''}
                          </div>
                        {/if}
                      </div>
                    </div>
                  </Table.Cell>

                  <!-- Driver -->
                  <Table.Cell>
                    <Badge variant={driverBadge.variant} class="{driverBadge.class} gap-1 font-medium">
                      <DriverIcon class="h-3 w-3" />
                      {volume.driver}
                    </Badge>
                  </Table.Cell>

                  <!-- Status -->
                  <Table.Cell>
                    <Badge
                      variant={statusBadge.variant}
                      class="{statusBadge.class} gap-1.5 font-medium"
                    >
                      <StatusIcon class="h-3 w-3" />
                      {statusBadge.text}
                    </Badge>
                  </Table.Cell>

                  <!-- Size -->
                  <Table.Cell class="text-muted-foreground font-mono">
                    <div class="flex items-center gap-1">
                      <Database class="h-3 w-3" />
                      <span class="text-sm">
                        {volumesStore.formatVolumeSize(volume.usage_data?.size)}
                      </span>
                    </div>
                  </Table.Cell>

                  <!-- Usage -->
                  <Table.Cell class="text-muted-foreground">
                    <div class="flex items-center gap-1">
                      <FolderOpen class="h-3 w-3" />
                      <span class="text-sm">
                        {volume.usage_data?.ref_count || 0} ref{(volume.usage_data?.ref_count || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </Table.Cell>

                  <!-- Created -->
                  <Table.Cell class="text-muted-foreground">
                    <div class="flex items-center gap-1">
                      <Clock class="h-3 w-3" />
                      <span class="text-sm" title={new Date(volume.created_at).toLocaleString()}>
                        {volumesStore.formatVolumeCreated(volume.created_at)}
                      </span>
                    </div>
                  </Table.Cell>

                  <!-- Mount Point -->
                  <Table.Cell>
                    <div class="font-mono text-sm text-muted-foreground truncate" title={volume.mountpoint}>
                      {volume.mountpoint}
                    </div>
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
                        <!-- Volume Actions -->
                        <DropdownMenu.Item onclick={() => handleBrowseVolume(volume)}>
                          <FolderOpen class="mr-2 h-4 w-4" />
                          Browse
                        </DropdownMenu.Item>

                        <DropdownMenu.Separator />

                        <!-- Management Actions -->
                        <DropdownMenu.Item onclick={() => handleBackupVolume(volume)}>
                          <Archive class="mr-2 h-4 w-4" />
                          Backup
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onclick={() => handleCloneVolume(volume)}>
                          <Copy class="mr-2 h-4 w-4" />
                          Clone
                        </DropdownMenu.Item>
                        <DropdownMenu.Item>
                          <Settings class="mr-2 h-4 w-4" />
                          Inspect
                        </DropdownMenu.Item>

                        <DropdownMenu.Separator />

                        <!-- Destructive Actions -->
                        <DropdownMenu.Item
                          class="text-destructive focus:text-destructive"
                          onclick={() => handleVolumeAction("remove", volume)}
                          disabled={volumesStore.isVolumeInUse(volume)}
                        >
                          <Trash2 class="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenu.Item>
                        {#if volumesStore.isVolumeInUse(volume)}
                          <DropdownMenu.Item
                            class="text-destructive focus:text-destructive"
                            onclick={() => handleVolumeAction("remove", volume, { force: true })}
                          >
                            <Trash2 class="mr-2 h-4 w-4" />
                            Force Remove
                          </DropdownMenu.Item>
                        {/if}
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
