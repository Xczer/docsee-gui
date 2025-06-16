<script lang="ts">
  import { onMount } from "svelte";
  import {
    HardDrive,
    Database,
    Folder,
    Search,
    Filter,
    MoreHorizontal,
    Plus,
    Trash2,
    Settings,
    Info,
    Copy,
    Download,
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

  // Mock data
  let volumes = $state([
    {
      name: "postgres_data",
      driver: "local",
      mountpoint: "/var/lib/docker/volumes/postgres_data/_data",
      created: "3 days ago",
      size: "1.2GB",
      containers: 1,
      scope: "local",
    },
    {
      name: "redis_data",
      driver: "local",
      mountpoint: "/var/lib/docker/volumes/redis_data/_data",
      created: "1 day ago",
      size: "45MB",
      containers: 1,
      scope: "local",
    },
    {
      name: "app_logs",
      driver: "local",
      mountpoint: "/var/lib/docker/volumes/app_logs/_data",
      created: "5 hours ago",
      size: "256MB",
      containers: 2,
      scope: "local",
    },
    {
      name: "shared_config",
      driver: "local",
      mountpoint: "/var/lib/docker/volumes/shared_config/_data",
      created: "2 weeks ago",
      size: "12MB",
      containers: 3,
      scope: "local",
    },
    {
      name: "backup_volume",
      driver: "local",
      mountpoint: "/var/lib/docker/volumes/backup_volume/_data",
      created: "1 week ago",
      size: "3.4GB",
      containers: 0,
      scope: "local",
    },
  ]);

  let searchTerm = $state("");
  let usageFilter = $state("all");
  let loading = $state(true);

  onMount(() => {
    // Simulate loading
    setTimeout(() => {
      loading = false;
    }, 1000);
  });

  // Filtered volumes
  let filteredVolumes = $derived(() => {
    return volumes.filter((volume) => {
      const matchesSearch = volume.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesUsage =
        usageFilter === "all" ||
        (usageFilter === "used" && volume.containers > 0) ||
        (usageFilter === "unused" && volume.containers === 0);
      return matchesSearch && matchesUsage;
    });
  });

  function formatSize(size: string) {
    return size;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
</script>

<svelte:head>
  <title>Volumes - DocSee</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Volumes</h1>
      <p class="text-muted-foreground">
        Manage Docker volumes and persistent storage
      </p>
    </div>
    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm">
        <Download class="h-4 w-4 mr-2" />
        Export Volume
      </Button>
      <Button size="sm">
        <Plus class="h-4 w-4 mr-2" />
        Create Volume
      </Button>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">
              Total Volumes
            </p>
            <p class="text-2xl font-bold">{volumes.length}</p>
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
            <p class="text-2xl font-bold text-success">
              {volumes.filter((v) => v.containers > 0).length}
            </p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success"
          >
            <Database class="h-5 w-5" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Unused</p>
            <p class="text-2xl font-bold text-warning">
              {volumes.filter((v) => v.containers === 0).length}
            </p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning"
          >
            <Folder class="h-5 w-5" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Total Size</p>
            <p class="text-2xl font-bold">5.0GB</p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3"
          >
            <HardDrive class="h-5 w-5" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Filters -->
  <Card.Root>
    <Card.Content class="p-4">
      <div class="flex items-center gap-4">
        <div class="flex-1 relative">
          <Search
            class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            placeholder="Search volumes..."
            bind:value={searchTerm}
            class="pl-10"
          />
        </div>
        <Select.Root type="single" bind:value={usageFilter}>
          <Select.Trigger class="w-[180px]">
            <Filter class="h-4 w-4 mr-2" />
            {usageFilter === "all"
              ? "Filter by usage"
              : usageFilter === "used"
                ? "In Use"
                : "Unused"}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Volumes</Select.Item>
            <Select.Item value="used">In Use</Select.Item>
            <Select.Item value="unused">Unused</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Volumes Table -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Volume Storage</Card.Title>
      <Card.Description>
        {filteredVolumes.length} of {volumes.length} volumes
      </Card.Description>
    </Card.Header>
    <Card.Content class="p-0">
      {#if loading}
        <div class="p-6 space-y-4">
          {#each Array(5) as _}
            <div class="flex items-center space-x-4">
              <Skeleton class="h-10 w-10 rounded-lg" />
              <div class="space-y-2 flex-1">
                <Skeleton class="h-4 w-[200px]" />
                <Skeleton class="h-3 w-[400px]" />
              </div>
              <Skeleton class="h-6 w-16 rounded-full" />
            </div>
          {/each}
        </div>
      {:else}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Volume Name</Table.Head>
              <Table.Head>Driver</Table.Head>
              <Table.Head>Mount Point</Table.Head>
              <Table.Head>Size</Table.Head>
              <Table.Head>Containers</Table.Head>
              <Table.Head>Created</Table.Head>
              <Table.Head class="w-[100px]">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each filteredVolumes() as volume}
              <Table.Row class="group">
                <Table.Cell class="font-medium">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover:bg-background transition-colors"
                    >
                      <HardDrive class="h-4 w-4" />
                    </div>
                    <div class="font-medium">{volume.name}</div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="outline" class="gap-1">
                    <Database class="h-3 w-3" />
                    {volume.driver}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div class="flex items-center gap-2 max-w-[300px]">
                    <code
                      class="font-mono text-xs text-muted-foreground truncate"
                    >
                      {volume.mountpoint}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onclick={() => copyToClipboard(volume.mountpoint)}
                    >
                      <Copy class="h-3 w-3" />
                    </Button>
                  </div>
                </Table.Cell>
                <Table.Cell class="font-mono text-sm">
                  {volume.size}
                </Table.Cell>
                <Table.Cell>
                  {#if volume.containers > 0}
                    <Badge
                      class="bg-success text-success-foreground hover:bg-success/90 gap-1"
                    >
                      <Database class="h-3 w-3" />
                      {volume.containers}
                    </Badge>
                  {:else}
                    <Badge variant="secondary" class="gap-1">
                      <div
                        class="h-2 w-2 rounded-full bg-muted-foreground"
                      ></div>
                      Unused
                    </Badge>
                  {/if}
                </Table.Cell>
                <Table.Cell class="text-muted-foreground">
                  {volume.created}
                </Table.Cell>
                <Table.Cell>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <MoreHorizontal class="h-4 w-4" />
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item>
                        <Info class="mr-2 h-4 w-4" />
                        Inspect
                      </DropdownMenu.Item>
                      <DropdownMenu.Item>
                        <Copy class="mr-2 h-4 w-4" />
                        Copy Path
                      </DropdownMenu.Item>
                      <DropdownMenu.Item>
                        <Download class="mr-2 h-4 w-4" />
                        Backup
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        class="text-destructive"
                        disabled={volume.containers > 0}
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
      {/if}
    </Card.Content>
  </Card.Root>
</div>
