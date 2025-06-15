<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui';
  import { Image } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Images - DocSee</title>
</svelte:head>

<div class="space-y-8">
  <!-- Page Header -->
  <div class="space-y-2">
    <h1 class="text-3xl font-bold tracking-tight text-foreground">
      Images
    </h1>
    <p class="text-muted-foreground">
      Manage your Docker images
    </p>
  </div>

  <Card>
    <CardContent class="p-12 text-center">
      <Image class="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 class="font-medium text-foreground mb-2">Images page</h3>
      <p class="text-sm text-muted-foreground">
        Images management will be implemented here.
      </p>
    </CardContent>
  </Card>
</div>
