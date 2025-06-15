<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui';
  import { BarChart3 } from 'lucide-svelte';
</script>

<svelte:head>
  <title>System - DocSee</title>
</svelte:head>

<div class="space-y-8">
  <!-- Page Header -->
  <div class="space-y-2">
    <h1 class="text-3xl font-bold tracking-tight text-foreground">
      System
    </h1>
    <p class="text-muted-foreground">
      View Docker system information
    </p>
  </div>

  <Card>
    <CardContent class="p-12 text-center">
      <BarChart3 class="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 class="font-medium text-foreground mb-2">System page</h3>
      <p class="text-sm text-muted-foreground">
        System information will be displayed here.
      </p>
    </CardContent>
  </Card>
</div>
