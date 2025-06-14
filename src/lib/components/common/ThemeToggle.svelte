<script lang="ts">
	import { theme, setTheme, type Theme } from '$lib/stores/theme.js';
	import { Sun, Moon, Monitor } from 'lucide-svelte';

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

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (showDropdown && !(event.target as Element)?.closest('.theme-dropdown')) {
			showDropdown = false;
		}
	}

	// Size classes
	const sizeClasses = {
		sm: 'w-8 h-8',
		md: 'w-10 h-10',
		lg: 'w-12 h-12'
	};

	const iconSizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-6 h-6'
	};
</script>

<svelte:window on:click={handleClickOutside} />

<div class="theme-dropdown relative">
	{#if variant === 'button'}
		<!-- Simple toggle button -->
		<button
			on:click={handleToggle}
			class="flex items-center justify-center {sizeClasses[size]} rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
			title="Toggle theme"
		>
			<svelte:component this={getIconComponent($theme)} class={iconSizeClasses[size]} />
		</button>
	{:else}
		<!-- Dropdown button -->
		<button
			on:click={handleToggle}
			class="flex items-center justify-center {sizeClasses[size]} rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
			title="Change theme"
		>
			<svelte:component this={getIconComponent($theme)} class={iconSizeClasses[size]} />
		</button>

		{#if showDropdown}
			<!-- Dropdown menu -->
			<div class="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
				<div class="py-1">
					{#each themes as themeOption}
						<button
							on:click={() => handleThemeSelect(themeOption.value)}
							class="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors {$theme === themeOption.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''}"
						>
							<svelte:component this={themeOption.icon} class="w-4 h-4" />
							<span>{themeOption.label}</span>
							{#if $theme === themeOption.value}
								<svg class="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
