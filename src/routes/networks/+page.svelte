<script lang="ts">
  import { onMount } from "svelte";
  import {
    Network,
    Globe,
    Shield,
    Link,
    Search,
    Filter,
    MoreHorizontal,
    Plus,
    Trash2,
    Settings,
    Info,
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
  let networks = $state([
    {
      id: "bridge",
      name: "bridge",
      driver: "bridge",
      scope: "local",
      subnet: "172.17.0.0/16",
      gateway: "172.17.0.1",
      containers: 3,
      created: "2 days ago",
      internal: false,
    },
    {
      id: "host",
      name: "host",
      driver: "host",
      scope: "local",
      subnet: "-",
      gateway: "-",
      containers: 0,
      created: "2 days ago",
      internal: false,
    },
    {
      id: "none",
      name: "none",
      driver: "null",
      scope: "local",
      subnet: "-",
      gateway: "-",
      containers: 0,
      created: "2 days ago",
      internal: true,
    },
    {
      id: "app-network",
      name: "app-network",
      driver: "bridge",
      scope: "local",
      subnet: "172.20.0.0/16",
      gateway: "172.20.0.1",
      containers: 2,
      created: "1 day ago",
      internal: false,
    },
    {
      id: "db-network",
      name: "db-network",
      driver: "bridge",
      scope: "local",
      subnet: "172.21.0.0/16",
      gateway: "172.21.0.1",
      containers: 1,
      created: "3 hours ago",
      internal: true,
    },
  ]);

  let searchTerm = $state("");
  let driverFilter = $state("all");
  let loading = $state(true);

  onMount(() => {
    // Simulate loading
    setTimeout(() => {
      loading = false;
    }, 1000);
  });

  // Filtered networks
  let filteredNetworks = $derived(() => {
    return networks.filter((network) => {
      const matchesSearch = network.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesDriver =
        driverFilter === "all" || network.driver === driverFilter;
      return matchesSearch && matchesDriver;
    });
  });

  function getDriverIcon(driver: string) {
    switch (driver) {
      case "bridge":
        return Link;
      case "host":
        return Globe;
      case "null":
        return Shield;
      default:
        return Network;
    }
  }

  function getDriverBadge(driver: string) {
    switch (driver) {
      case "bridge":
        return {
          variant: "default" as const,
          class: "bg-primary text-primary-foreground",
        };
      case "host":
        return {
          variant: "secondary" as const,
          class: "bg-success text-success-foreground",
        };
      case "null":
        return { variant: "outline" as const, class: "" };
      default:
        return { variant: "secondary" as const, class: "" };
    }
  }
</script>

<svelte:head>
  <title>Networks - DocSee</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Networks</h1>
      <p class="text-muted-foreground">
        Manage Docker networks and connectivity
      </p>
    </div>
    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm">
        <Info class="h-4 w-4 mr-2" />
        Network Info
      </Button>
      <Button size="sm">
        <Plus class="h-4 w-4 mr-2" />
        Create Network
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
              Total Networks
            </p>
            <p class="text-2xl font-bold">{networks.length}</p>
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
            <p class="text-sm font-medium text-muted-foreground">
              Bridge Networks
            </p>
            <p class="text-2xl font-bold text-primary">
              {networks.filter((n) => n.driver === "bridge").length}
            </p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Link class="h-5 w-5" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">
              Connected Containers
            </p>
            <p class="text-2xl font-bold text-success">
              {networks.reduce((sum, n) => sum + n.containers, 0)}
            </p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success"
          >
            <Globe class="h-5 w-5" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">
              Internal Networks
            </p>
            <p class="text-2xl font-bold text-warning">
              {networks.filter((n) => n.internal).length}
            </p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning"
          >
            <Shield class="h-5 w-5" />
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
            placeholder="Search networks..."
            bind:value={searchTerm}
            class="pl-10"
          />
        </div>
        <Select.Root type="single" bind:value={driverFilter}>
          <Select.Trigger class="w-[180px]">
            <Filter class="h-4 w-4 mr-2" />
            {driverFilter === "all"
              ? "Filter by driver"
              : driverFilter === "bridge"
                ? "Bridge"
                : driverFilter === "host"
                  ? "Host"
                  : "None"}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Drivers</Select.Item>
            <Select.Item value="bridge">Bridge</Select.Item>
            <Select.Item value="host">Host</Select.Item>
            <Select.Item value="null">None</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Networks Table -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Network List</Card.Title>
      <Card.Description>
        {filteredNetworks.length} of {networks.length} networks
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
              <Table.Head>Network</Table.Head>
              <Table.Head>Driver</Table.Head>
              <Table.Head>Scope</Table.Head>
              <Table.Head>Subnet</Table.Head>
              <Table.Head>Gateway</Table.Head>
              <Table.Head>Containers</Table.Head>
              <Table.Head>Created</Table.Head>
              <Table.Head class="w-[100px]">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each filteredNetworks() as network}
              {@const driverBadge = getDriverBadge(network.driver)}
              {@const DriverIcon = getDriverIcon(network.driver)}
              <Table.Row class="group">
                <Table.Cell class="font-medium">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover:bg-background transition-colors"
                    >
                      <Network class="h-4 w-4" />
                    </div>
                    <div>
                      <div class="font-medium">{network.name}</div>
                      <div class="text-xs text-muted-foreground font-mono">
                        {network.id}
                      </div>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    variant={driverBadge.variant}
                    class="{driverBadge.class} gap-1.5"
                  >
                    <DriverIcon class="h-3 w-3" />
                    {network.driver}
                  </Badge>
                </Table.Cell>
                <Table.Cell class="text-muted-foreground">
                  {network.scope}
                </Table.Cell>
                <Table.Cell>
                  <div class="font-mono text-sm">{network.subnet}</div>
                </Table.Cell>
                <Table.Cell>
                  <div class="font-mono text-sm">{network.gateway}</div>
                </Table.Cell>
                <Table.Cell>
                  {#if network.containers > 0}
                    <Badge
                      variant="secondary"
                      class="bg-success/10 text-success"
                    >
                      {network.containers}
                    </Badge>
                  {:else}
                    <span class="text-muted-foreground">0</span>
                  {/if}
                </Table.Cell>
                <Table.Cell class="text-muted-foreground">
                  {network.created}
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
                        <Settings class="mr-2 h-4 w-4" />
                        Configure
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        class="text-destructive"
                        disabled={network.containers > 0 ||
                          ["bridge", "host", "none"].includes(network.name)}
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
