<!-- src/lib/components/ui/DropdownMenu.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    open?: boolean;
    class?: string;
    children?: any;
    [key: string]: any;
  }

  let {
    open = $bindable(false),
    class: className,
    children,
    ...restProps
  }: Props = $props();

  let dropdownRef: HTMLDivElement;

  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      open = false;
    }
  }

  $effect(() => {
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  });

  function toggle() {
    open = !open;
  }
</script>

<div 
  bind:this={dropdownRef}
  class={cn('relative inline-block', className)} 
  {...restProps}
>
  {@render children?.({ toggle, open })}
</div>
