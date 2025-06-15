<!-- src/lib/components/ui/Checkbox.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';
  import { Check } from 'lucide-svelte';

  interface Props {
    checked?: boolean;
    disabled?: boolean;
    indeterminate?: boolean;
    class?: string;
    id?: string;
    name?: string;
    value?: string;
    onCheckedChange?: (checked: boolean) => void;
    [key: string]: any;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    indeterminate = false,
    class: className,
    id,
    name,
    value,
    onCheckedChange,
    ...restProps
  }: Props = $props();

  function handleChange(event: Event) {
    if (disabled) return;
    const target = event.target as HTMLInputElement;
    checked = target.checked;
    onCheckedChange?.(checked);
  }

  const checkboxClass = $derived(cn(
    'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
    className
  ));
</script>

<div class="relative inline-flex items-center">
  <input
    type="checkbox"
    {id}
    {name}
    {value}
    {disabled}
    bind:checked
    onchange={handleChange}
    class="sr-only"
    {...restProps}
  />
  <div 
    class={checkboxClass}
    data-state={checked ? 'checked' : indeterminate ? 'indeterminate' : 'unchecked'}
  >
    {#if checked}
      <Check class="h-3 w-3 text-current" />
    {:else if indeterminate}
      <div class="h-0.5 w-3 bg-current"></div>
    {/if}
  </div>
</div>
