<!-- src/lib/components/containers/LogsViewer.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    Terminal,
    Download,
    RefreshCw,
    Search,
    Filter,
    Play,
    Pause,
    Trash2,
    Settings,
    ScrollText,
    FileText,
    Clock,
    AlertCircle,
    CheckCircle2,
    Copy,
    ExternalLink,
    ArrowDown,
  } from "lucide-svelte";

  // Import shadcn-svelte components
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import * as Card from "$lib/components/ui/card";
  import * as Sheet from "$lib/components/ui/sheet";
  import { Input } from "$lib/components/ui/input";
  import * as Select from "$lib/components/ui/select";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Label } from "$lib/components/ui/label";
  import { Separator } from "$lib/components/ui/separator";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import * as Alert from "$lib/components/ui/alert";
  import { Skeleton } from "$lib/components/ui/skeleton";

  // Import services and types
  import { getContainerLogs } from "$lib/services/tauri-commands";
  import type { ContainerLogLine } from "$lib/types/container";
  import { toast } from "svelte-sonner";

  // Props
  interface Props {
    containerId: string;
    containerName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }

  const { containerId, containerName, open, onOpenChange }: Props = $props();

  // State
  let logs: ContainerLogLine[] = $state([]);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let autoRefresh = $state(false);
  // biome-ignore lint/style/useConst: <explanation>
  let searchTerm = $state("");
  // biome-ignore lint/style/useConst: <explanation>
  let showTimestamps = $state(true);
  // biome-ignore lint/style/useConst: <explanation>
  let showStdout = $state(true);
  // biome-ignore lint/style/useConst: <explanation>
  let showStderr = $state(true);
  // biome-ignore lint/style/useConst: <explanation>
  let tailLines = $state("100");
  // biome-ignore lint/style/useConst: <explanation>
  let sinceTime = $state("");
  // biome-ignore lint/style/useConst: <explanation>
  let untilTime = $state("");

  // Refs
  // let scrollAreaElement: HTMLElement;
  // svelte-ignore non_reactive_update
  let scrollViewport: HTMLElement;
  // biome-ignore lint/style/useConst: <explanation>
  let autoScrollEnabled = $state(true);
  let isNearBottom = $state(true);
  let autoRefreshInterval: NodeJS.Timeout | null = null;

  // Computed values
  const filteredLogs = $derived(() => {
    let filtered = logs;

    // Filter by stream type
    if (!showStdout && !showStderr) {
      return [];
    }
    if (!showStdout) {
      filtered = filtered.filter((log) => log.stream !== "stdout");
    } else if (!showStderr) {
      filtered = filtered.filter((log) => log.stream !== "stderr");
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((log) =>
        log.content.toLowerCase().includes(term),
      );
    }

    return filtered;
  });

  // Scroll management
  function checkScrollPosition() {
    if (!scrollViewport) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollViewport;
    const scrollBottom = scrollTop + clientHeight;
    const threshold = 50; // pixels from bottom

    isNearBottom = scrollHeight - scrollBottom <= threshold;
  }

  function scrollToBottom() {
    if (!scrollViewport) return;

    setTimeout(() => {
      scrollViewport.scrollTop = scrollViewport.scrollHeight;
      isNearBottom = true;
    }, 100);
  }

  // Load logs function
  async function loadLogs(isRefresh = false) {
    if (isLoading && !isRefresh) return;

    try {
      isLoading = true;
      error = null;

      const logsData = await getContainerLogs(
        containerId,
        false, // follow
        tailLines || "100",
        sinceTime || undefined,
        untilTime || undefined,
      );

      logs = logsData || [];

      // Auto-scroll to bottom if enabled and user is at bottom
      if (autoScrollEnabled && isNearBottom) {
        scrollToBottom();
      }

      // Don't show toast for auto-refresh to avoid spam
      if (isRefresh && !autoRefresh) {
        toast.success("Logs refreshed successfully");
      }
    } catch (err: any) {
      console.error("Failed to load logs:", err);
      error = err.message || "Failed to load container logs";
      if (isRefresh && !autoRefresh) {
        toast.error("Failed to refresh logs");
      }
    } finally {
      isLoading = false;
    }
  }

  // Auto refresh functionality
  function startAutoRefresh() {
    stopAutoRefresh();
    if (autoRefresh) {
      autoRefreshInterval = setInterval(() => {
        loadLogs(true);
      }, 3000); // Refresh every 3 seconds
    }
  }

  function stopAutoRefresh() {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
  }

  function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }

  // Format timestamp
  function formatTimestamp(timestamp?: string): string {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);
      return date.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return timestamp;
    }
  }

  // Get stream badge style
  function getStreamBadge(stream: string) {
    switch (stream) {
      case "stdout":
        return {
          variant: "secondary" as const,
          class:
            "text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
        };
      case "stderr":
        return {
          variant: "destructive" as const,
          class:
            "text-red-600 border-red-200 bg-red-50 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
        };
      default:
        return {
          variant: "outline" as const,
          class: "",
        };
    }
  }

  // Export logs
  function exportLogs() {
    try {
      const exportData = filteredLogs().map((log) => ({
        timestamp: log.timestamp,
        stream: log.stream,
        content: log.content,
      }));

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${containerName}_logs_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Logs exported successfully");
    } catch (err) {
      console.error("Failed to export logs:", err);
      toast.error("Failed to export logs");
    }
  }

  // Copy logs to clipboard
  async function copyLogs() {
    try {
      const logsText = filteredLogs()
        .map((log) => {
          const timestamp =
            showTimestamps && log.timestamp
              ? `[${formatTimestamp(log.timestamp)}] `
              : "";
          const stream = `[${log.stream}] `;
          return `${timestamp}${stream}${log.content}`;
        })
        .join("\n");

      await navigator.clipboard.writeText(logsText);
      toast.success("Logs copied to clipboard");
    } catch (err) {
      console.error("Failed to copy logs:", err);
      toast.error("Failed to copy logs");
    }
  }

  // Clear logs (refresh with empty tail)
  async function clearLogs() {
    logs = [];
    await loadLogs();
  }

  // Initialize when sheet opens
  $effect(() => {
    if (open && containerId) {
      loadLogs();
    }
  });

  // Cleanup auto refresh
  $effect(() => {
    if (autoRefresh && open) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  });

  // Cleanup on destroy
  onDestroy(() => {
    stopAutoRefresh();
  });
</script>

<Sheet.Root {open} {onOpenChange}>
  <Sheet.Content side="right" class="w-full sm:max-w-4xl flex flex-col">
    <Sheet.Header class="space-y-4 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <Sheet.Title class="flex items-center gap-2">
            <Terminal class="h-5 w-5" />
            Container Logs
          </Sheet.Title>
          <Sheet.Description>
            Viewing logs for <span class="font-mono font-medium"
              >{containerName}</span
            >
          </Sheet.Description>
        </div>

        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onclick={() => loadLogs(true)}
            disabled={isLoading}
          >
            <RefreshCw class="mr-2 h-4 w-4 {isLoading ? 'animate-spin' : ''}" />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onclick={toggleAutoRefresh}
          >
            {#if autoRefresh}
              <Pause class="mr-2 h-4 w-4" />
              Stop Auto
            {:else}
              <Play class="mr-2 h-4 w-4" />
              Auto Refresh
            {/if}
          </Button>
        </div>
      </div>

      <!-- Filters -->
      <Card.Root>
        <Card.Content class="p-4">
          <div class="grid gap-4">
            <!-- Search and Stream Filters -->
            <div class="flex flex-col sm:flex-row gap-4">
              <div class="flex-1">
                <div class="relative">
                  <Search
                    class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="Search logs..."
                    bind:value={searchTerm}
                    class="pl-10"
                  />
                </div>
              </div>

              <div class="flex items-center gap-4">
                <div class="flex items-center space-x-2">
                  <Checkbox id="stdout" bind:checked={showStdout} />
                  <Label for="stdout" class="text-sm">stdout</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox id="stderr" bind:checked={showStderr} />
                  <Label for="stderr" class="text-sm">stderr</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox id="timestamps" bind:checked={showTimestamps} />
                  <Label for="timestamps" class="text-sm">Timestamps</Label>
                </div>
              </div>
            </div>

            <!-- Advanced Filters -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="space-y-2">
                <Label for="tail" class="text-sm font-medium">Tail Lines</Label>
                <Select.Root type="single" bind:value={tailLines}>
                  <Select.Trigger>
                    <span>{tailLines} lines</span>
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="50">50 lines</Select.Item>
                    <Select.Item value="100">100 lines</Select.Item>
                    <Select.Item value="500">500 lines</Select.Item>
                    <Select.Item value="1000">1000 lines</Select.Item>
                    <Select.Item value="all">All lines</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>

              <div class="space-y-2">
                <Label for="since" class="text-sm font-medium"
                  >Since (timestamp)</Label
                >
                <Input
                  id="since"
                  placeholder="2024-01-01T00:00:00Z"
                  bind:value={sinceTime}
                  class="font-mono text-sm"
                />
              </div>

              <div class="space-y-2">
                <Label for="until" class="text-sm font-medium"
                  >Until (timestamp)</Label
                >
                <Input
                  id="until"
                  placeholder="2024-01-01T23:59:59Z"
                  bind:value={untilTime}
                  class="font-mono text-sm"
                />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-between pt-2 border-t">
              <div class="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={copyLogs}
                  disabled={filteredLogs().length === 0}
                >
                  <Copy class="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onclick={exportLogs}
                  disabled={filteredLogs().length === 0}
                >
                  <Download class="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onclick={clearLogs}>
                  <Trash2 class="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>

              <div class="text-sm text-muted-foreground">
                {#if isLoading}
                  Loading...
                {:else}
                  {filteredLogs().length} of {logs.length} entries
                {/if}
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    </Sheet.Header>

    <!-- Error Display -->
    {#if error}
      <Alert.Root variant="destructive" class="my-4 flex-shrink-0">
        <AlertCircle class="h-4 w-4" />
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>{error}</Alert.Description>
      </Alert.Root>
    {/if}

    <!-- Logs Content -->
    <div class="flex-1 mt-6 min-h-0">
      <Card.Root class="h-full flex flex-col">
        <Card.Header class="pb-3 flex-shrink-0">
          <div class="flex items-center justify-between">
            <Card.Title class="text-base">Logs</Card.Title>
            <div class="flex items-center gap-2">
              {#if autoRefresh}
                <Badge variant="default" class="gap-1">
                  <div
                    class="h-2 w-2 rounded-full bg-green-500 animate-pulse"
                  ></div>
                  Auto Refresh
                </Badge>
              {/if}
              {#if !isNearBottom}
                <Button
                  variant="outline"
                  size="sm"
                  onclick={scrollToBottom}
                  class="gap-1"
                >
                  <ArrowDown class="h-3 w-3" />
                  Jump to Bottom
                </Button>
              {/if}
            </div>
          </div>
        </Card.Header>

        <Card.Content class="p-0 flex-1 flex flex-col min-h-0">
          {#if isLoading && logs.length === 0}
            <!-- Loading State -->
            <div class="p-6 space-y-3">
              {#each Array(10) as _}
                <div class="flex items-start space-x-3">
                  <Skeleton class="h-4 w-20 rounded" />
                  <Skeleton class="h-4 w-16 rounded" />
                  <Skeleton class="h-4 flex-1 rounded" />
                </div>
              {/each}
            </div>
          {:else if filteredLogs().length === 0}
            <!-- Empty State -->
            <div
              class="flex flex-col items-center justify-center h-64 text-center"
            >
              <ScrollText class="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 class="mb-2 text-lg font-semibold">No logs found</h3>
              <p class="text-sm text-muted-foreground max-w-md">
                {logs.length === 0
                  ? "This container has no logs available."
                  : "No logs match your current filter criteria."}
              </p>
              {#if logs.length > 0 && filteredLogs().length === 0}
                <Button
                  variant="outline"
                  size="sm"
                  class="mt-4"
                  onclick={() => {
                    searchTerm = "";
                    showStdout = true;
                    showStderr = true;
                  }}
                >
                  Clear Filters
                </Button>
              {/if}
            </div>
          {:else}
            <!-- Logs Display -->
            <div class="flex-1 min-h-0">
              <ScrollArea class="h-full">
                <div
                  bind:this={scrollViewport}
                  class="p-4 font-mono text-sm space-y-1"
                  onscroll={checkScrollPosition}
                >
                  {#each filteredLogs() as log, index (index)}
                    {@const streamBadge = getStreamBadge(log.stream)}

                    <div
                      class="flex items-start gap-3 group hover:bg-muted/50 px-2 py-1 rounded min-h-6"
                    >
                      <!-- Timestamp -->
                      {#if showTimestamps && log.timestamp}
                        <span
                          class="text-muted-foreground text-xs shrink-0 mt-0.5 w-20 font-mono"
                        >
                          {formatTimestamp(log.timestamp)}
                        </span>
                      {/if}

                      <!-- Stream Badge -->
                      <Badge
                        variant={streamBadge.variant}
                        class="{streamBadge.class} text-xs px-2 py-0 shrink-0 mt-0.5"
                      >
                        {log.stream}
                      </Badge>

                      <!-- Log Content -->
                      <span
                        class="flex-1 break-all leading-relaxed whitespace-pre-wrap"
                      >
                        {log.content}
                      </span>

                      <!-- Copy Button (shown on hover) -->
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                        onclick={async () => {
                          try {
                            await navigator.clipboard.writeText(log.content);
                            toast.success("Log entry copied");
                          } catch {
                            toast.error("Failed to copy");
                          }
                        }}
                      >
                        <Copy class="h-3 w-3" />
                      </Button>
                    </div>
                  {/each}
                </div>
              </ScrollArea>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>
  </Sheet.Content>
</Sheet.Root>
