<!-- src/lib/components/ui/Textarea.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    rows?: number;
    cols?: number;
    class?: string;
    id?: string;
    name?: string;
    required?: boolean;
    maxlength?: number;
    minlength?: number;
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
    [key: string]: any;
  }

  let {
    value = $bindable(''),
    placeholder,
    disabled = false,
    readonly = false,
    rows = 3,
    cols,
    class: className,
    id,
    name,
    required = false,
    maxlength,
    minlength,
    resize = 'vertical',
    ...restProps
  }: Props = $props();

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  };

  const textareaClass = $derived(cn(
    'textarea',
    resizeClasses[resize],
    className
  ));
</script>

<textarea
  {id}
  {name}
  {placeholder}
  {disabled}
  {readonly}
  {required}
  {rows}
  {cols}
  {maxlength}
  {minlength}
  bind:value
  class={textareaClass}
  {...restProps}
></textarea>
