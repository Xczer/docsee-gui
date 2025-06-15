<!-- src/lib/components/ui/ToastContainer.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';
  import Toast, { type ToastType } from './Toast.svelte';

  export type ToastPosition = 
    | 'top-left' 
    | 'top-center' 
    | 'top-right' 
    | 'bottom-left' 
    | 'bottom-center' 
    | 'bottom-right';

  interface ToastMessage {
    id: string;
    type: ToastType;
    title?: string;
    description?: string;
    duration?: number;
    closable?: boolean;
  }

  interface Props {
    position?: ToastPosition;
    maxToasts?: number;
    class?: string;
    [key: string]: any;
  }

  let {
    position = 'top-right',
    maxToasts = 5,
    class: className,
    ...restProps
  }: Props = $props();

  let toasts = $state<ToastMessage[]>([]);

  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-center': 'top-0 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-center': 'bottom-0 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-0 right-0'
  };

  const containerClass = $derived(cn(
    'fixed z-50 flex max-h-screen w-full flex-col-reverse space-y-4 space-y-reverse p-4 sm:flex-col sm:space-y-4 sm:space-y-reverse',
    positionClasses[position],
    className
  ));

  export function addToast(toast: Omit<ToastMessage, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    toasts = [newToast, ...toasts].slice(0, maxToasts);
  }

  function removeToast(id: string) {
    toasts = toasts.filter(toast => toast.id !== id);
  }
</script>

<div class={containerClass} {...restProps}>
  {#each toasts as toast (toast.id)}
    <Toast
      type={toast.type}
      title={toast.title}
      description={toast.description}
      duration={toast.duration}
      closable={toast.closable}
      onClose={() => removeToast(toast.id)}
    />
  {/each}
</div>
