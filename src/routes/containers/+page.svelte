<script lang="ts">
  import { onMount } from "svelte";
  import {
    Container,
    Play,
    Square,
    Pause,
    RotateCcw,
    Trash2,
    Download,
    Search,
    Filter,
    MoreHorizontal,
    Terminal,
    FileText,
    Settings,
    Plus,
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

  // Mock data
  let containers = $state([
    {
      id: "nginx-web-1",
      name: "nginx-web-1",
      image: "nginx:latest",
      status: "running",
      ports: "80:8080, 443:8443",
      created: "2 hours ago",
      size: "142MB",
    },
    {
      id: "redis-cache-1",
      name: "redis-cache-1",
      image: "redis:7-alpine",
      status: "running",
      ports: "6379:6379",
      created: "1 day ago",
      size: "32MB",
    },
    {
      id: "postgres-db-1",
      name: "postgres-db-1",
      image: "postgres:15",
      status: "stopped",
      ports: "5432:5432",
      created: "3 days ago",
      size: "374MB",
    },
    {
      id: "app-worker-1",
      name: "app-worker-1",
      image: "myapp:latest",
      status: "paused",
      ports: "-",
      created: "5 hours ago",
      size: "256MB",
    },
  ]);

  let searchTerm = $state("");
  let statusFilter = $state("all");
  let loading = $state(true);

  onMount(() => {
    // Simulate loading
    setTimeout(() => {
      loading = false;
    }, 1000);
  });

  // Filtered containers
  let filteredContainers = $derived(() => {
    return containers.filter((container) => {
      const matchesSearch = container.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || container.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  });

  function getStatusBadge(status: string) {
    switch (status) {
      case "running":
        return {
          variant: "default" as const,
          class: "bg-success text-success-foreground hover:bg-success/90",
        };
      case "stopped":
        return { variant: "destructive" as const, class: "" };
      case "paused":
        return {
          variant: "secondary" as const,
          class: "bg-warning text-warning-foreground hover:bg-warning/90",
        };
      default:
        return { variant: "secondary" as const, class: "" };
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "running":
        return Play;
      case "stopped":
        return Square;
      case "paused":
        return Pause;
      default:
        return RotateCcw;
    }
  }
</script>

<svelte:head>
  <title>Containers - DocSee</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Containers</h1>
      <p class="text-muted-foreground">
        Manage and monitor your Docker containers
      </p>
    </div>
    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm">
        <Download class="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button size="sm">
        <Plus class="h-4 w-4 mr-2" />
        Create Container
      </Button>
    </div>
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
            placeholder="Search containers..."
            bind:value={searchTerm}
            class="pl-10"
          />
        </div>
        <Select.Root type="single" bind:value={statusFilter}>
          <Select.Trigger class="w-[180px]">
            <Filter class="h-4 w-4 mr-2" />
            {statusFilter === "all"
              ? "Filter by status"
              : statusFilter === "running"
                ? "Running"
                : statusFilter === "stopped"
                  ? "Stopped"
                  : "Paused"}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Status</Select.Item>
            <Select.Item value="running">Running</Select.Item>
            <Select.Item value="stopped">Stopped</Select.Item>
            <Select.Item value="paused">Paused</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Containers Table -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Container List</Card.Title>
      <Card.Description>
        {filteredContainers.length} of {containers.length} containers
      </Card.Description>
    </Card.Header>
    <Card.Content class="p-0">
      {#if loading}
        <div class="p-6 space-y-4">
          {#each Array(4) as _}
            <div class="flex items-center space-x-4">
              <Skeleton class="h-10 w-10 rounded-lg" />
              <div class="space-y-2 flex-1">
                <Skeleton class="h-4 w-[200px]" />
                <Skeleton class="h-3 w-[300px]" />
              </div>
              <Skeleton class="h-6 w-16 rounded-full" />
            </div>
          {/each}
        </div>
      {:else}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Container</Table.Head>
              <Table.Head>Image</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Ports</Table.Head>
              <Table.Head>Created</Table.Head>
              <Table.Head>Size</Table.Head>
              <Table.Head class="w-[100px]">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each filteredContainers() as container}
              {@const statusBadge = getStatusBadge(container.status)}
              {@const StatusIcon = getStatusIcon(container.status)}
              <Table.Row class="group">
                <Table.Cell class="font-medium">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover:bg-background transition-colors"
                    >
                      <Container class="h-4 w-4" />
                    </div>
                    <div>
                      <div class="font-medium">{container.name}</div>
                      <div class="text-xs text-muted-foreground font-mono">
                        {container.id}
                      </div>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div class="font-mono text-sm">{container.image}</div>
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    variant={statusBadge.variant}
                    class="{statusBadge.class} gap-1.5"
                  >
                    <StatusIcon class="h-3 w-3" />
                    {container.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div class="font-mono text-sm">{container.ports}</div>
                </Table.Cell>
                <Table.Cell class="text-muted-foreground">
                  {container.created}
                </Table.Cell>
                <Table.Cell class="text-muted-foreground">
                  {container.size}
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
                        <Terminal class="mr-2 h-4 w-4" />
                        Exec
                      </DropdownMenu.Item>
                      <DropdownMenu.Item>
                        <FileText class="mr-2 h-4 w-4" />
                        Logs
                      </DropdownMenu.Item>
                      <DropdownMenu.Item>
                        <Settings class="mr-2 h-4 w-4" />
                        Inspect
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item class="text-destructive">
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
