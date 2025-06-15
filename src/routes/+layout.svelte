<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import {
		connectionStatus,
		initializeDockerConnection,
		startAutoRefresh,
		stopAutoRefresh,
		isConnecting,
		dockerError,
		setDockerError
	} from '$lib/stores/docker.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ThemeToggle } from '$lib/components/ui';
	import {
		Container,
		Image,
		Network,
		HardDrive,
		BarChart3,
		Settings,
		Home,
		X,
		AlertCircle,
		Wifi,
		WifiOff,
		Loader2
	} from 'lucide-svelte';

	// Properly destructure children from $props
	let { children } = $props();

	let mounted = $state(false);

	// Get reactive values
	let currentConnectionStatus = $derived(connectionStatus());
	let currentIsConnecting = $derived(isConnecting());
	let currentDockerError = $derived(dockerError());
	let currentTheme = $derived(theme());

	// Reactive statements for navigation highlighting using $derived
	let currentPath = $derived($page.url.pathname);

	// Debug reactive statements using $effect - moved after reactive values are defined
	$effect(() => {
		if (mounted) {
			console.log('Connection Status:', currentConnectionStatus);
			console.log('Is Connecting:', currentIsConnecting);
			console.log('Docker Error:', currentDockerError);
			console.log('Current Theme:', currentTheme);
		}
	});

	onMount(async () => {
		mounted = true;
		console.log('Layout mounted, initializing Docker connection...');

		try {
			// Initialize Docker connection when the app starts
			await initializeDockerConnection();
			console.log('Docker connection initialized');

			// Start auto-refresh of connection status
			startAutoRefresh(5000);
			console.log('Auto-refresh started');
		} catch (error) {
			console.error('Error during initialization:', error);
		}
	});

	onDestroy(() => {
		console.log('Layout unmounting, stopping auto-refresh...');
		stopAutoRefresh();
		mounted = false;
	});

	function isActiveRoute(route: string): boolean {
		if (route === '/' && currentPath === '/') return true;
		if (route !== '/' && currentPath.startsWith(route)) return true;
		return false;
	}

	// Navigation items
	const navigationItems = [
		{ path: '/', label: 'Dashboard', icon: Home },
		{ path: '/containers', label: 'Containers', icon: Container },
		{ path: '/images', label: 'Images', icon: Image },
		{ path: '/networks', label: 'Networks', icon: Network },
		{ path: '/volumes', label: 'Volumes', icon: HardDrive },
		{ path: '/system', label: 'System', icon: BarChart3 },
	];

	// Navigation helper
	function navigateTo(path: string) {
		goto(path);
	}
</script>

<svelte:head>
	<title>DocSee - Docker Management</title>
	<meta name="description" content="Modern Docker management application built with Tauri and Svelte" />
</svelte:head>

<div class="min-h-screen bg-background font-sans antialiased">
	<!-- Header -->
	<header class="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
		<div class="container mx-auto px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<!-- Logo and Main Navigation -->
				<div class="flex items-center gap-8">
					<!-- Logo -->
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<Container class="h-4 w-4" />
						</div>
						<h1 class="text-xl font-bold tracking-tight text-foreground">
							DocSee
						</h1>
					</div>

					<!-- Desktop Navigation -->
					<nav class="hidden lg:flex items-center gap-1">
						{#each navigationItems as item}
							{@const IconComponent = item.icon}
							<button
								class="btn btn-ghost btn-sm gap-2 px-3 {isActiveRoute(item.path) ? 'bg-secondary text-secondary-foreground' : ''}"
								onclick={() => navigateTo(item.path)}
							>
								<IconComponent class="h-4 w-4" />
								{item.label}
							</button>
						{/each}
					</nav>
				</div>

				<!-- Status and Actions -->
				<div class="flex items-center gap-4">
					<!-- Docker Connection Status -->
					<div class="hidden sm:flex items-center gap-2">
						{#if currentIsConnecting}
							<span class="badge badge-secondary gap-2">
								<Loader2 class="h-3 w-3 animate-spin" />
								Connecting...
							</span>
						{:else if currentConnectionStatus.connected}
							<span class="badge gap-2 bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
								<Wifi class="h-3 w-3" />
								Connected {currentConnectionStatus.version ? `(${currentConnectionStatus.version})` : ''}
							</span>
						{:else}
							<span class="badge badge-destructive gap-2">
								<WifiOff class="h-3 w-3" />
								{currentConnectionStatus.error ? 'Error' : 'Disconnected'}
							</span>
						{/if}
					</div>

					<!-- Theme Toggle -->
					<ThemeToggle />

					<!-- Settings -->
					<button
						class="btn btn-ghost btn-icon"
						onclick={() => navigateTo('/settings')}
						title="Settings"
					>
						<Settings class="h-4 w-4" />
						<span class="sr-only">Settings</span>
					</button>
				</div>
			</div>
		</div>
	</header>

	<!-- Mobile Navigation (shown on smaller screens) -->
	<div class="lg:hidden border-b border-border bg-background">
		<div class="container mx-auto px-6">
			<div class="flex gap-1 py-3 overflow-x-auto">
				{#each navigationItems as item}
					{@const IconComponent = item.icon}
					<button
						class="btn btn-ghost btn-sm gap-2 px-3 flex-shrink-0 {isActiveRoute(item.path) ? 'bg-secondary text-secondary-foreground' : ''}"
						onclick={() => navigateTo(item.path)}
					>
						<IconComponent class="h-4 w-4" />
						{item.label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Error Banner -->
	{#if currentDockerError}
		<div class="alert alert-destructive rounded-none border-x-0 border-t-0">
			<div class="container mx-auto px-6 lg:px-8">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<AlertCircle class="h-4 w-4" />
						<div class="alert-description text-sm font-medium">
							Docker Error: {currentDockerError}
						</div>
					</div>
					<button
						class="btn btn-ghost btn-icon h-6 w-6 hover:bg-destructive/20"
						onclick={() => setDockerError(null)}
					>
						<X class="h-4 w-4" />
						<span class="sr-only">Close error message</span>
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Debug Info (only in development) -->
	<div class="bg-muted p-2 text-xs text-muted-foreground">
		<div class="container mx-auto px-6">
			Debug: Theme={currentTheme} | Connected={currentConnectionStatus.connected} | Connecting={currentIsConnecting} | Error={currentDockerError || 'None'}
		</div>
	</div>

	<!-- Main Content -->
	<main class="container mx-auto px-6 lg:px-8 py-8">
		<div class="max-w-screen-2xl mx-auto">
			{@render children?.()}
		</div>
	</main>
</div>

<style>
	/* Global styles */
	:global(html) {
		scroll-behavior: smooth;
	}

	:global(body) {
		overscroll-behavior: none;
		font-feature-settings: "rlig" 1, "calt" 1;
	}

	/* Custom scrollbar for webkit browsers */
	:global(*) {
		scrollbar-width: thin;
		scrollbar-color: var(--color-border) transparent;
	}

	:global(*::-webkit-scrollbar) {
		width: 6px;
		height: 6px;
	}

	:global(*::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(*::-webkit-scrollbar-thumb) {
		background-color: var(--color-border);
		border-radius: 3px;
	}

	:global(*::-webkit-scrollbar-thumb:hover) {
		background-color: var(--color-muted-foreground);
	}

	/* Focus styles */
	:global(*:focus-visible) {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
	}

	/* Selection styles */
	:global(::selection) {
		background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
	}

	/* Remove default focus styles that conflict */
	:global(button:focus),
	:global(input:focus),
	:global(select:focus),
	:global(textarea:focus) {
		outline: none;
	}

	/* Custom scrollbar for mobile navigation */
	.overflow-x-auto::-webkit-scrollbar {
		height: 4px;
	}

	.overflow-x-auto::-webkit-scrollbar-track {
		background: transparent;
	}

	.overflow-x-auto::-webkit-scrollbar-thumb {
		background: color-mix(in srgb, var(--color-muted-foreground) 30%, transparent);
		border-radius: 2px;
	}

	.overflow-x-auto::-webkit-scrollbar-thumb:hover {
		background: color-mix(in srgb, var(--color-muted-foreground) 50%, transparent);
	}
</style>
