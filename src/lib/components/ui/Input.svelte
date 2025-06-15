<!-- src/lib/components/ui/Input.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'url' | 'tel';
    value?: string | number;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    class?: string;
    id?: string;
    name?: string;
    required?: boolean;
    autocomplete?: string;
    min?: number;
    max?: number;
    step?: number;
    pattern?: string;
    [key: string]: any;
  }

  let {
    type = 'text',
    value = $bindable(''),
    placeholder,
    disabled = false,
    readonly = false,
    size = 'md',
    class: className,
    id,
    name,
    required = false,
    autocomplete,
    min,
    max,
    step,
    pattern,
    ...restProps
  }: Props = $props();

  const sizeClasses = {
    sm: 'input-sm',
    md: '',
    lg: 'input-lg'
  };

  const inputClass = $derived(cn(
    'input',
    sizeClasses[size],
    className
  ));
</script>

<input
  {type}
  {id}
  {name}
  {placeholder}
  {disabled}
  {readonly}
  {required}
  {autocomplete}
  {min}
  {max}
  {step}
  {pattern}
  bind:value
  class={inputClass}
  {...restProps}
/>
