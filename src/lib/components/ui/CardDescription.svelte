<!-- src/lib/components/ui/CardDescription.svelte -->
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

<p class={cn('card-description', className)} {...restProps}>
  {@render children?.()}
</p>