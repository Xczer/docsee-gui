<!-- src/routes/+page.svelte -->
<script>
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
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
  import * as Alert from "$lib/components/ui/alert";
  import {
    Play,
    Square,
    Trash2,
    Container,
    HardDrive,
    Activity,
    AlertCircle,
    CheckCircle,
  } from "lucide-svelte";
  import { toast } from "svelte-sonner";

  // Sample data for testing
  let containers = $state([
    {
      id: "nginx-1",
      name: "nginx-web",
      status: "running",
      image: "nginx:latest",
      port: "80:80",
    },
    {
      id: "redis-1",
      name: "redis-cache",
      status: "running",
      image: "redis:alpine",
      port: "6379:6379",
    },
    {
      id: "postgres-1",
      name: "postgres-db",
      status: "stopped",
      image: "postgres:13",
      port: "5432:5432",
    },
  ]);

  let stats = $state({
    totalContainers: 12,
    runningContainers: 8,
    totalImages: 15,
    diskUsage: 65,
  });

  /**
   * @param {string} action
   * @param {{ id: any; name: any; status?: string; image?: string; port?: string; }} container
   */
  function handleAction(action, container) {
    toast(`${action} action on ${container.name}`, {
      description: `Container ID: ${container.id}`,
    });
  }
</script>

<svelte:head>
  <title>DocSee - Docker Manager</title>
</svelte:head>

<div class="space-y-6">
  <!-- Welcome Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Docker Dashboard</h1>
      <p class="text-muted-foreground">
        Monitor and manage your Docker containers, images, and volumes
      </p>
    </div>
    <Button onclick={() => toast("Refresh triggered!")}>
      <Activity class="mr-2 h-4 w-4" />
      Refresh
    </Button>
  </div>

  <!-- Stats Cards -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-2"
      >
        <CardTitle class="text-sm font-medium">Total Containers</CardTitle>
        <Container class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{stats.totalContainers}</div>
        <Badge variant="secondary" class="mt-1">+2 from last week</Badge>
      </CardContent>
    </Card>

    <Card>
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-2"
      >
        <CardTitle class="text-sm font-medium">Running</CardTitle>
        <CheckCircle class="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-green-600">
          {stats.runningContainers}
        </div>
        <Badge variant="default" class="mt-1">Active</Badge>
      </CardContent>
    </Card>

    <Card>
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-2"
      >
        <CardTitle class="text-sm font-medium">Images</CardTitle>
        <HardDrive class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{stats.totalImages}</div>
        <Badge variant="outline" class="mt-1">Available</Badge>
      </CardContent>
    </Card>

    <Card>
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-2"
      >
        <CardTitle class="text-sm font-medium">Disk Usage</CardTitle>
        <AlertCircle class="h-4 w-4 text-yellow-600" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{stats.diskUsage}%</div>
        <Progress value={stats.diskUsage} class="mt-2" />
      </CardContent>
    </Card>
  </div>

  <!-- Alert Component Test -->
  <Alert.Root>
    <AlertCircle class="h-4 w-4" />
    <Alert.Title>Shadcn-Svelte Setup Test</Alert.Title>
    <Alert.Description>
      If you can see this styled alert with proper theming, your setup is
      working correctly!
    </Alert.Description>
  </Alert.Root>

  <Separator />

  <!-- Containers Table -->
  <Card>
    <CardHeader>
      <CardTitle>Recent Containers</CardTitle>
      <CardDescription>
        A list of your recent Docker containers with their current status
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Image</Table.Head>
            <Table.Head>Ports</Table.Head>
            <Table.Head class="text-right">Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each containers as container}
            <Table.Row>
              <Table.Cell class="font-medium">{container.name}</Table.Cell>
              <Table.Cell>
                <Badge
                  variant={container.status === "running"
                    ? "default"
                    : "secondary"}
                  class={container.status === "running" ? "bg-green-600" : ""}
                >
                  {container.status}
                </Badge>
              </Table.Cell>
              <Table.Cell class="text-muted-foreground"
                >{container.image}</Table.Cell
              >
              <Table.Cell class="font-mono text-sm">{container.port}</Table.Cell
              >
              <Table.Cell class="text-right">
                <div class="flex justify-end gap-2">
                  {#if container.status === "running"}
                    <Button
                      size="sm"
                      variant="outline"
                      onclick={() => handleAction("Stop", container)}
                    >
                      <Square class="h-3 w-3" />
                    </Button>
                  {:else}
                    <Button
                      size="sm"
                      variant="outline"
                      onclick={() => handleAction("Start", container)}
                    >
                      <Play class="h-3 w-3" />
                    </Button>
                  {/if}
                  <Button
                    size="sm"
                    variant="destructive"
                    onclick={() => handleAction("Delete", container)}
                  >
                    <Trash2 class="h-3 w-3" />
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </CardContent>
  </Card>

  <!-- Component Testing Section -->
  <Card>
    <CardHeader>
      <CardTitle>Component Testing</CardTitle>
      <CardDescription>Testing various Shadcn-Svelte components</CardDescription
      >
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex flex-wrap gap-2">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>

      <Separator />

      <div class="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    </CardContent>
  </Card>
</div>
