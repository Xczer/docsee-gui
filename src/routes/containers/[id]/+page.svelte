<script lang="ts">
	// Minimal container details page
</script>

<svelte:head>
	<title>Container Details - DocSee</title>
</svelte:head>

<div class="p-6">
	<h1 class="text-2xl font-bold mb-4">Container Details</h1>
	<p>Container ID: {$page.params.id}</p>
	<a href="/containers" class="text-blue-600 hover:underline">← Back to Containers</a>
</div>

<script>
	import { page } from '$app/stores';
</script>