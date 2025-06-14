// TODO: Implement volumes store
import { writable } from 'svelte/store';

export const volumesStore = writable({
  volumes: [],
  isLoading: false,
  error: null
});
