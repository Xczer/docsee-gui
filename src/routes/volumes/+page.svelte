<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { connectionStatus } from '$lib/stores/docker.js';
	import {
		loadVolumes,
		removeVolume,
		pruneVolumes,
		filteredVolumes,
		isLoadingVolumes,
		volumesError,
		volumeSearchTerm,
		volumeDriverFilter,
		formatVolumeCreated,
		formatVolumeSize,
		getVolumeRefCount,
		isVolumeInUse,
		clearVolumesError,
		type VolumePruneResponse
	} from '$lib/stores/volumes.js';
	import { 
		HardDrive, 
		Search, 
		Filter, 
		Trash2, 
		RefreshCw, 
		AlertCircle, 
		Database,
		Users,
		Zap,
		AlertTriangle
	} from 'lucide-svelte';

	let showRemoveDialog = false;
	let volumeToRemove: string | null = null;
	let volumeNameToRemove = '';
	let forceRemove = false;
	let isRemoving = false;
	let isPruning = false;
	let pruneResult: VolumePruneResponse | null = null;
	let showPruneResult = false;

	onMount(async () => {
		if (!$connectionStatus.connected) {
			goto('/');
			return;
		}
		await loadVolumes();
	});

	async function handleRefresh() {
		clearVolumesError();
		await loadVolumes();
	}

	async function handleRemoveVolume(name: string) {
		volumeToRemove = name;
		volumeNameToRemove = name;
		forceRemove = false;
		showRemoveDialog = true;
	}

	async function confirmRemoveVolume() {
		if (!volumeToRemove) return;
		
		try {
			isRemoving = true;
			await removeVolume(volumeToRemove, forceRemove);
			showRemoveDialog = false;
			volumeToRemove = null;
			volumeNameToRemove = '';
			forceRemove = false;
		} catch (error) {
			console.error('Failed to remove volume:', error);
			alert(`Failed to remove volume: ${error}`);
		} finally {
			isRemoving = false;
		}
	}

	async function handlePruneVolumes() {
		if (!confirm('Are you sure you want to remove all unused volumes? This will permanently delete all volume data.')) return;
		
		try {
			isPruning = true;
			pruneResult = await pruneVolumes();
			showPruneResult = true;
		} catch (error) {
			console.error('Failed to prune volumes:', error);
			alert(`Failed to prune volumes: ${error}`);
		} finally {
			isPruning = false;
		}
	}

	function getDriverColor(driver: string): string {
		switch (driver) {
			case 'local':
				return 'bg-blue-100 text-blue-800';
			case 'nfs':
				return 'bg-green-100 text-green-800';
			case 'tmpfs':
				return 'bg-yellow-100 text-yellow-800';
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
	$: drivers = [...new Set($filteredVolumes.map(volume => volume.driver))];
</script>

<svelte:head>
	<title>Volumes - DocSee</title>
</svelte:head>

<div class="p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Docker Volumes</h1>
			<p class="text-gray-600">Manage your Docker volumes</p>
		</div>
		
		<div class="flex items-center gap-2">
			<button
				on:click={handleRefresh}
				disabled={$isLoadingVolumes}
				class="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
				title="Refresh volumes"
			>
				<RefreshCw class="w-4 h-4 {$isLoadingVolumes ? 'animate-spin' : ''}" />
				Refresh
			</button>
			
			<button
				on:click={handlePruneVolumes}
				disabled={$isLoadingVolumes || isPruning}
				class="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
				title="Remove unused volumes"
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
				placeholder="Search volumes..."
				bind:value={$volumeSearchTerm}
				class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			/>
		</div>
		
		<div class="flex items-center gap-2 sm:w-48">
			<Filter class="w-4 h-4 text-gray-600" />
			<select 
				bind:value={$volumeDriverFilter}
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
	{#if $volumesError}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<div class="flex items-center">
				<AlertCircle class="w-5 h-5 text-red-600 mr-2" />
				<span class="text-red-800">{$volumesError}</span>
			</div>
		</div>
	{/if}

	<!-- Loading State -->
	{#if $isLoadingVolumes}
		<div class="text-center py-12">
			<div class="inline-flex items-center text-gray-600">
				<RefreshCw class="animate-spin -ml-1 mr-3 h-4 w-4" />
				Loading volumes...
			</div>
		</div>
	{:else if $filteredVolumes.length === 0}
		<!-- Empty State -->
		<div class="text-center py-12">
			<HardDrive class="w-12 h-12 text-gray-300 mx-auto mb-4" />
			<h3 class="text-lg font-medium text-gray-900 mb-2">
				{$volumeSearchTerm ? 'No volumes found' : 'No volumes available'}
			</h3>
			<p class="text-gray-600">
				{$volumeSearchTerm 
					? 'Try adjusting your search criteria' 
					: 'Create a volume to get started'}
			</p>
		</div>
	{:else}
		<!-- Volumes Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
			{#each $filteredVolumes as volume}
				<div class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
					<div class="p-6">
						<!-- Header -->
						<div class="flex items-start justify-between mb-4">
							<div class="flex-1 min-w-0">
								<h3 class="text-lg font-semibold text-gray-900 truncate" title={volume.name}>
									{volume.name}
								</h3>
								<p class="text-sm text-gray-500 truncate" title={volume.mountpoint}>
									{volume.mountpoint}
								</p>
							</div>
							<div class="flex items-center gap-2 ml-2">
								{#if isVolumeInUse(volume)}
									<div class="p-1.5 text-yellow-600" title="Volume is in use">
										<AlertTriangle class="w-4 h-4" />
									</div>
								{/if}
								<button
									on:click={() => handleRemoveVolume(volume.name)}
									class="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
									title="Remove volume"
								>
									<Trash2 class="w-4 h-4" />
								</button>
							</div>
						</div>

						<!-- Driver and Scope -->
						<div class="flex items-center gap-2 mb-4">
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getDriverColor(volume.driver)}">
								<Database class="w-3 h-3 mr-1" />
								{volume.driver}
							</span>
							<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getScopeColor(volume.scope)}">
								{volume.scope}
							</span>
						</div>

						<!-- Usage Info -->
						<div class="grid grid-cols-2 gap-4 mb-4">
							<div class="text-center">
								<div class="flex items-center justify-center text-sm text-gray-600 mb-1">
									<Users class="w-4 h-4 mr-1" />
									<span>References</span>
								</div>
								<div class="text-lg font-semibold {isVolumeInUse(volume) ? 'text-yellow-600' : 'text-gray-900'}">
									{getVolumeRefCount(volume)}
								</div>
							</div>
							<div class="text-center">
								<div class="flex items-center justify-center text-sm text-gray-600 mb-1">
									<HardDrive class="w-4 h-4 mr-1" />
									<span>Size</span>
								</div>
								<div class="text-lg font-semibold text-gray-900">
									{formatVolumeSize(volume.usage_data?.size)}
								</div>
							</div>
						</div>

						<!-- Labels -->
						{#if volume.labels && Object.keys(volume.labels).length > 0}
							<div class="mb-4">
								<h4 class="text-sm font-medium text-gray-700 mb-2">Labels:</h4>
								<div class="space-y-1">
									{#each Object.entries(volume.labels) as [key, value]}
										<div class="text-xs text-gray-600">
											<span class="font-medium">{key}:</span> {value}
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Created Date -->
						{#if volume.created_at}
							<div class="pt-4 border-t border-gray-100">
								<p class="text-xs text-gray-500">
									Created: {formatVolumeCreated(volume.created_at)}
								</p>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Remove Volume Dialog -->
{#if showRemoveDialog}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg max-w-md w-full p-6">
			<div class="flex items-center mb-4">
				<AlertCircle class="w-6 h-6 text-red-600 mr-3" />
				<h3 class="text-lg font-semibold text-gray-900">Remove Volume</h3>
			</div>
			
			<p class="text-gray-600 mb-4">
				Are you sure you want to remove the volume <strong>{volumeNameToRemove}</strong>? 
				This will permanently delete all data in the volume.
			</p>
			
			<div class="mb-6">
				<label class="flex items-center">
					<input
						type="checkbox"
						bind:checked={forceRemove}
						class="mr-2"
					/>
					<span class="text-sm text-gray-700">Force remove (bypass usage checks)</span>
				</label>
			</div>
			
			<div class="flex justify-end gap-3">
				<button
					on:click={() => {showRemoveDialog = false; volumeToRemove = null; volumeNameToRemove = ''; forceRemove = false;}}
					disabled={isRemoving}
					class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					on:click={confirmRemoveVolume}
					disabled={isRemoving}
					class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
				>
					{isRemoving ? 'Removing...' : 'Remove'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Prune Result Dialog -->
{#if showPruneResult && pruneResult}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg max-w-md w-full p-6">
			<div class="flex items-center mb-4">
				<Zap class="w-6 h-6 text-green-600 mr-3" />
				<h3 class="text-lg font-semibold text-gray-900">Prune Complete</h3>
			</div>
			
			<div class="space-y-3 mb-6">
				<p class="text-gray-600">
					<strong>{pruneResult.volumes_deleted?.length || 0}</strong> volumes removed
				</p>
				{#if pruneResult.space_reclaimed}
					<p class="text-gray-600">
						<strong>{formatVolumeSize(pruneResult.space_reclaimed)}</strong> of space reclaimed
					</p>
				{/if}
			</div>
			
			<div class="flex justify-end">
				<button
					on:click={() => {showPruneResult = false; pruneResult = null;}}
					class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
				>
					OK
				</button>
			</div>
		</div>
	</div>
{/if}
