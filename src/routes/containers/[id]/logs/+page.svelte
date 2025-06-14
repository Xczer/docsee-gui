<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { invoke } from '@tauri-apps/api/core';
	import { connectionStatus } from '$lib/stores/docker.js';
	import ContainerLogs from '$lib/components/docker/containers/ContainerLogs.svelte';
	import { 
		ArrowLeft, 
		Container, 
		AlertCircle, 
		FileText, 
		BarChart3, 
		Terminal,
		Activity,
		Play,
		Square,
		Pause,
		RotateCcw
	} from 'lucide-svelte';

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

	function getStatusBadgeClass(status: string) {
		switch (status) {
			case 'running':
				return 'badge badge-default';
			case 'exited':
				return 'badge badge-secondary';
			case 'paused':
				return 'badge badge-outline';
			case 'restarting':
				return 'badge badge-default';
			default:
				return 'badge badge-secondary';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'running':
				return Play;
			case 'exited':
				return Square;
			case 'paused':
				return Pause;
			case 'restarting':
				return RotateCcw;
			default:
				return Square;
		}
	}

	// Navigation items for container tabs
	$: containerTabs = [
		{ 
			label: 'Logs', 
			icon: FileText, 
			href: `/containers/${containerId}/logs`,
			active: true
		},
		{ 
			label: 'Stats', 
			icon: BarChart3, 
			href: `/containers/${containerId}/stats`,
			active: false
		},
		{ 
			label: 'Shell', 
			icon: Terminal, 
			href: `/containers/${containerId}/shell`,
			active: false,
			disabled: containerStatus !== 'running'
		}
	];
</script>

<svelte:head>
	<title>Container Logs{containerName ? ` - ${containerName}` : ''} - DocSee</title>
</svelte:head>

<div class="space-y-6 h-full flex flex-col">
	<!-- Header -->
	<div class="space-y-4">
		<!-- Breadcrumb -->
		<div class="flex items-center gap-2 text-sm text-muted-foreground">
			<button
				class="btn btn-ghost btn-sm gap-2 px-2"
				on:click={handleGoBack}
			>
				<ArrowLeft class="h-4 w-4" />
				Containers
			</button>
			<span>/</span>
			<span class="text-foreground">Logs</span>
		</div>

		<!-- Container Info -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
					<Container class="h-6 w-6 text-muted-foreground" />
				</div>
				<div class="space-y-1">
					<div class="flex items-center gap-3">
						<h1 class="text-2xl font-bold tracking-tight text-foreground">
							{loading ? 'Loading...' : containerName || 'Container Logs'}
						</h1>
						{#if containerStatus && !loading}
							<span class="{getStatusBadgeClass(containerStatus)} gap-1">
								<svelte:component this={getStatusIcon(containerStatus)} class="h-3 w-3" />
								{containerStatus}
							</span>
						{/if}
					</div>
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<Activity class="h-3 w-3" />
						<span class="font-mono">{containerId?.slice(0, 12)}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Container Navigation Tabs -->
		<div class="card">
			<div class="card-content p-4">
				<div class="flex gap-2">
					{#each containerTabs as tab}
						<button
							class="btn {tab.active ? 'btn-default' : 'btn-ghost'} btn-sm gap-2"
							disabled={tab.disabled}
							on:click={() => !tab.disabled && goto(tab.href)}
						>
							<svelte:component this={tab.icon} class="h-4 w-4" />
							{tab.label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 min-h-0">
		{#if !$connectionStatus.connected}
			<div class="alert border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10">
				<AlertCircle class="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
				<div class="alert-title text-yellow-800 dark:text-yellow-200">Docker Connection Required</div>
				<div class="alert-description text-yellow-700 dark:text-yellow-300">
					Please connect to Docker to view container logs.
				</div>
			</div>
		{:else if loading}
			<div class="card h-full">
				<div class="card-content p-6 h-full">
					<div class="space-y-4">
						<div class="flex items-center gap-2">
							<div class="skeleton h-4 w-4 rounded"></div>
							<div class="skeleton h-4 w-32"></div>
						</div>
						<div class="separator separator-horizontal"></div>
						<div class="space-y-3">
							{#each Array(10) as _}
								<div class="skeleton h-4 w-full"></div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{:else if error}
			<div class="alert alert-destructive">
				<AlertCircle class="h-4 w-4" />
				<div class="alert-title">Failed to Load Container</div>
				<div class="alert-description mt-2">
					<p class="mb-4">{error}</p>
					<button class="btn btn-outline btn-sm" on:click={loadContainerDetails}>
						Retry
					</button>
				</div>
			</div>
		{:else}
			<ContainerLogs {containerId} {containerName} />
		{/if}
	</div>
</div>
