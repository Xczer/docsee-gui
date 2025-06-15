<!-- src/lib/components/docker/containers/EnhancedContainerCard.svelte -->
<script lang="ts">
  import { cn, formatRelativeTime, formatBytes } from '$lib/utils';
  import { createEventDispatcher } from 'svelte';
  import { 
    Card, 
    CardHeader, 
    CardContent, 
    Badge, 
    Button,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
  } from '$lib/components/ui';
  import { 
    Container,
    Play,
    Square,
    Pause,
    RotateCcw,
    Trash2,
    Terminal,
    FileText,
    MoreVertical,
    ExternalLink,
    Copy,
    AlertCircle,
    Clock,
    HardDrive,
    Cpu,
    MemoryStick
  } from 'lucide-svelte';

  interface DockerContainer {
    id: string;
    names: string[];
    image: string;
    state: string;
    status: string;
    created: number;
    ports?: Array<{
      PublicPort?: number;
      PrivatePort: number;
      Type: string;
    }>;
    stats?: {
      cpu_percent?: number;
      memory_usage?: number;
      network_rx?: number;
    };
  }

  interface Props {
    container: DockerContainer;
    class?: string;
    showActions?: boolean;
    showStats?: boolean;
    compact?: boolean;
    selectable?: boolean;
    selected?: boolean;
    loading?: boolean;
  }

  let {
    container,
    class: className,
    showActions = true,
    showStats = false,
    compact = false,
    selectable = false,
    selected = false,
    loading = false
  }: Props = $props();

  const dispatch = createEventDispatcher<{
    start: { container: DockerContainer };
    stop: { container: DockerContainer };
    restart: { container: DockerContainer };
    pause: { container: DockerContainer };
    unpause: { container: DockerContainer };
    remove: { container: DockerContainer };
    logs: { container: DockerContainer };
    shell: { container: DockerContainer };
    inspect: { container: DockerContainer };
    select: { container: DockerContainer; selected: boolean };
    copy: { text: string; type: 'id' | 'name' | 'image' };
  }>();

  // Helper functions
  function getContainerName(): string {
    return container.names?.[0]?.replace('/', '') || container.id.substring(0, 12);
  }

  function getStatusInfo() {
    const state = container.state.toLowerCase();
    
    switch (state) {
      case 'running':
        return {
          variant: 'success' as const,
          label: 'Running',
          icon: Play,
          color: 'text-green-600 dark:text-green-400',
          canStart: false,
          canStop: true,
          canPause: true,
          canRestart: true
        };
      case 'exited':
        return {
          variant: 'secondary' as const,
          label: 'Stopped',
          icon: Square,
          color: 'text-gray-600 dark:text-gray-400',
          canStart: true,
          canStop: false,
          canPause: false,
          canRestart: false
        };
      case 'paused':
        return {
          variant: 'warning' as const,
          label: 'Paused',
          icon: Pause,
          color: 'text-yellow-600 dark:text-yellow-400',
          canStart: false,
          canStop: true,
          canPause: false,
          canRestart: true
        };
      case 'created':
        return {
          variant: 'info' as const,
          label: 'Created',
          icon: Container,
          color: 'text-blue-600 dark:text-blue-400',
          canStart: true,
          canStop: false,
          canPause: false,
          canRestart: false
        };
      case 'restarting':
        return {
          variant: 'warning' as const,
          label: 'Restarting',
          icon: RotateCcw,
          color: 'text-orange-600 dark:text-orange-400',
          canStart: false,
          canStop: true,
          canPause: false,
          canRestart: false
        };
      case 'dead':
        return {
          variant: 'destructive' as const,
          label: 'Dead',
          icon: AlertCircle,
          color: 'text-red-600 dark:text-red-400',
          canStart: false,
          canStop: false,
          canPause: false,
          canRestart: true
        };
      default:
        return {
          variant: 'outline' as const,
          label: state.charAt(0).toUpperCase() + state.slice(1),
          icon: Container,
          color: 'text-gray-600 dark:text-gray-400',
          canStart: false,
          canStop: false,
          canPause: false,
          canRestart: false
        };
    }
  }

  function getPortsDisplay(): string {
    if (!container.ports || container.ports.length === 0) {
      return 'No exposed ports';
    }

    return container.ports
      .filter(port => port.PublicPort)
      .map(port => `${port.PublicPort}:${port.PrivatePort}`)
      .join(', ') || 'Internal only';
  }

  function copyToClipboard(text: string, type: 'id' | 'name' | 'image') {
    navigator.clipboard.writeText(text).then(() => {
      dispatch('copy', { text, type });
    });
  }

  // Action handlers
  function handleStart() {
    dispatch('start', { container });
  }

  function handleStop() {
    dispatch('stop', { container });
  }

  function handleRestart() {
    dispatch('restart', { container });
  }

  function handlePause() {
    if (container.state === 'paused') {
      dispatch('unpause', { container });
    } else {
      dispatch('pause', { container });
    }
  }

  function handleRemove() {
    dispatch('remove', { container });
  }

  function handleLogs() {
    dispatch('logs', { container });
  }

  function handleShell() {
    dispatch('shell', { container });
  }

  function handleInspect() {
    dispatch('inspect', { container });
  }

  function handleSelect() {
    const newSelected = !selected;
    dispatch('select', { container, selected: newSelected });
  }

  // Derived values using $derived
  const status = $derived(getStatusInfo());
  const containerName = $derived(getContainerName());
  const portsDisplay = $derived(getPortsDisplay());
  const uptime = $derived(
    container.state === 'running' && container.status 
      ? container.status.replace('Up ', '') 
      : null
  );

  const cardClass = $derived(cn(
    'group transition-all duration-200',
    'hover:shadow-md dark:hover:shadow-lg',
    selectable && 'cursor-pointer',
    selected && 'ring-2 ring-primary ring-offset-2',
    loading && 'opacity-50 pointer-events-none',
    className
  ));
</script>

<Card 
  class={cardClass}
  onclick={selectable ? handleSelect : undefined}
>
  <CardHeader class={cn('pb-3', compact && 'p-4 pb-2')}>
    <div class="flex items-start justify-between gap-3">
      <!-- Container Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-2">
          {#if selectable}
            <input
              type="checkbox"
              checked={selected}
              on:change={handleSelect}
              class="rounded border-border"
              aria-label="Select container"
            />
          {/if}
          
          <svelte:component 
            this={status.icon} 
            class={cn('h-4 w-4', status.color)} 
          />
          
          <h3 class="font-semibold text-foreground truncate">
            {containerName}
          </h3>
          
          <Badge variant={status.variant} class="text-xs">
            {status.label}
          </Badge>
        </div>

        <div class="space-y-1 text-sm text-muted-foreground">
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground">Image:</span>
            <span class="font-mono text-xs truncate">{container.image}</span>
            <button
              type="button"
              class="btn-ghost p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
              on:click={() => copyToClipboard(container.image, 'image')}
              title="Copy image name"
            >
              <Copy class="h-3 w-3" />
            </button>
          </div>
          
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground">ID:</span>
            <span class="font-mono text-xs">{container.id.substring(0, 12)}</span>
            <button
              type="button"
              class="btn-ghost p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
              on:click={() => copyToClipboard(container.id, 'id')}
              title="Copy container ID"
            >
              <Copy class="h-3 w-3" />
            </button>
          </div>

          {#if !compact}
            <div class="flex items-center gap-2">
              <Clock class="h-3 w-3" />
              <span class="text-xs">
                Created {formatRelativeTime(container.created * 1000)}
              </span>
            </div>

            {#if uptime}
              <div class="flex items-center gap-2">
                <Play class="h-3 w-3 text-green-500" />
                <span class="text-xs">Uptime: {uptime}</span>
              </div>
            {/if}

            <div class="flex items-center gap-2">
              <ExternalLink class="h-3 w-3" />
              <span class="text-xs">{portsDisplay}</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Actions -->
      {#if showActions}
        <div class="flex items-center gap-1">
          <!-- Quick Actions -->
          <div class="hidden group-hover:flex items-center gap-1">
            {#if status.canStart}
              <Button
                variant="ghost"
                size="icon-sm"
                onclick={handleStart}
                disabled={loading}
                title="Start container"
              >
                <Play class="h-3 w-3" />
              </Button>
            {/if}

            {#if status.canStop}
              <Button
                variant="ghost"
                size="icon-sm"
                onclick={handleStop}
                disabled={loading}
                title="Stop container"
              >
                <Square class="h-3 w-3" />
              </Button>
            {/if}

            {#if status.canRestart}
              <Button
                variant="ghost"
                size="icon-sm"
                onclick={handleRestart}
                disabled={loading}
                title="Restart container"
              >
                <RotateCcw class="h-3 w-3" />
              </Button>
            {/if}

            {#if container.state === 'running'}
              <Button
                variant="ghost"
                size="icon-sm"
                onclick={handleLogs}
                disabled={loading}
                title="View logs"
              >
                <FileText class="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onclick={handleShell}
                disabled={loading}
                title="Open shell"
              >
                <Terminal class="h-3 w-3" />
              </Button>
            {/if}
          </div>

          <!-- More Actions Menu -->
          <DropdownMenu>
            {#snippet children({ toggle })}
              <DropdownMenuTrigger 
                class="btn btn-ghost btn-icon-sm"
                onclick={toggle}
                title="More actions"
              >
                <MoreVertical class="h-4 w-4" />
              </DropdownMenuTrigger>

              <DropdownMenuContent placement="bottom-end">
                {#if status.canStart}
                  <DropdownMenuItem onclick={handleStart}>
                    <Play class="h-4 w-4 mr-2" />
                    Start
                  </DropdownMenuItem>
                {/if}

                {#if status.canStop}
                  <DropdownMenuItem onclick={handleStop}>
                    <Square class="h-4 w-4 mr-2" />
                    Stop
                  </DropdownMenuItem>
                {/if}

                {#if status.canRestart}
                  <DropdownMenuItem onclick={handleRestart}>
                    <RotateCcw class="h-4 w-4 mr-2" />
                    Restart
                  </DropdownMenuItem>
                {/if}

                {#if status.canPause}
                  <DropdownMenuItem onclick={handlePause}>
                    <Pause class="h-4 w-4 mr-2" />
                    {container.state === 'paused' ? 'Unpause' : 'Pause'}
                  </DropdownMenuItem>
                {/if}

                <DropdownMenuItem onclick={handleLogs}>
                  <FileText class="h-4 w-4 mr-2" />
                  View Logs
                </DropdownMenuItem>

                {#if container.state === 'running'}
                  <DropdownMenuItem onclick={handleShell}>
                    <Terminal class="h-4 w-4 mr-2" />
                    Open Shell
                  </DropdownMenuItem>
                {/if}

                <DropdownMenuItem onclick={handleInspect}>
                  <ExternalLink class="h-4 w-4 mr-2" />
                  Inspect
                </DropdownMenuItem>

                <div class="separator-horizontal my-1"></div>

                <DropdownMenuItem 
                  onclick={handleRemove}
                  class="text-destructive hover:text-destructive focus:text-destructive"
                >
                  <Trash2 class="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            {/snippet}
          </DropdownMenu>
        </div>
      {/if}
    </div>
  </CardHeader>

  {#if showStats && container.stats}
    <CardContent class={cn('pt-0', compact && 'p-4 pt-0')}>
      <div class="grid grid-cols-3 gap-4 text-sm">
        <!-- CPU Usage -->
        <div class="flex items-center gap-2">
          <Cpu class="h-4 w-4 text-blue-500" />
          <div>
            <div class="font-medium">{container.stats.cpu_percent?.toFixed(1) || '0'}%</div>
            <div class="text-xs text-muted-foreground">CPU</div>
          </div>
        </div>

        <!-- Memory Usage -->
        <div class="flex items-center gap-2">
          <MemoryStick class="h-4 w-4 text-green-500" />
          <div>
            <div class="font-medium">
              {container.stats.memory_usage ? formatBytes(container.stats.memory_usage) : '0 B'}
            </div>
            <div class="text-xs text-muted-foreground">Memory</div>
          </div>
        </div>

        <!-- Network I/O -->
        <div class="flex items-center gap-2">
          <HardDrive class="h-4 w-4 text-purple-500" />
          <div>
            <div class="font-medium">
              {container.stats.network_rx ? formatBytes(container.stats.network_rx) : '0 B'}
            </div>
            <div class="text-xs text-muted-foreground">Network RX</div>
          </div>
        </div>
      </div>
    </CardContent>
  {/if}

  {#if loading}
    <div class="absolute inset-0 bg-background/50 flex items-center justify-center">
      <div class="loading-spinner h-6 w-6"></div>
    </div>
  {/if}
</Card>
