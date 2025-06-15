<!-- src/lib/components/DebugPanel.svelte - Fixed -->
<script lang="ts">
  import { dockerStore } from '$lib/stores/docker.svelte';
  import { containersStore } from '$lib/stores/containers.svelte';
  import { theme, resolvedTheme } from '$lib/stores/theme.svelte';
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui';
  import { Bug, Wifi, WifiOff, Container, Moon, Sun, Monitor } from 'lucide-svelte';

  // State to prevent access before mount
  let mounted = $state(false);

  // Get reactive values from stores - only after mounting
  let currentConnectionStatus = $derived(mounted ? dockerStore.connectionStatus : { connected: false, error: undefined, version: undefined, api_version: undefined });
  let currentIsConnecting = $derived(mounted ? dockerStore.isConnecting : false);
  let currentDockerError = $derived(mounted ? dockerStore.dockerError : null);
  let currentContainers = $derived(mounted ? containersStore.containers : []);
  let currentIsLoadingContainers = $derived(mounted ? containersStore.isLoadingContainers : false);
  let currentTheme = $derived(mounted ? theme() : 'light');
  let currentResolvedTheme = $derived(mounted ? resolvedTheme() : 'light');

  // Mount effect
  $effect(() => {
    if (!mounted) {
      mounted = true;
      console.log('DebugPanel mounted');
    }
  });

  // Computed values using $derived
  let debugInfo = $derived(mounted ? {
    theme: {
      current: currentTheme,
      resolved: currentResolvedTheme,
    },
    docker: {
      connected: currentConnectionStatus.connected,
      connecting: currentIsConnecting,
      error: currentDockerError,
      version: currentConnectionStatus.version,
      apiVersion: currentConnectionStatus.api_version,
    },
    containers: {
      total: currentContainers.length,
      loading: currentIsLoadingContainers,
      running: currentContainers.filter(c => c.state === 'running').length,
      stopped: currentContainers.filter(c => c.state === 'exited' || c.state === 'created').length,
    },
    app: {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
    }
  } : {
    theme: { current: 'light', resolved: 'light' },
    docker: { connected: false, connecting: false, error: null, version: null, apiVersion: null },
    containers: { total: 0, loading: false, running: 0, stopped: 0 },
    app: { timestamp: '', userAgent: 'SSR' }
  });

  function getThemeIcon(themeValue: string) {
    switch (themeValue) {
      case 'light':
        return Sun;
      case 'dark':
        return Moon;
      case 'system':
        return Monitor;
      default:
        return Monitor;
    }
  }
</script>

{#if mounted}
  <Card class="bg-muted/50 border-dashed">
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-sm">
        <Bug class="h-4 w-4 text-muted-foreground" />
        Debug Information
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <!-- Theme Info -->
        <div class="space-y-2">
          <div class="font-medium text-foreground flex items-center gap-2">
            {#if getThemeIcon(debugInfo.theme.current)}
              {@const ThemeIcon = getThemeIcon(debugInfo.theme.current)}
              <ThemeIcon class="h-3 w-3" />
            {/if}
            Theme
          </div>
          <div class="space-y-1 text-muted-foreground">
            <div>Current: {debugInfo.theme.current}</div>
            <div>Resolved: {debugInfo.theme.resolved}</div>
          </div>
        </div>

        <!-- Docker Info -->
        <div class="space-y-2">
          <div class="font-medium text-foreground flex items-center gap-2">
            {#if debugInfo.docker.connected}
              <Wifi class="h-3 w-3 text-green-500" />
            {:else}
              <WifiOff class="h-3 w-3 text-red-500" />
            {/if}
            Docker
          </div>
          <div class="space-y-1 text-muted-foreground">
            <div>Status: {debugInfo.docker.connected ? 'Connected' : 'Disconnected'}</div>
            <div>Connecting: {debugInfo.docker.connecting ? 'Yes' : 'No'}</div>
            {#if debugInfo.docker.version}
              <div>Version: {debugInfo.docker.version}</div>
            {/if}
            {#if debugInfo.docker.error}
              <div class="text-red-500">Error: {debugInfo.docker.error}</div>
            {/if}
          </div>
        </div>

        <!-- Containers Info -->
        <div class="space-y-2">
          <div class="font-medium text-foreground flex items-center gap-2">
            <Container class="h-3 w-3" />
            Containers
          </div>
          <div class="space-y-1 text-muted-foreground">
            <div>Total: {debugInfo.containers.total}</div>
            <div>Running: {debugInfo.containers.running}</div>
            <div>Stopped: {debugInfo.containers.stopped}</div>
            <div>Loading: {debugInfo.containers.loading ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <!-- App Info -->
        <div class="space-y-2">
          <div class="font-medium text-foreground">
            App
          </div>
          <div class="space-y-1 text-muted-foreground">
            <div>Updated: {mounted ? new Date(debugInfo.app.timestamp).toLocaleTimeString() : '--'}</div>
            <div>Browser: {debugInfo.app.userAgent.includes('Chrome') ? 'Chrome' : 
                             debugInfo.app.userAgent.includes('Firefox') ? 'Firefox' : 
                             debugInfo.app.userAgent.includes('Safari') ? 'Safari' : 'Other'}</div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
{/if}
