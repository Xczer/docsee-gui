<!-- src/lib/components/ui/Toast.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';
  import { X } from 'lucide-svelte';

  export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

  interface Props {
    type?: ToastType;
    title?: string;
    description?: string;
    duration?: number;
    closable?: boolean;
    class?: string;
    onClose?: () => void;
    children?: any;
    [key: string]: any;
  }

  let {
    type = 'default',
    title,
    description,
    duration = 5000,
    closable = true,
    class: className,
    onClose,
    children,
    ...restProps
  }: Props = $props();

  let visible = $state(true);
  let timeoutId: number;

  const typeClasses = {
    default: 'bg-background border-border text-foreground',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
  };

  const toastClass = $derived(cn(
    'relative flex w-full items-center space-x-4 overflow-hidden rounded-md border p-4 shadow-lg transition-all',
    'animate-in fade-in-0 slide-in-from-top-2',
    typeClasses[type],
    !visible && 'animate-out fade-out-0 slide-out-to-top-2',
    className
  ));

  function handleClose() {
    visible = false;
    setTimeout(() => {
      onClose?.();
    }, 150); // Wait for animation to complete
  }

  $effect(() => {
    if (duration > 0) {
      timeoutId = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  });
</script>

{#if visible}
  <div class={toastClass} {...restProps}>
    <div class="flex-1">
      {#if title}
        <div class="font-semibold">{title}</div>
      {/if}
      {#if description}
        <div class="text-sm opacity-90">{description}</div>
      {/if}
      {#if children}
        {@render children()}
      {/if}
    </div>
    
    {#if closable}
      <button
        type="button"
        class="absolute right-2 top-2 rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10"
        onclick={handleClose}
      >
        <X class="h-4 w-4" />
        <span class="sr-only">Close</span>
      </button>
    {/if}
  </div>
{/if}
