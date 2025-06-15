<script lang="ts">
  import { onMount } from "svelte";
  import {
    Image,
    Download,
    Trash2,
    Search,
    Filter,
    MoreHorizontal,
    Play,
    Tag,
    Calendar,
    HardDrive,
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

  // Mock data
  let images = $state([
    {
      repository: "nginx",
      tag: "latest",
      imageId: "sha256:c316d5a335a5",
      created: "2 weeks ago",
      size: "142MB",
      inUse: true,
    },
    {
      repository: "redis",
      tag: "7-alpine",
      imageId: "sha256:f6494ac8e477",
      created: "1 month ago",
      size: "32MB",
      inUse: true,
    },
    {
      repository: "postgres",
      tag: "15",
      imageId: "sha256:9f94c11bcd3d",
      created: "3 weeks ago",
      size: "374MB",
      inUse: false,
    },
    {
      repository: "node",
      tag: "18-alpine",
      imageId: "sha256:b87cb7936b38",
      created: "1 week ago",
      size: "172MB",
      inUse: false,
    },
    {
      repository: "myapp",
      tag: "latest",
      imageId: "sha256:a1b2c3d4e5f6",
      created: "5 hours ago",
      size: "256MB",
      inUse: true,
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

  // Filtered images
  let filteredImages = $derived(() => {
    return images.filter((image) => {
      const matchesSearch = 
        image.repository.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.tag.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUsage =
        usageFilter === "all" ||
        (usageFilter === "used" && image.inUse) ||
        (usageFilter === "unused" && !image.inUse);
      return matchesSearch && matchesUsage;
    });
  });

  function formatImageName(repository: string, tag: string) {
    return `${repository}:${tag}`;
  }
</script>

<svelte:head>
  <title>Images - DocSee</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Images</h1>
      <p class="text-muted-foreground">
        Manage your Docker images and repositories
      </p>
    </div>
    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm">
        <Download class="h-4 w-4 mr-2" />
        Pull Image
      </Button>
      <Button size="sm">
        <Plus class="h-4 w-4 mr-2" />
        Build Image
      </Button>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Total Images</p>
            <p class="text-2xl font-bold">{images.length}</p>
          </div>
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Image class="h-5 w-5" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">In Use</p>
            <p class="text-2xl font-bold text-success">{images.filter(img => img.inUse).length}</p>
          </div>
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
            <Play class="h-5 w-5" />
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">Total Size</p>
            <p class="text-2xl font-bold">1.1GB</p>
          </div>
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
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
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            bind:value={searchTerm}
            class="pl-10"
          />
        </div>
        <Select.Root>
          <Select.Trigger class="w-[180px]">
            <Filter class="h-4 w-4 mr-2" />
            <Select.Value placeholder="Filter by usage" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all" onclick={() => usageFilter = 'all'}>All Images</Select.Item>
            <Select.Item value="used" onclick={() => usageFilter = 'used'}>In Use</Select.Item>
            <Select.Item value="unused" onclick={() => usageFilter = 'unused'}>Unused</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Images Table -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Image Repository</Card.Title>
      <Card.Description>
        {filteredImages.length} of {images.length} images
      </Card.Description>
    </Card.Header>
    <Card.Content class="p-0">
      {#if loading}
        <div class="p-6 space-y-4">
          {#each Array(5) as _}
            <div class="flex items-center space-x-4">
              <Skeleton class="h-10 w-10 rounded-lg" />
              <div class="space-y-2 flex-1">
                <Skeleton class="h-4 w-[250px]" />
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
              <Table.Head>Repository</Table.Head>
              <Table.Head>Tag</Table.Head>
              <Table.Head>Image ID</Table.Head>
              <Table.Head>Created</Table.Head>
              <Table.Head>Size</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head class="w-[100px]">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each filteredImages as image}
              <Table.Row class="group">
                <Table.Cell class="font-medium">
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover:bg-background transition-colors">
                      <Image class="h-4 w-4" />
                    </div>
                    <div class="font-medium">{image.repository}</div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="outline" class="gap-1">
                    <Tag class="h-3 w-3" />
                    {image.tag}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div class="font-mono text-sm text-muted-foreground">
                    {image.imageId}
                  </div>
                </Table.Cell>
                <Table.Cell class="text-muted-foreground">
                  <div class="flex items-center gap-1">
                    <Calendar class="h-3 w-3" />
                    {image.created}
                  </div>
                </Table.Cell>
                <Table.Cell class="text-muted-foreground font-mono">
                  {image.size}
                </Table.Cell>
                <Table.Cell>
                  {#if image.inUse}
                    <Badge class="bg-success text-success-foreground hover:bg-success/90 gap-1">
                      <Play class="h-3 w-3" />
                      In Use
                    </Badge>
                  {:else}
                    <Badge variant="secondary" class="gap-1">
                      <div class="h-2 w-2 rounded-full bg-muted-foreground"></div>
                      Unused
                    </Badge>
                  {/if}
                </Table.Cell>
                <Table.Cell>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8"
                      >
                        <MoreHorizontal class="h-4 w-4" />
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item>
                        <Play class="mr-2 h-4 w-4" />
                        Run Container
                      </DropdownMenu.Item>
                      <DropdownMenu.Item>
                        <Tag class="mr-2 h-4 w-4" />
                        Tag Image
                      </DropdownMenu.Item>
                      <DropdownMenu.Item>
                        <Download class="mr-2 h-4 w-4" />
                        Export
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item class="text-destructive" disabled={image.inUse}>
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
