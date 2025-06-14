// TODO: Implement settings store
import { writable } from 'svelte/store';

export const settingsStore = writable({
  theme: 'light',
  autoRefresh: true,
  refreshInterval: 5000
});
