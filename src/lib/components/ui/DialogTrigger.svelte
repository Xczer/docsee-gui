<!-- src/lib/components/ui/DialogTrigger.svelte -->
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
</script>

<button
  type="button"
  class={cn('', className)}
  onclick={onclick}
  {...restProps}
>
  {@render children?.()}
</button>
