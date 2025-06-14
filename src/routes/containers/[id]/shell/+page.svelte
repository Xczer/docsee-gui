<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { invoke } from '@tauri-apps/api/core';
	import { connectionStatus } from '$lib/stores/docker.js';
	import { 
		ArrowLeft, 
		Container, 
		AlertCircle, 
		Terminal, 
		Play, 
		FileText, 
		BarChart3,
		Activity,
		Square,
		Pause,
		RotateCcw,
		Trash2
	} from 'lucide-svelte';

	let containerId: string;
	let containerName: string = '';
	let containerStatus: string = '';
	let loading = true;
	let error: string | null = null;
	let command = '';
	let output = '';
	let isExecuting = false;
	let commandHistory: string[] = [];
	let historyIndex = -1;

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

	async function executeCommand() {
		if (!command.trim() || isExecuting) return;

		try {
			isExecuting = true;
			const cmd = command.trim().split(' ');
			
			output += `$ ${command}\n`;
			
			const result = await invoke('exec_container_cmd', {
				id: containerId,
				cmd,
				interactive: true,
				tty: true
			});

			output += result + '\n';
			
			// Add to history
			commandHistory.push(command);
			if (commandHistory.length > 100) {
				commandHistory = commandHistory.slice(-100);
			}
			historyIndex = -1;
			
			command = '';
		} catch (err) {
			console.error('Failed to execute command:', err);
			output += `Error: ${err}\n`;
		} finally {
			isExecuting = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			executeCommand();
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (commandHistory.length > 0) {
				if (historyIndex === -1) {
					historyIndex = commandHistory.length - 1;
				} else if (historyIndex > 0) {
					historyIndex--;
				}
				command = commandHistory[historyIndex] || '';
			}
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (historyIndex !== -1) {
				if (historyIndex < commandHistory.length - 1) {
					historyIndex++;
					command = commandHistory[historyIndex] || '';
				} else {
					historyIndex = -1;
					command = '';
				}
			}
		}
	}

	function clearOutput() {
		output = '';
	}

	function getStatusBadgeClass(status: string) {
		switch (status) {
			case 'running':
				return 'px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full';
			case 'exited':
				return 'px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full';
			case 'paused':
				return 'px-2 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full';
			case 'restarting':
				return 'px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full';
			default:
				return 'px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full';
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
			active: false
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
			active: true,
			disabled: containerStatus !== 'running'
		}
	];
</script>

<svelte:head>
	<title>Container Shell{containerName ? ` - ${containerName}` : ''} - DocSee</title>
</svelte:head>

<div class="space-y-6 h-full flex flex-col">
	<!-- Header -->
	<div class="space-y-4">
		<!-- Breadcrumb -->
		<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
			<button
				class="flex items-center gap-2 px-2 py-1 text-sm bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
				on:click={handleGoBack}
			>
				<ArrowLeft class="h-4 w-4" />
				Containers
			</button>
			<span>/</span>
			<span class="text-gray-900 dark:text-gray-100">Shell</span>
		</div>

		<!-- Container Info -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
					<Terminal class="h-6 w-6 text-gray-600 dark:text-gray-400" />
				</div>
				<div class="space-y-1">
					<div class="flex items-center gap-3">
						<h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
							{loading ? 'Loading...' : containerName || 'Container Shell'}
						</h1>
						{#if containerStatus && !loading}
							<span class="{getStatusBadgeClass(containerStatus)} flex items-center gap-1">
								<svelte:component this={getStatusIcon(containerStatus)} class="h-3 w-3" />
								{containerStatus}
							</span>
						{/if}
					</div>
					<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
						<Activity class="h-3 w-3" />
						<span class="font-mono">{containerId?.slice(0, 12)}</span>
					</div>
				</div>
			</div>

			<button
				class="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
				on:click={clearOutput}
			>
				<Trash2 class="h-4 w-4" />
				Clear
			</button>
		</div>

		<!-- Container Navigation Tabs -->
		<Card.Root>
			<Card.Content class="p-4">
				<div class="flex gap-2">
					{#each containerTabs as tab}
						<Button
							variant={tab.active ? 'default' : 'ghost'}
							size="sm"
							class="gap-2"
							disabled={tab.disabled}
							on:click={() => !tab.disabled && goto(tab.href)}
						>
							<svelte:component this={tab.icon} class="h-4 w-4" />
							{tab.label}
						</Button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Content -->
	<div class="flex-1 min-h-0">
		{#if !$connectionStatus.connected}
			<Alert.Root class="border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10">
				<AlertCircle class="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
				<Alert.Title class="text-yellow-800 dark:text-yellow-200">Docker Connection Required</Alert.Title>
				<Alert.Description class="text-yellow-700 dark:text-yellow-300">
					Please connect to Docker to access container shell.
				</Alert.Description>
			</Alert.Root>
		{:else if loading}
			<Card.Root class="h-full">
				<Card.Content class="p-6 h-full flex items-center justify-center">
					<div class="text-center">
						<div class="animate-spin mb-4">
							<Terminal class="h-8 w-8 text-muted-foreground" />
						</div>
						<p class="text-muted-foreground">Loading container details...</p>
					</div>
				</Card.Content>
			</Card.Root>
		{:else if error}
			<Alert.Root variant="destructive">
				<AlertCircle class="h-4 w-4" />
				<Alert.Title>Failed to Load Container</Alert.Title>
				<Alert.Description class="mt-2">
					<p class="mb-4">{error}</p>
					<Button variant="outline" size="sm" on:click={loadContainerDetails}>
						Retry
					</Button>
				</Alert.Description>
			</Alert.Root>
		{:else if containerStatus !== 'running'}
			<Alert.Root class="border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10">
				<Container class="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
				<Alert.Title class="text-yellow-800 dark:text-yellow-200">Container Not Running</Alert.Title>
				<Alert.Description class="text-yellow-700 dark:text-yellow-300">
					The container must be running to access the shell. Current status: <strong>{containerStatus}</strong>
				</Alert.Description>
			</Alert.Root>
		{:else}
			<!-- Terminal Interface -->
			<Card.Root class="h-full overflow-hidden bg-black dark:bg-gray-950">
				<div class="h-full flex flex-col">
					<!-- Terminal Header -->
					<div class="bg-gray-800 dark:bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-700 dark:border-gray-800">
						<div class="flex items-center gap-3">
							<div class="flex gap-1">
								<div class="w-3 h-3 bg-red-500 rounded-full"></div>
								<div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
								<div class="w-3 h-3 bg-green-500 rounded-full"></div>
							</div>
							<span class="text-sm text-gray-300">
								{containerName}@{containerId?.slice(0, 8)}
							</span>
						</div>
						<div class="text-xs text-gray-400 flex items-center gap-1">
							<Terminal class="h-3 w-3" />
							Interactive Shell
						</div>
					</div>

					<!-- Terminal Output -->
					<div class="flex-1 p-4 font-mono text-sm text-green-400 overflow-auto bg-black dark:bg-gray-950 terminal-scroll">
						{#if output}
							<pre class="whitespace-pre-wrap leading-relaxed">{output}</pre>
						{:else}
							<div class="text-gray-500 mb-4 leading-relaxed">
								<div class="mb-2">Welcome to the container shell!</div>
								<div class="text-xs">
									• Type commands and press Enter to execute<br>
									• Use ↑/↓ arrow keys to navigate command history<br>
									• Commands are executed in /bin/sh by default
								</div>
							</div>
						{/if}
					</div>

					<!-- Command Input -->
					<div class="bg-gray-800 dark:bg-gray-900 border-t border-gray-700 dark:border-gray-800 p-4">
						<div class="flex items-center gap-3">
							<span class="text-green-400 font-mono text-sm flex-shrink-0">$</span>
							<Input
								type="text"
								bind:value={command}
								on:keydown={handleKeyDown}
								disabled={isExecuting}
								placeholder={isExecuting ? 'Executing...' : 'Enter command...'}
								class="flex-1 bg-transparent text-green-400 font-mono text-sm border-none outline-none ring-0 focus-visible:ring-0 placeholder:text-gray-500 disabled:opacity-50"
							/>
							<Button
								size="sm"
								on:click={executeCommand}
								disabled={!command.trim() || isExecuting}
								class="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
							>
								<Play class="h-3 w-3" />
								{isExecuting ? 'Running...' : 'Run'}
							</Button>
						</div>
					</div>
				</div>
			</Card.Root>
		{/if}
	</div>
</div>

<style>
	/* Custom scrollbar styles for terminal */
	.terminal-scroll::-webkit-scrollbar {
		width: 8px;
	}

	.terminal-scroll::-webkit-scrollbar-track {
		background: #000000;
	}

	.terminal-scroll::-webkit-scrollbar-thumb {
		background: #4b5563;
		border-radius: 4px;
	}

	.terminal-scroll::-webkit-scrollbar-thumb:hover {
		background: #6b7280;
	}

	:global(.dark) .terminal-scroll::-webkit-scrollbar-track {
		background: #030712;
	}

	:global(.dark) .terminal-scroll::-webkit-scrollbar-thumb {
		background: #374151;
	}

	:global(.dark) .terminal-scroll::-webkit-scrollbar-thumb:hover {
		background: #4b5563;
	}
</style>
