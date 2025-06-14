<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { 
		connectionStatus, 
		initializeDockerConnection, 
		startAutoRefresh, 
		stopAutoRefresh,
		isConnecting,
		dockerError 
	} from '$lib/stores/docker.js';
	import { initializeTheme, theme } from '$lib/stores/theme.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ThemeToggle from '$lib/components/common/ThemeToggle.svelte';
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

	let mounted = false;
	let themeCleanup: (() => void) | undefined;

	onMount(async () => {
		mounted = true;
		// Initialize theme system
		themeCleanup = initializeTheme();
		// Initialize Docker connection when the app starts
		await initializeDockerConnection();
		// Start auto-refresh of connection status
		startAutoRefresh(5000);
	});

	onDestroy(() => {
		stopAutoRefresh();
		// Cleanup theme listeners
		if (themeCleanup) {
			themeCleanup();
		}
	});

	// Reactive statements for navigation highlighting
	$: currentPath = $page.url.pathname;
	
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
							<button
								class="btn btn-ghost btn-sm gap-2 px-3 {isActiveRoute(item.path) ? 'bg-secondary text-secondary-foreground' : ''}"
								on:click={() => goto(item.path)}
							>
								<svelte:component this={item.icon} class="h-4 w-4" />
								{item.label}
							</button>
						{/each}
					</nav>
				</div>
				
				<!-- Status and Actions -->
				<div class="flex items-center gap-4">
					<!-- Docker Connection Status -->
					<div class="hidden sm:flex items-center gap-2">
						{#if $isConnecting}
							<span class="badge badge-secondary gap-2">
								<Loader2 class="h-3 w-3 animate-spin" />
								Connecting...
							</span>
						{:else if $connectionStatus.connected}
							<span class="badge gap-2 bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
								<Wifi class="h-3 w-3" />
								Connected {$connectionStatus.version ? `(${$connectionStatus.version})` : ''}
							</span>
						{:else}
							<span class="badge badge-destructive gap-2">
								<WifiOff class="h-3 w-3" />
								{$connectionStatus.error ? 'Error' : 'Disconnected'}
							</span>
						{/if}
					</div>
					
					<!-- Theme Toggle -->
					<ThemeToggle variant="dropdown" size="md" />
					
					<!-- Settings -->
					<button
						class="btn btn-ghost btn-icon"
						on:click={() => goto('/settings')}
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
					<button
						class="btn btn-ghost btn-sm gap-2 px-3 flex-shrink-0 {isActiveRoute(item.path) ? 'bg-secondary text-secondary-foreground' : ''}"
						on:click={() => goto(item.path)}
					>
						<svelte:component this={item.icon} class="h-4 w-4" />
						{item.label}
					</button>
				{/each}
			</div>
		</div>
	</div>
	
	<!-- Error Banner -->
	{#if $dockerError}
		<div class="alert alert-destructive rounded-none border-x-0 border-t-0">
			<div class="container mx-auto px-6 lg:px-8">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<AlertCircle class="h-4 w-4" />
						<div class="alert-description text-sm font-medium">
							Docker Error: {$dockerError}
						</div>
					</div>
					<button
						class="btn btn-ghost btn-icon h-6 w-6 hover:bg-destructive/20"
						on:click={() => dockerError.set(null)}
					>
						<X class="h-4 w-4" />
						<span class="sr-only">Close error message</span>
					</button>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Main Content -->
	<main class="container mx-auto px-6 lg:px-8 py-8">
		<div class="max-w-screen-2xl mx-auto">
			<slot />
		</div>
	</main>
</div>

<style>
	/* Ensure proper font rendering */
	:global(body) {
		font-feature-settings: "rlig" 1, "calt" 1;
	}

	/* Custom scrollbar for mobile navigation */
	.overflow-x-auto::-webkit-scrollbar {
		height: 4px;
	}

	.overflow-x-auto::-webkit-scrollbar-track {
		background: transparent;
	}

	.overflow-x-auto::-webkit-scrollbar-thumb {
		background: rgb(var(--muted-foreground) / 0.3);
		border-radius: 2px;
	}

	.overflow-x-auto::-webkit-scrollbar-thumb:hover {
		background: rgb(var(--muted-foreground) / 0.5);
	}
</style>
