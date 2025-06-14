// TODO: Implement notifications store
import { writable } from 'svelte/store';

export const notificationsStore = writable({
  notifications: []
});
