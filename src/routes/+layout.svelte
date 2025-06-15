<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { dockerStore } from "$lib/stores/docker.svelte";
  import { ModeWatcher, mode, toggleMode } from "mode-watcher";
  import {
    LayoutDashboard,
    Container,
    Image,
    Network,
    HardDrive,
    Settings,
    Menu,
    X,
    Cpu,
    Activity,
    AlertCircle,
    CheckCircle,
    Sun,
    Moon,
    Monitor,
  } from "lucide-svelte";

  // Import shadcn-svelte components
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { Separator } from "$lib/components/ui/separator";
  import * as Tooltip from "$lib/components/ui/tooltip";

  // Props
  let { children } = $props();

  // State
  let mounted = $state(false);
  let sidebarOpen = $state(true);

  // Docker connection state
  let connectionStatus = $derived(
    mounted
      ? dockerStore.connectionStatus
      : { connected: false, error: undefined, version: undefined },
  );
  let isConnecting = $derived(mounted ? dockerStore.isConnecting : false);

  // Navigation items
  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      description: "Overview & Stats",
    },
    {
      name: "Containers",
      href: "/containers",
      icon: Container,
      description: "Manage Containers",
    },
    {
      name: "Images",
      href: "/images",
      icon: Image,
      description: "Docker Images",
    },
    {
      name: "Networks",
      href: "/networks",
      icon: Network,
      description: "Network Management",
    },
    {
      name: "Volumes",
      href: "/volumes",
      icon: HardDrive,
      description: "Volume Storage",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      description: "App Configuration",
    },
  ];

  // Derived connection badge info
  let connectionBadge = $derived(() => {
    if (isConnecting) {
      return {
        variant: "secondary" as const,
        text: "Connecting...",
        icon: Activity,
      };
    } else if (connectionStatus.connected) {
      return {
        variant: "default" as const,
        text: "Connected",
        icon: CheckCircle,
        class: "bg-success text-success-foreground hover:bg-success/90",
      };
    } else {
      return {
        variant: "destructive" as const,
        text: "Disconnected",
        icon: AlertCircle,
      };
    }
  });

  // Mount and initialize
  onMount(async () => {
    mounted = true;

    try {
      await dockerStore.initializeDockerConnection();
    } catch (error) {
      console.error("Layout - Docker initialization error:", error);
    }
  });

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function setTheme(theme: string) {
    if (theme === 'light') {
      mode.set('light');
    } else if (theme === 'dark') {
      mode.set('dark');
    } else {
      mode.set('system');
    }
  }
</script>

<svelte:head>
  <title>DocSee - Professional Docker Management</title>
  <meta
    name="description"
    content="Professional Docker container management interface"
  />
</svelte:head>

<!-- Mode Watcher for theme management -->
<ModeWatcher />

<!-- Main Layout Container -->
<div class="main-layout">
  <!-- Professional Header -->
  <header class="header-professional">
    <div class="container mx-auto flex h-16 items-center justify-between px-6">
      <!-- Left side - Logo & Navigation toggle -->
      <div class="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onclick={toggleSidebar}
          class="lg:hidden"
        >
          {#if sidebarOpen}
            <X class="h-4 w-4" />
          {:else}
            <Menu class="h-4 w-4" />
          {/if}
        </Button>

        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"
          >
            <Cpu class="h-5 w-5" />
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight">DocSee</h1>
            <p class="text-xs text-muted-foreground hidden sm:block">
              Professional Docker Management
            </p>
          </div>
        </div>
      </div>

      <!-- Right side - Status & Controls -->
      <div class="flex items-center gap-4">
        <!-- Docker Connection Status -->
        <div class="hidden sm:flex items-center gap-3">
          <Badge 
            variant={connectionBadge().variant} 
            class="{connectionBadge().class || ''} gap-1.5 font-medium"
          >
            {#if connectionBadge().icon === Activity}
              <Activity class="h-3 w-3 animate-pulse" />
            {:else if connectionBadge().icon === CheckCircle}
              <CheckCircle class="h-3 w-3" />
            {:else}
              <AlertCircle class="h-3 w-3" />
            {/if}
            {connectionBadge().text}
          </Badge>
          {#if connectionStatus.connected && connectionStatus.version}
            <span class="text-xs text-muted-foreground font-mono">
              v{connectionStatus.version}
            </span>
          {/if}
        </div>

        <Separator orientation="vertical" class="h-6" />

        <!-- Theme Toggle with Dropdown -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button variant="ghost" size="icon">
              <Sun
                class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
              />
              <Moon
                class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
              />
              <span class="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item onclick={() => setTheme('light')}>
              <Sun class="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => setTheme('dark')}>
              <Moon class="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => setTheme('system')}>
              <Monitor class="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </div>
  </header>

  <!-- Professional Sidebar -->
  <aside
    class="sidebar-professional {sidebarOpen
      ? 'translate-x-0'
      : '-translate-x-full lg:translate-x-0'}"
  >
    <nav class="flex flex-col gap-1 p-4">
      {#each navigation as item}
        {@const isActive = $page.url.pathname === item.href}
        <Tooltip.Root>
          <Tooltip.Trigger class="w-full">
            <a
              href={item.href}
              class="nav-link {isActive ? 'nav-link-active' : ''}"
            >
              <svelte:component this={item.icon} class="h-4 w-4 shrink-0" />
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-medium truncate">{item.name}</span>
                <span class="text-xs text-muted-foreground truncate">
                  {item.description}
                </span>
              </div>
            </a>
          </Tooltip.Trigger>
          <Tooltip.Content side="right">
            <p>{item.name} - {item.description}</p>
          </Tooltip.Content>
        </Tooltip.Root>
      {/each}
    </nav>

    <!-- Sidebar Footer -->
    <div class="mt-auto p-4 border-t border-sidebar-border">
      <div class="text-xs text-muted-foreground space-y-3">
        <div>
          <p class="font-medium text-sidebar-foreground mb-2">System Status</p>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span>Docker Daemon</span>
              <div
                class="status-dot {connectionStatus.connected
                  ? 'status-dot-running'
                  : 'status-dot-stopped'}"
              ></div>
            </div>
            {#if connectionStatus.connected}
              <div class="flex items-center justify-between">
                <span>API Version</span>
                <span class="text-success font-mono text-xs">
                  {connectionStatus.api_version || "N/A"}
                </span>
              </div>
            {/if}
          </div>
        </div>
        
        <Separator />
        
        <div class="text-center">
          <p class="font-mono text-xs">DocSee v1.0.0</p>
          <p class="text-xs opacity-70">Build 2024.1</p>
        </div>
      </div>
    </div>
  </aside>

  <!-- Main Content Area -->
  <main class="main-content {!sidebarOpen ? 'ml-0' : ''}">
    {#if mounted}
      <div class="fade-in">
        {@render children?.()}
      </div>
    {:else}
      <!-- Professional Loading State -->
      <div class="flex items-center justify-center min-h-[400px]">
        <div class="text-center space-y-4">
          <div class="loading-spinner w-8 h-8 mx-auto"></div>
          <div class="space-y-2">
            <p class="text-sm font-medium">Initializing DocSee...</p>
            <p class="text-xs text-muted-foreground">
              Connecting to Docker daemon
            </p>
          </div>
        </div>
      </div>
    {/if}
  </main>

  <!-- Mobile Overlay -->
  {#if sidebarOpen}
    <button
      type="button"
      class="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
      onclick={toggleSidebar}
      aria-label="Close sidebar"
    ></button>
  {/if}
</div>
