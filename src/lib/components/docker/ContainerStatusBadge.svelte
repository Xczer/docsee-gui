<!-- src/lib/components/docker/ContainerStatusBadge.svelte -->
<script lang="ts">
  import { Badge } from '$lib/components/ui';
  import { formatContainerStatus } from '$lib/utils';
  
  interface Props {
    status: string;
    class?: string;
  }
  
  let { status, class: className } = $props();
  
  let formattedStatus = $derived(formatContainerStatus(status));
</script>

<Badge variant={formattedStatus.variant} class={className}>
  {formattedStatus.label}
</Badge>