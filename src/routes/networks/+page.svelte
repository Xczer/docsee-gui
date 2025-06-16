<!-- src/routes/networks/+page.svelte -->
<script lang="ts">
import { onMount, onDestroy } from "svelte";
import {
	Network,
	Search,
	Filter,
	MoreHorizontal,
	Plus,
	RefreshCw,
	AlertCircle,
	CheckCircle2,
	Clock,
	Trash2,
	Settings,
	Link,
	Unlink,
	Globe,
	Shield,
	Server,
	Router,
	Wifi,
	Archive,
	Monitor,
	Container,
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
import { networksStore } from "$lib/stores/networks.svelte";
import { dockerStore } from "$lib/stores/docker.svelte";
import type { Network as NetworkType } from "$lib/types/network";
import { toast } from "svelte-sonner";

// Reactive state using runes
// biome-ignore lint/style/useConst: <explanation>
let searchTerm = $state("");
// biome-ignore lint/style/useConst: <explanation>
let usageFilter = $state<string>("all");
// biome-ignore lint/style/useConst: <explanation>
let sortBy = $state("name");

// Derived values from stores
const networks = $derived(networksStore.networks);
const isLoadingNetworks = $derived(networksStore.isLoadingNetworks);
const networkError = $derived(networksStore.networkError);
const networkOperationInProgress = $derived(
	networksStore.networkOperationInProgress,
);
const connectionStatus = $derived(dockerStore.connectionStatus);

// Update store filters when local state changes
$effect(() => {
	networksStore.setNetworkSearchTerm(searchTerm);
});

$effect(() => {
	networksStore.setNetworkFilter(usageFilter);
});

$effect(() => {
	networksStore.setNetworkSortBy(sortBy);
});

// Filtered and sorted networks
const filteredNetworks = $derived(() => {
	let filtered = networks;

	// Apply usage filter
	if (usageFilter !== "all") {
		filtered = filtered.filter((network) => {
			switch (usageFilter) {
				case "used":
					return networksStore.isNetworkInUse(network);
				case "unused":
					return !networksStore.isNetworkInUse(network);
				case "system":
					return networksStore.isSystemNetwork(network);
				case "custom":
					return !networksStore.isSystemNetwork(network);
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
	if (searchTerm.trim()) {
		const term = searchTerm.toLowerCase();
		filtered = filtered.filter((network) => {
			return (
				network.name.toLowerCase().includes(term) ||
				network.id.toLowerCase().includes(term) ||
				network.driver.toLowerCase().includes(term) ||
				networksStore.getNetworkSubnet(network).toLowerCase().includes(term)
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
				return new Date(b.created).getTime() - new Date(a.created).getTime(); // Newest first
			case "containers":
				return (
					networksStore.getNetworkContainerCount(b) -
					networksStore.getNetworkContainerCount(a)
				); // Most used first
			case "scope":
				return a.scope.localeCompare(b.scope);
			default:
				return 0;
		}
	});

	return sorted;
});

// Dashboard stats
const dashboardStats = $derived(() => {
	const totalNetworks = networks.length;
	const usedNetworks = networks.filter((net) =>
		networksStore.isNetworkInUse(net),
	).length;
	const unusedNetworks = totalNetworks - usedNetworks;
	const systemNetworks = networks.filter((net) =>
		networksStore.isSystemNetwork(net),
	).length;
	const customNetworks = totalNetworks - systemNetworks;
	const totalContainers = networks.reduce(
		(sum, net) => sum + networksStore.getNetworkContainerCount(net),
		0,
	);

	return {
		totalNetworks,
		usedNetworks,
		unusedNetworks,
		systemNetworks,
		customNetworks,
		totalContainers,
	};
});

// Status badge configuration
function getStatusBadge(network: NetworkType) {
	const inUse = networksStore.isNetworkInUse(network);
	const isSystem = networksStore.isSystemNetwork(network);

	if (inUse) {
		return {
			variant: "default" as const,
			class: "bg-green-600 text-white hover:bg-green-700",
			icon: CheckCircle2,
			text: "In Use",
		};
	}
	if (isSystem) {
		return {
			variant: "secondary" as const,
			class: "bg-blue-500 text-white hover:bg-blue-600",
			icon: Shield,
			text: "System",
		};
	}
	return {
		variant: "outline" as const,
		class: "border-gray-500 text-gray-600",
		icon: Archive,
		text: "Available",
	};
}

// Driver badge configuration
function getDriverBadge(driver: string) {
	switch (driver) {
		case "bridge":
			return {
				variant: "outline" as const,
				class: "border-green-500 text-green-600",
				icon: Router,
			};
		case "overlay":
			return {
				variant: "outline" as const,
				class: "border-blue-500 text-blue-600",
				icon: Globe,
			};
		case "host":
			return {
				variant: "outline" as const,
				class: "border-purple-500 text-purple-600",
				icon: Monitor,
			};
		case "macvlan":
			return {
				variant: "outline" as const,
				class: "border-orange-500 text-orange-600",
				icon: Wifi,
			};
		default:
			return {
				variant: "outline" as const,
				class: "border-gray-500 text-gray-600",
				icon: Network,
			};
	}
}

// Scope badge configuration
function getScopeBadge(scope: string) {
	switch (scope) {
		case "local":
			return {
				variant: "secondary" as const,
				class: "bg-gray-500 text-white",
				text: "Local",
			};
		case "global":
			return {
				variant: "default" as const,
				class: "bg-blue-600 text-white",
				text: "Global",
			};
		case "swarm":
			return {
				variant: "default" as const,
				class: "bg-purple-600 text-white",
				text: "Swarm",
			};
		default:
			return {
				variant: "outline" as const,
				class: "",
				text: scope,
			};
	}
}

// Network actions
async function handleNetworkAction(
	action: "remove" | "prune",
	network?: NetworkType,
) {
	try {
		let success = false;
		let actionName = "";

		switch (action) {
			case "remove":
				if (!network) throw new Error("Network is required for remove action");
				success = await networksStore.removeNetwork(network.id);
				actionName = "removed";
				break;
			case "prune":
				success = await networksStore.pruneNetworks();
				actionName = "pruned";
				break;
		}

		if (success) {
			toast.success(
				`Successfully ${actionName} ${action === "remove" && network ? `network ${network.name}` : "unused networks"}`,
			);
		} else {
			throw new Error(networkError || `Failed to ${action} network`);
		}
	} catch (error: any) {
		console.error(`Failed to ${action} network:`, error);
		toast.error(`Failed to ${action} network: ${error.message}`);
	}
}

// Refresh networks
async function handleRefresh() {
	try {
		await networksStore.loadNetworks();
		toast.success("Networks refreshed successfully");
	} catch (error) {
		console.error("Failed to refresh networks:", error);
		toast.error("Failed to refresh networks");
	}
}

// Create network (placeholder)
function handleCreateNetwork() {
	toast.info("Create network functionality coming soon!");
}

// Connect container (placeholder)
function handleConnectContainer(network: NetworkType) {
	toast.info(`Connect container to ${network.name} functionality coming soon!`);
}

// Disconnect container (placeholder)
function handleDisconnectContainer(network: NetworkType) {
	toast.info(
		`Disconnect container from ${network.name} functionality coming soon!`,
	);
}

// Initialize on mount
onMount(async () => {
	// Load networks if not already loaded
	if (networks.length === 0 && !isLoadingNetworks) {
		await networksStore.loadNetworks();
	}

	// Start auto-refresh
	networksStore.startAutoRefresh(10000);
});

// Cleanup on destroy
onDestroy(() => {
	networksStore.stopAutoRefresh();
});
</script>

<svelte:head>
  <title>Networks - DocSee</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Networks</h1>
      <p class="text-muted-foreground">
        Manage and monitor your Docker networks and container connectivity
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
          <span class="text-muted-foreground">{filteredNetworks().length} networks</span>
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm" onclick={handleRefresh} disabled={isLoadingNetworks}>
        <RefreshCw class="mr-2 h-4 w-4 {isLoadingNetworks ? 'animate-spin' : ''}" />
        Refresh
      </Button>
      <Button variant="outline" size="sm" onclick={() => handleNetworkAction("prune")}>
        <Trash2 class="mr-2 h-4 w-4" />
        Prune Unused
      </Button>
      <Button size="sm" onclick={handleCreateNetwork}>
        <Plus class="mr-2 h-4 w-4" />
        Create Network
      </Button>
    </div>
  </div>

  <!-- Error Alert -->
  {#if networkError}
    <Alert.Root variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <Alert.Title>Error</Alert.Title>
      <Alert.Description>{networkError}</Alert.Description>
    </Alert.Root>
  {/if}

  <!-- Stats Cards -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">
              Total Networks
            </p>
            <p class="text-2xl font-bold">{dashboardStats().totalNetworks}</p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Network class="h-5 w-5" />
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
              {dashboardStats().usedNetworks}
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
            <p class="text-sm font-medium text-muted-foreground">Custom</p>
            <p class="text-2xl font-bold text-blue-600">
              {dashboardStats().customNetworks}
            </p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600"
          >
            <Router class="h-5 w-5" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Connected Containers</p>
            <p class="text-2xl font-bold">{dashboardStats().totalContainers}</p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/10 text-purple-600"
          >
            <Container class="h-5 w-5" />
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
            placeholder="Search networks by name, ID, driver, or subnet..."
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
                ? "All Networks"
                : usageFilter === "used"
                  ? "In Use"
                  : usageFilter === "unused"
                    ? "Unused"
                    : usageFilter === "system"
                      ? "System"
                      : usageFilter === "custom"
                        ? "Custom"
                        : usageFilter === "bridge"
                          ? "Bridge"
                          : usageFilter === "overlay"
                            ? "Overlay"
                            : usageFilter === "host"
                              ? "Host"
                              : usageFilter === "macvlan"
                                ? "Macvlan"
                                : "All Networks"}
            </span>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all" label="All Networks">All Networks</Select.Item>
            <Select.Item value="used" label="In Use">In Use</Select.Item>
            <Select.Item value="unused" label="Unused">Unused</Select.Item>
            <Select.Separator />
            <Select.Item value="system" label="System">System</Select.Item>
            <Select.Item value="custom" label="Custom">Custom</Select.Item>
            <Select.Separator />
            <Select.Item value="bridge" label="Bridge">Bridge</Select.Item>
            <Select.Item value="overlay" label="Overlay">Overlay</Select.Item>
            <Select.Item value="host" label="Host">Host</Select.Item>
            <Select.Item value="macvlan" label="Macvlan">Macvlan</Select.Item>
          </Select.Content>
        </Select.Root>

        <!-- Sort By -->
        <Select.Root type="single" bind:value={sortBy}>
          <Select.Trigger class="w-full sm:w-[140px]">
            <span class="truncate">
              Sort by {sortBy === "name" ? "Name" : sortBy === "driver" ? "Driver" : sortBy === "created" ? "Created" : sortBy === "containers" ? "Containers" : "Scope"}
            </span>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="name">Name</Select.Item>
            <Select.Item value="driver">Driver</Select.Item>
            <Select.Item value="created">Created</Select.Item>
            <Select.Item value="containers">Containers</Select.Item>
            <Select.Item value="scope">Scope</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Networks Table -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Network class="h-5 w-5" />
        Network Infrastructure
      </Card.Title>
      <Card.Description>
        {#if isLoadingNetworks}
          Loading networks...
        {:else}
          {filteredNetworks().length} of {networks.length} networks
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
      {#if isLoadingNetworks}
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
      {:else if filteredNetworks().length === 0}
        <!-- Empty State -->
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <Network class="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 class="mb-2 text-lg font-semibold">No networks found</h3>
          <p class="mb-4 text-sm text-muted-foreground max-w-md">
            {searchTerm || usageFilter !== "all"
              ? "No networks match your current filters. Try adjusting your search or filter criteria."
              : connectionStatus.connected
                ? "No networks are currently available. Create your first network to get started."
                : "Connect to Docker to see your networks."}
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
            <Button size="sm" onclick={handleCreateNetwork}>
              <Plus class="mr-2 h-4 w-4" />
              Create Your First Network
            </Button>
          {/if}
        </div>
      {:else}
        <!-- Networks Table -->
        <div class="overflow-x-auto">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head class="min-w-[200px]">Network Name</Table.Head>
                <Table.Head class="min-w-[100px]">Driver</Table.Head>
                <Table.Head class="min-w-[80px]">Scope</Table.Head>
                <Table.Head class="min-w-[100px]">Status</Table.Head>
                <Table.Head class="min-w-[80px]">Containers</Table.Head>
                <Table.Head class="min-w-[120px]">Subnet</Table.Head>
                <Table.Head class="min-w-[100px]">Gateway</Table.Head>
                <Table.Head class="min-w-[100px]">Created</Table.Head>
                <Table.Head class="w-[100px] text-right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each filteredNetworks() as network (network.id)}
                {@const statusBadge = getStatusBadge(network)}
                {@const StatusIcon = statusBadge.icon}
                {@const driverBadge = getDriverBadge(network.driver)}
                {@const DriverIcon = driverBadge.icon}
                {@const scopeBadge = getScopeBadge(network.scope)}
                {@const isOperationInProgress = networkOperationInProgress?.some(op => op.includes(network.id))}

                <Table.Row class="group hover:bg-muted/50">
                  <!-- Network Name -->
                  <Table.Cell class="font-medium">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-background"
                      >
                        <Network class="h-4 w-4" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="font-medium truncate" title={network.name}>
                          {network.name}
                        </div>
                        <div class="text-xs text-muted-foreground font-mono truncate" title={network.id}>
                          {network.id.substring(0, 12)}
                        </div>
                      </div>
                    </div>
                  </Table.Cell>

                  <!-- Driver -->
                  <Table.Cell>
                    <Badge variant={driverBadge.variant} class="{driverBadge.class} gap-1 font-medium">
                      <DriverIcon class="h-3 w-3" />
                      {network.driver}
                    </Badge>
                  </Table.Cell>

                  <!-- Scope -->
                  <Table.Cell>
                    <Badge variant={scopeBadge.variant} class="{scopeBadge.class} gap-1 font-medium">
                      {scopeBadge.text}
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

                  <!-- Containers -->
                  <Table.Cell class="text-muted-foreground">
                    <div class="flex items-center gap-1">
                      <Container class="h-3 w-3" />
                      <span class="text-sm">
                        {networksStore.getNetworkContainerCount(network)}
                      </span>
                    </div>
                  </Table.Cell>

                  <!-- Subnet -->
                  <Table.Cell>
                    <div class="font-mono text-sm text-muted-foreground truncate" title={networksStore.getNetworkSubnet(network)}>
                      {networksStore.getNetworkSubnet(network)}
                    </div>
                  </Table.Cell>

                  <!-- Gateway -->
                  <Table.Cell>
                    <div class="font-mono text-sm text-muted-foreground truncate" title={networksStore.getNetworkGateway(network)}>
                      {networksStore.getNetworkGateway(network)}
                    </div>
                  </Table.Cell>

                  <!-- Created -->
                  <Table.Cell class="text-muted-foreground">
                    <div class="flex items-center gap-1">
                      <Clock class="h-3 w-3" />
                      <span class="text-sm" title={new Date(network.created).toLocaleString()}>
                        {networksStore.formatNetworkCreated(network.created)}
                      </span>
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
                      <DropdownMenu.Content align="end" class="w-[180px]">
                        <!-- Container Actions -->
                        <DropdownMenu.Item onclick={() => handleConnectContainer(network)}>
                          <Link class="mr-2 h-4 w-4" />
                          Connect Container
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onclick={() => handleDisconnectContainer(network)}>
                          <Unlink class="mr-2 h-4 w-4" />
                          Disconnect Container
                        </DropdownMenu.Item>

                        <DropdownMenu.Separator />

                        <!-- Management Actions -->
                        <DropdownMenu.Item>
                          <Settings class="mr-2 h-4 w-4" />
                          Inspect
                        </DropdownMenu.Item>

                        <DropdownMenu.Separator />

                        <!-- Destructive Actions -->
                        <DropdownMenu.Item
                          class="text-destructive focus:text-destructive"
                          onclick={() => handleNetworkAction("remove", network)}
                          disabled={networksStore.isNetworkInUse(network) || networksStore.isSystemNetwork(network)}
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
