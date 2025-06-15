<!-- src/lib/components/ui/Dialog.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    class?: string;
    children?: any;
    [key: string]: any;
  }

  let {
    open = $bindable(false),
    onOpenChange,
    class: className,
    children,
    ...restProps
  }: Props = $props();

  function handleOpenChange(newOpen: boolean) {
    open = newOpen;
    onOpenChange?.(newOpen);
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleOpenChange(false);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleOpenChange(false);
    }
  }

  $effect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeydown);
      
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeydown);
      };
    }
  });
</script>

{#if open}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    onclick={handleBackdropClick}
    onkeydown={(e) => e.key === 'Escape' && handleOpenChange(false)}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- Dialog content container -->
    <div class={cn('flex min-h-full items-center justify-center p-4', className)} {...restProps}>
      {@render children?.({ open, onOpenChange: handleOpenChange })}
    </div>
  </div>
{/if}
