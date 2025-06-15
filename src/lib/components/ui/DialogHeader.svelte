<!-- src/lib/components/ui/DialogHeader.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    children?: any;
    [key: string]: any;
  }

  let { class: className, children, ...restProps }: Props = $props();
</script>

<div class={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...restProps}>
  {@render children?.()}
</div>
