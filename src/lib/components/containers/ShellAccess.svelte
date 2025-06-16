<!-- src/lib/components/containers/ShellAccess.svelte -->
<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import {
    Terminal,
    Send,
    Copy,
    Download,
    RefreshCw,
    Settings,
    X,
    ChevronRight,
    AlertCircle,
    Loader2,
    History,
    FileText,
    Trash2,
    Command,
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
  import * as Popover from "$lib/components/ui/popover";

  // Import services and types
  import { invoke } from "@tauri-apps/api/core";
  import { toast } from "svelte-sonner";

  // Props
  interface Props {
    containerId: string;
    containerName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }

  const { containerId, containerName, open, onOpenChange }: Props = $props();

  // Types
  interface CommandResult {
    id: string;
    command: string;
    output: string;
    timestamp: Date;
    success: boolean;
    duration: number;
  }

  interface ShellSettings {
    shell: string;
    workingDir: string;
    user: string;
    env: string[];
  }

  // State
  let commandInput = $state("");
  let commandHistory: string[] = $state([]);
  let commandResults: CommandResult[] = $state([]);
  let isExecuting = $state(false);
  let historyIndex = $state(-1);
  let error = $state<string | null>(null);

  // Shell settings
  // biome-ignore lint/style/useConst: <explanation>
  let shellSettings: ShellSettings = $state({
    shell: "/bin/sh",
    workingDir: "/",
    user: "",
    env: [],
  });

  // Common shell options
  const shellOptions = [
    { value: "/bin/sh", label: "sh" },
    { value: "/bin/bash", label: "bash" },
    { value: "/bin/zsh", label: "zsh" },
    { value: "/bin/fish", label: "fish" },
    { value: "/bin/ash", label: "ash" },
  ];

  // Common commands for quick access
  const commonCommands = [
    { label: "List files", command: "ls -la" },
    { label: "Current directory", command: "pwd" },
    { label: "Disk usage", command: "df -h" },
    { label: "Memory usage", command: "free -h" },
    { label: "Process list", command: "ps aux" },
    { label: "Network config", command: "ip addr show" },
    { label: "Environment", command: "env" },
    { label: "System info", command: "uname -a" },
  ];

  // Refs
  let commandInputRef: HTMLInputElement;
  let resultsContainer: HTMLElement;

  // svelte-ignore non_reactive_update
  let scrollViewport: HTMLElement | undefined;

  // biome-ignore lint/style/useConst: <explanation>
  let autoScroll = $state(true);

  // Execute command function
  async function executeCommand(cmd?: string) {
    const command = cmd || commandInput.trim();
    if (!command || isExecuting) return;

    const startTime = Date.now();
    isExecuting = true;
    error = null;

    try {
      // Build command array
      const shellCommand = [shellSettings.shell, "-c", command];

      // Add to history if not already present
      if (!commandHistory.includes(command)) {
        commandHistory = [command, ...commandHistory.slice(0, 49)]; // Keep last 50 commands
      }

      // Execute command
      const output = await invoke<string>("exec_container_cmd", {
        id: containerId,
        cmd: shellCommand,
        interactive: true,
        tty: true,
      });

      const duration = Date.now() - startTime;
      const result: CommandResult = {
        id: crypto.randomUUID(),
        command,
        output: output || "",
        timestamp: new Date(),
        success: true,
        duration,
      };

      commandResults = [...commandResults, result];

      // Clear input and reset history index
      if (!cmd) {
        // Only clear if command came from input
        commandInput = "";
        historyIndex = -1;
      }

      // Auto-scroll to bottom
      if (autoScroll) {
        setTimeout(() => {
          if (scrollViewport) {
            scrollViewport.scrollTop = scrollViewport.scrollHeight;
          }
        }, 100);
      }

      toast.success(`Command executed in ${duration}ms`);
    } catch (err: any) {
      const duration = Date.now() - startTime;
      const result: CommandResult = {
        id: crypto.randomUUID(),
        command,
        output: err.message || "Command execution failed",
        timestamp: new Date(),
        success: false,
        duration,
      };

      commandResults = [...commandResults, result];
      error = err.message || "Failed to execute command";
      toast.error("Command execution failed");
    } finally {
      isExecuting = false;
    }
  }

  // Handle keyboard shortcuts
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      executeCommand();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      navigateHistory("up");
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      navigateHistory("down");
    } else if (event.key === "Tab") {
      event.preventDefault();
      // TODO: Implement command completion
      toast.info("Command completion coming soon!");
    } else if (event.ctrlKey && event.key === "c") {
      // Handle Ctrl+C
      if (isExecuting) {
        // TODO: Implement command cancellation
        toast.info("Command cancellation coming soon!");
      }
    } else if (event.ctrlKey && event.key === "l") {
      event.preventDefault();
      clearResults();
    }
  }

  // Navigate command history
  function navigateHistory(direction: "up" | "down") {
    if (commandHistory.length === 0) return;

    if (direction === "up") {
      historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
    } else {
      historyIndex = Math.max(historyIndex - 1, -1);
    }

    if (historyIndex === -1) {
      commandInput = "";
    } else {
      commandInput = commandHistory[historyIndex];
    }
  }

  // Clear results
  function clearResults() {
    commandResults = [];
    toast.success("Terminal cleared");
  }

  // Copy command output
  async function copyOutput(output: string) {
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Output copied to clipboard");
    } catch {
      toast.error("Failed to copy output");
    }
  }

  // Export session
  function exportSession() {
    try {
      const sessionData = {
        container: {
          id: containerId,
          name: containerName,
        },
        timestamp: new Date().toISOString(),
        settings: shellSettings,
        history: commandHistory,
        results: commandResults,
      };

      const jsonString = JSON.stringify(sessionData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${containerName}_shell_session_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Session exported successfully");
    } catch (err) {
      console.error("Failed to export session:", err);
      toast.error("Failed to export session");
    }
  }

  // Format timestamp
  function formatTimestamp(date: Date): string {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  // Format duration
  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  // Focus input when sheet opens
  $effect(() => {
    if (open && commandInputRef) {
      setTimeout(() => {
        commandInputRef?.focus();
      }, 100);
    }
  });

  // Load command history from localStorage
  onMount(() => {
    try {
      const saved = localStorage.getItem(`shell-history-${containerId}`);
      if (saved) {
        commandHistory = JSON.parse(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  });

  // Save command history to localStorage
  $effect(() => {
    if (commandHistory.length > 0) {
      try {
        localStorage.setItem(
          `shell-history-${containerId}`,
          JSON.stringify(commandHistory),
        );
      } catch {
        // Ignore localStorage errors
      }
    }
  });

  // Cleanup on destroy
  onDestroy(() => {
    // Save any pending history
    if (commandHistory.length > 0) {
      try {
        localStorage.setItem(
          `shell-history-${containerId}`,
          JSON.stringify(commandHistory),
        );
      } catch {
        // Ignore localStorage errors
      }
    }
  });
</script>

<Sheet.Root {open} {onOpenChange}>
  <Sheet.Content side="right" class="w-full sm:max-w-4xl flex flex-col">
    <Sheet.Header class="space-y-4 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <Sheet.Title class="flex items-center gap-2">
            <Terminal class="h-5 w-5" />
            Shell Access
          </Sheet.Title>
          <Sheet.Description>
            Interactive shell for <span class="font-mono font-medium"
              >{containerName}</span
            >
          </Sheet.Description>
        </div>

        <div class="flex items-center gap-2">
          <!-- Shell Settings -->
          <Popover.Root>
            <Popover.Trigger>
              <Button variant="outline" size="sm">
                <Settings class="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Popover.Trigger>
            <Popover.Content class="w-80">
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label for="shell-select" class="text-sm font-medium"
                    >Shell</Label
                  >
                  <Select.Root type="single" bind:value={shellSettings.shell}>
                    <Select.Trigger id="shell-select">
                      <span>{shellSettings.shell}</span>
                    </Select.Trigger>
                    <Select.Content>
                      {#each shellOptions as option}
                        <Select.Item value={option.value}
                          >{option.label}</Select.Item
                        >
                      {/each}
                    </Select.Content>
                  </Select.Root>
                </div>

                <div class="space-y-2">
                  <Label for="working-dir" class="text-sm font-medium"
                    >Working Directory</Label
                  >
                  <Input
                    id="working-dir"
                    bind:value={shellSettings.workingDir}
                    placeholder="/path/to/directory"
                    class="font-mono"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="user" class="text-sm font-medium">User</Label>
                  <Input
                    id="user"
                    bind:value={shellSettings.user}
                    placeholder="root"
                  />
                </div>

                <div class="flex items-center space-x-2">
                  <Checkbox id="auto-scroll" bind:checked={autoScroll} />
                  <Label for="auto-scroll" class="text-sm"
                    >Auto-scroll to bottom</Label
                  >
                </div>
              </div>
            </Popover.Content>
          </Popover.Root>

          <Button variant="outline" size="sm" onclick={clearResults}>
            <Trash2 class="mr-2 h-4 w-4" />
            Clear
          </Button>

          <Button variant="outline" size="sm" onclick={exportSession}>
            <Download class="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <!-- Quick Commands -->
      <Card.Root>
        <Card.Content class="p-4">
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <Command class="h-4 w-4" />
              <span class="text-sm font-medium">Quick Commands</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              {#each commonCommands as cmd}
                <Button
                  variant="outline"
                  size="sm"
                  class="justify-start h-8 text-xs"
                  onclick={() => executeCommand(cmd.command)}
                  disabled={isExecuting}
                >
                  {cmd.label}
                </Button>
              {/each}
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

    <!-- Terminal Content -->
    <div class="flex-1 min-h-0 flex flex-col">
      <!-- Results Area -->
      <Card.Root class="flex-1 flex flex-col min-h-0 mb-4">
        <Card.Header class="pb-3 flex-shrink-0">
          <div class="flex items-center justify-between">
            <Card.Title class="text-base">Terminal Output</Card.Title>
            <div class="flex items-center gap-2">
              {#if isExecuting}
                <Badge variant="default" class="gap-1">
                  <Loader2 class="h-3 w-3 animate-spin" />
                  Executing...
                </Badge>
              {/if}
              <Badge variant="outline" class="gap-1">
                <History class="h-3 w-3" />
                {commandResults.length} commands
              </Badge>
            </div>
          </div>
        </Card.Header>

        <Card.Content class="p-0 flex-1 flex flex-col min-h-0">
          {#if commandResults.length === 0}
            <!-- Empty State -->
            <div
              class="flex flex-col items-center justify-center h-64 text-center"
            >
              <Terminal class="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 class="mb-2 text-lg font-semibold">Ready for commands</h3>
              <p class="text-sm text-muted-foreground max-w-md">
                Start typing commands below or use the quick commands above.
                Press Enter to execute.
              </p>
              <div class="mt-4 text-xs text-muted-foreground">
                <p>
                  Tips: ↑↓ for history • Ctrl+L to clear • Tab for completion
                </p>
              </div>
            </div>
          {:else}
            <!-- Command Results -->
            <div class="flex-1 min-h-0">
              <ScrollArea class="h-full">
                <div
                  bind:this={scrollViewport}
                  class="p-4 space-y-4 font-mono text-sm"
                >
                  {#each commandResults as result}
                    <div class="space-y-2">
                      <!-- Command Header -->
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <ChevronRight class="h-3 w-3 text-muted-foreground" />
                          <span class="font-medium">{result.command}</span>
                          {#if result.success}
                            <Badge variant="outline" class="text-xs h-5">
                              ✓ {formatDuration(result.duration)}
                            </Badge>
                          {:else}
                            <Badge variant="destructive" class="text-xs h-5">
                              ✗ {formatDuration(result.duration)}
                            </Badge>
                          {/if}
                        </div>
                        <div class="flex items-center gap-1">
                          <span class="text-xs text-muted-foreground">
                            {formatTimestamp(result.timestamp)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            class="h-6 w-6"
                            onclick={() => copyOutput(result.output)}
                          >
                            <Copy class="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <!-- Command Output -->
                      <div class="ml-5 space-y-1">
                        {#if result.output}
                          <pre
                            class="whitespace-pre-wrap break-all bg-muted/50 p-3 rounded text-xs leading-relaxed {result.success
                              ? ''
                              : 'text-red-600 dark:text-red-400'}">{result.output}</pre>
                        {:else}
                          <div class="text-xs text-muted-foreground italic p-2">
                            No output
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </ScrollArea>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Command Input -->
      <Card.Root class="flex-shrink-0">
        <Card.Content class="p-4">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <Terminal class="h-4 w-4" />
              <span class="font-mono">{shellSettings.shell}</span>
              <ChevronRight class="h-3 w-3" />
            </div>
            <div class="flex-1 relative">
              <input
                bind:this={commandInputRef}
                bind:value={commandInput}
                placeholder="Enter command... (Press Enter to execute)"
                onkeydown={handleKeyDown}
                disabled={isExecuting}
                class="font-mono"
              />
              {#if commandHistory.length > 0}
                <div class="absolute right-2 top-1/2 -translate-y-1/2">
                  <Popover.Root>
                    <Popover.Trigger>
                      <Button variant="ghost" size="icon" class="h-6 w-6">
                        <History class="h-3 w-3" />
                      </Button>
                    </Popover.Trigger>
                    <Popover.Content class="w-80 max-h-60 overflow-y-auto">
                      <div class="space-y-1">
                        <div class="text-sm font-medium mb-2">
                          Command History
                        </div>
                        {#each commandHistory.slice(0, 20) as cmd, index}
                          <Button
                            variant="ghost"
                            size="sm"
                            class="w-full justify-start h-8 font-mono text-xs"
                            onclick={() => {
                              commandInput = cmd;
                              commandInputRef?.focus();
                            }}
                          >
                            {cmd}
                          </Button>
                        {/each}
                      </div>
                    </Popover.Content>
                  </Popover.Root>
                </div>
              {/if}
            </div>
            <Button
              onclick={() => executeCommand()}
              disabled={isExecuting || !commandInput.trim()}
              size="sm"
            >
              {#if isExecuting}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                Executing
              {:else}
                <Send class="mr-2 h-4 w-4" />
                Execute
              {/if}
            </Button>
          </div>

          <!-- Help Text -->
          <div class="mt-2 text-xs text-muted-foreground">
            <p>
              <kbd class="px-1 py-0.5 bg-muted rounded text-xs">↑↓</kbd> History
              •
              <kbd class="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+L</kbd>
              Clear •
              <kbd class="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd>
              Complete •
              <kbd class="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> Execute
            </p>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </Sheet.Content>
</Sheet.Root>
