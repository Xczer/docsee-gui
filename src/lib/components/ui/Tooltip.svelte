<!-- src/lib/components/ui/Tooltip.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    class?: string;
    children?: any;
    [key: string]: any;
  }

  let {
    content,
    placement = 'top',
    delay = 300,
    class: className,
    children,
    ...restProps
  }: Props = $props();

  let visible = $state(false);
  let timeoutId: number;
  let tooltipRef = $state<HTMLDivElement>();

  const placementClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900'
  };

  function showTooltip() {
    timeoutId = setTimeout(() => {
      visible = true;
    }, delay);
  }

  function hideTooltip() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    visible = false;
  }

  const tooltipClass = $derived(cn(
    'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-sm whitespace-nowrap',
    'animate-in fade-in-0 zoom-in-95',
    placementClasses[placement],
    className
  ));
</script>

<div 
  class="relative inline-block"
  onmouseenter={showTooltip}
  onmouseleave={hideTooltip}
  onfocus={showTooltip}
  onblur={hideTooltip}
  {...restProps}
>
  {@render children?.()}
  
  {#if visible && content}
    <div 
      bind:this={tooltipRef}
      class={tooltipClass}
      role="tooltip"
    >
      {content}
      <!-- Tooltip arrow -->
      <div class={cn('absolute w-0 h-0 border-4', arrowClasses[placement])}></div>
    </div>
  {/if}
</div>
