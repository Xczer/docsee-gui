<!-- src/routes/settings/+page.svelte -->
<script lang="ts">
import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Clock,
	Database,
	Download,
	ExternalLink,
	Eye,
	EyeOff,
	Globe,
	HardDrive,
	Info,
	Lock,
	Monitor,
	Moon,
	Palette,
	RefreshCw,
	RotateCcw,
	Save,
	Server,
	Settings,
	Shield,
	Sun,
	TestTube,
	Upload,
} from "lucide-svelte";
import { onDestroy, onMount } from "svelte";

import * as Alert from "$lib/components/ui/alert";
import { Badge } from "$lib/components/ui/badge";
// Import shadcn-svelte components
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import * as Collapsible from "$lib/components/ui/collapsible";
import * as Dialog from "$lib/components/ui/dialog";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import * as Select from "$lib/components/ui/select";
import { Separator } from "$lib/components/ui/separator";
import { Skeleton } from "$lib/components/ui/skeleton";
import { Slider } from "$lib/components/ui/slider";
import { Switch } from "$lib/components/ui/switch";
import * as Tabs from "$lib/components/ui/tabs";
import { Textarea } from "$lib/components/ui/textarea";

import { testDockerConnection } from "$lib/services/tauri-commands";
import { dockerStore } from "$lib/stores/docker.svelte";
// Import stores and services
import { settingsStore } from "$lib/stores/settings.svelte";
import { toast } from "svelte-sonner";

// Reactive state
let isTestingConnection = $state(false);
let showImportDialog = $state(false);
let showExportDialog = $state(false);
let importText = $state("");
let exportText = $state("");
// biome-ignore lint/style/useConst: <explanation>
let showAdvancedDocker = $state(false);
// biome-ignore lint/style/useConst: <explanation>
let showAdvancedSecurity = $state(false);

// Store getters
const settings = $derived(settingsStore.settings);
const isLoading = $derived(settingsStore.isLoading);
const isSaving = $derived(settingsStore.isSaving);
const hasUnsavedChanges = $derived(settingsStore.hasUnsavedChanges);
const error = $derived(settingsStore.error);
const lastSaved = $derived(settingsStore.lastSaved);
const dockerSettings = $derived(settingsStore.dockerSettings);
const appSettings = $derived(settingsStore.applicationSettings);
const resourceSettings = $derived(settingsStore.resourceSettings);
const securitySettings = $derived(settingsStore.securitySettings);
const connectionStatus = $derived(dockerStore.connectionStatus);

// Theme options
const themeOptions = [
	{ value: "auto", label: "Auto", icon: Monitor },
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
];

// Language options (future-ready)
const languageOptions = [
	{ value: "en", label: "English" },
	{ value: "es", label: "Español" },
	{ value: "fr", label: "Français" },
	{ value: "de", label: "Deutsch" },
];

// Image pull policy options
const pullPolicyOptions = [
	{
		value: "always",
		label: "Always pull latest",
		description: "Always pull the latest version",
	},
	{
		value: "missing",
		label: "Pull if missing",
		description: "Only pull if image doesn't exist locally",
	},
	{
		value: "never",
		label: "Never pull",
		description: "Never automatically pull images",
	},
];

// Handle save settings
async function handleSave() {
	const success = await settingsStore.saveSettings();
	if (success) {
		// Apply theme change if needed
		if (appSettings.theme !== "auto") {
			// Theme integration would happen here with mode-watcher
			document.documentElement.classList.toggle(
				"dark",
				appSettings.theme === "dark",
			);
		}
	}
}

// Handle reset to defaults
function handleReset() {
	if (
		confirm(
			"Are you sure you want to reset all settings to defaults? This cannot be undone.",
		)
	) {
		settingsStore.resetToDefaults();
		toast.success("Settings reset to defaults");
	}
}

// Handle Docker connection test
async function handleTestConnection() {
	try {
		isTestingConnection = true;
		const isConnected = await testDockerConnection();

		if (isConnected) {
			toast.success("Docker connection successful!");
		} else {
			toast.error("Failed to connect to Docker");
		}
	} catch (error) {
		console.error("Connection test failed:", error);
		toast.error("Connection test failed");
	} finally {
		isTestingConnection = false;
	}
}

// Handle export settings
function handleExport() {
	exportText = settingsStore.exportSettings();
	showExportDialog = true;
}

// Handle import settings
async function handleImport() {
	if (importText.trim()) {
		const success = await settingsStore.importSettings(importText);
		if (success) {
			showImportDialog = false;
			importText = "";
		}
	}
}

// Copy export text to clipboard
async function copyExportText() {
	try {
		await navigator.clipboard.writeText(exportText);
		toast.success("Settings copied to clipboard");
	} catch (error) {
		toast.error("Failed to copy to clipboard");
	}
}

// Download export as file
function downloadExportFile() {
	const blob = new Blob([exportText], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `docsee-settings-${new Date().toISOString().split("T")[0]}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Format time since last saved
function formatLastSaved(timestamp: number | null) {
	if (!timestamp) return "Never";

	const now = Date.now();
	const diff = now - timestamp;

	if (diff < 60000) return "Just now";
	if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
	if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
	return new Date(timestamp).toLocaleDateString();
}

// Format bytes
function formatBytes(bytes: number) {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

// Validation functions
const dockerHostError = $derived(() => {
	if (dockerSettings.host) {
		return settingsStore.validateDockerHost(dockerSettings.host);
	}
	return null;
});

const timeoutError = $derived(() => {
	return settingsStore.validateTimeout(dockerSettings.connectionTimeout);
});

onMount(() => {
	// Settings are automatically loaded in the store constructor
});

onDestroy(() => {
	// Cleanup is handled in the store
});
</script>

<svelte:head>
  <title>Settings - DocSee</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
      <p class="text-muted-foreground">
        Configure DocSee preferences and Docker connection settings
      </p>

      <!-- Status indicators -->
      <div class="flex items-center gap-4 text-sm">
        <!-- Connection Status -->
        <div class="flex items-center gap-2">
          <div
            class="h-2 w-2 rounded-full {connectionStatus.connected
              ? 'bg-green-500'
              : 'bg-red-500'}"
          ></div>
          <span
            class={connectionStatus.connected
              ? "text-green-600"
              : "text-red-600"}
          >
            {connectionStatus.connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <!-- Last Saved -->
        <div class="flex items-center gap-2 text-muted-foreground">
          <Clock class="h-3 w-3" />
          <span>Last saved: {formatLastSaved(lastSaved)}</span>
        </div>

        <!-- Unsaved Changes -->
        {#if hasUnsavedChanges}
          <Badge variant="outline" class="text-orange-600 border-orange-200">
            <AlertCircle class="mr-1 h-3 w-3" />
            Unsaved changes
          </Badge>
        {/if}
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm" onclick={handleReset}>
        <RotateCcw class="mr-2 h-4 w-4" />
        Reset
      </Button>
      <Button variant="outline" size="sm" onclick={handleExport}>
        <Download class="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button
        variant="outline"
        size="sm"
        onclick={() => (showImportDialog = true)}
      >
        <Upload class="mr-2 h-4 w-4" />
        Import
      </Button>
      <Button
        size="sm"
        onclick={handleSave}
        disabled={isSaving || !hasUnsavedChanges}
        class="min-w-[100px]"
      >
        {#if isSaving}
          <RefreshCw class="mr-2 h-4 w-4 animate-spin" />
          Saving...
        {:else}
          <Save class="mr-2 h-4 w-4" />
          Save Changes
        {/if}
      </Button>
    </div>
  </div>

  <!-- Error Alert -->
  {#if error}
    <Alert.Root variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <Alert.Title>Error</Alert.Title>
      <Alert.Description>{error}</Alert.Description>
    </Alert.Root>
  {/if}

  <!-- Settings Content -->
  {#if isLoading}
    <!-- Loading State -->
    <div class="space-y-6">
      {#each Array(4) as _}
        <Card.Root>
          <Card.Header>
            <Skeleton class="h-6 w-48" />
            <Skeleton class="h-4 w-96" />
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              {#each Array(3) as _}
                <div class="space-y-2">
                  <Skeleton class="h-4 w-32" />
                  <Skeleton class="h-10 w-full" />
                </div>
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {:else}
    <!-- Settings Tabs -->
    <Tabs.Root value="docker" class="w-full">
      <Tabs.List class="grid w-full grid-cols-4">
        <Tabs.Trigger value="docker" class="flex items-center gap-2">
          <Server class="h-4 w-4" />
          Docker
        </Tabs.Trigger>
        <Tabs.Trigger value="application" class="flex items-center gap-2">
          <Palette class="h-4 w-4" />
          Application
        </Tabs.Trigger>
        <Tabs.Trigger value="resources" class="flex items-center gap-2">
          <HardDrive class="h-4 w-4" />
          Resources
        </Tabs.Trigger>
        <Tabs.Trigger value="security" class="flex items-center gap-2">
          <Shield class="h-4 w-4" />
          Security
        </Tabs.Trigger>
      </Tabs.List>

      <!-- Docker Connection Settings -->
      <Tabs.Content value="docker" class="space-y-6 mt-6">
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Server class="h-5 w-5" />
              Docker Connection
            </Card.Title>
            <Card.Description>
              Configure how DocSee connects to your Docker daemon
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Docker Host -->
            <div class="space-y-2">
              <Label for="docker-host">Docker Host</Label>
              <Input
                id="docker-host"
                placeholder="unix:///var/run/docker.sock"
                value={dockerSettings.host}
                oninput={(e) => {
                  const value = e.currentTarget.value;
                  settingsStore.updateDockerSettings({ host: value });
                }}
                class={dockerHostError() ? "border-red-500" : ""}
              />
              {#if dockerHostError}
                <p class="text-sm text-red-600">{dockerHostError}</p>
              {:else}
                <p class="text-sm text-muted-foreground">
                  Common formats: unix:///var/run/docker.sock,
                  tcp://localhost:2376
                </p>
              {/if}
            </div>

            <!-- Connection Timeout -->
            <div class="space-y-2">
              <Label for="connection-timeout"
                >Connection Timeout (seconds)</Label
              >
              <div class="flex items-center gap-4">
                <Slider
                  type="multiple"
                  value={[dockerSettings.connectionTimeout]}
                  onValueChange={(value) =>
                    settingsStore.updateDockerSettings({
                      connectionTimeout: value[0],
                    })}
                  min={5}
                  max={120}
                  step={5}
                  class="flex-1"
                />
                <span class="text-sm font-medium w-12"
                  >{dockerSettings.connectionTimeout}s</span
                >
              </div>
              {#if timeoutError}
                <p class="text-sm text-red-600">{timeoutError}</p>
              {/if}
            </div>

            <!-- Auto Reconnect -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Auto Reconnect</Label>
                <p class="text-sm text-muted-foreground">
                  Automatically reconnect when connection is lost
                </p>
              </div>
              <Switch
                bind:checked={dockerSettings.autoReconnect}
                onCheckedChange={(checked) =>
                  settingsStore.updateDockerSettings({
                    autoReconnect: checked,
                  })}
              />
            </div>

            <!-- Advanced Settings -->
            <Collapsible.Root bind:open={showAdvancedDocker}>
              <Collapsible.Trigger class="w-full">
                <Button variant="ghost" class="w-full justify-between p-0">
                  <span class="font-medium">Advanced Settings</span>
                  {#if showAdvancedDocker}
                    <ChevronDown class="h-4 w-4" />
                  {:else}
                    <ChevronRight class="h-4 w-4" />
                  {/if}
                </Button>
              </Collapsible.Trigger>
              <Collapsible.Content class="space-y-4 mt-4">
                <!-- Retry Attempts -->
                <div class="space-y-2">
                  <Label>Retry Attempts</Label>
                  <div class="flex items-center gap-4">
                    <Slider
                      type="multiple"
                      value={[dockerSettings.retryAttempts]}
                      onValueChange={(value) =>
                        settingsStore.updateDockerSettings({
                          retryAttempts: value[0],
                        })}
                      min={1}
                      max={10}
                      step={1}
                      class="flex-1"
                    />
                    <span class="text-sm font-medium w-8"
                      >{dockerSettings.retryAttempts}</span
                    >
                  </div>
                </div>
                <!-- Retry Delay -->
                <div class="space-y-2">
                  <Label>Retry Delay (milliseconds)</Label>
                  <div class="flex items-center gap-4">
                    <Slider
                      type="multiple"
                      value={[dockerSettings.retryDelay]}
                      onValueChange={(value) =>
                        settingsStore.updateDockerSettings({
                          retryDelay: value[0],
                        })}
                      min={1000}
                      max={10000}
                      step={500}
                      class="flex-1"
                    />
                    <span class="text-sm font-medium w-16"
                      >{dockerSettings.retryDelay}ms</span
                    >
                  </div>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>

            <!-- Test Connection -->
            <div class="pt-4 border-t">
              <Button
                onclick={handleTestConnection}
                disabled={isTestingConnection || !!dockerHostError}
                variant="outline"
                class="w-full"
              >
                {#if isTestingConnection}
                  <RefreshCw class="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                {:else}
                  <TestTube class="mr-2 h-4 w-4" />
                  Test Connection
                {/if}
              </Button>
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- Application Preferences -->
      <Tabs.Content value="application" class="space-y-6 mt-6">
        <!-- Theme Settings -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Palette class="h-5 w-5" />
              Appearance
            </Card.Title>
            <Card.Description>
              Customize the look and feel of the application
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Theme Selection -->
            <div class="space-y-2">
              <Label>Theme</Label>
              <Select.Root
                type="single"
                bind:value={appSettings.theme}
                onValueChange={(value) => {
                  if (
                    value &&
                    (value === "auto" || value === "light" || value === "dark")
                  ) {
                    settingsStore.updateApplicationSettings({ theme: value });
                  }
                }}
              >
                <Select.Trigger>
                  <div class="flex items-center gap-2">
                    {#each themeOptions as option}
                      {#if option.value === appSettings.theme}
                        <option.icon class="h-4 w-4" />
                        {option.label}
                      {/if}
                    {/each}
                  </div>
                </Select.Trigger>
                <Select.Content>
                  {#each themeOptions as option}
                    <Select.Item value={option.value}>
                      <div class="flex items-center gap-2">
                        <option.icon class="h-4 w-4" />
                        {option.label}
                      </div>
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>

            <!-- Compact View -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Compact View</Label>
                <p class="text-sm text-muted-foreground">
                  Use a more compact layout for tables and lists
                </p>
              </div>
              <Switch
                bind:checked={appSettings.compactView}
                onCheckedChange={(checked) =>
                  settingsStore.updateApplicationSettings({
                    compactView: checked,
                  })}
              />
            </div>

            <!-- Language -->
            <div class="space-y-2">
              <Label>Language</Label>
              <Select.Root
                type="single"
                bind:value={appSettings.language}
                onValueChange={(value) => {
                  if (value) {
                    settingsStore.updateApplicationSettings({
                      language: value,
                    });
                  }
                }}
              >
                <Select.Trigger>
                  <div class="flex items-center gap-2">
                    <Globe class="h-4 w-4" />
                    {languageOptions.find(
                      (l) => l.value === appSettings.language,
                    )?.label || "English"}
                  </div>
                </Select.Trigger>
                <Select.Content>
                  {#each languageOptions as option}
                    <Select.Item value={option.value}>
                      {option.label}
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
              <p class="text-sm text-muted-foreground">
                Language support coming in future updates
              </p>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Auto-Refresh Settings -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <RefreshCw class="h-5 w-5" />
              Auto-Refresh
            </Card.Title>
            <Card.Description>
              Configure automatic refresh intervals for different resources
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Global Auto-Refresh -->
            <div class="space-y-2">
              <Label>Global Refresh Interval (seconds)</Label>
              <div class="flex items-center gap-4">
                <Slider
                  type="multiple"
                  value={[appSettings.autoRefreshInterval]}
                  onValueChange={(value) =>
                    settingsStore.updateApplicationSettings({
                      autoRefreshInterval: value[0],
                    })}
                  min={1000}
                  max={60000}
                  step={1000}
                  class="flex-1"
                />
                <span class="text-sm font-medium w-12"
                  >{appSettings.autoRefreshInterval / 1000}s</span
                >
              </div>
            </div>

            <!-- Container Refresh -->
            <div class="space-y-2">
              <Label>Container Refresh Interval (seconds)</Label>
              <div class="flex items-center gap-4">
                <Slider
                  type="multiple"
                  value={[appSettings.containerRefreshInterval]}
                  onValueChange={(value) =>
                    settingsStore.updateApplicationSettings({
                      containerRefreshInterval: value[0],
                    })}
                  min={1000}
                  max={60000}
                  step={1000}
                  class="flex-1"
                />
                <span class="text-sm font-medium w-12"
                  >{appSettings.containerRefreshInterval / 1000}s</span
                >
              </div>
            </div>

            <!-- Image Refresh -->
            <div class="space-y-2">
              <Label>Image Refresh Interval (seconds)</Label>
              <div class="flex items-center gap-4">
                <Slider
                  type="multiple"
                  value={[appSettings.imageRefreshInterval]}
                  onValueChange={(value) =>
                    settingsStore.updateApplicationSettings({
                      imageRefreshInterval: value[0],
                    })}
                  min={5000}
                  max={120000}
                  step={5000}
                  class="flex-1"
                />
                <span class="text-sm font-medium w-12"
                  >{appSettings.imageRefreshInterval / 1000}s</span
                >
              </div>
            </div>

            <!-- Volume Refresh -->
            <div class="space-y-2">
              <Label>Volume Refresh Interval (seconds)</Label>
              <div class="flex items-center gap-4">
                <Slider
                  type="multiple"
                  value={[appSettings.volumeRefreshInterval]}
                  onValueChange={(value) =>
                    settingsStore.updateApplicationSettings({
                      volumeRefreshInterval: value[0],
                    })}
                  min={5000}
                  max={300000}
                  step={5000}
                  class="flex-1"
                />
                <span class="text-sm font-medium w-12"
                  >{appSettings.volumeRefreshInterval / 1000}s</span
                >
              </div>
            </div>

            <!-- Network Refresh -->
            <div class="space-y-2">
              <Label>Network Refresh Interval (seconds)</Label>
              <div class="flex items-center gap-4">
                <Slider
                  type="multiple"
                  value={[appSettings.networkRefreshInterval]}
                  onValueChange={(value) =>
                    settingsStore.updateApplicationSettings({
                      networkRefreshInterval: value[0],
                    })}
                  min={5000}
                  max={300000}
                  step={5000}
                  class="flex-1"
                />
                <span class="text-sm font-medium w-12"
                  >{appSettings.networkRefreshInterval / 1000}s</span
                >
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Default Views -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Eye class="h-5 w-5" />
              Default Views
            </Card.Title>
            <Card.Description>
              Set default view preferences for different pages
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Default Container View -->
            <div class="space-y-2">
              <Label>Default Container View</Label>
              <Select.Root
                type="single"
                bind:value={appSettings.defaultContainerView}
                onValueChange={(value) => {
                  if (value && (value === "all" || value === "running")) {
                    settingsStore.updateApplicationSettings({
                      defaultContainerView: value,
                    });
                  }
                }}
              >
                <Select.Trigger>
                  {appSettings.defaultContainerView === "all"
                    ? "All Containers"
                    : "Running Only"}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All Containers</Select.Item>
                  <Select.Item value="running">Running Only</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>

            <!-- Enable Notifications -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Enable Notifications</Label>
                <p class="text-sm text-muted-foreground">
                  Show toast notifications for operations and events
                </p>
              </div>
              <Switch
                bind:checked={appSettings.enableNotifications}
                onCheckedChange={(checked) =>
                  settingsStore.updateApplicationSettings({
                    enableNotifications: checked,
                  })}
              />
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- Resource Management -->
      <Tabs.Content value="resources" class="space-y-6 mt-6">
        <!-- Container Management -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <HardDrive class="h-5 w-5" />
              Container Management
            </Card.Title>
            <Card.Description>
              Configure default behaviors for container operations
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Auto Remove Containers -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Auto-remove Containers</Label>
                <p class="text-sm text-muted-foreground">
                  Automatically remove containers when they exit
                </p>
              </div>
              <Switch
                bind:checked={resourceSettings.autoRemoveContainers}
                onCheckedChange={(checked) =>
                  settingsStore.updateResourceSettings({
                    autoRemoveContainers: checked,
                  })}
              />
            </div>

            <!-- Max Container Logs -->
            <div class="space-y-2">
              <Label>Max Container Log Lines</Label>
              <div class="flex items-center gap-4">
                <Slider
                  type="multiple"
                  value={[resourceSettings.maxContainerLogs]}
                  onValueChange={(value) =>
                    settingsStore.updateResourceSettings({
                      maxContainerLogs: value[0],
                    })}
                  min={100}
                  max={10000}
                  step={100}
                  class="flex-1"
                />
                <span class="text-sm font-medium w-16"
                  >{resourceSettings.maxContainerLogs}</span
                >
              </div>
              <p class="text-sm text-muted-foreground">
                Maximum number of log lines to fetch when viewing container logs
              </p>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Image Management -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Database class="h-5 w-5" />
              Image Management
            </Card.Title>
            <Card.Description>
              Configure image pull policies and cleanup behaviors
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Default Image Pull Policy -->
            <div class="space-y-2">
              <Label>Default Image Pull Policy</Label>
              <Select.Root
                type="single"
                bind:value={resourceSettings.defaultImagePullPolicy}
                onValueChange={(value) => {
                  if (value && (value === "always" || value === "missing")) {
                    settingsStore.updateResourceSettings({
                      defaultImagePullPolicy: value,
                    });
                  }
                }}
              >
                <Select.Trigger>
                  {pullPolicyOptions.find(
                    (p) => p.value === resourceSettings.defaultImagePullPolicy,
                  )?.label || "Pull if missing"}
                </Select.Trigger>
                <Select.Content>
                  {#each pullPolicyOptions as option}
                    <Select.Item value={option.value}>
                      <div class="space-y-1">
                        <div class="font-medium">{option.label}</div>
                        <div class="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>

            <!-- Enable Image Auto Cleanup -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Enable Image Auto-cleanup</Label>
                <p class="text-sm text-muted-foreground">
                  Automatically clean up unused images periodically
                </p>
              </div>
              <Switch
                bind:checked={resourceSettings.enableImageAutoCleanup}
                onCheckedChange={(checked) =>
                  settingsStore.updateResourceSettings({
                    enableImageAutoCleanup: checked,
                  })}
              />
            </div>

            {#if resourceSettings.enableImageAutoCleanup}
              <!-- Image Cleanup Days -->
              <div class="space-y-2">
                <Label>Image Cleanup Days</Label>
                <div class="flex items-center gap-4">
                  <Slider
                    type="multiple"
                    value={[resourceSettings.imageCleanupDays]}
                    onValueChange={(value) =>
                      settingsStore.updateResourceSettings({
                        imageCleanupDays: value[0],
                      })}
                    min={1}
                    max={90}
                    step={1}
                    class="flex-1"
                  />
                  <span class="text-sm font-medium w-16"
                    >{resourceSettings.imageCleanupDays} days</span
                  >
                </div>
                <p class="text-sm text-muted-foreground">
                  Clean up images that haven't been used for this many days
                </p>
              </div>
            {/if}
          </Card.Content>
        </Card.Root>

        <!-- Volume Management -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <HardDrive class="h-5 w-5" />
              Volume Management
            </Card.Title>
            <Card.Description>
              Configure volume cleanup and management policies
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Enable Volume Auto Cleanup -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Enable Volume Auto-cleanup</Label>
                <p class="text-sm text-muted-foreground">
                  Automatically clean up unused volumes periodically
                </p>
              </div>
              <Switch
                bind:checked={resourceSettings.enableVolumeAutoCleanup}
                onCheckedChange={(checked) =>
                  settingsStore.updateResourceSettings({
                    enableVolumeAutoCleanup: checked,
                  })}
              />
            </div>

            {#if resourceSettings.enableVolumeAutoCleanup}
              <!-- Volume Cleanup Days -->
              <div class="space-y-2">
                <Label>Volume Cleanup Days</Label>
                <div class="flex items-center gap-4">
                  <Slider
                    type="multiple"
                    value={[resourceSettings.volumeCleanupDays]}
                    onValueChange={(value) =>
                      settingsStore.updateResourceSettings({
                        volumeCleanupDays: value[0],
                      })}
                    min={1}
                    max={90}
                    step={1}
                    class="flex-1"
                  />
                  <span class="text-sm font-medium w-16"
                    >{resourceSettings.volumeCleanupDays} days</span
                  >
                </div>
                <p class="text-sm text-muted-foreground">
                  Clean up volumes that haven't been used for this many days
                </p>
              </div>
            {/if}
          </Card.Content>
        </Card.Root>

        <!-- Resource Warnings -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <AlertCircle class="h-5 w-5" />
              Resource Warnings
            </Card.Title>
            <Card.Description>
              Configure thresholds for resource usage warnings
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Enable Resource Warnings -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Enable Resource Warnings</Label>
                <p class="text-sm text-muted-foreground">
                  Show warnings when resource usage exceeds thresholds
                </p>
              </div>
              <Switch
                bind:checked={resourceSettings.enableResourceWarnings}
                onCheckedChange={(checked) =>
                  settingsStore.updateResourceSettings({
                    enableResourceWarnings: checked,
                  })}
              />
            </div>

            {#if resourceSettings.enableResourceWarnings}
              <!-- CPU Warning Threshold -->
              <div class="space-y-2">
                <Label>CPU Warning Threshold (%)</Label>
                <div class="flex items-center gap-4">
                  <Slider
                    type="multiple"
                    value={[resourceSettings.cpuWarningThreshold]}
                    onValueChange={(value) =>
                      settingsStore.updateResourceSettings({
                        cpuWarningThreshold: value[0],
                      })}
                    min={50}
                    max={95}
                    step={5}
                    class="flex-1"
                  />
                  <span class="text-sm font-medium w-12"
                    >{resourceSettings.cpuWarningThreshold}%</span
                  >
                </div>
              </div>

              <!-- Memory Warning Threshold -->
              <div class="space-y-2">
                <Label>Memory Warning Threshold (%)</Label>
                <div class="flex items-center gap-4">
                  <Slider
                    type="multiple"
                    value={[resourceSettings.memoryWarningThreshold]}
                    onValueChange={(value) =>
                      settingsStore.updateResourceSettings({
                        memoryWarningThreshold: value[0],
                      })}
                    min={50}
                    max={95}
                    step={5}
                    class="flex-1"
                  />
                  <span class="text-sm font-medium w-12"
                    >{resourceSettings.memoryWarningThreshold}%</span
                  >
                </div>
              </div>

              <!-- Disk Warning Threshold -->
              <div class="space-y-2">
                <Label>Disk Warning Threshold (%)</Label>
                <div class="flex items-center gap-4">
                  <Slider
                    type="multiple"
                    value={[resourceSettings.diskWarningThreshold]}
                    onValueChange={(value) =>
                      settingsStore.updateResourceSettings({
                        diskWarningThreshold: value[0],
                      })}
                    min={50}
                    max={95}
                    step={5}
                    class="flex-1"
                  />
                  <span class="text-sm font-medium w-12"
                    >{resourceSettings.diskWarningThreshold}%</span
                  >
                </div>
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <!-- Security & Privacy -->
      <Tabs.Content value="security" class="space-y-6 mt-6">
        <!-- Security Options -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Shield class="h-5 w-5" />
              Security
            </Card.Title>
            <Card.Description>
              Configure security settings and operation confirmations
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Enable Operation Confirmation -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Enable Operation Confirmation</Label>
                <p class="text-sm text-muted-foreground">
                  Require confirmation for destructive operations
                </p>
              </div>
              <Switch
                bind:checked={securitySettings.enableOperationConfirmation}
                onCheckedChange={(checked) =>
                  settingsStore.updateSecuritySettings({
                    enableOperationConfirmation: checked,
                  })}
              />
            </div>

            <!-- Allow Dangerous Operations -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Allow Dangerous Operations</Label>
                <p class="text-sm text-muted-foreground">
                  Enable potentially destructive operations like system prune
                </p>
              </div>
              <Switch
                bind:checked={securitySettings.allowDangerousOperations}
                onCheckedChange={(checked) =>
                  settingsStore.updateSecuritySettings({
                    allowDangerousOperations: checked,
                  })}
              />
            </div>

            <!-- Enable Audit Logging -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Enable Audit Logging</Label>
                <p class="text-sm text-muted-foreground">
                  Log all user actions for security auditing
                </p>
              </div>
              <Switch
                bind:checked={securitySettings.enableAuditLogging}
                onCheckedChange={(checked) =>
                  settingsStore.updateSecuritySettings({
                    enableAuditLogging: checked,
                  })}
              />
            </div>

            {#if securitySettings.enableAuditLogging}
              <!-- Audit Log Retention -->
              <div class="space-y-2">
                <Label>Audit Log Retention (days)</Label>
                <div class="flex items-center gap-4">
                  <Slider
                    type="multiple"
                    value={[securitySettings.auditLogRetentionDays]}
                    onValueChange={(value) =>
                      settingsStore.updateSecuritySettings({
                        auditLogRetentionDays: value[0],
                      })}
                    min={7}
                    max={365}
                    step={7}
                    class="flex-1"
                  />
                  <span class="text-sm font-medium w-16"
                    >{securitySettings.auditLogRetentionDays} days</span
                  >
                </div>
              </div>
            {/if}

            <!-- Advanced Security -->
            <Collapsible.Root bind:open={showAdvancedSecurity}>
              <Collapsible.Trigger class="w-full">
                <Button variant="ghost" class="w-full justify-between p-0">
                  <span class="font-medium">Advanced Security Settings</span>
                  {#if showAdvancedSecurity}
                    <ChevronDown class="h-4 w-4" />
                  {:else}
                    <ChevronRight class="h-4 w-4" />
                  {/if}
                </Button>
              </Collapsible.Trigger>
              <Collapsible.Content class="space-y-4 mt-4">
                <!-- Export Include Credentials -->
                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <Label>Export Include Credentials</Label>
                    <p class="text-sm text-muted-foreground">
                      Include sensitive data when exporting settings
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.exportIncludeCredentials}
                    onCheckedChange={(checked) =>
                      settingsStore.updateSecuritySettings({
                        exportIncludeCredentials: checked,
                      })}
                  />
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          </Card.Content>
        </Card.Root>

        <!-- Privacy Settings -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Lock class="h-5 w-5" />
              Privacy
            </Card.Title>
            <Card.Description>
              Configure data retention and telemetry settings
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-6">
            <!-- Enable Telemetry -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>Enable Telemetry</Label>
                <p class="text-sm text-muted-foreground">
                  Help improve DocSee by sending anonymous usage data
                </p>
              </div>
              <Switch
                bind:checked={securitySettings.enableTelemetry}
                onCheckedChange={(checked) =>
                  settingsStore.updateSecuritySettings({
                    enableTelemetry: checked,
                  })}
              />
            </div>

            <!-- Data Retention -->
            <div class="space-y-2">
              <Label>Data Retention (days)</Label>
              <div class="flex items-center gap-4">
                <Slider
                  type="multiple"
                  value={[securitySettings.dataRetentionDays]}
                  onValueChange={(value) =>
                    settingsStore.updateSecuritySettings({
                      dataRetentionDays: value[0],
                    })}
                  min={30}
                  max={730}
                  step={30}
                  class="flex-1"
                />
                <span class="text-sm font-medium w-16"
                  >{securitySettings.dataRetentionDays} days</span
                >
              </div>
              <p class="text-sm text-muted-foreground">
                How long to keep application data and logs
              </p>
            </div>
          </Card.Content>
        </Card.Root>

        <!-- About & System Info -->
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <Info class="h-5 w-5" />
              About & System
            </Card.Title>
            <Card.Description>
              Application information and system details
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-4">
            <!-- Application Version -->
            <div class="flex items-center justify-between">
              <div>
                <Label>Application Version</Label>
                <p class="text-sm text-muted-foreground">
                  DocSee Docker Manager
                </p>
              </div>
              <Badge variant="outline">{settings.version}</Badge>
            </div>

            <!-- Docker Information -->
            {#if connectionStatus.connected}
              <div class="flex items-center justify-between">
                <div>
                  <Label>Docker Version</Label>
                  <p class="text-sm text-muted-foreground">
                    Connected Docker daemon
                  </p>
                </div>
                <Badge
                  variant="outline"
                  class="text-green-600 border-green-200"
                >
                  {connectionStatus.version || "Unknown"}
                </Badge>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <Label>Docker API Version</Label>
                  <p class="text-sm text-muted-foreground">
                    API compatibility version
                  </p>
                </div>
                <Badge variant="outline">
                  {connectionStatus.api_version || "Unknown"}
                </Badge>
              </div>
            {/if}

            <!-- Settings Information -->
            <div class="pt-4 border-t space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Settings Size</span>
                <span>{formatBytes(JSON.stringify(settings).length)}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Last Modified</span>
                <span>{new Date(settings.lastModified).toLocaleString()}</span>
              </div>
            </div>

            <!-- Links -->
            <div class="pt-4 border-t">
              <div class="flex items-center gap-4 text-sm">
                <a
                  href="https://github.com/Xczer/docsee-gui"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1 text-primary hover:underline"
                >
                  GitHub
                  <ExternalLink class="h-3 w-3" />
                </a>
                <a
                  href="https://github.com/Xczer/docsee-gui/wiki"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1 text-primary hover:underline"
                >
                  Documentation
                  <ExternalLink class="h-3 w-3" />
                </a>
                <a
                  href="mailto:support@xczer.in"
                  class="text-primary hover:underline"
                >
                  Support
                </a>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>
    </Tabs.Root>
  {/if}
</div>

<!-- Import Dialog -->
<Dialog.Root bind:open={showImportDialog}>
  <Dialog.Content class="max-w-2xl">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Upload class="h-5 w-5" />
        Import Settings
      </Dialog.Title>
      <Dialog.Description>
        Paste your settings JSON below to import configuration
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="import-textarea">Settings JSON</Label>
        <Textarea
          id="import-textarea"
          placeholder="Paste your exported settings JSON here..."
          bind:value={importText}
          class="min-h-[200px] font-mono text-sm"
        />
      </div>

      <Alert.Root>
        <AlertCircle class="h-4 w-4" />
        <Alert.Title>Import Warning</Alert.Title>
        <Alert.Description>
          Importing settings will overwrite your current configuration. Make
          sure to export your current settings first if you want to keep them.
        </Alert.Description>
      </Alert.Root>
    </div>

    <Dialog.Footer class="flex gap-2">
      <Button
        variant="outline"
        onclick={() => {
          showImportDialog = false;
          importText = "";
        }}
      >
        Cancel
      </Button>
      <Button onclick={handleImport} disabled={!importText.trim()}>
        <Upload class="mr-2 h-4 w-4" />
        Import Settings
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Export Dialog -->
<Dialog.Root bind:open={showExportDialog}>
  <Dialog.Content class="max-w-2xl">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2">
        <Download class="h-5 w-5" />
        Export Settings
      </Dialog.Title>
      <Dialog.Description>
        Copy or download your current settings configuration
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="export-textarea">Settings JSON</Label>
        <Textarea
          id="export-textarea"
          readonly
          bind:value={exportText}
          class="min-h-[200px] font-mono text-sm"
        />
      </div>

      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <Info class="h-4 w-4" />
        <span>
          {securitySettings.exportIncludeCredentials
            ? "Export includes sensitive data"
            : "Sensitive data excluded from export"}
        </span>
      </div>
    </div>

    <Dialog.Footer class="flex gap-2">
      <Button variant="outline" onclick={() => (showExportDialog = false)}>
        Close
      </Button>
      <Button variant="outline" onclick={copyExportText}>
        Copy to Clipboard
      </Button>
      <Button onclick={downloadExportFile}>
        <Download class="mr-2 h-4 w-4" />
        Download File
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
