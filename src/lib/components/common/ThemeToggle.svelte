<script lang="ts">
	import { theme, setTheme, type Theme } from '$lib/stores/theme.js';
	import { Sun, Moon, Monitor, ChevronDown } from 'lucide-svelte';
	import { clickOutside } from '$lib/utils/click-outside.js';

	export let variant: 'button' | 'dropdown' = 'dropdown';
	export let size: 'sm' | 'md' | 'lg' = 'md';

	let showDropdown = false;

	const themes: { value: Theme; label: string; icon: any }[] = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'auto', label: 'System', icon: Monitor }
	];

	function handleThemeSelect(selectedTheme: Theme) {
		setTheme(selectedTheme);
		showDropdown = false;
	}

	function handleToggle() {
		if (variant === 'button') {
			// Simple toggle between light and dark
			const newTheme = $theme === 'light' ? 'dark' : 'light';
			setTheme(newTheme);
		} else {
			showDropdown = !showDropdown;
		}
	}

	function getIconComponent(themeValue: Theme) {
		return themes.find(t => t.value === themeValue)?.icon || Monitor;
	}

	function handleClickOutside() {
		showDropdown = false;
	}

	// Size classes
	const buttonSizes = {
		sm: 'h-8 w-8',
		md: 'h-9 w-9',
		lg: 'h-10 w-10'
	};

	const iconSizes = {
		sm: 'h-3 w-3',
		md: 'h-4 w-4',
		lg: 'h-5 w-5'
	};
</script>

{#if variant === 'button'}
	<!-- Simple toggle button -->
	<button
		class="btn btn-outline btn-icon {buttonSizes[size]}"
		on:click={handleToggle}
		title="Toggle theme"
	>
		<svelte:component this={getIconComponent($theme)} class={iconSizes[size]} />
		<span class="sr-only">Toggle theme</span>
	</button>
{:else}
	<!-- Dropdown button -->
	<div class="relative" use:clickOutside={handleClickOutside}>
		<button 
			class="btn btn-outline btn-icon {buttonSizes[size]}"
			on:click={handleToggle}
			title="Change theme"
		>
			<svelte:component this={getIconComponent($theme)} class={iconSizes[size]} />
			<span class="sr-only">Change theme</span>
		</button>

		{#if showDropdown}
			<!-- Dropdown menu -->
			<div class="absolute right-0 top-full mt-2 w-44 bg-popover border border-border rounded-md shadow-md z-50 py-1">
				<div class="px-2 py-1.5 text-sm font-medium text-muted-foreground">
					Theme
				</div>
				<div class="h-px bg-border mx-1 my-1"></div>
				{#each themes as themeOption}
					<button
						type="button"
						on:click={() => handleThemeSelect(themeOption.value)}
						class="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-accent rounded-sm mx-1 transition-colors {$theme === themeOption.value ? 'bg-accent' : ''}"
					>
						<svelte:component this={themeOption.icon} class="h-4 w-4" />
						<span>{themeOption.label}</span>
						{#if $theme === themeOption.value}
							<svg class="ml-auto h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
