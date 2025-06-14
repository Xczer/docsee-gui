<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		connectionStatus, 
		systemInfo, 
		loadSystemInfo, 
		isLoadingSystemInfo,
		dockerError 
	} from '$lib/stores/docker.js';
	import { formatBytes } from '$lib/utils/formatters.js';

	let mounted = false;

	onMount(async () => {
		mounted = true;
		
		if ($connectionStatus.connected) {
			await loadSystemInfo();
		}
	});

	// Reactive statement to load system info when connection changes
	$: if (mounted && $connectionStatus.connected) {
		loadSystemInfo();
	}
</script>

<div style="padding: 1rem;">
	<!-- Page Header -->
	<div style="margin-bottom: 2rem;">
		<h1 style="font-size: 2rem; font-weight: bold; color: #111827; margin-bottom: 0.25rem;">
			System Information
		</h1>
		<p style="color: #6b7280;">Docker daemon and system details</p>
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
						Connect to Docker to view system information.
					</p>
				</div>
			</div>
		</div>
	{:else if $isLoadingSystemInfo}
		<!-- Loading State -->
		<div style="padding: 3rem; text-align: center; color: #6b7280;">
			<svg style="width: 2rem; height: 2rem; margin: 0 auto 1rem; animation: spin 1s linear infinite;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
			<p>Loading system information...</p>
		</div>
	{:else if $systemInfo}
		<!-- System Information -->
		<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
			<!-- Docker Version Info -->
			<div style="background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
				<h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">
					Docker Version
				</h3>
				<div style="space-y: 0.75rem;">
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Version:</span>
						<span style="font-size: 0.875rem; color: #111827; font-family: monospace;">{$systemInfo.version.version}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">API Version:</span>
						<span style="font-size: 0.875rem; color: #111827; font-family: monospace;">{$systemInfo.version.api_version}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Git Commit:</span>
						<span style="font-size: 0.875rem; color: #111827; font-family: monospace;">{$systemInfo.version.git_commit}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Go Version:</span>
						<span style="font-size: 0.875rem; color: #111827; font-family: monospace;">{$systemInfo.version.go_version}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Build Time:</span>
						<span style="font-size: 0.875rem; color: #111827; font-family: monospace;">{$systemInfo.version.build_time}</span>
					</div>
				</div>
			</div>

			<!-- System Info -->
			<div style="background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
				<h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">
					System Details
				</h3>
				<div style="space-y: 0.75rem;">
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Operating System:</span>
						<span style="font-size: 0.875rem; color: #111827;">{$systemInfo.info.operating_system}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Architecture:</span>
						<span style="font-size: 0.875rem; color: #111827;">{$systemInfo.info.architecture}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">CPUs:</span>
						<span style="font-size: 0.875rem; color: #111827;">{$systemInfo.info.ncpu}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Total Memory:</span>
						<span style="font-size: 0.875rem; color: #111827;">{formatBytes($systemInfo.info.mem_total)}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Kernel Version:</span>
						<span style="font-size: 0.875rem; color: #111827;">{$systemInfo.info.kernel_version}</span>
					</div>
				</div>
			</div>

			<!-- Container Stats -->
			<div style="background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
				<h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">
					Container Statistics
				</h3>
				<div style="space-y: 0.75rem;">
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Total Containers:</span>
						<span style="font-size: 0.875rem; color: #111827;">{$systemInfo.info.containers}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Running:</span>
						<span style="font-size: 0.875rem; color: #10b981;">{$systemInfo.info.containers_running}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Paused:</span>
						<span style="font-size: 0.875rem; color: #f59e0b;">{$systemInfo.info.containers_paused}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Stopped:</span>
						<span style="font-size: 0.875rem; color: #6b7280;">{$systemInfo.info.containers_stopped}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Images:</span>
						<span style="font-size: 0.875rem; color: #111827;">{$systemInfo.info.images}</span>
					</div>
				</div>
			</div>

			<!-- Docker Configuration -->
			<div style="background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
				<h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">
					Docker Configuration
				</h3>
				<div style="space-y: 0.75rem;">
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Storage Driver:</span>
						<span style="font-size: 0.875rem; color: #111827;">{$systemInfo.info.driver}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Logging Driver:</span>
						<span style="font-size: 0.875rem; color: #111827;">{$systemInfo.info.logging_driver}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Cgroup Driver:</span>
						<span style="font-size: 0.875rem; color: #111827;">{$systemInfo.info.cgroup_driver}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Docker Root Dir:</span>
						<span style="font-size: 0.875rem; color: #111827; font-family: monospace; word-break: break-all;">{$systemInfo.info.docker_root_dir}</span>
					</div>
					<div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
						<span style="font-size: 0.875rem; font-weight: 500; color: #6b7280;">Default Runtime:</span>
						<span style="font-size: 0.875rem; color: #111827;">{$systemInfo.info.default_runtime}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Security and Features -->
		<div style="background-color: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-top: 1.5rem;">
			<h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">
				Features & Security
			</h3>
			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
				<div>
					<h4 style="font-size: 1rem; font-weight: 500; color: #374151; margin-bottom: 0.75rem;">Feature Support</h4>
					<div style="space-y: 0.5rem;">
						<div style="display: flex; justify-content: space-between; align-items: center;">
							<span style="font-size: 0.875rem; color: #6b7280;">Memory Limit:</span>
							<span style="padding: 0.125rem 0.375rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; {$systemInfo.info.memory_limit ? 'background-color: #dcfce7; color: #16a34a;' : 'background-color: #fee2e2; color: #dc2626;'}">
								{$systemInfo.info.memory_limit ? 'Enabled' : 'Disabled'}
							</span>
						</div>
						<div style="display: flex; justify-content: space-between; align-items: center;">
							<span style="font-size: 0.875rem; color: #6b7280;">Swap Limit:</span>
							<span style="padding: 0.125rem 0.375rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; {$systemInfo.info.swap_limit ? 'background-color: #dcfce7; color: #16a34a;' : 'background-color: #fee2e2; color: #dc2626;'}">
								{$systemInfo.info.swap_limit ? 'Enabled' : 'Disabled'}
							</span>
						</div>
						<div style="display: flex; justify-content: space-between; align-items: center;">
							<span style="font-size: 0.875rem; color: #6b7280;">CPU Shares:</span>
							<span style="padding: 0.125rem 0.375rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; {$systemInfo.info.cpu_shares ? 'background-color: #dcfce7; color: #16a34a;' : 'background-color: #fee2e2; color: #dc2626;'}">
								{$systemInfo.info.cpu_shares ? 'Enabled' : 'Disabled'}
							</span>
						</div>
						<div style="display: flex; justify-content: space-between; align-items: center;">
							<span style="font-size: 0.875rem; color: #6b7280;">IPv4 Forwarding:</span>
							<span style="padding: 0.125rem 0.375rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; {$systemInfo.info.ipv4_forwarding ? 'background-color: #dcfce7; color: #16a34a;' : 'background-color: #fee2e2; color: #dc2626;'}">
								{$systemInfo.info.ipv4_forwarding ? 'Enabled' : 'Disabled'}
							</span>
						</div>
					</div>
				</div>
				<div>
					<h4 style="font-size: 1rem; font-weight: 500; color: #374151; margin-bottom: 0.75rem;">Security Options</h4>
					{#if $systemInfo.info.security_options && $systemInfo.info.security_options.length > 0}
						<div style="space-y: 0.25rem;">
							{#each $systemInfo.info.security_options as option}
								<div style="font-size: 0.875rem; color: #6b7280; font-family: monospace; padding: 0.25rem 0.5rem; background-color: #f3f4f6; border-radius: 0.25rem;">
									{option}
								</div>
							{/each}
						</div>
					{:else}
						<div style="font-size: 0.875rem; color: #9ca3af; font-style: italic;">
							No security options configured
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<!-- Error State -->
		<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 0.5rem; padding: 1rem;">
			<div style="display: flex; align-items: center;">
				<svg style="width: 1.25rem; height: 1.25rem; color: #ef4444; margin-right: 0.75rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
				<div>
					<h3 style="font-size: 0.875rem; font-weight: 600; color: #dc2626; margin-bottom: 0.25rem;">
						Error Loading System Information
					</h3>
					<p style="font-size: 0.875rem; color: #b91c1c; margin: 0;">
						{$dockerError || 'Failed to load system information'}
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		div[style*="grid-template-columns: 1fr 1fr"] {
			grid-template-columns: 1fr !important;
		}
	}
</style>
