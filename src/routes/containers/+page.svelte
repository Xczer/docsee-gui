<!-- src/routes/containers/+page.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui';
  import { goto } from '$app/navigation';
  import { ArrowLeft } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Containers - DocSee</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <Button variant="ghost" size="icon" onclick={() => goto('/')}>
      <ArrowLeft class="h-4 w-4" />
    </Button>
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Containers</h1>
      <p class="text-muted-foreground">Manage your Docker containers</p>
    </div>
  </div>
  
  <div class="rounded-lg border border-border bg-card p-8">
    <div class="text-center">
      <h2 class="text-xl font-semibold mb-2">Containers Page</h2>
      <p class="text-muted-foreground mb-4">This is a placeholder containers page to test navigation.</p>
      <Button onclick={() => goto('/')}>
        Back to Dashboard
      </Button>
    </div>
  </div>
</div>