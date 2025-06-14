<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { 
		connectionStatus, 
		systemStats, 
		loadSystemStats, 
		isLoadingStats,
		dockerError 
	} from '$lib/stores/docker.js';
	import { 
		containers, 
		loadContainers, 
		startContainerAutoRefresh, 
		stopContainerAutoRefresh,
		isLoadingContainers 
	} from '$lib/stores/containers.js';
	import { formatRelativeTime, getContainerDisplayName, getContainerStatusColor } from '$lib/utils/formatters.js';

	let mounted = false;

	onMount(async () => {
		mounted = true;
		
		// Load initial data if connected
		if ($connectionStatus.connected) {
			await loadSystemStats();
			await loadContainers();
			startContainerAutoRefresh(5000);
		}
	});

	onDestroy(() => {
		stopContainerAutoRefresh();
	});

	// Reactive statements to load data when connection status changes
	$: if (mounted && $connectionStatus.connected) {
		loadSystemStats();
		loadContainers();
	}

	// Calculate running and stopped containers
	$: runningContainers = $containers.filter(c => c.state === 'running');
	$: stoppedContainers = $containers.filter(c => c.state === 'exited' || c.state === 'created');
	$: pausedContainers = $containers.filter(c => c.state === 'paused');

	// Get recent containers (last 5)
	$: recentContainers = [...$containers]
		.sort((a, b) => b.created - a.created)
		.slice(0, 5);
</script>

<div style="padding: 1rem;">
	<!-- Page Header -->
	<div style="margin-bottom: 2rem;">
		<h1 style="font-size: 2rem; font-weight: bold; color: #111827; margin-bottom: 0.25rem;">
			Dashboard
		</h1>
		<p style="color: #6b7280;">Overview of your Docker environment</p>
	</div>

	{#if !$connectionStatus.connected}
		<!-- Connection Required Notice -->
		<div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 0.5rem; padding: 1rem; margin-bottom: 2rem;">
			<div style="display: flex; align-items: center;">
				<svg style="width: 1.25rem; height: 1.25rem; color: #f59e0b; margin-right: 0.75rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
				<div>
					<h3 style="font-size: 0.875rem; font-weight: 600; color: #92400e; margin-bottom: 0.25rem;">
						Docker Connection Required
					</h3>
					<p style="font-size: 0.875rem; color: #b45309; margin: 0;">
						Please ensure Docker is running and try refreshing the page. The application will automatically attempt to connect.
					</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- Dashboard Content -->
		<div style="display: flex; flex-direction: column; gap: 1.5rem;">
			<!-- Stats Cards -->
			<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem;">
				<!-- Total Containers -->
				<div style="background-color: white; padding: 1.25rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
					<div style="display: flex; align-items: center;">
						<div style="width: 2rem; height: 2rem; background-color: #3b82f6; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; margin-right: 1.25rem;">
							<svg style="width: 1.25rem; height: 1.25rem; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
							</svg>
						</div>
						<div>
							<div style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">
								Total Containers
							</div>
							<div style="font-size: 1.125rem; font-weight: 600; color: #111827;">
								{$isLoadingStats || $isLoadingContainers ? '...' : $systemStats?.containers_total ?? $containers.length}
							</div>
						</div>
					</div>
				</div>

				<!-- Running Containers -->
				<div style="background-color: white; padding: 1.25rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
					<div style="display: flex; align-items: center;">
						<div style="width: 2rem; height: 2rem; background-color: #10b981; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; margin-right: 1.25rem;">
							<svg style="width: 1.25rem; height: 1.25rem; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<div style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">
								Running
							</div>
							<div style="font-size: 1.125rem; font-weight: 600; color: #10b981;">
								{$isLoadingStats || $isLoadingContainers ? '...' : $systemStats?.containers_running ?? runningContainers.length}
							</div>
						</div>
					</div>
				</div>

				<!-- Stopped Containers -->
				<div style="background-color: white; padding: 1.25rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
					<div style="display: flex; align-items: center;">
						<div style="width: 2rem; height: 2rem; background-color: #6b7280; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; margin-right: 1.25rem;">
							<svg style="width: 1.25rem; height: 1.25rem; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10h6v4H9z" />
							</svg>
						</div>
						<div>
							<div style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">
								Stopped
							</div>
							<div style="font-size: 1.125rem; font-weight: 600; color: #6b7280;">
								{$isLoadingStats || $isLoadingContainers ? '...' : $systemStats?.containers_stopped ?? stoppedContainers.length}
							</div>
						</div>
					</div>
				</div>

				<!-- Images -->
				<div style="background-color: white; padding: 1.25rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
					<div style="display: flex; align-items: center;">
						<div style="width: 2rem; height: 2rem; background-color: #8b5cf6; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; margin-right: 1.25rem;">
							<svg style="width: 1.25rem; height: 1.25rem; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
						<div>
							<div style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">
								Images
							</div>
							<div style="font-size: 1.125rem; font-weight: 600; color: #111827;">
								{$isLoadingStats ? '...' : $systemStats?.images_total ?? '-'}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
				<!-- Quick Actions -->
				<div style="background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
					<h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">
						Quick Actions
					</h3>
					<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
						<a
							href="/containers"
							style="display: flex; align-items: center; justify-content: center; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; color: #374151; background-color: white; text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: all 0.2s;"
						>
							<svg style="width: 1rem; height: 1rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
							</svg>
							Containers
						</a>

						<a
							href="/images"
							style="display: flex; align-items: center; justify-content: center; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; color: #374151; background-color: white; text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: all 0.2s;"
						>
							<svg style="width: 1rem; height: 1rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							Images
						</a>

						<a
							href="/networks"
							style="display: flex; align-items: center; justify-content: center; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; color: #374151; background-color: white; text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: all 0.2s;"
						>
							<svg style="width: 1rem; height: 1rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-2.219 5.781M15.219 7.219A9 9 0 0115.219 7.219M3 12a9 9 0 012.219-5.781m0 11.562A9 9 0 013 12m6 0a3 3 0 106 0 3 3 0 00-6 0zm6 0a3 3 0 106 0 3 3 0 00-6 0z" />
							</svg>
							Networks
						</a>

						<a
							href="/volumes"
							style="display: flex; align-items: center; justify-content: center; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; color: #374151; background-color: white; text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: all 0.2s;"
						>
							<svg style="width: 1rem; height: 1rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
							</svg>
							Volumes
						</a>
					</div>
				</div>

				<!-- Recent Containers -->
				<div style="background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
					<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
						<h3 style="font-size: 1.125rem; font-weight: 600; color: #111827;">
							Recent Containers
						</h3>
						<a
							href="/containers"
							style="font-size: 0.875rem; color: #3b82f6; text-decoration: none; font-weight: 500;"
						>
							View all →
						</a>
					</div>
					
					{#if $isLoadingContainers}
						<div style="text-align: center; padding: 2rem; color: #6b7280;">
							Loading containers...
						</div>
					{:else if recentContainers.length === 0}
						<div style="text-align: center; padding: 2rem; color: #6b7280;">
							No containers found
						</div>
					{:else}
						<div style="space-y: 0.75rem;">
							{#each recentContainers as container}
								<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-radius: 0.375rem; background-color: #f9fafb;">
									<div style="flex: 1; min-width: 0;">
										<div style="font-size: 0.875rem; font-weight: 500; color: #111827; truncate;">
											{getContainerDisplayName(container)}
										</div>
										<div style="font-size: 0.75rem; color: #6b7280; truncate;">
											{container.image}
										</div>
									</div>
									<div style="display: flex; align-items: center; gap: 0.5rem;">
										<span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 9999px; font-weight: 500; {getContainerStatusColor(container.state)}">
											{container.state}
										</span>
										<span style="font-size: 0.75rem; color: #6b7280;">
											{formatRelativeTime(container.created)}
										</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	a:hover {
		background-color: #f3f4f6 !important;
		border-color: #9ca3af !important;
	}
</style>
