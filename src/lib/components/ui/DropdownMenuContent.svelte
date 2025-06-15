<!-- src/lib/components/ui/DropdownMenuContent.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
    class?: string;
    children?: any;
    [key: string]: any;
  }

  let {
    placement = 'bottom-start',
    class: className,
    children,
    ...restProps
  }: Props = $props();

  const placementClasses = {
    'bottom-start': 'top-full left-0 mt-1',
    'bottom-end': 'top-full right-0 mt-1',
    'top-start': 'bottom-full left-0 mb-1',
    'top-end': 'bottom-full right-0 mb-1'
  };

  const contentClass = $derived(cn(
    'absolute z-50 min-w-32 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md',
    'animate-in fade-in-0 zoom-in-95',
    placementClasses[placement],
    className
  ));
</script>

<div class={contentClass} {...restProps}>
  {@render children?.()}
</div>
