<script lang="ts">
  import { onMount } from "svelte";
  import { dockerStore } from "$lib/stores/docker.svelte";
  import { containersStore } from "$lib/stores/containers.svelte";
  import {
    Container,
    Image,
    Network,
    HardDrive,
    Play,
    Square,
    RefreshCw,
    Activity,
    Clock,
    Cpu,
    MemoryStick,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    ArrowRight,
    Eye,
    Pause,
    RotateCcw,
  } from "lucide-svelte";

  // Import shadcn-svelte components
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import * as Card from "$lib/components/ui/card";
  import * as Alert from "$lib/components/ui/alert";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { Separator } from "$lib/components/ui/separator";
  import { formatRelativeTime, formatContainerStatus } from "$lib/utils";

  // Safe mounting pattern
  let mounted = $state(false);

  // Safe store access after mounting
  let connectionStatus = $derived(
    mounted
      ? dockerStore.connectionStatus
      : {
          connected: false,
          error: undefined,
          version: undefined,
          api_version: undefined,
        },
  );
  let containers = $derived(mounted ? containersStore.containers : []);
  let isLoadingContainers = $derived(
    mounted ? containersStore.isLoadingContainers : false,
  );

  // Derived statistics
  let runningContainers = $derived(
    containers.filter((c) => c.state === "running"),
  );
  let stoppedContainers = $derived(
    containers.filter((c) => c.state === "exited" || c.state === "created"),
  );
  let pausedContainers = $derived(
    containers.filter((c) => c.state === "paused"),
  );
  let totalContainers = $derived(containers.length);

  // Recent activity (last 5 containers)
  let recentContainers = $derived(
    containers.sort((a, b) => b.created - a.created).slice(0, 5),
  );

  // System health indicator
  let systemHealth = $derived(() => {
    if (!connectionStatus.connected) return "error";
    if (runningContainers.length === 0 && totalContainers > 0) return "warning";
    return "healthy";
  });

  onMount(async () => {
    mounted = true;
    console.log("Professional Dashboard mounted");

    try {
      await dockerStore.initializeDockerConnection();

      if (dockerStore.connectionStatus.connected) {
        await containersStore.loadContainers();
      }
    } catch (error) {
      console.error("Dashboard initialization error:", error);
    }
  });

  async function refreshData() {
    try {
      await dockerStore.initializeDockerConnection();
      if (dockerStore.connectionStatus.connected) {
        await containersStore.loadContainers();
      }
    } catch (error) {
      console.error("Refresh error:", error);
    }
  }

  function getContainerDisplayName(container: any) {
    return (
      container.names?.[0]?.replace("/", "") || container.id.substring(0, 12)
    );
  }

  function getContainerIcon(state: string) {
    switch (state) {
      case "running":
        return Play;
      case "paused":
        return Pause;
      case "restarting":
        return RotateCcw;
      default:
        return Square;
    }
  }

  function getBadgeVariant(state: string): "default" | "secondary" | "destructive" | "outline" {
    switch (state) {
      case "running":
        return "default"; // Will be styled with success colors via class
      case "paused":
        return "secondary";
      case "restarting":
        return "outline";
      case "exited":
      case "created":
        return "destructive";
      default:
        return "secondary";
    }
  }

  function getBadgeClass(state: string): string {
    switch (state) {
      case "running":
        return "bg-success text-success-foreground hover:bg-success/90";
      case "paused":
        return "bg-warning text-warning-foreground hover:bg-warning/90";
      case "restarting":
        return "border-chart-5 text-chart-5";
      default:
        return "";
    }
  }
</script>

<svelte:head>
  <title>Dashboard - DocSee</title>
  <meta name="description" content="Docker container management dashboard" />
</svelte:head>

<div class="space-y-6">
  <!-- Dashboard Header -->
  <div class="flex items-center justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">
        Monitor and manage your Docker infrastructure
      </p>
    </div>

    <div class="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onclick={refreshData}
        disabled={isLoadingContainers}
      >
        <RefreshCw
          class="h-4 w-4 mr-2 {isLoadingContainers ? 'animate-spin' : ''}"
        />
        Refresh
      </Button>

      <Button size="sm" href="/containers">
        <Container class="h-4 w-4 mr-2" />
        View All Containers
      </Button>
    </div>
  </div>

  <!-- System Status Alert -->
  {#if !connectionStatus.connected}
    <Alert.Root variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <Alert.Title>Docker Connection Failed</Alert.Title>
      <Alert.Description>
        Docker daemon is not accessible. Please ensure Docker is running and try
        refreshing the connection.
      </Alert.Description>
    </Alert.Root>
  {:else if connectionStatus.error}
    <Alert.Root>
      <AlertTriangle class="h-4 w-4" />
      <Alert.Title>Connection Warning</Alert.Title>
      <Alert.Description>
        Connection issues detected: {connectionStatus.error}
      </Alert.Description>
    </Alert.Root>
  {/if}

  <!-- Stats Overview -->
  <div class="stats-grid">
    <!-- Total Containers -->
    <Card.Root class="card-hover">
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">
              Total Containers
            </p>
            <p class="text-2xl font-bold">{totalContainers}</p>
            <p class="text-xs text-muted-foreground">
              {totalContainers > 0
                ? "Containers registered"
                : "No containers found"}
            </p>
          </div>
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Container class="h-6 w-6" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Running Containers -->
    <Card.Root class="card-hover">
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Running</p>
            <p class="text-2xl font-bold text-success">
              {runningContainers.length}
            </p>
            <p class="text-xs text-muted-foreground">
              {runningContainers.length > 0
                ? "Active containers"
                : "No active containers"}
            </p>
          </div>
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success"
          >
            <Play class="h-6 w-6" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Stopped Containers -->
    <Card.Root class="card-hover">
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Stopped</p>
            <p class="text-2xl font-bold text-muted-foreground">
              {stoppedContainers.length}
            </p>
            <p class="text-xs text-muted-foreground">
              {stoppedContainers.length > 0
                ? "Inactive containers"
                : "All containers running"}
            </p>
          </div>
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground"
          >
            <Square class="h-6 w-6" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- System Health -->
    <Card.Root class="card-hover">
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">
              System Health
            </p>
            <p class="text-2xl font-bold {systemHealth() === 'healthy' ? 'text-success' : systemHealth() === 'warning' ? 'text-warning' : 'text-destructive'}">
              {systemHealth() === "healthy"
                ? "Excellent"
                : systemHealth() === "warning"
                  ? "Warning"
                  : "Critical"}
            </p>
            <p class="text-xs text-muted-foreground">
              {connectionStatus.connected
                ? "Docker connected"
                : "Docker disconnected"}
            </p>
          </div>
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg {systemHealth() === 'healthy' ? 'bg-success/10 text-success' : systemHealth() === 'warning' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}"
          >
            {#if systemHealth() === "healthy"}
              <CheckCircle class="h-6 w-6" />
            {:else if systemHealth() === "warning"}
              <AlertTriangle class="h-6 w-6" />
            {:else}
              <AlertTriangle class="h-6 w-6" />
            {/if}
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Main Content Grid -->
  <div class="content-grid">
    <!-- Recent Activity -->
    <Card.Root class="lg:col-span-2">
      <Card.Header>
        <div class="flex items-center justify-between">
          <div class="space-y-1.5">
            <Card.Title>Recent Containers</Card.Title>
            <Card.Description>
              Latest container activity and status
            </Card.Description>
          </div>
          <Button variant="ghost" size="sm" href="/containers">
            <Eye class="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
      </Card.Header>

      <Card.Content>
        {#if isLoadingContainers}
          <div class="space-y-4">
            {#each Array(3) as _}
              <div class="flex items-center space-x-4">
                <Skeleton class="h-10 w-10 rounded-lg" />
                <div class="space-y-2 flex-1">
                  <Skeleton class="h-4 w-[200px]" />
                  <Skeleton class="h-3 w-[150px]" />
                </div>
                <Skeleton class="h-6 w-16 rounded-full" />
              </div>
            {/each}
          </div>
        {:else if recentContainers.length === 0}
          <div class="text-center py-12">
            <Container class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 class="text-lg font-medium mb-2">No containers found</h3>
            <p class="text-sm text-muted-foreground mb-4">
              Pull or create a container to get started
            </p>
            <Button variant="outline" href="/containers">
              <Container class="h-4 w-4 mr-2" />
              Manage Containers
            </Button>
          </div>
        {:else}
          <div class="space-y-3">
            {#each recentContainers as container, i}
              {@const IconComponent = getContainerIcon(container.state)}
              <div
                class="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
              >
                <div class="flex items-center space-x-4">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-background transition-colors"
                  >
                    <svelte:component this={IconComponent} class="h-5 w-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <h4 class="font-medium truncate">
                      {getContainerDisplayName(container)}
                    </h4>
                    <div
                      class="flex items-center space-x-2 text-sm text-muted-foreground"
                    >
                      <span class="truncate">{container.image}</span>
                      <span>•</span>
                      <span class="flex items-center gap-1">
                        <Clock class="h-3 w-3" />
                        {formatRelativeTime(container.created * 1000)}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center space-x-3">
                  <Badge
                    variant={getBadgeVariant(container.state)}
                    class="{getBadgeClass(container.state)} gap-1.5"
                  >
                    <div class="status-dot status-dot-{container.state}"></div>
                    {formatContainerStatus(container.state).label}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="icon"
                    href={`/containers/${container.id}`}
                    class="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ArrowRight class="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {#if i < recentContainers.length - 1}
                <Separator />
              {/if}
            {/each}
          </div>
        {/if}
      </Card.Content>

      {#if recentContainers.length > 0}
        <Card.Footer>
          <Button variant="outline" class="w-full" href="/containers">
            View All {totalContainers} Containers
          </Button>
        </Card.Footer>
      {/if}
    </Card.Root>

    <!-- Quick Actions -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Quick Actions</Card.Title>
        <Card.Description>Common Docker operations</Card.Description>
      </Card.Header>

      <Card.Content class="space-y-3">
        <Button
          variant="outline"
          class="w-full justify-start"
          href="/containers"
        >
          <Container class="h-4 w-4 mr-3" />
          Manage Containers
        </Button>

        <Button variant="outline" class="w-full justify-start" href="/images">
          <Image class="h-4 w-4 mr-3" />
          Browse Images
        </Button>

        <Button
          variant="outline"
          class="w-full justify-start"
          href="/networks"
        >
          <Network class="h-4 w-4 mr-3" />
          Network Settings
        </Button>

        <Button variant="outline" class="w-full justify-start" href="/volumes">
          <HardDrive class="h-4 w-4 mr-3" />
          Volume Storage
        </Button>
      </Card.Content>

      <Card.Footer>
        <Button variant="ghost" class="w-full" href="/settings">
          Configure DocSee
        </Button>
      </Card.Footer>
    </Card.Root>
  </div>

  <!-- System Information -->
  {#if connectionStatus.connected}
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <Activity class="h-5 w-5" />
          System Information
        </Card.Title>
        <Card.Description>
          Docker daemon details and connection info
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-2">
            <p class="text-sm font-medium text-muted-foreground">
              Docker Version
            </p>
            <p class="text-lg font-semibold font-mono">
              {connectionStatus.version || "Unknown"}
            </p>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-muted-foreground">API Version</p>
            <p class="text-lg font-semibold font-mono">
              {connectionStatus.api_version || "Unknown"}
            </p>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium text-muted-foreground">
              Connection Status
            </p>
            <Badge class="bg-success text-success-foreground hover:bg-success/90 gap-1.5">
              <CheckCircle class="h-3 w-3" />
              Connected
            </Badge>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
