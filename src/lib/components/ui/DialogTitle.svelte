<!-- src/lib/components/ui/DialogTitle.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    children?: any;
    [key: string]: any;
  }

  let { class: className, children, ...restProps }: Props = $props();
</script>

<h2 class={cn('text-lg font-semibold leading-none tracking-tight', className)} {...restProps}>
  {@render children?.()}
</h2>
