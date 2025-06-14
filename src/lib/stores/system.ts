// TODO: Implement system store
import { writable } from 'svelte/store';

export const systemStore = writable({
  info: null,
  events: [],
  isLoading: false,
  error: null
});
