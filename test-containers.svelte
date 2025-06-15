<!-- Test file - copy this content to src/routes/containers/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';

  let mounted = $state(false);
  let testData = $state(['Container 1', 'Container 2', 'Container 3']);

  $effect(() => {
    if (!mounted) {
      mounted = true;
      console.log('Basic containers page mounted');
    }
  });

  function goBack() {
    goto('/');
  }
</script>

<svelte:head>
  <title>Containers - DocSee</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <button 
      class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
      onclick={goBack}
    >
      ← Back to Dashboard
    </button>
    <div>
      <h1 class="text-3xl font-bold">Containers (Basic Test)</h1>
      <p class="text-gray-600">Testing navigation and basic functionality</p>
    </div>
  </div>

  <!-- Debug Info -->
  <div class="bg-gray-100 p-4 rounded">
    <h3 class="font-semibold mb-2">Debug Info:</h3>
    <ul class="text-sm space-y-1">
      <li>Mounted: {mounted}</li>
      <li>Test Data Count: {testData.length}</li>
      <li>Current Time: {new Date().toLocaleTimeString()}</li>
    </ul>
  </div>

  <!-- Test Content -->
  <div class="bg-white border rounded-lg p-6">
    <h2 class="text-xl font-semibold mb-4">Test Containers</h2>
    
    <div class="space-y-3">
      {#each testData as item, index}
        <div class="border rounded p-3 flex justify-between items-center">
          <div>
            <h3 class="font-medium">{item}</h3>
            <p class="text-sm text-gray-600">Test container #{index + 1}</p>
          </div>
          <div class="flex gap-2">
            <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              Running
            </span>
            <button class="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
              Details
            </button>
          </div>
        </div>
      {/each}
    </div>

    <div class="mt-6 text-center">
      <p class="text-gray-600 mb-4">
        This is a basic test page to verify navigation is working properly.
      </p>
      <button 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onclick={goBack}
      >
        Back to Dashboard
      </button>
    </div>
  </div>
</div>
