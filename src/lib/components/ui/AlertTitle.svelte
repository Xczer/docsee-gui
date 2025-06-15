<!-- src/lib/components/ui/AlertTitle.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    children?: any;
    [key: string]: any;
  }

  let { class: className, children, ...restProps }: Props = $props();
</script>

<h5 class={cn('alert-title', className)} {...restProps}>
  {@render children?.()}
</h5>
