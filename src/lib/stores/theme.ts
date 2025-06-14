import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'auto';

// Initialize theme from localStorage or default to 'auto'
function getInitialTheme(): Theme {
	if (browser) {
		const stored = localStorage.getItem('docsee-theme') as Theme;
		if (stored && ['light', 'dark', 'auto'].includes(stored)) {
			return stored;
		}
	}
	return 'auto';
}

// Create the theme store
export const theme = writable<Theme>(getInitialTheme());

// Function to apply theme to document
function applyTheme(selectedTheme: Theme) {
	if (!browser) return;

	const root = document.documentElement;
	
	let actualTheme: 'light' | 'dark';
	
	if (selectedTheme === 'auto') {
		// Use system preference
		actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	} else {
		actualTheme = selectedTheme;
	}

	// Apply theme class to root element
	root.classList.remove('light', 'dark');
	root.classList.add(actualTheme);

	// Update color-scheme for better native control styling
	root.style.colorScheme = actualTheme;
}

// Function to set theme
export function setTheme(newTheme: Theme) {
	theme.set(newTheme);
	
	if (browser) {
		localStorage.setItem('docsee-theme', newTheme);
		applyTheme(newTheme);
	}
}

// Function to toggle between light and dark (skipping auto)
export function toggleTheme() {
	theme.update(currentTheme => {
		const newTheme = currentTheme === 'light' ? 'dark' : 'light';
		setTheme(newTheme);
		return newTheme;
	});
}

// Initialize theme on app start
export function initializeTheme() {
	if (browser) {
		const currentTheme = getInitialTheme();
		applyTheme(currentTheme);

		// Listen for system theme changes when in auto mode
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = () => {
			theme.subscribe(t => {
				if (t === 'auto') {
					applyTheme('auto');
				}
			})();
		};

		mediaQuery.addEventListener('change', handleChange);

		// Return cleanup function
		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	}
}

// Get the actual theme being used (resolves 'auto' to 'light' or 'dark')
export function getActualTheme(): 'light' | 'dark' {
	if (!browser) return 'light';

	let currentTheme: Theme;
	theme.subscribe(t => currentTheme = t)();

	if (currentTheme === 'auto') {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	return currentTheme;
}
