<!-- src/lib/components/ui/CardHeader.svelte -->
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
</script>

<div class={cn('card-header', className)} {...restProps}>
  {@render children?.()}
</div>