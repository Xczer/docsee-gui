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
  } from "lucide-svelte";
  
  // Import Card components
  import Card from "$lib/components/ui/Card.svelte";
  import CardContent from "$lib/components/ui/CardContent.svelte";
  import CardHeader from "$lib/components/ui/CardHeader.svelte";
  import CardTitle from "$lib/components/ui/CardTitle.svelte";

  // Simple state - SAFE PATTERN
  let mounted = $state(false);

  // Only access stores after mounting - SAFE PATTERN
  let connectionStatus = $derived(mounted ? dockerStore.connectionStatus : { connected: false, error: undefined, version: undefined, api_version: undefined });
  let containers = $derived(mounted ? containersStore.containers : []);
  let isLoadingContainers = $derived(mounted ? containersStore.isLoadingContainers : false);

  // Simple derived states
  let runningContainers = $derived(containers.filter((c) => c.state === "running"));
  let stoppedContainers = $derived(containers.filter((c) => c.state === "exited" || c.state === "created"));

  onMount(async () => {
    mounted = true;
    console.log("Dashboard mounted");

    try {
      await dockerStore.initializeDockerConnection();
      console.log("Docker initialized:", dockerStore.connectionStatus);

      if (dockerStore.connectionStatus.connected) {
        await containersStore.loadContainers();
        console.log("Containers loaded:", containersStore.containers.length);
      }
    } catch (error) {
      console.error("Initialization error:", error);
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
    return container.names?.[0]?.replace("/", "") || container.id.substring(0, 12);
  }
</script>

<svelte:head>
  <title>Dashboard - DocSee</title>
</svelte:head>

<div class="p-8">
  <h1 class="text-3xl font-bold mb-6">DocSee Dashboard</h1>

  <!-- Debug Info Card -->
  <Card class="mb-6">
    <CardHeader>
      <CardTitle size="md">Debug Info</CardTitle>
    </CardHeader>
    <CardContent>
      <ul class="space-y-1 text-sm">
        <li>Mounted: {mounted}</li>
        <li>Connected: {connectionStatus.connected}</li>
        <li>Docker Version: {connectionStatus.version || 'N/A'}</li>
        <li>Total Containers: {containers.length}</li>
        <li>Loading Containers: {isLoadingContainers}</li>
      </ul>
      <button
        class="mt-3 btn btn-default btn-sm"
        onclick={refreshData}
      >
        <RefreshCw class="inline h-4 w-4 mr-2" />
        Refresh
      </button>
    </CardContent>
  </Card>

  <!-- Stats Cards Grid -->
  <div class="stats-grid mb-8">
    <Card>
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Total Containers</p>
            <p class="text-2xl font-bold">{containers.length}</p>
          </div>
          <Container class="h-8 w-8 text-blue-500" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Running</p>
            <p class="text-2xl font-bold text-green-600">{runningContainers.length}</p>
          </div>
          <Play class="h-8 w-8 text-green-500" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Stopped</p>
            <p class="text-2xl font-bold text-gray-600">{stoppedContainers.length}</p>
          </div>
          <Square class="h-8 w-8 text-gray-500" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Images</p>
            <p class="text-2xl font-bold">-</p>
          </div>
          <Image class="h-8 w-8 text-purple-500" />
        </div>
      </CardContent>
    </Card>
  </div>

  <!-- Connection Status Card -->
  {#if !connectionStatus.connected}
    <Card class="mb-6 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
      <CardContent class="p-4">
        <h3 class="font-semibold text-yellow-800 dark:text-yellow-200">Docker Not Connected</h3>
        <p class="text-yellow-700 dark:text-yellow-300">Please ensure Docker is running and try refreshing.</p>
      </CardContent>
    </Card>
  {:else}
    <Card class="mb-6 border-green-300 bg-green-50 dark:bg-green-900/20">
      <CardContent class="p-4">
        <h3 class="font-semibold text-green-800 dark:text-green-200">Docker Connected</h3>
        <p class="text-green-700 dark:text-green-300">Version: {connectionStatus.version}</p>
      </CardContent>
    </Card>
  {/if}

  <!-- Containers List Card -->
  {#if connectionStatus.connected}
    <Card>
      <CardHeader>
        <CardTitle size="lg">Recent Containers</CardTitle>
      </CardHeader>

      <CardContent>
        {#if isLoadingContainers}
          <p class="text-muted-foreground">Loading containers...</p>
        {:else if containers.length === 0}
          <p class="text-muted-foreground">No containers found</p>
        {:else}
          <div class="space-y-3">
            {#each containers.slice(0, 5) as container}
              <Card class="border-muted">
                <CardContent class="p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="font-medium">{getContainerDisplayName(container)}</h3>
                      <p class="text-sm text-muted-foreground">Image: {container.image}</p>
                      <p class="text-sm text-muted-foreground">ID: {container.id.substring(0, 12)}</p>
                    </div>
                    <div class="text-right">
                      <span class="badge badge-{container.state === 'running' ? 'running' : 'secondary'}">
                        {container.state}
                      </span>
                      <p class="text-xs text-muted-foreground mt-1">
                        Created: {new Date(container.created * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>
