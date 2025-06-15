// src/lib/stores/theme.svelte.ts - Svelte 5 Runes Version
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'docsee-theme';

// Get system theme preference
function getSystemTheme(): ResolvedTheme {
  if (!browser) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Get initial theme from localStorage or default to system
function getInitialTheme(): Theme {
  if (!browser) return 'system';

  const stored = localStorage.getItem(STORAGE_KEY) as Theme;
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored;
  }

  return 'system';
}

// Private state using $state with object wrappers
const _theme = $state<{ value: Theme }>({ value: getInitialTheme() });
const _systemPreference = $state<{ value: ResolvedTheme }>({ value: getSystemTheme() });

// Export getter functions
export function theme() {
  return _theme.value;
}

export function systemPreference() {
  return _systemPreference.value;
}

// Export function that returns derived value instead of exporting derived directly
export function resolvedTheme(): ResolvedTheme {
  return _theme.value === 'system' ? _systemPreference.value : _theme.value;
}

// Apply theme to document
function applyTheme(resolvedTheme: ResolvedTheme) {
  if (!browser) return;

  const root = document.documentElement;

  // Use class-based strategy (recommended for Tailwind CSS)
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);

  // Also set a CSS custom property for JavaScript access
  root.style.setProperty('--resolved-theme', resolvedTheme);
}

// Store theme preference
function storeTheme(theme: Theme) {
  if (!browser) return;

  if (theme === 'system') {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, theme);
  }
}

// Setup effect to watch for system preference changes
if (browser) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    _systemPreference.value = e.matches ? 'dark' : 'light';
  };

  mediaQuery.addEventListener('change', handleChange);

  // Initial theme application using $effect
  $effect(() => {
    const resolved = resolvedTheme();
    applyTheme(resolved);
    storeTheme(_theme.value);
  });
}

// Theme management functions
export function setTheme(newTheme: Theme): void {
  _theme.value = newTheme;
}

export function toggleTheme(): void {
  if (_theme.value === 'system') {
    // If currently system, switch to opposite of system preference
    _theme.value = _systemPreference.value === 'dark' ? 'light' : 'dark';
  } else if (_theme.value === 'light') {
    _theme.value = 'dark';
  } else {
    _theme.value = 'light';
  }
}

export function resetTheme(): void {
  _theme.value = 'system';
}

// Theme detection utilities
export function isDarkMode(): boolean {
  return resolvedTheme() === 'dark';
}

export function isLightMode(): boolean {
  return resolvedTheme() === 'light';
}

export function isSystemTheme(): boolean {
  return _theme.value === 'system';
}

// Theme change events for components that need to react
export const themeChangeEvent = 'theme-change';

if (browser) {
  $effect(() => {
    const resolved = resolvedTheme();
    window.dispatchEvent(new CustomEvent(themeChangeEvent, {
      detail: { theme: resolved }
    }));
  });
}

// Utility to create theme-aware reactive values - now returns a function
export function createThemeReactive<T>(lightValue: T, darkValue: T): () => T {
  return () => resolvedTheme() === 'dark' ? darkValue : lightValue;
}

// Color scheme utilities for dynamic styling - now returns a function
export function colorScheme() {
  const resolved = resolvedTheme();
  return {
    isDark: resolved === 'dark',
    isLight: resolved === 'light',
    scheme: resolved,
    // CSS custom properties that can be used in components
    cssVars: {
      '--theme-scheme': resolved,
      '--theme-numeric': resolved === 'dark' ? '1' : '0'
    }
  };
}

// Theme preferences for better UX
export interface ThemePreferences {
  autoSwitchTime?: {
    light: string; // e.g., "07:00"
    dark: string;  // e.g., "19:00"
  };
  reducedMotion?: boolean;
  highContrast?: boolean;
}

// Advanced theme store with preferences (optional)
const _themePreferences = $state<ThemePreferences>({
  reducedMotion: browser ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  highContrast: browser ? window.matchMedia('(prefers-contrast: high)').matches : false
});

export function themePreferences() {
  return _themePreferences;
}

export function setThemePreferences(prefs: Partial<ThemePreferences>) {
  Object.assign(_themePreferences, prefs);
}

// Auto-switch theme based on time (if enabled)
export function enableAutoThemeSwitch(preferences: ThemePreferences) {
  if (!browser || !preferences.autoSwitchTime) return;

  const checkTime = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (currentTime >= preferences.autoSwitchTime!.dark || currentTime < preferences.autoSwitchTime!.light) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  // Check immediately
  checkTime();

  // Check every minute
  const interval = setInterval(checkTime, 60000);

  // Return cleanup function
  return () => clearInterval(interval);
}

// Export theme constants for consistency
export const THEME_OPTIONS: Array<{ value: Theme; label: string; description: string }> = [
  { 
    value: 'light', 
    label: 'Light', 
    description: 'Light mode with bright backgrounds' 
  },
  { 
    value: 'dark', 
    label: 'Dark', 
    description: 'Dark mode with dark backgrounds' 
  },
  { 
    value: 'system', 
    label: 'System', 
    description: 'Follow system preference' 
  }
] as const;
