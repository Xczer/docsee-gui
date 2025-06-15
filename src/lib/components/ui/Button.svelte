<!-- src/lib/components/ui/Button.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';
  
  interface Props {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'icon-sm' | 'icon-lg';
    class?: string;
    disabled?: boolean;
    children?: any;
    onclick?: (event: MouseEvent) => void;
    type?: 'button' | 'submit' | 'reset';
    [key: string]: any;
  }
  
  let {
    variant = 'default',
    size = 'md',
    class: className,
    disabled = false,
    children,
    onclick,
    type = 'button',
    ...restProps
  }: Props = $props();
  
  const variants = {
    default: 'btn btn-default',
    destructive: 'btn btn-destructive',
    outline: 'btn btn-outline',
    secondary: 'btn btn-secondary',
    ghost: 'btn btn-ghost',
    link: 'btn btn-link'
  };
  
  const sizes = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    xl: 'btn-xl',
    icon: 'btn-icon',
    'icon-sm': 'btn-icon-sm',
    'icon-lg': 'btn-icon-lg'
  };
</script>

<button
  class={cn(variants[variant], sizes[size], className)}
  {disabled}
  {onclick}
  {type}
  {...restProps}
>
  {@render children?.()}
</button>