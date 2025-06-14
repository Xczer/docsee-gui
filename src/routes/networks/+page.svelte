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
		Zap
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
				return 'bg-blue-100 text-blue-800';
			case 'host':
				return 'bg-green-100 text-green-800';
			case 'overlay':
				return 'bg-purple-100 text-purple-800';
			case 'macvlan':
				return 'bg-orange-100 text-orange-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getScopeColor(scope: string): string {
		return scope === 'global' 
			? 'bg-red-100 text-red-800' 
			: 'bg-gray-100 text-gray-800';
	}

	// Get unique drivers for filter
	$: drivers = [...new Set($filteredNetworks.map(network => network.driver))];
</script>

<svelte:head>
	<title>Networks - DocSee</title>
</svelte:head>

<div class="p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Docker Networks</h1>
			<p class="text-gray-600">Manage your Docker networks</p>
		</div>
		
		<div class="flex items-center gap-2">
			<button
				on:click={handleRefresh}
				disabled={$isLoadingNetworks}
				class="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
				title="Refresh networks"
			>
				<RefreshCw class="w-4 h-4 {$isLoadingNetworks ? 'animate-spin' : ''}" />
				Refresh
			</button>
			
			<button
				on:click={handlePruneNetworks}
				disabled={$isLoadingNetworks || isPruning}
				class="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
				title="Remove unused networks"
			>
				<Zap class="w-4 h-4" />
				{isPruning ? 'Pruning...' : 'Prune'}
			</button>
		</div>
	</div>

	<!-- Search and Filters -->
	<div class="flex flex-col sm:flex-row gap-4">
		<div class="flex-1 relative">
			<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
			<input
				type="text"
				placeholder="Search networks..."
				bind:value={$networkSearchTerm}
				class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			/>
		</div>
		
		<div class="flex items-center gap-2 sm:w-48">
			<Filter class="w-4 h-4 text-gray-600" />
			<select 
				bind:value={$networkDriverFilter}
				class="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				<option value="all">All Drivers</option>
				{#each drivers as driver}
					<option value={driver}>{driver}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Error Message -->
	{#if $networksError}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<div class="flex items-center">
				<AlertCircle class="w-5 h-5 text-red-600 mr-2" />
				<span class="text-red-800">{$networksError}</span>
			</div>
		</div>
	{/if}

	<!-- Loading State -->
	{#if $isLoadingNetworks}
		<div class="text-center py-12">
			<div class="inline-flex items-center text-gray-600">
				<RefreshCw class="animate-spin -ml-1 mr-3 h-4 w-4" />
				Loading networks...
			</div>
		</div>
	{:else if $filteredNetworks.length === 0}
		<!-- Empty State -->
		<div class="text-center py-12">
			<Network class="w-12 h-12 text-gray-300 mx-auto mb-4" />
			<h3 class="text-lg font-medium text-gray-900 mb-2">
				{$networkSearchTerm ? 'No networks found' : 'No networks available'}
			</h3>
			<p class="text-gray-600">
				{$networkSearchTerm 
					? 'Try adjusting your search criteria' 
					: 'Create a network to get started'}
			</p>
		</div>
	{:else}
		<!-- Networks Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
			{#each $filteredNetworks as network}
				<div class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
					<div class="p-6">
						<!-- Header -->
						<div class="flex items-start justify-between mb-4">
							<div class="flex-1 min-w-0">
								<h3 class="text-lg font-semibold text-gray-900 truncate" title={network.name}>
									{network.name}
								</h3>
								<p class="text-sm text-gray-500 font-mono truncate" title={network.id}>
									{network.id.slice(0, 12)}
								</p>
							</div>
							<div class="flex items-center gap-2 ml-2">
								<button
									on:click={() => handleRemoveNetwork(network.id, network.name)}
									disabled={network.name === 'bridge' || network.name === 'host' || network.name === 'none'}
									class="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									title={network.name === 'bridge' || network.name === 'host' || network.name === 'none' 
										? 'Cannot remove system network' 
										: 'Remove network'}
								>
									<Trash2 class="w-4 h-4" />
								</button>
							</div>
						</div>

						<!-- Driver and Scope -->
						<div class="flex items-center gap-2 mb-4">
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getDriverColor(network.driver)}">
								<Router class="w-3 h-3 mr-1" />
								{network.driver}
							</span>
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getScopeColor(network.scope)}">
								<Globe class="w-3 h-3 mr-1" />
								{network.scope}
							</span>
						</div>

						<!-- Connected Containers -->
						<div class="flex items-center justify-between mb-4">
							<div class="flex items-center text-sm text-gray-600">
								<Container class="w-4 h-4 mr-1" />
								<span>{getConnectedContainerCount(network)} containers</span>
							</div>
						</div>

						<!-- Subnets -->
						{#if getNetworkSubnets(network).length > 0}
							<div class="mb-4">
								<h4 class="text-sm font-medium text-gray-700 mb-2">Subnets:</h4>
								<div class="space-y-1">
									{#each getNetworkSubnets(network) as subnet}
										<code class="text-xs bg-gray-100 px-2 py-1 rounded block font-mono">
											{subnet}
										</code>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Labels -->
						{#if network.labels && Object.keys(network.labels).length > 0}
							<div>
								<h4 class="text-sm font-medium text-gray-700 mb-2">Labels:</h4>
								<div class="space-y-1">
									{#each Object.entries(network.labels) as [key, value]}
										<div class="text-xs text-gray-600">
											<span class="font-medium">{key}:</span> {value}
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Created Date -->
						{#if network.created}
							<div class="mt-4 pt-4 border-t border-gray-100">
								<p class="text-xs text-gray-500">
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

<!-- Remove Network Dialog -->
{#if showRemoveDialog}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg max-w-md w-full p-6">
			<div class="flex items-center mb-4">
				<AlertCircle class="w-6 h-6 text-red-600 mr-3" />
				<h3 class="text-lg font-semibold text-gray-900">Remove Network</h3>
			</div>
			
			<p class="text-gray-600 mb-6">
				Are you sure you want to remove the network <strong>{networkNameToRemove}</strong>? 
				This action cannot be undone.
			</p>
			
			<div class="flex justify-end gap-3">
				<button
					on:click={() => {showRemoveDialog = false; networkToRemove = null; networkNameToRemove = '';}}
					disabled={isRemoving}
					class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					on:click={confirmRemoveNetwork}
					disabled={isRemoving}
					class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
				>
					{isRemoving ? 'Removing...' : 'Remove'}
				</button>
			</div>
		</div>
	</div>
{/if}
