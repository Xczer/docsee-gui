<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { 
		sortedContainers, 
		loadContainers, 
		startContainerAutoRefresh, 
		stopContainerAutoRefresh,
		isLoadingContainers,
		containerError,
		containerFilter,
		containerSearchTerm,
		startContainerAction,
		stopContainerAction,
		restartContainerAction,
		removeContainerAction,
		containerOperationInProgress
	} from '$lib/stores/containers.js';
	import { connectionStatus } from '$lib/stores/docker.js';
	import { 
		getContainerDisplayName, 
		getContainerStatusColor, 
		formatRelativeTime, 
		formatContainerPorts 
	} from '$lib/utils/formatters.js';
	import { 
		Container,
		Search,
		RefreshCw,
		AlertTriangle,
		Play,
		Square,
		RotateCcw,
		Trash2,
		FileText,
		BarChart3,
		Terminal,
		Filter,
		Clock,
		Image as ImageIcon
	} from 'lucide-svelte';

	let mounted = false;

	onMount(async () => {
		mounted = true;
		
		if ($connectionStatus.connected) {
			await loadContainers();
			startContainerAutoRefresh(3000);
		}
	});

	onDestroy(() => {
		stopContainerAutoRefresh();
	});

	// Reactive statement to load containers when connection changes
	$: if (mounted && $connectionStatus.connected) {
		loadContainers();
	}

	// Handle container actions
	async function handleContainerAction(action: string, containerId: string) {
		switch (action) {
			case 'start':
				await startContainerAction(containerId);
				break;
			case 'stop':
				await stopContainerAction(containerId);
				break;
			case 'restart':
				await restartContainerAction(containerId);
				break;
			case 'remove':
				if (confirm('Are you sure you want to remove this container?')) {
					await removeContainerAction(containerId, false);
				}
				break;
		}
	}

	function isActionInProgress(action: string, containerId: string): boolean {
		return $containerOperationInProgress === `${action}-${containerId}`;
	}

	function canPerformAction(action: string, state: string): boolean {
		switch (action) {
			case 'start':
				return state === 'exited' || state === 'created';
			case 'stop':
				return state === 'running';
			case 'restart':
				return state === 'running';
			case 'remove':
				return state !== 'running';
			default:
				return false;
		}
	}

	function getStatusBadgeClass(state: string) {
		switch (state) {
			case 'running':
				return 'badge badge-default';
			case 'exited':
			case 'created':
				return 'badge badge-secondary';
			case 'paused':
				return 'badge badge-outline';
			default:
				return 'badge badge-secondary';
		}
	}

	function getStatusIcon(state: string) {
		switch (state) {
			case 'running':
				return Play;
			case 'exited':
			case 'created':
				return Square;
			case 'paused':
				return Square;
			default:
				return Square;
		}
	}

	const filterOptions = [
		{ value: 'all', label: 'All', count: $sortedContainers.length },
		{ value: 'running', label: 'Running', count: $sortedContainers.filter(c => c.state === 'running').length },
		{ value: 'stopped', label: 'Stopped', count: $sortedContainers.filter(c => c.state === 'exited' || c.state === 'created').length }
	];
</script>

<svelte:head>
	<title>Containers - DocSee</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="space-y-2">
		<h1 class="text-3xl font-bold tracking-tight text-foreground">
			Containers
		</h1>
		<p class="text-muted-foreground">
			Manage your Docker containers
		</p>
	</div>

	{#if !$connectionStatus.connected}
		<!-- Connection Required Notice -->
		<div class="alert border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10">
			<AlertTriangle class="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
			<div class="alert-title text-yellow-800 dark:text-yellow-200">Docker Connection Required</div>
			<div class="alert-description text-yellow-700 dark:text-yellow-300">
				Connect to Docker to view and manage containers.
			</div>
		</div>
	{:else}
		<!-- Error Banner -->
		{#if $containerError}
			<div class="alert alert-destructive">
				<AlertTriangle class="h-4 w-4" />
				<div class="alert-title">Error</div>
				<div class="alert-description">{$containerError}</div>
			</div>
		{/if}

		<!-- Filters and Search Card -->
		<div class="card">
			<div class="card-content p-6">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<!-- Filter Buttons -->
					<div class="flex gap-2 flex-wrap">
						{#each filterOptions as option}
							<button
								class="btn {$containerFilter === option.value ? 'btn-default' : 'btn-outline'} btn-sm gap-2"
								on:click={() => containerFilter.set(option.value)}
							>
								<Filter class="h-3 w-3" />
								{option.label}
								<span class="badge badge-secondary ml-1 text-xs">
									{option.count}
								</span>
							</button>
						{/each}
					</div>

					<!-- Search and Refresh -->
					<div class="flex gap-2 flex-1 max-w-md">
						<div class="relative flex-1">
							<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<input
								type="text"
								placeholder="Search containers..."
								bind:value={$containerSearchTerm}
								class="input pl-10"
							/>
						</div>
						<button
							class="btn btn-outline btn-icon"
							on:click={() => loadContainers()}
							disabled={$isLoadingContainers}
							title="Refresh containers"
						>
							<RefreshCw class="h-4 w-4 {$isLoadingContainers ? 'animate-spin' : ''}" />
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Containers Table -->
		<div class="card">
			{#if $isLoadingContainers}
				<div class="card-content p-6">
					<div class="space-y-4">
						<div class="flex items-center justify-center py-8">
							<RefreshCw class="h-6 w-6 animate-spin text-muted-foreground mr-2" />
							<span class="text-muted-foreground">Loading containers...</span>
						</div>
						{#each Array(3) as _}
							<div class="flex items-center gap-4 p-4 border rounded-lg">
								<div class="skeleton h-10 w-10 rounded"></div>
								<div class="flex-1 space-y-2">
									<div class="skeleton h-4 w-48"></div>
									<div class="skeleton h-3 w-32"></div>
								</div>
								<div class="skeleton h-6 w-20 rounded-full"></div>
								<div class="flex gap-2">
									<div class="skeleton h-8 w-16"></div>
									<div class="skeleton h-8 w-16"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else if $sortedContainers.length === 0}
				<div class="card-content p-12">
					<div class="flex flex-col items-center justify-center text-center space-y-4">
						<Container class="h-16 w-16 text-muted-foreground/50" />
						<div class="space-y-2">
							<h3 class="text-lg font-medium text-foreground">No containers found</h3>
							<p class="text-muted-foreground">
								{$containerFilter === 'all' ? 'No containers exist yet.' : `No ${$containerFilter} containers found.`}
							</p>
						</div>
					</div>
				</div>
			{:else}
				<div class="rounded-lg border">
					<div class="overflow-x-auto">
						<table class="w-full border-collapse">
							<thead class="bg-muted/50">
								<tr class="border-b">
									<th class="text-left p-4 font-medium text-sm text-muted-foreground">Container</th>
									<th class="text-left p-4 font-medium text-sm text-muted-foreground">Image</th>
									<th class="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
									<th class="text-left p-4 font-medium text-sm text-muted-foreground">Ports</th>
									<th class="text-left p-4 font-medium text-sm text-muted-foreground">Created</th>
									<th class="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
								</tr>
							</thead>
							<tbody class="bg-background">
								{#each $sortedContainers as container}
									<tr class="border-b hover:bg-muted/50 transition-colors">
										<!-- Container Info -->
										<td class="p-4">
											<div class="flex items-center gap-3">
												<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
													<svelte:component this={getStatusIcon(container.state)} class="h-5 w-5 text-muted-foreground" />
												</div>
												<div class="min-w-0">
													<div class="font-medium text-foreground truncate">
														{getContainerDisplayName(container)}
													</div>
													<div class="text-sm text-muted-foreground font-mono">
														{container.id.slice(0, 12)}
													</div>
												</div>
											</div>
										</td>

										<!-- Image -->
										<td class="p-4">
											<div class="flex items-center gap-2">
												<ImageIcon class="h-4 w-4 text-muted-foreground" />
												<span class="text-sm text-foreground truncate">
													{container.image}
												</span>
											</div>
										</td>

										<!-- Status -->
										<td class="p-4">
											<span class="{getStatusBadgeClass(container.state)} gap-1">
												<svelte:component this={getStatusIcon(container.state)} class="h-3 w-3" />
												{container.state}
											</span>
										</td>

										<!-- Ports -->
										<td class="p-4">
											<div class="text-sm text-muted-foreground font-mono">
												{formatContainerPorts(container.ports) || '-'}
											</div>
										</td>

										<!-- Created -->
										<td class="p-4">
											<div class="flex items-center gap-1 text-sm text-muted-foreground">
												<Clock class="h-3 w-3" />
												{formatRelativeTime(container.created)}
											</div>
										</td>

										<!-- Actions -->
										<td class="p-4 text-right">
											<div class="flex items-center justify-end gap-1">
												<!-- View Logs -->
												<button
													class="btn btn-outline btn-sm gap-1"
													on:click={() => window.location.href = `/containers/${container.id}/logs`}
												>
													<FileText class="h-3 w-3" />
													Logs
												</button>

												<!-- View Stats -->
												<button
													class="btn btn-outline btn-sm gap-1"
													on:click={() => window.location.href = `/containers/${container.id}/stats`}
												>
													<BarChart3 class="h-3 w-3" />
													Stats
												</button>

												<!-- Shell Access -->
												{#if container.state === 'running'}
													<button
														class="btn btn-outline btn-sm gap-1"
														on:click={() => window.location.href = `/containers/${container.id}/shell`}
													>
														<Terminal class="h-3 w-3" />
														Shell
													</button>
												{/if}

												<!-- Container Actions -->
												{#if canPerformAction('start', container.state)}
													<button
														class="btn btn-outline btn-sm gap-1 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
														on:click={() => handleContainerAction('start', container.id)}
														disabled={isActionInProgress('start', container.id)}
													>
														{#if isActionInProgress('start', container.id)}
															<RefreshCw class="h-3 w-3 animate-spin" />
														{:else}
															<Play class="h-3 w-3" />
														{/if}
														Start
													</button>
												{/if}

												{#if canPerformAction('stop', container.state)}
													<button
														class="btn btn-outline btn-sm gap-1 text-yellow-600 border-yellow-200 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-950"
														on:click={() => handleContainerAction('stop', container.id)}
														disabled={isActionInProgress('stop', container.id)}
													>
														{#if isActionInProgress('stop', container.id)}
															<RefreshCw class="h-3 w-3 animate-spin" />
														{:else}
															<Square class="h-3 w-3" />
														{/if}
														Stop
													</button>
												{/if}

												{#if canPerformAction('restart', container.state)}
													<button
														class="btn btn-outline btn-sm gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
														on:click={() => handleContainerAction('restart', container.id)}
														disabled={isActionInProgress('restart', container.id)}
													>
														{#if isActionInProgress('restart', container.id)}
															<RefreshCw class="h-3 w-3 animate-spin" />
														{:else}
															<RotateCcw class="h-3 w-3" />
														{/if}
														Restart
													</button>
												{/if}

												{#if canPerformAction('remove', container.state)}
													<button
														class="btn btn-outline btn-sm gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
														on:click={() => handleContainerAction('remove', container.id)}
														disabled={isActionInProgress('remove', container.id)}
													>
														{#if isActionInProgress('remove', container.id)}
															<RefreshCw class="h-3 w-3 animate-spin" />
														{:else}
															<Trash2 class="h-3 w-3" />
														{/if}
														Remove
													</button>
												{/if}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
