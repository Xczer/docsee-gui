<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import {
    connectionStatus,
    systemStats,
    loadSystemStats,
    isLoadingStats,
    dockerError,
    initializeDockerConnection,
  } from "$lib/stores/docker.svelte";
  import {
    containers,
    loadContainers,
    startContainerAutoRefresh,
    stopContainerAutoRefresh,
    isLoadingContainers,
  } from "$lib/stores/containers.svelte";
  import { formatRelativeTime, formatContainerStatus } from "$lib/utils";
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    Badge,
    Button,
  } from "$lib/components/ui";
  import DebugPanel from "$lib/components/DebugPanel.svelte";
  import TestComponent from "$lib/components/TestComponent.svelte";
  import {
    Container,
    Image,
    Network,
    HardDrive,
    Play,
    Square,
    ArrowUpRight,
    AlertTriangle,
    TrendingUp,
    Activity,
    Zap,
    RefreshCw,
  } from "lucide-svelte";
  import type { BadgeVariant } from "$lib/components/ui/Badge.svelte";

  // Reactive state
  let mounted = $state(false);
  let currentConnectionStatus = $derived(connectionStatus());
  let currentSystemStats = $derived(systemStats());
  let currentIsLoadingStats = $derived(isLoadingStats());
  let currentDockerError = $derived(dockerError());
  let currentContainers = $derived(containers());
  let currentIsLoadingContainers = $derived(isLoadingContainers());

  // Derived container states
  let runningContainers = $derived(currentContainers.filter((c) => c.state === "running"));
  let stoppedContainers = $derived(currentContainers.filter((c) => c.state === "exited" || c.state === "created"));
  let pausedContainers = $derived(currentContainers.filter((c) => c.state === "paused"));
  let recentContainers = $derived([...currentContainers].sort((a, b) => b.created - a.created).slice(0, 5));

  // Initialize and load data
  async function init() {
    mounted = true;
    console.log("Dashboard mounted, loading data...");

    try {
      await initializeDockerConnection();
      console.log("Docker connection initialized");

      if (currentConnectionStatus.connected) {
        await Promise.all([loadSystemStats(), loadContainers()]);
        startContainerAutoRefresh(5000);
      }
    } catch (error) {
      console.error("Failed to initialize Docker connection:", error);
    }
  }

  // Load data when connection status changes - moved to top level
  $effect(() => {
    if (mounted && currentConnectionStatus.connected) {
      console.log("Connection established, loading data...");
      loadSystemStats();
      loadContainers();
    }
  });

  // Cleanup - moved to top level and using onDestroy instead
  onDestroy(() => {
    stopContainerAutoRefresh();
    mounted = false;
  });

  // Stats cards data
  let statsCards = $derived([
    {
      title: "Total Containers",
      value: currentIsLoadingStats || currentIsLoadingContainers ? null : (currentSystemStats?.containers_total ?? currentContainers.length),
      icon: Container,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      href: "/containers",
    },
    {
      title: "Running",
      value: currentIsLoadingStats || currentIsLoadingContainers ? null : (currentSystemStats?.containers_running ?? runningContainers.length),
      icon: Play,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      href: "/containers",
    },
    {
      title: "Stopped",
      value: currentIsLoadingStats || currentIsLoadingContainers ? null : (currentSystemStats?.containers_stopped ?? stoppedContainers.length),
      icon: Square,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-900/20",
      href: "/containers",
    },
    {
      title: "Images",
      value: currentIsLoadingStats ? null : (currentSystemStats?.images_total ?? "-"),
      icon: Image,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      href: "/images",
    },
  ]);

  // Quick actions
  const quickActions = [
    {
      label: "Containers",
      icon: Container,
      href: "/containers",
      description: "Manage containers",
    },
    {
      label: "Images",
      icon: Image,
      href: "/images",
      description: "Browse images",
    },
    {
      label: "Networks",
      icon: Network,
      href: "/networks",
      description: "Network settings",
    },
    {
      label: "Volumes",
      icon: HardDrive,
      href: "/volumes",
      description: "Storage volumes",
    },
  ];

  // Helper functions
  function getContainerDisplayName(container: any) {
    return container.names?.[0]?.replace("/", "") || container.id.substring(0, 12);
  }

  function getStatusColor(state: string) {
    switch (state) {
      case "running": return "text-green-600 dark:text-green-400";
      case "exited": case "created": return "text-gray-600 dark:text-gray-400";
      case "paused": return "text-yellow-600 dark:text-yellow-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  }

  function navigateTo(path: string) {
    goto(path);
  }

  async function refreshData() {
    console.log("Refreshing data manually...");
    try {
      await initializeDockerConnection();
      if (currentConnectionStatus.connected) {
        await Promise.all([loadSystemStats(), loadContainers()]);
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  }

  // Initialize the component
  init();
</script>

<svelte:head>
  <title>Dashboard - DocSee</title>
</svelte:head>

<div class="space-y-8">
  <!-- Page Header -->
  <div class="flex items-center justify-between">
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">
        Dashboard
      </h1>
      <p class="text-muted-foreground">Overview of your Docker environment</p>
    </div>

    <!-- Refresh Button -->
    <Button variant="outline" onclick={refreshData}>
      <RefreshCw class="h-4 w-4 mr-2" />
      Refresh
    </Button>
  </div>

  <!-- Debug Panel -->
  <DebugPanel />

  <!-- Test Component -->
  <TestComponent />

  {#if !currentConnectionStatus.connected}
    <!-- Connection Required Notice -->
    <div
      class="alert border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10 rounded-lg p-4"
    >
      <div class="flex items-start gap-3">
        <AlertTriangle
          class="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5"
        />
        <div>
          <div class="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
            Docker Connection Required
          </div>
          <div class="text-sm text-yellow-700 dark:text-yellow-300">
            Please ensure Docker is running and try refreshing the connection.
            {#if currentDockerError}
              <br />Error: {currentDockerError}
            {/if}
          </div>
          <div class="mt-3">
            <Button variant="outline" size="sm" onclick={refreshData}>
              <RefreshCw class="h-3 w-3 mr-1" />
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Dashboard Content -->
    <div class="space-y-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {#each statsCards as card}
          {@const IconComponent = card.icon}
          <Card
            class="group cursor-pointer transition-all hover:shadow-md dark:hover:shadow-lg hover:scale-[1.02]"
            onclick={() => navigateTo(card.href)}
          >
            <CardContent class="p-6">
              <div class="flex items-center justify-between">
                <div class="space-y-2">
                  <p class="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <div class="text-2xl font-bold text-foreground">
                    {#if card.value === null}
                      <div
                        class="skeleton h-8 w-12 bg-muted animate-pulse rounded"
                      ></div>
                    {:else}
                      {card.value}
                    {/if}
                  </div>
                </div>
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-lg {card.bgColor}"
                >
                  <IconComponent class="h-6 w-6 {card.color}" />
                </div>
              </div>
              <div
                class="mt-4 flex items-center gap-2 text-xs text-muted-foreground"
              >
                <TrendingUp class="h-3 w-3" />
                <span class="hover:text-foreground transition-colors">
                  View details
                  <ArrowUpRight class="ml-1 h-3 w-3 inline" />
                </span>
              </div>
            </CardContent>
          </Card>
        {/each}
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <!-- Quick Actions -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Zap class="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Navigate to main features</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            {#each quickActions as action}
              {@const ActionIcon = action.icon}
              <Button
                variant="ghost"
                class="w-full justify-start h-auto p-4 group"
                onclick={() => navigateTo(action.href)}
              >
                <div class="flex items-center gap-4 w-full">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors"
                  >
                    <ActionIcon
                      class="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors"
                    />
                  </div>
                  <div class="flex-1 text-left">
                    <div
                      class="font-medium text-foreground group-hover:text-primary transition-colors"
                    >
                      {action.label}
                    </div>
                    <div class="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                  <ArrowUpRight
                    class="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"
                  />
                </div>
              </Button>
            {/each}
          </CardContent>
        </Card>

        <!-- Recent Containers -->
        <Card class="xl:col-span-2">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <CardTitle class="flex items-center gap-2">
                  <Activity class="h-5 w-5 text-primary" />
                  Recent Containers
                </CardTitle>
                <CardDescription>
                  Latest container activity ({currentContainers.length} total)
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onclick={() => navigateTo("/containers")}
              >
                View all
                <ArrowUpRight class="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {#if currentIsLoadingContainers}
              <div class="space-y-4">
                {#each Array(3) as _}
                  <div class="flex items-center gap-4">
                    <div
                      class="skeleton h-10 w-10 rounded-lg bg-muted animate-pulse"
                    ></div>
                    <div class="flex-1 space-y-2">
                      <div
                        class="skeleton h-4 w-32 bg-muted animate-pulse rounded"
                      ></div>
                      <div
                        class="skeleton h-3 w-48 bg-muted animate-pulse rounded"
                      ></div>
                    </div>
                    <div
                      class="skeleton h-6 w-16 rounded-full bg-muted animate-pulse"
                    ></div>
                  </div>
                {/each}
              </div>
            {:else if recentContainers.length === 0}
              <div
                class="flex flex-col items-center justify-center py-12 text-center"
              >
                <Container class="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 class="font-medium text-foreground mb-2">
                  No containers found
                </h3>
                <p class="text-sm text-muted-foreground mb-4">
                  {#if currentContainers.length === 0}
                    No containers exist yet.
                  {:else}
                    No recent containers to display.
                  {/if}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => navigateTo("/containers")}
                >
                  View all containers
                </Button>
              </div>
            {:else}
              <div class="space-y-4">
                {#each recentContainers as container}
                  <button
                    type="button"
                    class="flex items-center gap-4 group hover:bg-muted/50 rounded-lg p-3 -m-3 transition-colors cursor-pointer w-full text-left"
                    onclick={() => navigateTo(`/containers/${container.id}`)}
                    onkeydown={(e) =>
                      (e.key === "Enter" || e.key === "Space") &&
                      navigateTo(`/containers/${container.id}`)}
                  >
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"
                    >
                      <Container
                        class="h-5 w-5 {getStatusColor(container.state)}"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-foreground truncate">
                        {getContainerDisplayName(container)}
                      </div>
                      <div class="text-sm text-muted-foreground truncate">
                        {container.image}
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <Badge
                        variant={formatContainerStatus(container.state)
                          .variant as BadgeVariant}
                        class="text-xs"
                      >
                        {formatContainerStatus(container.state).label}
                      </Badge>
                      <div class="text-xs text-muted-foreground">
                        {formatRelativeTime(container.created * 1000)}
                      </div>
                    </div>
                  </button>
                {/each}
              </div>
            {/if}
          </CardContent>
        </Card>
      </div>
    </div>
  {/if}
</div>
