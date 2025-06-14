// TODO: Implement images store
import { writable } from 'svelte/store';

export const imagesStore = writable({
  images: [],
  isLoading: false,
  error: null
});
