<script lang="ts">
	// Simplified layout without advanced TailwindCSS classes
	let isConnected = false;
</script>

<svelte:head>
	<title>DocSee - Docker Management</title>
	<meta name="description" content="Modern Docker management application built with Tauri and Svelte" />
</svelte:head>

<div style="min-height: 100vh; background-color: #f9fafb;">
	<!-- Header -->
	<header style="background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-bottom: 1px solid #e5e7eb;">
		<div style="max-width: 1280px; margin: 0 auto; padding: 0 1rem;">
			<div style="display: flex; justify-content: space-between; align-items: center; height: 4rem;">
				<div style="display: flex; align-items: center;">
					<div style="flex-shrink: 0;">
						<h1 style="font-size: 1.5rem; font-weight: bold; color: #111827;">DocSee</h1>
					</div>
					<nav style="display: none; margin-left: 2rem; gap: 2rem;" class="nav-links">
						<a 
							href="/" 
							style="color: #111827; padding: 0.5rem 0.75rem; font-size: 0.875rem; font-weight: 500; text-decoration: none;"
						>
							Dashboard
						</a>
						<a 
							href="/containers" 
							style="color: #6b7280; padding: 0.5rem 0.75rem; font-size: 0.875rem; font-weight: 500; text-decoration: none;"
						>
							Containers
						</a>
						<a 
							href="/images" 
							style="color: #6b7280; padding: 0.5rem 0.75rem; font-size: 0.875rem; font-weight: 500; text-decoration: none;"
						>
							Images
						</a>
						<a 
							href="/networks" 
							style="color: #6b7280; padding: 0.5rem 0.75rem; font-size: 0.875rem; font-weight: 500; text-decoration: none;"
						>
							Networks
						</a>
						<a 
							href="/volumes" 
							style="color: #6b7280; padding: 0.5rem 0.75rem; font-size: 0.875rem; font-weight: 500; text-decoration: none;"
						>
							Volumes
						</a>
					</nav>
				</div>
				
				<div style="display: flex; align-items: center; gap: 1rem;">
					<!-- Docker Connection Status -->
					<div style="display: flex; align-items: center; gap: 0.5rem;">
						{#if isConnected}
							<div style="width: 8px; height: 8px; background-color: #10b981; border-radius: 50%;"></div>
							<span style="font-size: 0.875rem; color: #6b7280;">Connected</span>
						{:else}
							<div style="width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%;"></div>
							<span style="font-size: 0.875rem; color: #6b7280;">Disconnected</span>
						{/if}
					</div>
					
					<button
						type="button"
						style="color: #6b7280; padding: 0.25rem; border-radius: 0.375rem; border: none; background: none; cursor: pointer;"
						on:click={() => isConnected = !isConnected}
						aria-label="Toggle connection status"
					>
						<svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	</header>
	
	<!-- Main Content -->
	<main style="max-width: 1280px; margin: 0 auto; padding: 1.5rem;">
		<slot />
	</main>
</div>

<style>
	:global(html) {
		height: 100%;
	}
	
	:global(body) {
		height: 100%;
		margin: 0;
		font-family: system-ui, -apple-system, sans-serif;
		background-color: #f9fafb;
	}

	@media (min-width: 768px) {
		.nav-links {
			display: flex !important;
		}
	}

	a:hover {
		color: #2563eb !important;
	}

	button:hover {
		color: #374151 !important;
	}
</style>
