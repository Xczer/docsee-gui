<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { pullImageAction, imageOperationInProgress, imageError } from '$lib/stores/images.js';
	import { X, Download, AlertCircle } from 'lucide-svelte';

	const dispatch = createEventDispatcher();

	export let open = false;

	let imageName = '';
	let tag = 'latest';
	let isPulling = false;

	// Reset form when dialog opens
	$: if (open) {
		imageName = '';
		tag = 'latest';
		isPulling = false;
	}

	// Watch for operation progress
	$: isPulling = !!$imageOperationInProgress?.startsWith('pull-');

	async function handlePull() {
		if (!imageName.trim()) {
			return;
		}

		const success = await pullImageAction(imageName.trim(), tag.trim() || undefined);
		
		if (success) {
			dispatch('success');
			open = false;
		}
	}

	function handleClose() {
		if (!isPulling) {
			open = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !isPulling) {
			open = false;
		} else if (event.key === 'Enter' && !isPulling) {
			handlePull();
		}
	}

	// Popular images suggestions
	const popularImages = [
		{ name: 'nginx', description: 'High-performance web server' },
		{ name: 'redis', description: 'In-memory data store' },
		{ name: 'postgres', description: 'PostgreSQL database' },
		{ name: 'mysql', description: 'MySQL database' },
		{ name: 'mongodb', description: 'MongoDB database' },
		{ name: 'node', description: 'Node.js runtime' },
		{ name: 'python', description: 'Python runtime' },
		{ name: 'ubuntu', description: 'Ubuntu Linux' },
		{ name: 'alpine', description: 'Lightweight Linux' },
		{ name: 'traefik', description: 'Modern reverse proxy' }
	];

	function selectImage(name: string) {
		imageName = name;
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div 
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
		on:click={handleClose}
	>
		<!-- Dialog -->
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div 
			class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
			on:click|stopPropagation
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200">
				<div class="flex items-center gap-3">
					<Download class="w-6 h-6 text-blue-600" />
					<h2 class="text-xl font-semibold text-gray-900">Pull Docker Image</h2>
				</div>
				{#if !isPulling}
					<button
						on:click={handleClose}
						class="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X class="w-6 h-6" />
					</button>
				{/if}
			</div>

			<!-- Content -->
			<div class="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
				{#if $imageError}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
						<div class="flex items-center gap-2 text-red-800">
							<AlertCircle class="w-4 h-4" />
							<span class="text-sm font-medium">Pull failed</span>
						</div>
						<p class="text-sm text-red-700 mt-1">{$imageError}</p>
					</div>
				{/if}

				<div class="space-y-6">
					<!-- Form -->
					<div class="space-y-4">
						<div>
							<label for="imageName" class="block text-sm font-medium text-gray-700 mb-2">
								Image Name *
							</label>
							<input
								id="imageName"
								type="text"
								bind:value={imageName}
								placeholder="e.g., nginx, postgres, node"
								disabled={isPulling}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							/>
							<p class="text-xs text-gray-500 mt-1">
								Enter the image name (repository). For Docker Hub images, use the short name.
							</p>
						</div>

						<div>
							<label for="tag" class="block text-sm font-medium text-gray-700 mb-2">
								Tag
							</label>
							<input
								id="tag"
								type="text"
								bind:value={tag}
								placeholder="latest"
								disabled={isPulling}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
							/>
							<p class="text-xs text-gray-500 mt-1">
								Specify the image tag/version. Defaults to "latest" if empty.
							</p>
						</div>

						{#if imageName && tag}
							<div class="p-3 bg-blue-50 border border-blue-200 rounded-md">
								<p class="text-sm text-blue-800">
									<strong>Will pull:</strong> <code class="font-mono">{imageName}:{tag}</code>
								</p>
							</div>
						{/if}
					</div>

					<!-- Popular Images -->
					<div>
						<h3 class="text-sm font-medium text-gray-700 mb-3">Popular Images</h3>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
							{#each popularImages as image}
								<button
									type="button"
									on:click={() => selectImage(image.name)}
									disabled={isPulling}
									class="text-left p-3 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<div class="font-medium text-sm text-gray-900">{image.name}</div>
									<div class="text-xs text-gray-600">{image.description}</div>
								</button>
							{/each}
						</div>
					</div>

					<!-- Examples -->
					<div>
						<h3 class="text-sm font-medium text-gray-700 mb-2">Examples</h3>
						<div class="space-y-1 text-xs text-gray-600">
							<div><code class="bg-gray-100 px-1 rounded">nginx:alpine</code> - Lightweight nginx</div>
							<div><code class="bg-gray-100 px-1 rounded">postgres:13</code> - PostgreSQL version 13</div>
							<div><code class="bg-gray-100 px-1 rounded">node:18-alpine</code> - Node.js 18 on Alpine</div>
							<div><code class="bg-gray-100 px-1 rounded">redis:7-alpine</code> - Redis 7 on Alpine</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
				{#if !isPulling}
					<button
						type="button"
						on:click={handleClose}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
				{/if}
				
				<button
					type="button"
					on:click={handlePull}
					disabled={isPulling || !imageName.trim()}
					class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
				>
					{#if isPulling}
						<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Pulling...
					{:else}
						<Download class="w-4 h-4" />
						Pull Image
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
