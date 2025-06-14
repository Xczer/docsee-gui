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
	import { 
		Container, 
		Image, 
		Network, 
		HardDrive, 
		Play, 
		Square, 
		ArrowUpRight, 
		AlertTriangle,
		TrendingUp,
		Activity,
		Zap
	} from 'lucide-svelte';

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

	// Stats cards data
	$: statsCards = [
		{
			title: 'Total Containers',
			value: $isLoadingStats || $isLoadingContainers ? null : $systemStats?.containers_total ?? $containers.length,
			icon: Container,
			color: 'text-blue-600 dark:text-blue-400',
			bgColor: 'bg-blue-100 dark:bg-blue-900/20',
			href: '/containers'
		},
		{
			title: 'Running',
			value: $isLoadingStats || $isLoadingContainers ? null : $systemStats?.containers_running ?? runningContainers.length,
			icon: Play,
			color: 'text-green-600 dark:text-green-400',
			bgColor: 'bg-green-100 dark:bg-green-900/20',
			href: '/containers'
		},
		{
			title: 'Stopped',
			value: $isLoadingStats || $isLoadingContainers ? null : $systemStats?.containers_stopped ?? stoppedContainers.length,
			icon: Square,
			color: 'text-gray-600 dark:text-gray-400',
			bgColor: 'bg-gray-100 dark:bg-gray-900/20',
			href: '/containers'
		},
		{
			title: 'Images',
			value: $isLoadingStats ? null : $systemStats?.images_total ?? '-',
			icon: Image,
			color: 'text-purple-600 dark:text-purple-400',
			bgColor: 'bg-purple-100 dark:bg-purple-900/20',
			href: '/images'
		}
	];

	// Quick actions
	const quickActions = [
		{ label: 'Containers', icon: Container, href: '/containers', description: 'Manage containers' },
		{ label: 'Images', icon: Image, href: '/images', description: 'Browse images' },
		{ label: 'Networks', icon: Network, href: '/networks', description: 'Network settings' },
		{ label: 'Volumes', icon: HardDrive, href: '/volumes', description: 'Storage volumes' }
	];

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

	function getStatusColor(state: string) {
		switch (state) {
			case 'running':
				return 'text-green-600 dark:text-green-400';
			case 'exited':
			case 'created':
				return 'text-gray-600 dark:text-gray-400';
			case 'paused':
				return 'text-yellow-600 dark:text-yellow-400';
			default:
				return 'text-gray-600 dark:text-gray-400';
		}
	}
</script>

<svelte:head>
	<title>Dashboard - DocSee</title>
</svelte:head>

<div class="space-y-8">
	<!-- Page Header -->
	<div class="space-y-2">
		<h1 class="text-3xl font-bold tracking-tight text-foreground">
			Dashboard
		</h1>
		<p class="text-muted-foreground">
			Overview of your Docker environment
		</p>
	</div>

	{#if !$connectionStatus.connected}
		<!-- Connection Required Notice -->
		<div class="alert border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10">
			<AlertTriangle class="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
			<div class="alert-title text-yellow-800 dark:text-yellow-200">Docker Connection Required</div>
			<div class="alert-description text-yellow-700 dark:text-yellow-300">
				Please ensure Docker is running and try refreshing the page. The application will automatically attempt to connect.
			</div>
		</div>
	{:else}
		<!-- Dashboard Content -->
		<div class="space-y-8">
			<!-- Stats Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
				{#each statsCards as card}
					<div class="card group cursor-pointer transition-all hover:shadow-md dark:hover:shadow-lg hover:scale-[1.02]">
						<div class="card-content p-6">
							<div class="flex items-center justify-between">
								<div class="space-y-2">
									<p class="text-sm font-medium text-muted-foreground">
										{card.title}
									</p>
									<div class="text-2xl font-bold text-foreground">
										{#if card.value === null}
											<div class="skeleton h-8 w-12"></div>
										{:else}
											{card.value}
										{/if}
									</div>
								</div>
								<div class="flex h-12 w-12 items-center justify-center rounded-lg {card.bgColor}">
									<svelte:component this={card.icon} class="h-6 w-6 {card.color}" />
								</div>
							</div>
							<div class="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
								<TrendingUp class="h-3 w-3" />
								<a href={card.href} class="hover:text-foreground transition-colors">
									View details
									<ArrowUpRight class="ml-1 h-3 w-3 inline" />
								</a>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
				<!-- Quick Actions -->
				<div class="card">
					<div class="card-header">
						<div class="card-title flex items-center gap-2">
							<Zap class="h-5 w-5 text-primary" />
							Quick Actions
						</div>
						<div class="card-description">
							Navigate to main features
						</div>
					</div>
					<div class="card-content space-y-4">
						{#each quickActions as action}
							<button 
								class="btn btn-ghost w-full justify-start h-auto p-4 group"
								on:click={() => window.location.href = action.href}
							>
								<div class="flex items-center gap-4 w-full">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
										<svelte:component this={action.icon} class="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
									</div>
									<div class="flex-1 text-left">
										<div class="font-medium text-foreground group-hover:text-primary transition-colors">
											{action.label}
										</div>
										<div class="text-sm text-muted-foreground">
											{action.description}
										</div>
									</div>
									<ArrowUpRight class="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
								</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Recent Containers -->
				<div class="card xl:col-span-2">
					<div class="card-header">
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<div class="card-title flex items-center gap-2">
									<Activity class="h-5 w-5 text-primary" />
									Recent Containers
								</div>
								<div class="card-description">
									Latest container activity
								</div>
							</div>
							<button class="btn btn-outline btn-sm" on:click={() => window.location.href = '/containers'}>
								View all
								<ArrowUpRight class="ml-2 h-4 w-4" />
							</button>
						</div>
					</div>
					<div class="card-content">
						{#if $isLoadingContainers}
							<div class="space-y-4">
								{#each Array(3) as _}
									<div class="flex items-center gap-4">
										<div class="skeleton h-10 w-10 rounded-lg"></div>
										<div class="flex-1 space-y-2">
											<div class="skeleton h-4 w-32"></div>
											<div class="skeleton h-3 w-48"></div>
										</div>
										<div class="skeleton h-6 w-16 rounded-full"></div>
									</div>
								{/each}
							</div>
						{:else if recentContainers.length === 0}
							<div class="flex flex-col items-center justify-center py-12 text-center">
								<Container class="h-12 w-12 text-muted-foreground/50 mb-4" />
								<h3 class="font-medium text-foreground mb-2">No containers found</h3>
								<p class="text-sm text-muted-foreground">
									No containers exist yet.
								</p>
							</div>
						{:else}
							<div class="space-y-4">
								{#each recentContainers as container}
									<div class="flex items-center gap-4 group hover:bg-muted/50 rounded-lg p-3 -m-3 transition-colors">
										<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
											<Container class="h-5 w-5 {getStatusColor(container.state)}" />
										</div>
										<div class="flex-1 min-w-0">
											<div class="font-medium text-foreground truncate">
												{getContainerDisplayName(container)}
											</div>
											<div class="text-sm text-muted-foreground truncate">
												{container.image}
											</div>
										</div>
										<div class="flex items-center gap-3">
											<span class="{getStatusBadgeClass(container.state)} text-xs">
												{container.state}
											</span>
											<div class="text-xs text-muted-foreground">
												{formatRelativeTime(container.created)}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
