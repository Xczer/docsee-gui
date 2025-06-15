<!-- src/lib/components/ui/Alert.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  type AlertVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

  interface Props {
    variant?: AlertVariant;
    class?: string;
    children?: any;
    [key: string]: any;
  }

  let {
    variant = 'default',
    class: className,
    children,
    ...restProps
  }: Props = $props();

  const variantClasses = {
    default: 'alert',
    destructive: 'alert alert-destructive',
    success: 'alert alert-success',
    warning: 'alert alert-warning',
    info: 'alert alert-info'
  };

  const alertClass = $derived(cn(variantClasses[variant], className));
</script>

<div class={alertClass} {...restProps}>
  {@render children?.()}
</div>
