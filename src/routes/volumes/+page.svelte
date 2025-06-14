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
		AlertTriangle,
		Loader2,
		Activity,
		FolderOpen,
		Gauge,
		X
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
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
			case 'nfs':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
			case 'tmpfs':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
		}
	}

	function getScopeColor(scope: string): string {
		return scope === 'global' 
			? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
			: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
	}

	function getUsageColor(volume: any): string {
		const inUse = isVolumeInUse(volume);
		return inUse 
			? 'text-green-600 dark:text-green-400' 
			: 'text-gray-600 dark:text-gray-400';
	}

	// Get unique drivers for filter
	$: drivers = [...new Set($filteredVolumes.map(volume => volume.driver))];
</script>

<svelte:head>
	<title>Volumes - DocSee</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="space-y-2">
			<h1 class="text-3xl font-bold tracking-tight text-foreground">
				Docker Volumes
			</h1>
			<p class="text-muted-foreground">
				Manage persistent storage volumes
			</p>
		</div>
		
		<div class="flex items-center gap-2">
			<button
				class="btn btn-outline btn-sm gap-2"
				on:click={handleRefresh}
				disabled={$isLoadingVolumes}
			>
				<RefreshCw class="h-4 w-4 {$isLoadingVolumes ? 'animate-spin' : ''}" />
				Refresh
			</button>
			
			<button
				class="btn btn-destructive btn-sm gap-2"
				on:click={handlePruneVolumes}
				disabled={$isLoadingVolumes || isPruning}
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
						placeholder="Search volumes..."
						bind:value={$volumeSearchTerm}
						class="input pl-10"
					/>
				</div>
				
				<div class="flex items-center gap-2 sm:w-48">
					<Filter class="h-4 w-4 text-muted-foreground" />
					<select 
						bind:value={$volumeDriverFilter}
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
	{#if $volumesError}
		<div class="alert alert-destructive">
			<AlertCircle class="h-4 w-4" />
			<div class="alert-title">Error</div>
			<div class="alert-description">{$volumesError}</div>
		</div>
	{/if}

	<!-- Loading State -->
	{#if $isLoadingVolumes}
		<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
			{#each Array(6) as _}
				<div class="card">
					<div class="card-content p-6">
						<div class="space-y-4">
							<div class="flex items-start justify-between">
								<div class="space-y-2 flex-1">
									<div class="skeleton h-5 w-32"></div>
									<div class="skeleton h-4 w-48"></div>
								</div>
								<div class="skeleton h-8 w-8"></div>
							</div>
							<div class="flex gap-2">
								<div class="skeleton h-6 w-16"></div>
								<div class="skeleton h-6 w-16"></div>
							</div>
							<div class="grid grid-cols-2 gap-4">
								<div class="skeleton h-12 w-full"></div>
								<div class="skeleton h-12 w-full"></div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if $filteredVolumes.length === 0}
		<!-- Empty State -->
		<div class="card">
			<div class="card-content p-12">
				<div class="flex flex-col items-center justify-center text-center space-y-4">
					<HardDrive class="h-16 w-16 text-muted-foreground/50" />
					<div class="space-y-2">
						<h3 class="text-lg font-medium text-foreground">
							{$volumeSearchTerm ? 'No volumes found' : 'No volumes available'}
						</h3>
						<p class="text-muted-foreground">
							{$volumeSearchTerm 
								? 'Try adjusting your search criteria' 
								: 'Create a volume to get started'}
						</p>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Volumes Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
			{#each $filteredVolumes as volume}
				<div class="card group hover:shadow-md transition-all duration-200">
					<div class="card-content p-6">
						<!-- Header -->
						<div class="flex items-start justify-between mb-4">
							<div class="flex-1 min-w-0 space-y-1">
								<div class="flex items-center gap-2">
									<h3 class="text-lg font-semibold text-foreground truncate" title={volume.name}>
										{volume.name}
									</h3>
									{#if isVolumeInUse(volume)}
										<span class="badge badge-outline text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
											<Activity class="h-3 w-3 mr-1" />
											In Use
										</span>
									{/if}
								</div>
								<p class="text-sm text-muted-foreground truncate" title={volume.mountpoint}>
									<FolderOpen class="h-3 w-3 inline mr-1" />
									{volume.mountpoint}
								</p>
							</div>
							<button
								class="btn btn-ghost btn-icon h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
								on:click={() => handleRemoveVolume(volume.name)}
								title="Remove volume"
							>
								<Trash2 class="h-4 w-4 text-destructive" />
							</button>
						</div>

						<!-- Driver and Scope -->
						<div class="flex items-center gap-2 mb-4">
							<span class="badge badge-secondary {getDriverColor(volume.driver)} gap-1">
								<Database class="h-3 w-3" />
								{volume.driver}
							</span>
							<span class="badge badge-outline {getScopeColor(volume.scope)}">
								{volume.scope}
							</span>
						</div>

						<!-- Usage Stats -->
						<div class="grid grid-cols-2 gap-4 mb-4">
							<div class="p-3 bg-muted/50 rounded-lg text-center">
								<div class="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
									<Users class="h-4 w-4" />
									<span>References</span>
								</div>
								<div class="text-lg font-semibold {getUsageColor(volume)}">
									{getVolumeRefCount(volume)}
								</div>
							</div>
							<div class="p-3 bg-muted/50 rounded-lg text-center">
								<div class="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
									<Gauge class="h-4 w-4" />
									<span>Size</span>
								</div>
								<div class="text-lg font-semibold text-foreground">
									{formatVolumeSize(volume.usage_data?.size)}
								</div>
							</div>
						</div>

						<!-- Labels -->
						{#if volume.labels && Object.keys(volume.labels).length > 0}
							<div class="mb-4">
								<h4 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
									<Activity class="h-4 w-4" />
									Labels
								</h4>
								<div class="space-y-1">
									{#each Object.entries(volume.labels).slice(0, 3) as [key, value]}
										<div class="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
											<span class="font-medium">{key}:</span> {value}
										</div>
									{/each}
									{#if Object.keys(volume.labels).length > 3}
										<div class="text-xs text-muted-foreground">
											+{Object.keys(volume.labels).length - 3} more
										</div>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Created Date -->
						{#if volume.created_at}
							<div class="pt-4 border-t border-border">
								<p class="text-xs text-muted-foreground flex items-center gap-2">
									<Activity class="h-3 w-3" />
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

<!-- Remove Volume Modal -->
{#if showRemoveDialog}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
		<div class="card w-full max-w-md">
			<div class="card-header">
				<div class="card-title flex items-center gap-2">
					<AlertTriangle class="h-5 w-5 text-destructive" />
					Remove Volume
				</div>
				<div class="card-description">
					Are you sure you want to remove the volume <strong>{volumeNameToRemove}</strong>? 
					This will permanently delete all data in the volume.
				</div>
			</div>
			<div class="card-content">
				<div class="space-y-4">
					<label class="flex items-center space-x-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={forceRemove}
							class="rounded border-gray-300"
						/>
						<span class="text-sm text-muted-foreground">
							Force remove (bypass usage checks)
						</span>
					</label>
				</div>
				
				<div class="flex justify-end gap-3 mt-6">
					<button
						class="btn btn-outline"
						on:click={() => {showRemoveDialog = false; volumeToRemove = null; volumeNameToRemove = ''; forceRemove = false;}}
						disabled={isRemoving}
					>
						Cancel
					</button>
					<button
						class="btn btn-destructive gap-2"
						on:click={confirmRemoveVolume}
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

<!-- Prune Result Modal -->
{#if showPruneResult}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
		<div class="card w-full max-w-md">
			<div class="card-header">
				<div class="card-title flex items-center gap-2">
					<Zap class="h-5 w-5 text-green-600" />
					Prune Complete
				</div>
			</div>
			<div class="card-content">
				{#if pruneResult}
					<div class="space-y-3">
						<div class="p-4 bg-muted/50 rounded-lg">
							<div class="text-sm text-muted-foreground mb-1">Volumes Removed</div>
							<div class="text-2xl font-bold text-foreground">
								{pruneResult.volumes_deleted?.length || 0}
							</div>
						</div>
						{#if pruneResult.space_reclaimed}
							<div class="p-4 bg-muted/50 rounded-lg">
								<div class="text-sm text-muted-foreground mb-1">Space Reclaimed</div>
								<div class="text-2xl font-bold text-green-600 dark:text-green-400">
									{formatVolumeSize(pruneResult.space_reclaimed)}
								</div>
							</div>
						{/if}
					</div>
				{/if}
				
				<div class="flex justify-end mt-6">
					<button
						class="btn btn-default"
						on:click={() => {showPruneResult = false; pruneResult = null;}}
					>
						OK
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
