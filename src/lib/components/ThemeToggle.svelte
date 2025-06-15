<!-- src/lib/components/ThemeToggle.svelte -->
<script lang="ts">
  import { Sun, Moon, Monitor } from 'lucide-svelte';
  import { theme, setTheme, type Theme } from '$lib/stores/theme.svelte';

  const themes: { value: Theme; label: string; icon: any }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  function handleThemeSelect(selectedTheme: Theme) {
    setTheme(selectedTheme);
  }

  let open = $state(false);
  let currentTheme = $derived(theme());

  // Get the current theme icon component using $derived
  let CurrentThemeIcon = $derived(() => {
    switch (currentTheme) {
      case 'light':
        return Sun;
      case 'dark':
        return Moon;
      case 'system':
        return Monitor;
      default:
        return Monitor;
    }
  });

  function toggle() {
    open = !open;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.theme-toggle-dropdown')) {
      open = false;
    }
  }

  $effect(() => {
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  });
</script>

<div class="relative inline-block theme-toggle-dropdown">
  <!-- Trigger Button -->
  <button 
    class="btn btn-ghost btn-icon" 
    onclick={toggle}
    aria-label="Toggle theme"
  >
    <!-- Use derived component directly - no svelte:component needed -->
    {#if CurrentThemeIcon()}
      {@const IconComponent = CurrentThemeIcon()}
      <IconComponent class="h-5 w-5" />
    {/if}
    <span class="sr-only">Toggle theme</span>
  </button>

  <!-- Dropdown Content -->
  {#if open}
    <div 
      class="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-border bg-popover p-1 shadow-md slide-in"
      role="menu"
      aria-orientation="vertical"
    >
      {#each themes as themeOption}
        {@const ThemeIcon = themeOption.icon}
        <button
          class="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          onclick={() => {
            handleThemeSelect(themeOption.value);
            open = false;
          }}
          role="menuitem"
        >
          <ThemeIcon class="h-4 w-4" />
          {themeOption.label}
          {#if currentTheme === themeOption.value}
            <div class="ml-auto h-2 w-2 rounded-full bg-primary"></div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .slide-in {
    animation: slideIn 150ms ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>