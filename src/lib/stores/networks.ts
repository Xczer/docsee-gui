// TODO: Implement networks store
import { writable } from 'svelte/store';

export const networksStore = writable({
  networks: [],
  isLoading: false,
  error: null
});
