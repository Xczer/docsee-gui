<!-- src/lib/components/ui/Switch.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    checked?: boolean;
    disabled?: boolean;
    class?: string;
    id?: string;
    name?: string;
    onCheckedChange?: (checked: boolean) => void;
    [key: string]: any;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    class: className,
    id,
    name,
    onCheckedChange,
    ...restProps
  }: Props = $props();

  function handleClick() {
    if (disabled) return;
    checked = !checked;
    onCheckedChange?.(checked);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (disabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleClick();
    }
  }

  const switchClass = $derived(cn(
    'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
    checked 
      ? 'bg-primary' 
      : 'bg-input',
    disabled && 'cursor-not-allowed opacity-50',
    className
  ));

  const thumbClass = $derived(cn(
    'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
    checked ? 'translate-x-5' : 'translate-x-0'
  ));
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  {id}
  {disabled}
  class={switchClass}
  onclick={handleClick}
  onkeydown={handleKeydown}
  {...restProps}
>
  <span class={thumbClass}></span>
</button>

<!-- Hidden input for form submission -->
{#if name}
  <input type="hidden" {name} value={checked} />
{/if}
