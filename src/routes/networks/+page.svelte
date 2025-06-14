<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { connectionStatus } from '$lib/stores/docker.js';
	import {
		loadNetworks,
		removeNetwork,
		pruneNetworks,
		filteredNetworks,
		isLoadingNetworks,
		networksError,
		networkSearchTerm,
		networkDriverFilter,
		formatNetworkCreated,
		getConnectedContainerCount,
		getNetworkSubnets,
		clearNetworksError
	} from '$lib/stores/networks.js';
	import { 
		Network, 
		Search, 
		Filter, 
		Trash2, 
		RefreshCw, 
		AlertCircle, 
		Globe, 
		Router,
		Container,
		Zap,
		AlertTriangle,
		Loader2,
		Shield,
		Activity,
		X
	} from 'lucide-svelte';

	let showRemoveDialog = false;
	let networkToRemove: string | null = null;
	let networkNameToRemove = '';
	let isRemoving = false;
	let isPruning = false;

	onMount(async () => {
		if (!$connectionStatus.connected) {
			goto('/');
			return;
		}
		await loadNetworks();
	});

	async function handleRefresh() {
		clearNetworksError();
		await loadNetworks();
	}

	async function handleRemoveNetwork(id: string, name: string) {
		networkToRemove = id;
		networkNameToRemove = name;
		showRemoveDialog = true;
	}

	async function confirmRemoveNetwork() {
		if (!networkToRemove) return;
		
		try {
			isRemoving = true;
			await removeNetwork(networkToRemove);
			showRemoveDialog = false;
			networkToRemove = null;
			networkNameToRemove = '';
		} catch (error) {
			console.error('Failed to remove network:', error);
			alert(`Failed to remove network: ${error}`);
		} finally {
			isRemoving = false;
		}
	}

	async function handlePruneNetworks() {
		if (!confirm('Are you sure you want to remove all unused networks?')) return;
		
		try {
			isPruning = true;
			await pruneNetworks();
		} catch (error) {
			console.error('Failed to prune networks:', error);
			alert(`Failed to prune networks: ${error}`);
		} finally {
			isPruning = false;
		}
	}

	function getDriverColor(driver: string): string {
		switch (driver) {
			case 'bridge':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
			case 'host':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
			case 'overlay':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
			case 'macvlan':
				return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
		}
	}

	function getScopeColor(scope: string): string {
		return scope === 'global' 
			? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
			: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
	}

	function isSystemNetwork(name: string): boolean {
		return name === 'bridge' || name === 'host' || name === 'none';
	}

	// Get unique drivers for filter
	$: drivers = [...new Set($filteredNetworks.map(network => network.driver))];
</script>

<svelte:head>
	<title>Networks - DocSee</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="space-y-2">
			<h1 class="text-3xl font-bold tracking-tight text-foreground">
				Docker Networks
			</h1>
			<p class="text-muted-foreground">
				Manage your Docker networks and connectivity
			</p>
		</div>
		
		<div class="flex items-center gap-2">
			<button
				class="btn btn-outline btn-sm gap-2"
				on:click={handleRefresh}
				disabled={$isLoadingNetworks}
			>
				<RefreshCw class="h-4 w-4 {$isLoadingNetworks ? 'animate-spin' : ''}" />
				Refresh
			</button>
			
			<button
				class="btn btn-destructive btn-sm gap-2"
				on:click={handlePruneNetworks}
				disabled={$isLoadingNetworks || isPruning}
			>
				{#if isPruning}
					<Loader2 class="h-4 w-4 animate-spin" />
					Pruning...
				{:else}
					<Zap class="h-4 w-4" />
					Prune Unused
				{/if}
			</button>
		</div>
	</div>

	<!-- Search and Filters -->
	<div class="card">
		<div class="card-content p-6">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
				<div class="relative flex-1">
					<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search networks..."
						bind:value={$networkSearchTerm}
						class="input pl-10"
					/>
				</div>
				
				<div class="flex items-center gap-2 sm:w-48">
					<Filter class="h-4 w-4 text-muted-foreground" />
					<select 
						bind:value={$networkDriverFilter}
						class="input"
					>
						<option value="all">All Drivers</option>
						{#each drivers as driver}
							<option value={driver}>{driver}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</div>

	<!-- Error Message -->
	{#if $networksError}
		<div class="alert alert-destructive">
			<AlertCircle class="h-4 w-4" />
			<div class="alert-title">Error</div>
			<div class="alert-description">{$networksError}</div>
		</div>
	{/if}

	<!-- Loading State -->
	{#if $isLoadingNetworks}
		<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
			{#each Array(6) as _}
				<div class="card">
					<div class="card-content p-6">
						<div class="space-y-4">
							<div class="flex items-start justify-between">
								<div class="space-y-2 flex-1">
									<div class="skeleton h-5 w-32"></div>
									<div class="skeleton h-4 w-24"></div>
								</div>
								<div class="skeleton h-8 w-8"></div>
							</div>
							<div class="flex gap-2">
								<div class="skeleton h-6 w-16"></div>
								<div class="skeleton h-6 w-16"></div>
							</div>
							<div class="skeleton h-4 w-full"></div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if $filteredNetworks.length === 0}
		<!-- Empty State -->
		<div class="card">
			<div class="card-content p-12">
				<div class="flex flex-col items-center justify-center text-center space-y-4">
					<Network class="h-16 w-16 text-muted-foreground/50" />
					<div class="space-y-2">
						<h3 class="text-lg font-medium text-foreground">
							{$networkSearchTerm ? 'No networks found' : 'No networks available'}
						</h3>
						<p class="text-muted-foreground">
							{$networkSearchTerm 
								? 'Try adjusting your search criteria' 
								: 'Create a network to get started'}
						</p>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Networks Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
			{#each $filteredNetworks as network}
				<div class="card group hover:shadow-md transition-all duration-200">
					<div class="card-content p-6">
						<!-- Header -->
						<div class="flex items-start justify-between mb-4">
							<div class="flex-1 min-w-0 space-y-1">
								<div class="flex items-center gap-2">
									<h3 class="text-lg font-semibold text-foreground truncate" title={network.name}>
										{network.name}
									</h3>
									{#if isSystemNetwork(network.name)}
										<span class="badge badge-outline text-xs">
											<Shield class="h-3 w-3 mr-1" />
											System
										</span>
									{/if}
								</div>
								<p class="text-sm text-muted-foreground font-mono truncate" title={network.id}>
									{network.id.slice(0, 12)}
								</p>
							</div>
							<button
								class="btn btn-ghost btn-icon h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
								on:click={() => handleRemoveNetwork(network.id, network.name)}
								disabled={isSystemNetwork(network.name)}
								title={isSystemNetwork(network.name) 
									? 'Cannot remove system network' 
									: 'Remove network'}
							>
								<Trash2 class="h-4 w-4 text-destructive" />
							</button>
						</div>

						<!-- Driver and Scope -->
						<div class="flex items-center gap-2 mb-4">
							<span class="badge badge-secondary {getDriverColor(network.driver)} gap-1">
								<Router class="h-3 w-3" />
								{network.driver}
							</span>
							<span class="badge badge-outline {getScopeColor(network.scope)} gap-1">
								<Globe class="h-3 w-3" />
								{network.scope}
							</span>
						</div>

						<!-- Connected Containers -->
						<div class="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
							<div class="flex items-center gap-2 text-sm text-muted-foreground">
								<Container class="h-4 w-4" />
								<span>Connected Containers</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="badge badge-outline text-xs">
									{getConnectedContainerCount(network)}
								</span>
								{#if getConnectedContainerCount(network) > 0}
									<Activity class="h-3 w-3 text-green-500" />
								{/if}
							</div>
						</div>

						<!-- Subnets -->
						{#if getNetworkSubnets(network).length > 0}
							<div class="mb-4">
								<h4 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
									<Network class="h-4 w-4" />
									Subnets
								</h4>
								<div class="space-y-1">
									{#each getNetworkSubnets(network) as subnet}
										<span class="badge badge-outline text-xs font-mono">
											{subnet}
										</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Labels -->
						{#if network.labels && Object.keys(network.labels).length > 0}
							<div class="mb-4">
								<h4 class="text-sm font-medium text-foreground mb-2">Labels</h4>
								<div class="space-y-1">
									{#each Object.entries(network.labels).slice(0, 3) as [key, value]}
										<div class="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
											<span class="font-medium">{key}:</span> {value}
										</div>
									{/each}
									{#if Object.keys(network.labels).length > 3}
										<div class="text-xs text-muted-foreground">
											+{Object.keys(network.labels).length - 3} more
										</div>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Created Date -->
						{#if network.created}
							<div class="pt-4 border-t border-border">
								<p class="text-xs text-muted-foreground flex items-center gap-2">
									<Activity class="h-3 w-3" />
									Created: {formatNetworkCreated(network.created)}
								</p>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Remove Network Modal -->
{#if showRemoveDialog}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
		<div class="card w-full max-w-md">
			<div class="card-header">
				<div class="card-title flex items-center gap-2">
					<AlertTriangle class="h-5 w-5 text-destructive" />
					Remove Network
				</div>
				<div class="card-description">
					Are you sure you want to remove the network <strong>{networkNameToRemove}</strong>? 
					This action cannot be undone.
				</div>
			</div>
			<div class="card-content">
				<div class="flex justify-end gap-3">
					<button
						class="btn btn-outline"
						on:click={() => {showRemoveDialog = false; networkToRemove = null; networkNameToRemove = '';}}
						disabled={isRemoving}
					>
						Cancel
					</button>
					<button
						class="btn btn-destructive gap-2"
						on:click={confirmRemoveNetwork}
						disabled={isRemoving}
					>
						{#if isRemoving}
							<Loader2 class="h-4 w-4 animate-spin" />
							Removing...
						{:else}
							<Trash2 class="h-4 w-4" />
							Remove
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
