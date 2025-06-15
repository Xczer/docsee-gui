<!-- src/lib/components/ui/DropdownMenuItem.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    onclick?: (event: MouseEvent) => void;
    disabled?: boolean;
    children?: any;
    [key: string]: any;
  }

  let {
    class: className,
    onclick,
    disabled = false,
    children,
    ...restProps
  }: Props = $props();

  function handleClick(event: MouseEvent) {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onclick?.(event);
  }

  const itemClass = $derived(cn(
    'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
    'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
    disabled && 'pointer-events-none opacity-50',
    className
  ));
</script>

<div
  class={itemClass}
  onclick={handleClick}
  role="menuitem"
  tabindex={disabled ? -1 : 0}
  {...restProps}
>
  {@render children?.()}
</div>
