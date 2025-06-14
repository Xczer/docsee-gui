<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { invoke } from '@tauri-apps/api/core';
	import { connectionStatus } from '$lib/stores/docker.js';
	import ContainerStats from '$lib/components/docker/containers/ContainerStats.svelte';
	import { ArrowLeft, Container, AlertCircle } from 'lucide-svelte';

	let containerId: string;
	let containerName: string = '';
	let containerStatus: string = '';
	let loading = true;
	let error: string | null = null;

	$: containerId = $page.params.id;

	onMount(async () => {
		if (!$connectionStatus.connected) {
			goto('/');
			return;
		}

		if (containerId) {
			await loadContainerDetails();
		}
	});

	async function loadContainerDetails() {
		try {
			loading = true;
			error = null;

			const containerDetails = await invoke('get_container_details', {
				id: containerId
			});

			containerName = containerDetails.name.replace(/^\//, ''); // Remove leading slash
			containerStatus = containerDetails.state.status;
		} catch (err) {
			console.error('Failed to load container details:', err);
			error = err as string;
		} finally {
			loading = false;
		}
	}

	function handleGoBack() {
		goto('/containers');
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'running':
				return 'text-green-600 bg-green-100';
			case 'exited':
				return 'text-gray-600 bg-gray-100';
			case 'paused':
				return 'text-yellow-600 bg-yellow-100';
			case 'restarting':
				return 'text-blue-600 bg-blue-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}
</script>

<svelte:head>
	<title>Container Stats{containerName ? ` - ${containerName}` : ''} - DocSee</title>
</svelte:head>

<div class="p-6 h-full flex flex-col">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-4">
			<button
				on:click={handleGoBack}
				class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
			>
				<ArrowLeft class="w-5 h-5" />
				<span>Back to Containers</span>
			</button>

			<div class="h-6 w-px bg-gray-300"></div>

			<div class="flex items-center gap-3">
				<Container class="w-6 h-6 text-gray-600" />
				<div>
					<h1 class="text-2xl font-bold text-gray-900">
						{containerName || 'Container Statistics'}
					</h1>
					<div class="flex items-center gap-2 text-sm text-gray-600">
						<span class="font-mono">{containerId?.slice(0, 12)}</span>
						{#if containerStatus}
							<span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(containerStatus)}">
								{containerStatus}
							</span>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 min-h-0">
		{#if !$connectionStatus.connected}
			<div class="h-full flex items-center justify-center">
				<div class="text-center">
					<AlertCircle class="w-12 h-12 text-yellow-500 mx-auto mb-4" />
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Docker Connection Required</h3>
					<p class="text-gray-600">Please connect to Docker to view container statistics.</p>
				</div>
			</div>
		{:else if loading}
			<div class="h-full flex items-center justify-center">
				<div class="inline-flex items-center text-gray-600">
					<svg class="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Loading container details...
				</div>
			</div>
		{:else if error}
			<div class="h-full flex items-center justify-center">
				<div class="text-center">
					<AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Failed to Load Container</h3>
					<p class="text-gray-600 mb-4">{error}</p>
					<button
						on:click={loadContainerDetails}
						class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		{:else}
			<ContainerStats {containerId} {containerName} />
		{/if}
	</div>
</div>
