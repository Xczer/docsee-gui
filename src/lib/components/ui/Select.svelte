<!-- src/lib/components/ui/Select.svelte -->
<script lang="ts">
  import { cn } from '$lib/utils';
  import { ChevronDown } from 'lucide-svelte';

  interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
  }

  interface Props {
    value?: string;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    class?: string;
    id?: string;
    name?: string;
    required?: boolean;
    onValueChange?: (value: string) => void;
    [key: string]: any;
  }

  let {
    value = $bindable(''),
    options,
    placeholder = 'Select an option...',
    disabled = false,
    class: className,
    id,
    name,
    required = false,
    onValueChange,
    ...restProps
  }: Props = $props();

  function handleChange(event: Event) {
    if (disabled) return;
    const target = event.target as HTMLSelectElement;
    value = target.value;
    onValueChange?.(value);
  }

  const selectClass = $derived(cn(
    'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    className
  ));

  const selectedOption = $derived(options.find(opt => opt.value === value));
</script>

<div class="relative">
  <select
    {id}
    {name}
    {disabled}
    {required}
    bind:value
    onchange={handleChange}
    class={selectClass}
    {...restProps}
  >
    {#if placeholder}
      <option value="" disabled>{placeholder}</option>
    {/if}
    {#each options as option}
      <option value={option.value} disabled={option.disabled}>
        {option.label}
      </option>
    {/each}
  </select>
  
  <ChevronDown class="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
</div>
