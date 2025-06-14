<script lang="ts">
	import { 
		connectionStatus, 
		connectToDocker, 
		disconnectFromDocker, 
		refreshConnectionStatus,
		isConnecting,
		dockerError 
	} from '$lib/stores/docker.js';

	let isRefreshing = false;

	async function handleConnect() {
		await connectToDocker();
	}

	async function handleDisconnect() {
		await disconnectFromDocker();
	}

	async function handleRefresh() {
		isRefreshing = true;
		await refreshConnectionStatus();
		isRefreshing = false;
	}
</script>

<div style="padding: 1rem;">
	<!-- Page Header -->
	<div style="margin-bottom: 2rem;">
		<h1 style="font-size: 2rem; font-weight: bold; color: #111827; margin-bottom: 0.25rem;">
			Settings
		</h1>
		<p style="color: #6b7280;">Manage your Docker connection and application preferences</p>
	</div>

	<!-- Docker Connection Settings -->
	<div style="background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
		<h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">
			Docker Connection
		</h3>
		
		<!-- Connection Status -->
		<div style="background-color: #f9fafb; padding: 1rem; border-radius: 0.375rem; margin-bottom: 1rem;">
			<div style="display: flex; align-items: center; justify-content: space-between;">
				<div style="display: flex; align-items: center; gap: 0.75rem;">
					{#if $isConnecting}
						<div style="width: 12px; height: 12px; background-color: #f59e0b; border-radius: 50%; animation: pulse 2s infinite;"></div>
						<span style="font-weight: 500; color: #f59e0b;">Connecting...</span>
					{:else if $connectionStatus.connected}
						<div style="width: 12px; height: 12px; background-color: #10b981; border-radius: 50%;"></div>
						<div>
							<span style="font-weight: 500; color: #10b981;">Connected</span>
							{#if $connectionStatus.version}
								<div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">
									Docker {$connectionStatus.version} (API {$connectionStatus.api_version})
								</div>
							{/if}
						</div>
					{:else}
						<div style="width: 12px; height: 12px; background-color: #ef4444; border-radius: 50%;"></div>
						<div>
							<span style="font-weight: 500; color: #ef4444;">Disconnected</span>
							{#if $connectionStatus.error}
								<div style="font-size: 0.875rem; color: #dc2626; margin-top: 0.25rem;">
									{$connectionStatus.error}
								</div>
							{/if}
						</div>
					{/if}
				</div>
				
				<div style="display: flex; gap: 0.5rem;">
					<button
						type="button"
						style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background-color: white; color: #374151; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; disabled:opacity-50;"
						on:click={handleRefresh}
						disabled={isRefreshing || $isConnecting}
					>
						{isRefreshing ? 'Refreshing...' : 'Refresh'}
					</button>
					
					{#if $connectionStatus.connected}
						<button
							type="button"
							style="padding: 0.5rem 1rem; border: 1px solid #ef4444; border-radius: 0.375rem; background-color: white; color: #ef4444; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; disabled:opacity-50;"
							on:click={handleDisconnect}
							disabled={$isConnecting}
						>
							Disconnect
						</button>
					{:else}
						<button
							type="button"
							style="padding: 0.5rem 1rem; border: 1px solid #10b981; border-radius: 0.375rem; background-color: white; color: #10b981; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; disabled:opacity-50;"
							on:click={handleConnect}
							disabled={$isConnecting}
						>
							{$isConnecting ? 'Connecting...' : 'Connect'}
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Connection Info -->
		<div style="font-size: 0.875rem; color: #6b7280; line-height: 1.5;">
			<p style="margin-bottom: 0.5rem;">
				DocSee automatically attempts to connect to Docker using the following methods:
			</p>
			<ul style="margin-left: 1.5rem; margin-bottom: 1rem;">
				<li>Unix socket (recommended for Linux/macOS): <code style="background-color: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace;">/var/run/docker.sock</code></li>
				<li>Local defaults: <code style="background-color: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace;">localhost</code></li>
				<li>HTTP connection: <code style="background-color: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace;">localhost:2375</code></li>
				<li>Environment variables: <code style="background-color: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace;">DOCKER_HOST</code></li>
			</ul>
			<p>
				Ensure Docker is running and accessible before attempting to connect.
			</p>
		</div>
	</div>

	<!-- Application Info -->
	<div style="background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
		<h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">
			About DocSee
		</h3>
		
		<div style="space-y: 1rem;">
			<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
				<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Version:</span>
				<span style="font-size: 0.875rem; color: #111827;">0.1.0 (Phase 1)</span>
			</div>
			<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
				<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Framework:</span>
				<span style="font-size: 0.875rem; color: #111827;">Tauri + SvelteKit</span>
			</div>
			<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
				<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Docker API:</span>
				<span style="font-size: 0.875rem; color: #111827;">Bollard (Rust)</span>
			</div>
			<div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
				<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Status:</span>
				<span style="font-size: 0.875rem; color: #111827;">Development Build</span>
			</div>
		</div>

		<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
			<h4 style="font-size: 1rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">
				Phase 1 Features
			</h4>
			<ul style="font-size: 0.875rem; color: #6b7280; line-height: 1.5; margin-left: 1.5rem;">
				<li>✅ Docker daemon connection and auto-discovery</li>
				<li>✅ Container listing with real-time status</li>
				<li>✅ Basic container operations (start, stop, restart, remove)</li>
				<li>✅ Image listing and basic management</li>
				<li>✅ System information and statistics</li>
				<li>✅ Real-time dashboard with container overview</li>
				<li>✅ Error handling and connection status monitoring</li>
			</ul>
		</div>

		<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
			<h4 style="font-size: 1rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">
				Coming in Future Phases
			</h4>
			<ul style="font-size: 0.875rem; color: #6b7280; line-height: 1.5; margin-left: 1.5rem;">
				<li>🔄 Advanced container operations (pause, unpause, kill)</li>
				<li>🔄 Container logs and real-time monitoring</li>
				<li>🔄 Container stats and resource usage</li>
				<li>🔄 Image building and registry operations</li>
				<li>🔄 Network and volume management</li>
				<li>🔄 Docker Compose integration</li>
				<li>🔄 Terminal access and file browser</li>
				<li>🔄 Advanced monitoring and analytics</li>
			</ul>
		</div>

		<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; text-align: center;">
			<p style="font-size: 0.875rem; color: #6b7280;">
				Built with ❤️ using Tauri, SvelteKit, and Rust
			</p>
		</div>
	</div>
</div>

<style>
	button:hover:not(:disabled) {
		opacity: 0.8;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	code {
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
	}
</style>
