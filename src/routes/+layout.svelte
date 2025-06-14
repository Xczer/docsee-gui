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
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let mounted = false;

	onMount(async () => {
		mounted = true;
		// Initialize Docker connection when the app starts
		await initializeDockerConnection();
		// Start auto-refresh of connection status
		startAutoRefresh(5000);
	});

	onDestroy(() => {
		stopAutoRefresh();
	});

	// Reactive statements for navigation highlighting
	$: currentPath = $page.url.pathname;
	
	function isActiveRoute(route: string): boolean {
		if (route === '/' && currentPath === '/') return true;
		if (route !== '/' && currentPath.startsWith(route)) return true;
		return false;
	}

	function getNavItemClass(route: string): string {
		const baseClass = "padding: 0.5rem 0.75rem; font-size: 0.875rem; font-weight: 500; text-decoration: none; border-radius: 0.375rem; transition: all 0.2s;";
		if (isActiveRoute(route)) {
			return baseClass + " color: #2563eb; background-color: #eff6ff;";
		} else {
			return baseClass + " color: #6b7280;";
		}
	}
</script>

<svelte:head>
	<title>DocSee - Docker Management</title>
	<meta name="description" content="Modern Docker management application built with Tauri and Svelte" />
</svelte:head>

<div style="min-height: 100vh; background-color: #f9fafb;">
	<!-- Header -->
	<header style="background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-bottom: 1px solid #e5e7eb;">
		<div style="max-width: 1280px; margin: 0 auto; padding: 0 1rem;">
			<div style="display: flex; justify-content: space-between; align-items: center; height: 4rem;">
				<div style="display: flex; align-items: center;">
					<div style="flex-shrink: 0;">
						<h1 style="font-size: 1.5rem; font-weight: bold; color: #111827; margin: 0;">DocSee</h1>
					</div>
					<nav style="display: none; margin-left: 2rem; gap: 0.5rem;" class="nav-links">
						<a href="/" style={getNavItemClass('/')}>
							Dashboard
						</a>
						<a href="/containers" style={getNavItemClass('/containers')}>
							Containers
						</a>
						<a href="/images" style={getNavItemClass('/images')}>
							Images
						</a>
						<a href="/networks" style={getNavItemClass('/networks')}>
							Networks
						</a>
						<a href="/volumes" style={getNavItemClass('/volumes')}>
							Volumes
						</a>
						<a href="/system" style={getNavItemClass('/system')}>
							System
						</a>
					</nav>
				</div>
				
				<div style="display: flex; align-items: center; gap: 1rem;">
					<!-- Docker Connection Status -->
					<div style="display: flex; align-items: center; gap: 0.5rem;">
						{#if $isConnecting}
							<div style="width: 8px; height: 8px; background-color: #f59e0b; border-radius: 50%; animation: pulse 2s infinite;"></div>
							<span style="font-size: 0.875rem; color: #f59e0b;">Connecting...</span>
						{:else if $connectionStatus.connected}
							<div style="width: 8px; height: 8px; background-color: #10b981; border-radius: 50%;"></div>
							<span style="font-size: 0.875rem; color: #6b7280;">
								Connected {$connectionStatus.version ? `(${$connectionStatus.version})` : ''}
							</span>
						{:else}
							<div style="width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%;"></div>
							<span style="font-size: 0.875rem; color: #6b7280;">
								{$connectionStatus.error ? 'Error' : 'Disconnected'}
							</span>
						{/if}
					</div>
					
					<!-- Settings button -->
					<button
						type="button"
						style="color: #6b7280; padding: 0.25rem; border-radius: 0.375rem; border: none; background: none; cursor: pointer; transition: color 0.2s;"
						on:click={() => goto('/settings')}
						aria-label="Settings"
					>
						<svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	</header>
	
	<!-- Error Banner -->
	{#if $dockerError}
		<div style="background-color: #fef2f2; border-bottom: 1px solid #fecaca; padding: 0.75rem;">
			<div style="max-width: 1280px; margin: 0 auto; padding: 0 1rem;">
				<div style="display: flex; align-items: center; gap: 0.75rem;">
					<svg style="width: 1.25rem; height: 1.25rem; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<span style="font-size: 0.875rem; color: #dc2626;">
						Docker Error: {$dockerError}
					</span>
					<button
						type="button"
						style="margin-left: auto; color: #6b7280; background: none; border: none; cursor: pointer;"
						on:click={() => dockerError.set(null)}
					>
						<svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Main Content -->
	<main style="max-width: 1280px; margin: 0 auto; padding: 1.5rem;">
		<slot />
	</main>
</div>

<style>
	:global(html) {
		height: 100%;
	}
	
	:global(body) {
		height: 100%;
		margin: 0;
		font-family: system-ui, -apple-system, sans-serif;
		background-color: #f9fafb;
	}

	@media (min-width: 768px) {
		.nav-links {
			display: flex !important;
		}
	}

	a:hover {
		color: #2563eb !important;
		background-color: #f3f4f6 !important;
	}

	button:hover {
		color: #374151 !important;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
