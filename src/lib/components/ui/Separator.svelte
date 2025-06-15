<!-- src/lib/components/ui/Separator.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    orientation?: 'horizontal' | 'vertical';
    class?: string;
    [key: string]: any;
  }

  let {
    orientation = 'horizontal',
    class: className,
    ...restProps
  }: Props = $props();

  const orientationClass = orientation === 'horizontal' 
    ? 'separator-horizontal' 
    : 'separator-vertical';

  const separatorClass = $derived(cn(
    'separator',
    orientationClass,
    className
  ));
</script>

<div
  class={separatorClass}
  role="separator"
  aria-orientation={orientation}
  {...restProps}
></div>
