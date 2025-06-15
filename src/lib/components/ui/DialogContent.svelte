<!-- src/lib/components/ui/DialogContent.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    children?: any;
    [key: string]: any;
  }

  let {
    class: className,
    children,
    ...restProps
  }: Props = $props();

  const contentClass = $derived(cn(
    'relative w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg',
    'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2',
    className
  ));
</script>

<div 
  class={contentClass}
  role="dialog"
  aria-modal="true"
  onclick={(e) => e.stopPropagation()}
  {...restProps}
>
  {@render children?.()}
</div>
