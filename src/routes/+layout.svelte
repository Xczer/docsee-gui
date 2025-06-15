<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { dockerStore } from '$lib/stores/docker.svelte';

	// Properly destructure children from $props
	let { children } = $props();

	let mounted = $state(false);

	// Simple reactive values - only after mounting
	let connectionStatus = $derived(mounted ? dockerStore.connectionStatus : { connected: false, error: undefined, version: undefined, api_version: undefined });
	let isConnecting = $derived(mounted ? dockerStore.isConnecting : false);

	onMount(async () => {
		mounted = true;
		console.log('Layout mounted');

		try {
			await dockerStore.initializeDockerConnection();
			console.log('Layout - Docker connection initialized');
		} catch (error) {
			console.error('Layout - Error during initialization:', error);
		}
	});
</script>

<svelte:head>
	<title>DocSee - Docker Management</title>
</svelte:head>

<div class="min-h-screen bg-white dark:bg-gray-900">
	<!-- Simple Header -->
	<header class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
		<div class="flex items-center justify-between">
			<h1 class="text-xl font-bold text-gray-900 dark:text-white">
				DocSee (Minimal Test)
			</h1>

			<!-- Simple Connection Status -->
			<div class="text-sm">
				{#if isConnecting}
					<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Connecting...</span>
				{:else if connectionStatus.connected}
					<span class="px-2 py-1 bg-green-100 text-green-800 rounded">
						Connected {connectionStatus.version ? `(${connectionStatus.version})` : ''}
					</span>
				{:else}
					<span class="px-2 py-1 bg-red-100 text-red-800 rounded">Disconnected</span>
				{/if}
			</div>
		</div>
	</header>

	<!-- Debug Info -->
	<div class="bg-gray-100 dark:bg-gray-800 p-2 text-xs">
		Debug: Mounted={mounted} | Connected={connectionStatus.connected} | Connecting={isConnecting}
	</div>

	<!-- Main Content -->
	<main>
		{#if mounted}
			{@render children?.()}
		{:else}
			<div class="flex items-center justify-center min-h-[200px]">
				<p>Loading...</p>
			</div>
		{/if}
	</main>
</div>
