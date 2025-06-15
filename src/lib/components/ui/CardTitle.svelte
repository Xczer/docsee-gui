<!-- src/lib/components/ui/CardTitle.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';
  
  interface Props {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    class?: string;
    children?: any;
    [key: string]: any;
  }
  
  let {
    size = 'md',
    class: className,
    children,
    ...restProps
  }: Props = $props();
  
  const sizes = {
    sm: 'card-title card-title-sm',
    md: 'card-title card-title-md',
    lg: 'card-title card-title-lg',
    xl: 'card-title card-title-xl'
  };
</script>

<h3 class={cn(sizes[size], className)} {...restProps}>
  {@render children?.()}
</h3>