<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { 
		sortedImages, 
		loadImages, 
		startImageAutoRefresh, 
		stopImageAutoRefresh,
		isLoadingImages,
		imageError,
		imageFilter,
		imageSearchTerm,
		removeImageAction,
		imageOperationInProgress
	} from '$lib/stores/images.js';
	import { connectionStatus } from '$lib/stores/docker.js';
	import { 
		formatBytes, 
		formatRelativeTime, 
		parseImageTag 
	} from '$lib/utils/formatters.js';

	let mounted = false;

	onMount(async () => {
		mounted = true;
		
		if ($connectionStatus.connected) {
			await loadImages();
			startImageAutoRefresh(10000);
		}
	});

	onDestroy(() => {
		stopImageAutoRefresh();
	});

	// Reactive statement to load images when connection changes
	$: if (mounted && $connectionStatus.connected) {
		loadImages();
	}

	// Handle image actions
	async function handleImageAction(action: string, imageId: string) {
		switch (action) {
			case 'remove':
				if (confirm('Are you sure you want to remove this image?')) {
					await removeImageAction(imageId, false);
				}
				break;
			case 'force-remove':
				if (confirm('Are you sure you want to force remove this image? This will remove the image even if containers are using it.')) {
					await removeImageAction(imageId, true);
				}
				break;
		}
	}

	function isActionInProgress(action: string, imageId: string): boolean {
		return $imageOperationInProgress === `${action}-${imageId}`;
	}

	function getImageDisplayName(image: any): string {
		if (image.repo_tags && image.repo_tags.length > 0 && image.repo_tags[0] !== '<none>:<none>') {
			return image.repo_tags[0];
		}
		return image.id.slice(0, 12);
	}

	function getImageTags(image: any): string[] {
		if (image.repo_tags && image.repo_tags.length > 0 && image.repo_tags[0] !== '<none>:<none>') {
			return image.repo_tags;
		}
		return ['<none>'];
	}
</script>

<div style="padding: 1rem;">
	<!-- Page Header -->
	<div style="margin-bottom: 2rem;">
		<h1 style="font-size: 2rem; font-weight: bold; color: #111827; margin-bottom: 0.25rem;">
			Images
		</h1>
		<p style="color: #6b7280;">Manage your Docker images</p>
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
						Connect to Docker to view and manage images.
					</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- Error Banner -->
		{#if $imageError}
			<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;">
				<div style="display: flex; align-items: center; gap: 0.75rem;">
					<svg style="width: 1.25rem; height: 1.25rem; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<span style="font-size: 0.875rem; color: #dc2626;">
						{$imageError}
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
						style="padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background-color: {$imageFilter === 'all' ? '#3b82f6' : 'white'}; color: {$imageFilter === 'all' ? 'white' : '#374151'}; cursor: pointer; transition: all 0.2s;"
						on:click={() => imageFilter.set('all')}
					>
						All
					</button>
					<button
						type="button"
						style="padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background-color: {$imageFilter === 'tagged' ? '#10b981' : 'white'}; color: {$imageFilter === 'tagged' ? 'white' : '#374151'}; cursor: pointer; transition: all 0.2s;"
						on:click={() => imageFilter.set('tagged')}
					>
						Tagged
					</button>
					<button
						type="button"
						style="padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background-color: {$imageFilter === 'untagged' ? '#6b7280' : 'white'}; color: {$imageFilter === 'untagged' ? 'white' : '#374151'}; cursor: pointer; transition: all 0.2s;"
						on:click={() => imageFilter.set('untagged')}
					>
						Untagged
					</button>
				</div>

				<!-- Search -->
				<div style="flex: 1; max-width: 24rem;">
					<input
						type="text"
						placeholder="Search images..."
						bind:value={$imageSearchTerm}
						style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; outline: none; transition: border-color 0.2s;"
					>
				</div>

				<!-- Refresh Button -->
				<button
					type="button"
					style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background-color: white; color: #374151; cursor: pointer; transition: all 0.2s;"
					on:click={() => loadImages()}
					disabled={$isLoadingImages}
				>
					<svg style="width: 1.25rem; height: 1.25rem; {$isLoadingImages ? 'animation: spin 1s linear infinite;' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Images List -->
		<div style="background-color: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
			{#if $isLoadingImages}
				<div style="padding: 3rem; text-align: center; color: #6b7280;">
					<svg style="width: 2rem; height: 2rem; margin: 0 auto 1rem; animation: spin 1s linear infinite;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					<p>Loading images...</p>
				</div>
			{:else if $sortedImages.length === 0}
				<div style="padding: 3rem; text-align: center; color: #6b7280;">
					<svg style="width: 3rem; height: 3rem; margin: 0 auto 1rem; color: #d1d5db;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<p style="font-size: 1.125rem; font-weight: 500; margin-bottom: 0.5rem;">No images found</p>
					<p style="font-size: 0.875rem;">
						{$imageFilter === 'all' ? 'No images exist yet.' : `No ${$imageFilter} images found.`}
					</p>
				</div>
			{:else}
				<div style="overflow-x: auto;">
					<table style="width: 100%; border-collapse: collapse;">
						<thead style="background-color: #f9fafb;">
							<tr>
								<th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Repository</th>
								<th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Tag</th>
								<th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Image ID</th>
								<th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Created</th>
								<th style="padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Size</th>
								<th style="padding: 0.75rem 1rem; text-align: right; font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">Actions</th>
							</tr>
						</thead>
						<tbody style="background-color: white; divide-y: 1px solid #e5e7eb;">
							{#each $sortedImages as image}
								{@const tags = getImageTags(image)}
								{#each tags as tag, index}
									<tr style="border-bottom: 1px solid #e5e7eb;">
										<td style="padding: 1rem; white-space: nowrap;">
											{#if index === 0}
												<div style="font-size: 0.875rem; font-weight: 500; color: #111827;">
													{tag === '<none>' ? '<none>' : parseImageTag(tag).name}
												</div>
											{/if}
										</td>
										<td style="padding: 1rem;">
											<div style="font-size: 0.875rem; color: #111827;">
												{tag === '<none>' ? '<none>' : parseImageTag(tag).tag}
											</div>
										</td>
										<td style="padding: 1rem;">
											{#if index === 0}
												<div style="font-size: 0.875rem; color: #6b7280; font-family: monospace;">
													{image.id.replace('sha256:', '').slice(0, 12)}
												</div>
											{/if}
										</td>
										<td style="padding: 1rem;">
											{#if index === 0}
												<div style="font-size: 0.875rem; color: #6b7280;">
													{formatRelativeTime(image.created)}
												</div>
											{/if}
										</td>
										<td style="padding: 1rem;">
											{#if index === 0}
												<div style="font-size: 0.875rem; color: #6b7280;">
													{formatBytes(image.size)}
												</div>
											{/if}
										</td>
										<td style="padding: 1rem; text-align: right;">
											{#if index === 0}
												<div style="display: flex; gap: 0.25rem; justify-content: flex-end;">
													<button
														type="button"
														style="padding: 0.25rem 0.5rem; border: 1px solid #ef4444; border-radius: 0.25rem; background-color: white; color: #ef4444; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s; disabled:opacity-50;"
														on:click={() => handleImageAction('remove', image.id)}
														disabled={isActionInProgress('remove', image.id)}
													>
														{isActionInProgress('remove', image.id) ? '...' : 'Remove'}
													</button>
												</div>
											{/if}
										</td>
									</tr>
								{/each}
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
