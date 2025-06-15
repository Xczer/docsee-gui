<script lang="ts">
  import { onMount } from "svelte";
  import {
    Settings,
    Docker,
    Monitor,
    Bell,
    Shield,
    Palette,
    Save,
    RotateCcw,
    Info,
    ExternalLink,
    Cpu,
    HardDrive,
    Network,
    Zap,
  } from "lucide-svelte";

  // Import shadcn-svelte components
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import * as Card from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select";
  import { Switch } from "$lib/components/ui/switch";
  import { Textarea } from "$lib/components/ui/textarea";
  import * as Tabs from "$lib/components/ui/tabs";
  import { Separator } from "$lib/components/ui/separator";
  import * as Alert from "$lib/components/ui/alert";

  // Settings state
  let settings = $state({
    docker: {
      host: "unix:///var/run/docker.sock",
      tlsVerify: false,
      apiVersion: "auto",
      timeout: 30,
    },
    ui: {
      theme: "system",
      autoRefresh: true,
      refreshInterval: 5,
      compactMode: false,
      showSystemContainers: false,
    },
    notifications: {
      enabled: true,
      containerEvents: true,
      systemAlerts: true,
      soundEnabled: false,
    },
    security: {
      requireAuth: false,
      sessionTimeout: 30,
      auditLogging: true,
      restrictedMode: false,
    },
    performance: {
      enableMetrics: true,
      retentionDays: 7,
      enableCache: true,
      maxContainers: 100,
    },
  });

  let loading = $state(false);
  let saved = $state(false);

  function saveSettings() {
    loading = true;
    // Simulate save
    setTimeout(() => {
      loading = false;
      saved = true;
      setTimeout(() => {
        saved = false;
      }, 2000);
    }, 1000);
  }

  function resetSettings() {
    // Reset to defaults
    settings = {
      docker: {
        host: "unix:///var/run/docker.sock",
        tlsVerify: false,
        apiVersion: "auto",
        timeout: 30,
      },
      ui: {
        theme: "system",
        autoRefresh: true,
        refreshInterval: 5,
        compactMode: false,
        showSystemContainers: false,
      },
      notifications: {
        enabled: true,
        containerEvents: true,
        systemAlerts: true,
        soundEnabled: false,
      },
      security: {
        requireAuth: false,
        sessionTimeout: 30,
        auditLogging: true,
        restrictedMode: false,
      },
      performance: {
        enableMetrics: true,
        retentionDays: 7,
        enableCache: true,
        maxContainers: 100,
      },
    };
  }
</script>

<svelte:head>
  <title>Settings - DocSee</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
      <p class="text-muted-foreground">
        Configure DocSee application preferences and Docker connection
      </p>
    </div>
    <div class="flex items-center gap-3">
      <Button variant="outline" on:click={resetSettings}>
        <RotateCcw class="h-4 w-4 mr-2" />
        Reset to Default
      </Button>
      <Button on:click={saveSettings} disabled={loading}>
        <Save class="h-4 w-4 mr-2" />
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  </div>

  <!-- Success Alert -->
  {#if saved}
    <Alert.Root class="border-success bg-success/10">
      <Info class="h-4 w-4 text-success" />
      <Alert.Title class="text-success">Settings Saved</Alert.Title>
      <Alert.Description>
        Your configuration has been successfully updated.
      </Alert.Description>
    </Alert.Root>
  {/if}

  <!-- Settings Tabs -->
  <Tabs.Root value="docker" class="space-y-4">
    <Tabs.List class="grid w-full grid-cols-5">
      <Tabs.Trigger value="docker" class="gap-2">
        <Docker class="h-4 w-4" />
        Docker
      </Tabs.Trigger>
      <Tabs.Trigger value="interface" class="gap-2">
        <Monitor class="h-4 w-4" />
        Interface
      </Tabs.Trigger>
      <Tabs.Trigger value="notifications" class="gap-2">
        <Bell class="h-4 w-4" />
        Notifications
      </Tabs.Trigger>
      <Tabs.Trigger value="security" class="gap-2">
        <Shield class="h-4 w-4" />
        Security
      </Tabs.Trigger>
      <Tabs.Trigger value="performance" class="gap-2">
        <Zap class="h-4 w-4" />
        Performance
      </Tabs.Trigger>
    </Tabs.List>

    <!-- Docker Settings -->
    <Tabs.Content value="docker" class="space-y-4">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Docker class="h-5 w-5" />
            Docker Connection
          </Card.Title>
          <Card.Description>
            Configure Docker daemon connection settings
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-6">
          <div class="space-y-2">
            <Label for="docker-host">Docker Host</Label>
            <Input
              id="docker-host"
              bind:value={settings.docker.host}
              placeholder="unix:///var/run/docker.sock"
            />
            <p class="text-xs text-muted-foreground">
              Docker daemon socket path or TCP connection string
            </p>
          </div>

          <div class="space-y-2">
            <Label for="api-version">API Version</Label>
            <Select.Root>
              <Select.Trigger>
                <Select.Value placeholder="Select API version" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="auto" onclick={() => settings.docker.apiVersion = 'auto'}>Auto-detect</Select.Item>
                <Select.Item value="1.41" onclick={() => settings.docker.apiVersion = '1.41'}>1.41</Select.Item>
                <Select.Item value="1.40" onclick={() => settings.docker.apiVersion = '1.40'}>1.40</Select.Item>
                <Select.Item value="1.39" onclick={() => settings.docker.apiVersion = '1.39'}>1.39</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          <div class="space-y-2">
            <Label for="timeout">Connection Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              bind:value={settings.docker.timeout}
              min="5"
              max="300"
            />
          </div>

          <div class="flex items-center space-x-2">
            <Switch bind:checked={settings.docker.tlsVerify} />
            <Label for="tls-verify">Enable TLS verification</Label>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Connection Status</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="flex items-center gap-4">
            <Badge class="bg-success text-success-foreground gap-1">
              <div class="h-2 w-2 rounded-full bg-success-foreground"></div>
              Connected
            </Badge>
            <span class="text-sm text-muted-foreground">Docker Engine v24.0.6</span>
          </div>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <!-- Interface Settings -->
    <Tabs.Content value="interface" class="space-y-4">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Palette class="h-5 w-5" />
            Appearance
          </Card.Title>
          <Card.Description>
            Customize the application interface and theme
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-6">
          <div class="space-y-2">
            <Label>Theme</Label>
            <Select.Root>
              <Select.Trigger>
                <Select.Value placeholder="Select theme" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="light" onclick={() => settings.ui.theme = 'light'}>Light</Select.Item>
                <Select.Item value="dark" onclick={() => settings.ui.theme = 'dark'}>Dark</Select.Item>
                <Select.Item value="system" onclick={() => settings.ui.theme = 'system'}>System</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          <Separator />

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Auto-refresh</Label>
              <p class="text-sm text-muted-foreground">
                Automatically refresh container data
              </p>
            </div>
            <Switch bind:checked={settings.ui.autoRefresh} />
          </div>

          <div class="space-y-2">
            <Label for="refresh-interval">Refresh Interval (seconds)</Label>
            <Input
              id="refresh-interval"
              type="number"
              bind:value={settings.ui.refreshInterval}
              min="1"
              max="60"
              disabled={!settings.ui.autoRefresh}
            />
          </div>

          <Separator />

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Compact Mode</Label>
              <p class="text-sm text-muted-foreground">
                Use smaller spacing and compact layouts
              </p>
            </div>
            <Switch bind:checked={settings.ui.compactMode} />
          </div>

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Show System Containers</Label>
              <p class="text-sm text-muted-foreground">
                Display Docker system and internal containers
              </p>
            </div>
            <Switch bind:checked={settings.ui.showSystemContainers} />
          </div>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <!-- Notifications Settings -->
    <Tabs.Content value="notifications" class="space-y-4">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Bell class="h-5 w-5" />
            Notification Preferences
          </Card.Title>
          <Card.Description>
            Configure when and how you receive notifications
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Enable Notifications</Label>
              <p class="text-sm text-muted-foreground">
                Receive browser notifications for events
              </p>
            </div>
            <Switch bind:checked={settings.notifications.enabled} />
          </div>

          <Separator />

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Container Events</Label>
              <p class="text-sm text-muted-foreground">
                Notify on container start, stop, and errors
              </p>
            </div>
            <Switch 
              bind:checked={settings.notifications.containerEvents} 
              disabled={!settings.notifications.enabled}
            />
          </div>

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>System Alerts</Label>
              <p class="text-sm text-muted-foreground">
                Notify on Docker daemon issues and warnings
              </p>
            </div>
            <Switch 
              bind:checked={settings.notifications.systemAlerts}
              disabled={!settings.notifications.enabled}
            />
          </div>

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Sound Notifications</Label>
              <p class="text-sm text-muted-foreground">
                Play sound alerts for critical events
              </p>
            </div>
            <Switch 
              bind:checked={settings.notifications.soundEnabled}
              disabled={!settings.notifications.enabled}
            />
          </div>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <!-- Security Settings -->
    <Tabs.Content value="security" class="space-y-4">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Shield class="h-5 w-5" />
            Security & Access
          </Card.Title>
          <Card.Description>
            Configure security policies and access controls
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Require Authentication</Label>
              <p class="text-sm text-muted-foreground">
                Require login to access the application
              </p>
            </div>
            <Switch bind:checked={settings.security.requireAuth} />
          </div>

          <div class="space-y-2">
            <Label for="session-timeout">Session Timeout (minutes)</Label>
            <Input
              id="session-timeout"
              type="number"
              bind:value={settings.security.sessionTimeout}
              min="5"
              max="480"
              disabled={!settings.security.requireAuth}
            />
          </div>

          <Separator />

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Audit Logging</Label>
              <p class="text-sm text-muted-foreground">
                Log user actions and system events
              </p>
            </div>
            <Switch bind:checked={settings.security.auditLogging} />
          </div>

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Restricted Mode</Label>
              <p class="text-sm text-muted-foreground">
                Limit access to read-only operations
              </p>
            </div>
            <Switch bind:checked={settings.security.restrictedMode} />
          </div>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>

    <!-- Performance Settings -->
    <Tabs.Content value="performance" class="space-y-4">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Zap class="h-5 w-5" />
            Performance & Metrics
          </Card.Title>
          <Card.Description>
            Configure performance monitoring and resource limits
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Enable Metrics Collection</Label>
              <p class="text-sm text-muted-foreground">
                Collect and store container performance metrics
              </p>
            </div>
            <Switch bind:checked={settings.performance.enableMetrics} />
          </div>

          <div class="space-y-2">
            <Label for="retention">Data Retention (days)</Label>
            <Input
              id="retention"
              type="number"
              bind:value={settings.performance.retentionDays}
              min="1"
              max="90"
              disabled={!settings.performance.enableMetrics}
            />
          </div>

          <Separator />

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Enable Response Caching</Label>
              <p class="text-sm text-muted-foreground">
                Cache Docker API responses for better performance
              </p>
            </div>
            <Switch bind:checked={settings.performance.enableCache} />
          </div>

          <div class="space-y-2">
            <Label for="max-containers">Max Containers to Display</Label>
            <Input
              id="max-containers"
              type="number"
              bind:value={settings.performance.maxContainers}
              min="10"
              max="1000"
            />
          </div>
        </Card.Content>
      </Card.Root>
    </Tabs.Content>
  </Tabs.Root>

  <!-- Application Info -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Info class="h-5 w-5" />
        Application Information
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="space-y-2">
          <p class="text-sm font-medium text-muted-foreground">Version</p>
          <p class="text-lg font-semibold">DocSee v1.0.0</p>
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-muted-foreground">Build</p>
          <p class="text-lg font-semibold font-mono">2024.1.15</p>
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-muted-foreground">License</p>
          <div class="flex items-center gap-2">
            <p class="text-lg font-semibold">MIT</p>
            <Button variant="ghost" size="sm" class="h-6 px-2">
              <ExternalLink class="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card.Content>
  </Card.Root>
</div>
