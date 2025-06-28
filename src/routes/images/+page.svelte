<!-- src/routes/images/+page.svelte -->
<script lang="ts">
import {
	AlertCircle,
	Archive,
	Calendar,
	CheckCircle2,
	Clock,
	Container,
	Download,
	Filter,
	HardDrive,
	Image,
	MoreHorizontal,
	Play,
	Plus,
	RefreshCw,
	Search,
	Tag,
	Trash2,
} from "lucide-svelte";
import { onDestroy, onMount } from "svelte";

import * as Alert from "$lib/components/ui/alert";
import { Badge } from "$lib/components/ui/badge";
// Import shadcn-svelte components
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
import { Input } from "$lib/components/ui/input";
import * as Select from "$lib/components/ui/select";
import { Separator } from "$lib/components/ui/separator";
import { Skeleton } from "$lib/components/ui/skeleton";
import * as Table from "$lib/components/ui/table";

import { dockerStore } from "$lib/stores/docker.svelte";
// Import stores and types
import { imagesStore } from "$lib/stores/images.svelte";
import type { ImageSummary } from "$lib/types/image";
import { toast } from "svelte-sonner";

// Reactive state using runes
// biome-ignore lint/style/useConst: <explanation>
let searchTerm = $state("");
// biome-ignore lint/style/useConst: <explanation>
let usageFilter = $state<string>("all");
// biome-ignore lint/style/useConst: <explanation>
let sortBy = $state("name");

// Derived values from stores
const images = $derived(imagesStore.images);
const isLoadingImages = $derived(imagesStore.isLoadingImages);
const imageError = $derived(imagesStore.imageError);
const imageOperationInProgress = $derived(imagesStore.imageOperationInProgress);
const connectionStatus = $derived(dockerStore.connectionStatus);

// Update store filters when local state changes
$effect(() => {
	imagesStore.setImageSearchTerm(searchTerm);
});

$effect(() => {
	imagesStore.setImageFilter(usageFilter);
});

$effect(() => {
	imagesStore.setImageSortBy(sortBy);
});

// Filtered and sorted images
const filteredImages = $derived(() => {
	let filtered = images;

	// Apply usage filter
	if (usageFilter !== "all") {
		filtered = filtered.filter((image) => {
			switch (usageFilter) {
				case "used":
					return imagesStore.isImageInUse(image);
				case "unused":
					return !imagesStore.isImageInUse(image);
				case "tagged":
					return (
						image.repo_tags &&
						image.repo_tags.length > 0 &&
						!image.repo_tags.includes("<none>:<none>")
					);
				case "untagged":
					return (
						!image.repo_tags ||
						image.repo_tags.length === 0 ||
						image.repo_tags.includes("<none>:<none>")
					);
				default:
					return true;
			}
		});
	}

	// Apply search filter
	if (searchTerm.trim()) {
		const term = searchTerm.toLowerCase();
		filtered = filtered.filter((image) => {
			const repoTags = image.repo_tags?.join(" ").toLowerCase() || "";
			const imageId = image.id.toLowerCase();
			return repoTags.includes(term) || imageId.includes(term);
		});
	}

	// Apply sorting
	const sorted = [...filtered];
	sorted.sort((a, b) => {
		switch (sortBy) {
			case "name": {
				const aName = imagesStore.getImageDisplayName(a);
				const bName = imagesStore.getImageDisplayName(b);
				return aName.localeCompare(bName);
			}
			case "size":
				return b.size - a.size; // Largest first
			case "created":
				return b.created - a.created; // Newest first
			case "containers":
				return b.containers - a.containers; // Most used first
			default:
				return 0;
		}
	});

	return sorted;
});

// Dashboard stats
const dashboardStats = $derived(() => {
	const totalImages = images.length;
	const usedImages = images.filter((img) =>
		imagesStore.isImageInUse(img),
	).length;
	const unusedImages = totalImages - usedImages;
	const totalSize = images.reduce((sum, img) => sum + img.size, 0);
	const taggedImages = images.filter(
		(img) =>
			img.repo_tags &&
			img.repo_tags.length > 0 &&
			!img.repo_tags.includes("<none>:<none>"),
	).length;

	return {
		totalImages,
		usedImages,
		unusedImages,
		totalSize,
		taggedImages,
		untaggedImages: totalImages - taggedImages,
	};
});

// Status badge configuration
function getStatusBadge(image: ImageSummary) {
	const inUse = imagesStore.isImageInUse(image);
	const isTagged =
		image.repo_tags &&
		image.repo_tags.length > 0 &&
		!image.repo_tags.includes("<none>:<none>");

	if (inUse) {
		return {
			variant: "default" as const,
			class: "bg-green-600 text-white hover:bg-green-700",
			icon: CheckCircle2,
			text: "In Use",
		};
	}
	if (isTagged) {
		return {
			variant: "secondary" as const,
			class: "bg-gray-500 text-white hover:bg-gray-600",
			icon: Archive,
			text: "Available",
		};
	}
	return {
		variant: "outline" as const,
		class: "border-yellow-500 text-yellow-600",
		icon: Clock,
		text: "Dangling",
	};
}

// Image actions
async function handleImageAction(
	action: "remove" | "pull",
	image: ImageSummary,
	options?: { force?: boolean; tag?: string },
) {
	try {
		const imageIdentifier =
			action === "remove" ? image.id : imagesStore.getImageDisplayName(image);
		const success = await imagesStore.performImageAction(
			action,
			imageIdentifier,
			options,
		);

		if (success) {
			toast.success(
				`Successfully ${action === "remove" ? "removed" : "pulled"} image ${imagesStore.getImageDisplayName(image)}`,
			);
		} else {
			throw new Error(imageError || `Failed to ${action} image`);
		}
	} catch (error: any) {
		console.error(`Failed to ${action} image:`, error);
		toast.error(`Failed to ${action} image: ${error.message}`);
	}
}

// Refresh images
async function handleRefresh() {
	try {
		await imagesStore.loadImages(true);
		toast.success("Images refreshed successfully");
	} catch (error) {
		console.error("Failed to refresh images:", error);
		toast.error("Failed to refresh images");
	}
}

// Pull image (placeholder)
function handlePullImage() {
	toast.info("Pull image functionality coming soon!");
}

// Build image (placeholder)
function handleBuildImage() {
	toast.info("Build image functionality coming soon!");
}

// Initialize on mount
onMount(async () => {
	// Load images if not already loaded
	if (images.length === 0 && !isLoadingImages) {
		await imagesStore.loadImages(true);
	}

	// Start auto-refresh
	imagesStore.startAutoRefresh(10000);
});

// Cleanup on destroy
onDestroy(() => {
	imagesStore.stopAutoRefresh();
});
</script>

<svelte:head>
  <title>Images - DocSee</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Images</h1>
      <p class="text-muted-foreground">
        Manage and monitor your Docker images and repositories
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
          <span class="text-muted-foreground">{filteredImages().length} images</span>
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm" onclick={handleRefresh} disabled={isLoadingImages}>
        <RefreshCw class="mr-2 h-4 w-4 {isLoadingImages ? 'animate-spin' : ''}" />
        Refresh
      </Button>
      <Button variant="outline" size="sm" onclick={handlePullImage}>
        <Download class="mr-2 h-4 w-4" />
        Pull Image
      </Button>
      <Button size="sm" onclick={handleBuildImage}>
        <Plus class="mr-2 h-4 w-4" />
        Build Image
      </Button>
    </div>
  </div>

  <!-- Error Alert -->
  {#if imageError}
    <Alert.Root variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <Alert.Title>Error</Alert.Title>
      <Alert.Description>{imageError}</Alert.Description>
    </Alert.Root>
  {/if}

  <!-- Stats Cards -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card.Root>
      <Card.Content class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">
              Total Images
            </p>
            <p class="text-2xl font-bold">{dashboardStats().totalImages}</p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
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
            <p class="text-2xl font-bold text-green-600">
              {dashboardStats().usedImages}
            </p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/10 text-green-600"
          >
            <Container class="h-5 w-5" />
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
              {dashboardStats().unusedImages}
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
            <p class="text-2xl font-bold">{imagesStore.formatImageSize(dashboardStats().totalSize)}</p>
          </div>
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600"
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
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <!-- Search -->
        <div class="relative flex-1">
          <Search
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search images by name, tag, or ID..."
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
                ? "All Images"
                : usageFilter === "used"
                  ? "In Use"
                  : usageFilter === "unused"
                    ? "Unused"
                    : usageFilter === "tagged"
                      ? "Tagged"
                      : usageFilter === "untagged"
                        ? "Untagged"
                        : "All Images"}
            </span>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all" label="All Images">All Images</Select.Item>
            <Select.Item value="used" label="In Use">In Use</Select.Item>
            <Select.Item value="unused" label="Unused">Unused</Select.Item>
            <Select.Item value="tagged" label="Tagged">Tagged</Select.Item>
            <Select.Item value="untagged" label="Untagged">Untagged</Select.Item>
          </Select.Content>
        </Select.Root>

        <!-- Sort By -->
        <Select.Root type="single" bind:value={sortBy}>
          <Select.Trigger class="w-full sm:w-[140px]">
            <span class="truncate">
              Sort by {sortBy === "name" ? "Name" : sortBy === "size" ? "Size" : sortBy === "created" ? "Created" : "Containers"}
            </span>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="name">Name</Select.Item>
            <Select.Item value="size">Size</Select.Item>
            <Select.Item value="created">Created</Select.Item>
            <Select.Item value="containers">Containers</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Images Table -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Image class="h-5 w-5" />
        Image Repository
      </Card.Title>
      <Card.Description>
        {#if isLoadingImages}
          Loading images...
        {:else}
          {filteredImages().length} of {images.length} images
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
      {#if isLoadingImages}
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
      {:else if filteredImages().length === 0}
        <!-- Empty State -->
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <Image class="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 class="mb-2 text-lg font-semibold">No images found</h3>
          <p class="mb-4 text-sm text-muted-foreground max-w-md">
            {searchTerm || usageFilter !== "all"
              ? "No images match your current filters. Try adjusting your search or filter criteria."
              : connectionStatus.connected
                ? "No images are currently available. Pull or build your first image to get started."
                : "Connect to Docker to see your images."}
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
            <div class="flex gap-2">
              <Button size="sm" onclick={handlePullImage}>
                <Download class="mr-2 h-4 w-4" />
                Pull Image
              </Button>
              <Button variant="outline" size="sm" onclick={handleBuildImage}>
                <Plus class="mr-2 h-4 w-4" />
                Build Image
              </Button>
            </div>
          {/if}
        </div>
      {:else}
        <!-- Images Table -->
        <div class="overflow-x-auto">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head class="min-w-[200px]">Repository</Table.Head>
                <Table.Head class="min-w-[100px]">Tag</Table.Head>
                <Table.Head class="min-w-[120px]">Image ID</Table.Head>
                <Table.Head class="min-w-[100px]">Created</Table.Head>
                <Table.Head class="min-w-[80px]">Size</Table.Head>
                <Table.Head class="min-w-[100px]">Status</Table.Head>
                <Table.Head class="w-[100px] text-right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each filteredImages() as image (image.id)}
                {@const statusBadge = getStatusBadge(image)}
                {@const StatusIcon = statusBadge.icon}
                {@const displayName = imagesStore.getImageDisplayName(image)}
                {@const repository = imagesStore.getImageRepository(image)}
                {@const tag = imagesStore.getImageTag(image)}
                {@const isOperationInProgress = imageOperationInProgress?.some(op => op.includes(image.id))}

                <Table.Row class="group hover:bg-muted/50">
                  <!-- Repository -->
                  <Table.Cell class="font-medium">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-background"
                      >
                        <Image class="h-4 w-4" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="font-medium truncate" title={repository}>
                          {repository}
                        </div>
                        {#if image.containers > 0}
                          <div class="text-xs text-muted-foreground">
                            {image.containers} container{image.containers !== 1 ? 's' : ''}
                          </div>
                        {/if}
                      </div>
                    </div>
                  </Table.Cell>

                  <!-- Tag -->
                  <Table.Cell>
                    <Badge variant="outline" class="gap-1 font-mono">
                      <Tag class="h-3 w-3" />
                      {tag}
                    </Badge>
                  </Table.Cell>

                  <!-- Image ID -->
                  <Table.Cell>
                    <div class="font-mono text-sm text-muted-foreground truncate" title={image.id}>
                      {image.id.substring(7, 19)}
                    </div>
                  </Table.Cell>

                  <!-- Created -->
                  <Table.Cell class="text-muted-foreground">
                    <div class="flex items-center gap-1">
                      <Calendar class="h-3 w-3" />
                      <span class="text-sm" title={new Date(image.created * 1000).toLocaleString()}>
                        {imagesStore.formatImageCreated(image.created)}
                      </span>
                    </div>
                  </Table.Cell>

                  <!-- Size -->
                  <Table.Cell class="text-muted-foreground font-mono">
                    <div class="flex items-center gap-1">
                      <HardDrive class="h-3 w-3" />
                      <span class="text-sm">
                        {imagesStore.formatImageSize(image.size)}
                      </span>
                    </div>
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
                        <!-- Container Actions -->
                        <DropdownMenu.Item>
                          <Play class="mr-2 h-4 w-4" />
                          Run Container
                        </DropdownMenu.Item>

                        <DropdownMenu.Separator />

                        <!-- Image Actions -->
                        <DropdownMenu.Item>
                          <Tag class="mr-2 h-4 w-4" />
                          Tag Image
                        </DropdownMenu.Item>
                        <DropdownMenu.Item>
                          <Download class="mr-2 h-4 w-4" />
                          Save Image
                        </DropdownMenu.Item>
                        <DropdownMenu.Item>
                          <Archive class="mr-2 h-4 w-4" />
                          Export
                        </DropdownMenu.Item>

                        <DropdownMenu.Separator />

                        <!-- Destructive Actions -->
                        <DropdownMenu.Item
                          class="text-destructive focus:text-destructive"
                          onclick={() => handleImageAction("remove", image)}
                          disabled={imagesStore.isImageInUse(image)}
                        >
                          <Trash2 class="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenu.Item>
                        {#if imagesStore.isImageInUse(image)}
                          <DropdownMenu.Item
                            class="text-destructive focus:text-destructive"
                            onclick={() => handleImageAction("remove", image, { force: true })}
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
