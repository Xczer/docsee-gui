<!-- src/lib/components/ui/DropdownMenuTrigger.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    onclick?: (event: MouseEvent) => void;
    children?: any;
    [key: string]: any;
  }

  let {
    class: className,
    onclick,
    children,
    ...restProps
  }: Props = $props();

  function handleClick(event: MouseEvent) {
    onclick?.(event);
  }
</script>

<button
  type="button"
  class={cn('', className)}
  onclick={handleClick}
  {...restProps}
>
  {@render children?.()}
</button>
