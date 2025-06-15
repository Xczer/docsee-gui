// src/lib/stores/toast.ts
import { writable } from 'svelte/store';
import { generateId } from '$lib/utils';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: any; // Svelte snippet
}

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  clear: () => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

function createToastStore(): ToastStore {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    get toasts() {
      let current: Toast[] = [];
      subscribe(value => current = value)();
      return current;
    },

    add(toast: Omit<Toast, 'id'>): string {
      const id = generateId();
      const newToast: Toast = {
        id,
        duration: 5000,
        dismissible: true,
        ...toast
      };

      update(toasts => [newToast, ...toasts]);
      return id;
    },

    dismiss(id: string): void {
      update(toasts => toasts.filter(t => t.id !== id));
    },

    clear(): void {
      update(() => []);
    },

    success(title: string, description?: string): string {
      return this.add({
        type: 'success',
        title,
        description
      });
    },

    error(title: string, description?: string): string {
      return this.add({
        type: 'error',
        title,
        description,
        duration: 0 // Errors persist until dismissed
      });
    },

    warning(title: string, description?: string): string {
      return this.add({
        type: 'warning',
        title,
        description,
        duration: 7000 // Warnings last longer
      });
    },

    info(title: string, description?: string): string {
      return this.add({
        type: 'info',
        title,
        description
      });
    }
  };
}

export const toasts = createToastStore();

// Convenience functions for direct use
export const toast = {
  success: toasts.success,
  error: toasts.error,
  warning: toasts.warning,
  info: toasts.info,
  dismiss: toasts.dismiss,
  clear: toasts.clear
};
