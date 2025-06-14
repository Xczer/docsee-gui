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
</script>

<div style="padding: 1rem;">
	<!-- Page Header -->
	<div style="margin-bottom: 2rem;">
		<h1 style="font-size: 2rem; font-weight: bold; color: #111827; margin-bottom: 0.25rem;">
			Containers
		</h1>
		<p style="color: #6b7280;">Manage your Docker containers</p>
	</div>

	{#if !$connectionStatus.connected}
		<!-- Connection Required Notice -->
		<div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 0.5rem; padding: 1rem;">
			<div style="display: flex; align-items: center;">
				<svg style="width: 1.25rem; height: 1.25rem; color: #f59e0b; margin-right: 0.75rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
				<div>
					<h3 style="font-size: 0.875rem; font-weight: 600; color: #92400e; margin-bottom: 0.25rem;">
						Docker Connection Required
					</h3>
					<p style="font-size: 0.875rem; color: #b45309; margin: 0;">
						Connect to Docker to view and manage containers.
					</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- Error Banner -->
		{#if $containerError}
			<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;">
				<div style="display: flex; align-items: center; gap: 0.75rem;">
					<svg style="width: 1.25rem; height: 1.25rem; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<span style="font-size: 0.875rem; color: #dc2626;">
						{$containerError}
					</span>
				</div>
			</div>
		{/if}

		<!-- Filters and Search -->
		<div style="background-color: white; padding: 1rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
			<div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
				<!-- Filter Buttons -->
				<div style="display: flex; gap: 0.5rem;">
					<button
						type="button"
						style="padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background-color: {$containerFilter === 'all' ? '#3b82f6' : 'white'}; color: {$containerFilter === 'all' ? 'white' : '#374151'}; cursor: pointer; transition: all 0.2s;"
						on:click={() => containerFilter.set('all')}
					>
						All
					</button>
					<button
						type="button"
						style="padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background-color: {$containerFilter === 'running' ? '#10b981' : 'white'}; color: {$containerFilter === 'running' ? 'white' : '#374151'}; cursor: pointer; transition: all 0.2s;"
						on:click={() => containerFilter.set('running')}
					>
						Running
					</button>
					<button
						type="button"
						style="padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background-color: {$containerFilter === 'stopped' ? '#6b7280' : 'white'}; color: {$containerFilter === 'stopped' ? 'white' : '#374151'}; cursor: pointer; transition: all 0.2s;"
						on:click={() => containerFilter.set('stopped')}
					>
						Stopped
					</button>
				</div>

				<!-- Search -->
				<div style="flex: 1; max-width: 24rem;">
					<input
						type="text"
						placeholder="Search containers..."
						bind:value={$containerSearchTerm}
						style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; outline: none; transition: border-color 0.2s;"
					>
				</div>

				<!-- Refresh Button -->
				<button
					type="button"
					style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background-color: white; color: #374151; cursor: pointer; transition: all 0.2s;"
					on:click={() => loadContainers()}
					disabled={$isLoadingContainers}
				>
					<svg style="width: 1.25rem; height: 1.25rem; {$isLoadingContainers ? 'animation: spin 1s linear infinite;' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Containers List -->
		<div style="background-color: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
			{#if $isLoadingContainers}
				<div style="padding: 3rem; text-align: center; color: #6b7280;">
					<svg style="width: 2rem; height: 2rem; margin: 0 auto 1rem; animation: spin 1s linear infinite;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					<p>Loading containers...</p>
				</div>
			{:else if $sortedContainers.length === 0}
				<div style="padding: 3rem; text-align: center; color: #6b7280;">
					<svg style="width: 3rem; height: 3rem; margin: 0 auto 1rem; color: #d1d5db;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
					</svg>
					<p style="font-size: 1.125rem; font-weight: 500; margin-bottom: 0.5rem;">No containers found</p>
					<p style="font-size: 0.875rem;">
						{$containerFilter === 'all' ? 'No containers exist yet.' : `No ${$containerFilter} containers found.`}
					</p>
				</div>
			{:else}
				<div style="overflow-x: auto;">
					<table style="width: 100%; border-collapse: collapse;">
						<thead style="background-color: #f9fafb;">
							<tr>
								<th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Name</th>
								<th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Image</th>
								<th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Status</th>
								<th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Ports</th>
								<th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Created</th>
								<th style="padding: 0.75rem 1rem; text-align: right; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Actions</th>
							</tr>
						</thead>
						<tbody style="background-color: white; divide-y: 1px solid #e5e7eb;">
							{#each $sortedContainers as container}
								<tr style="border-bottom: 1px solid #e5e7eb;">
									<td style="padding: 1rem; white-space: nowrap;">
										<div style="display: flex; align-items: center;">
											<div>
												<div style="font-size: 0.875rem; font-weight: 500; color: #111827;">
													{getContainerDisplayName(container)}
												</div>
												<div style="font-size: 0.75rem; color: #6b7280; font-family: monospace;">
													{container.id.slice(0, 12)}
												</div>
											</div>
										</div>
									</td>
									<td style="padding: 1rem;">
										<div style="font-size: 0.875rem; color: #111827;">
											{container.image}
										</div>
									</td>
									<td style="padding: 1rem;">
										<span style="display: inline-flex; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; {getContainerStatusColor(container.state)}">
											{container.state}
										</span>
									</td>
									<td style="padding: 1rem;">
										<div style="font-size: 0.875rem; color: #6b7280; font-family: monospace;">
											{formatContainerPorts(container.ports)}
										</div>
									</td>
									<td style="padding: 1rem;">
										<div style="font-size: 0.875rem; color: #6b7280;">
											{formatRelativeTime(container.created)}
										</div>
									</td>
									<td style="padding: 1rem; text-align: right;">
										<div style="display: flex; gap: 0.25rem; justify-content: flex-end;">
											{#if canPerformAction('start', container.state)}
												<button
													type="button"
													style="padding: 0.25rem 0.5rem; border: 1px solid #10b981; border-radius: 0.25rem; background-color: white; color: #10b981; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s; disabled:opacity-50;"
													on:click={() => handleContainerAction('start', container.id)}
													disabled={isActionInProgress('start', container.id)}
												>
													{isActionInProgress('start', container.id) ? '...' : 'Start'}
												</button>
											{/if}
											{#if canPerformAction('stop', container.state)}
												<button
													type="button"
													style="padding: 0.25rem 0.5rem; border: 1px solid #f59e0b; border-radius: 0.25rem; background-color: white; color: #f59e0b; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s; disabled:opacity-50;"
													on:click={() => handleContainerAction('stop', container.id)}
													disabled={isActionInProgress('stop', container.id)}
												>
													{isActionInProgress('stop', container.id) ? '...' : 'Stop'}
												</button>
											{/if}
											{#if canPerformAction('restart', container.state)}
												<button
													type="button"
													style="padding: 0.25rem 0.5rem; border: 1px solid #3b82f6; border-radius: 0.25rem; background-color: white; color: #3b82f6; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s; disabled:opacity-50;"
													on:click={() => handleContainerAction('restart', container.id)}
													disabled={isActionInProgress('restart', container.id)}
												>
													{isActionInProgress('restart', container.id) ? '...' : 'Restart'}
												</button>
											{/if}
											{#if canPerformAction('remove', container.state)}
												<button
													type="button"
													style="padding: 0.25rem 0.5rem; border: 1px solid #ef4444; border-radius: 0.25rem; background-color: white; color: #ef4444; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s; disabled:opacity-50;"
													on:click={() => handleContainerAction('remove', container.id)}
													disabled={isActionInProgress('remove', container.id)}
												>
													{isActionInProgress('remove', container.id) ? '...' : 'Remove'}
												</button>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	button:hover:not(:disabled) {
		opacity: 0.8;
	}

	input:focus {
		border-color: #3b82f6 !important;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
