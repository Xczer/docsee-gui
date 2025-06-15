<!-- src/lib/components/ui/Badge.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  export type BadgeVariant =
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'info'
    | 'running'
    | 'stopped'
    | 'error'
    | 'paused';

  interface Props {
    variant?: BadgeVariant;
    size?: 'sm' | 'md' | 'lg';
    class?: string;
    children?: any;
    [key: string]: any;
  }

  let {
    variant = 'default',
    size = 'md',
    class: className,
    children,
    ...restProps
  }: Props = $props();

  const variants = {
    default: 'badge badge-default',
    secondary: 'badge badge-secondary',
    destructive: 'badge badge-destructive',
    outline: 'badge badge-outline',
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    info: 'badge badge-info',
    running: 'badge badge-running',
    stopped: 'badge badge-stopped',
    error: 'badge badge-error',
    paused: 'badge badge-paused'
  };

  const sizes = {
    sm: 'badge-sm',
    md: '',
    lg: 'badge-lg'
  };
</script>

<span class={cn(variants[variant], sizes[size], className)} {...restProps}>
  {@render children?.()}
</span>
