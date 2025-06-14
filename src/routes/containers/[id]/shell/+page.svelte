<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { invoke } from '@tauri-apps/api/core';
	import { connectionStatus } from '$lib/stores/docker.js';
	import { ArrowLeft, Container, AlertCircle, Terminal, Play } from 'lucide-svelte';

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

	function getStatusColor(status: string): string {
		switch (status) {
			case 'running':
				return 'text-green-600 bg-green-100';
			case 'exited':
				return 'text-gray-600 bg-gray-100';
			case 'paused':
				return 'text-yellow-600 bg-yellow-100';
			case 'restarting':
				return 'text-blue-600 bg-blue-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}
</script>

<svelte:head>
	<title>Container Shell{containerName ? ` - ${containerName}` : ''} - DocSee</title>
</svelte:head>

<div class="p-6 h-full flex flex-col">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-4">
			<button
				on:click={handleGoBack}
				class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
			>
				<ArrowLeft class="w-5 h-5" />
				<span>Back to Containers</span>
			</button>

			<div class="h-6 w-px bg-gray-300"></div>

			<div class="flex items-center gap-3">
				<Terminal class="w-6 h-6 text-gray-600" />
				<div>
					<h1 class="text-2xl font-bold text-gray-900">
						Container Shell
					</h1>
					<div class="flex items-center gap-2 text-sm text-gray-600">
						<span class="font-mono">{containerId?.slice(0, 12)}</span>
						{#if containerName}
							<span>-</span>
							<span>{containerName}</span>
						{/if}
						{#if containerStatus}
							<span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(containerStatus)}">
								{containerStatus}
							</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<button
				on:click={clearOutput}
				class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
			>
				Clear
			</button>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 min-h-0">
		{#if !$connectionStatus.connected}
			<div class="h-full flex items-center justify-center">
				<div class="text-center">
					<AlertCircle class="w-12 h-12 text-yellow-500 mx-auto mb-4" />
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Docker Connection Required</h3>
					<p class="text-gray-600">Please connect to Docker to access container shell.</p>
				</div>
			</div>
		{:else if loading}
			<div class="h-full flex items-center justify-center">
				<div class="inline-flex items-center text-gray-600">
					<svg class="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Loading container details...
				</div>
			</div>
		{:else if error}
			<div class="h-full flex items-center justify-center">
				<div class="text-center">
					<AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Failed to Load Container</h3>
					<p class="text-gray-600 mb-4">{error}</p>
					<button
						on:click={loadContainerDetails}
						class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		{:else if containerStatus !== 'running'}
			<div class="h-full flex items-center justify-center">
				<div class="text-center">
					<Container class="w-12 h-12 text-yellow-500 mx-auto mb-4" />
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Container Not Running</h3>
					<p class="text-gray-600">The container must be running to access the shell.</p>
					<p class="text-sm text-gray-500 mt-2">Current status: <span class="font-medium">{containerStatus}</span></p>
				</div>
			</div>
		{:else}
			<!-- Terminal Interface -->
			<div class="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
				<!-- Terminal Header -->
				<div class="bg-gray-800 px-4 py-2 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="flex gap-1">
							<div class="w-3 h-3 bg-red-500 rounded-full"></div>
							<div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
							<div class="w-3 h-3 bg-green-500 rounded-full"></div>
						</div>
						<span class="text-sm text-gray-300 ml-4">
							{containerName}@{containerId?.slice(0, 8)}
						</span>
					</div>
					<div class="text-xs text-gray-400">
						Interactive Shell
					</div>
				</div>

				<!-- Terminal Output -->
				<div class="flex-1 p-4 font-mono text-sm text-green-400 overflow-auto bg-gray-900">
					{#if output}
						<pre class="whitespace-pre-wrap">{output}</pre>
					{:else}
						<div class="text-gray-500 mb-4">
							Welcome to the container shell! Type commands and press Enter to execute.
							<br>Use arrow keys to navigate command history.
						</div>
					{/if}
				</div>

				<!-- Command Input -->
				<div class="bg-gray-800 border-t border-gray-700 p-4">
					<div class="flex items-center gap-2">
						<span class="text-green-400 font-mono text-sm">$</span>
						<input
							type="text"
							bind:value={command}
							on:keydown={handleKeyDown}
							disabled={isExecuting}
							placeholder={isExecuting ? 'Executing...' : 'Enter command...'}
							class="flex-1 bg-transparent text-green-400 font-mono text-sm border-none outline-none placeholder-gray-500 disabled:opacity-50"
							autofocus
						/>
						<button
							on:click={executeCommand}
							disabled={!command.trim() || isExecuting}
							class="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Play class="w-3 h-3" />
							{isExecuting ? 'Running...' : 'Run'}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Custom scrollbar for terminal output */
	.overflow-auto::-webkit-scrollbar {
		width: 8px;
	}

	.overflow-auto::-webkit-scrollbar-track {
		background: #374151;
	}

	.overflow-auto::-webkit-scrollbar-thumb {
		background: #6b7280;
		border-radius: 4px;
	}

	.overflow-auto::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}
</style>
