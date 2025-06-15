<!-- src/lib/components/ui/DialogDescription.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    children?: any;
    [key: string]: any;
  }

  let { class: className, children, ...restProps }: Props = $props();
</script>

<p class={cn('text-sm text-muted-foreground', className)} {...restProps}>
  {@render children?.()}
</p>
