<!-- src/lib/components/ui/Card.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';
  
  interface Props {
    class?: string;
    interactive?: boolean;
    hover?: boolean;
    children?: any;
    [key: string]: any;
  }
  
  let {
    class: className,
    interactive = false,
    hover = false,
    children,
    ...restProps
  }: Props = $props();
  
  const baseClasses = 'card';
  const conditionalClasses = cn(
    interactive && 'card-interactive',
    hover && 'card-hover'
  );
</script>

<div 
  class={cn(baseClasses, conditionalClasses, className)} 
  {...restProps}
>
  {@render children?.()}
</div>