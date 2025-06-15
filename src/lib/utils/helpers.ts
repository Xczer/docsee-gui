// Utility functions for DocSee
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatDate(date: string | number | Date): string {
  const d = new Date(date);
  return d.toLocaleString();
}

export function formatDateRelative(date: string | number | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
}

// Size formatting utilities
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatBytesPerSecond(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

// Duration formatting utilities
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function formatUptime(startTime: string | number | Date): string {
  const start = new Date(startTime);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return formatDuration(diff);
}

// Color utilities for container states
export function getStateColor(state: string): string {
  switch (state.toLowerCase()) {
    case 'running':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
    case 'exited':
    case 'stopped':
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    case 'paused':
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
    case 'restarting':
      return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
    case 'removing':
    case 'dead':
      return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
    case 'created':
      return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900';
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
  }
}

export function getStateDotColor(state: string): string {
  switch (state.toLowerCase()) {
    case 'running':
      return 'bg-green-400';
    case 'exited':
    case 'stopped':
      return 'bg-gray-400';
    case 'paused':
      return 'bg-yellow-400';
    case 'restarting':
      return 'bg-blue-400';
    case 'removing':
    case 'dead':
      return 'bg-red-400';
    case 'created':
      return 'bg-purple-400';
    default:
      return 'bg-gray-400';
  }
}

// String utilities
export function truncateString(str: string, length: number = 50): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Array utilities
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// URL utilities
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Docker-specific utilities
export function parseImageName(image: string): {
  registry?: string;
  namespace?: string;
  repository: string;
  tag: string;
} {
  // Example: registry.example.com/namespace/repo:tag
  // or: namespace/repo:tag
  // or: repo:tag
  // or: repo (defaults to :latest)

  let remainder = image;
  let registry: string | undefined;
  let namespace: string | undefined;
  let repository: string;
  let tag: string = 'latest';

  // Check if there's a tag
  const tagIndex = remainder.lastIndexOf(':');
  if (tagIndex > 0 && !remainder.substring(tagIndex + 1).includes('/')) {
    tag = remainder.substring(tagIndex + 1);
    remainder = remainder.substring(0, tagIndex);
  }

  const parts = remainder.split('/');

  if (parts.length === 3) {
    // registry/namespace/repo
    [registry, namespace, repository] = parts;
  } else if (parts.length === 2) {
    // Could be registry/repo or namespace/repo
    // If first part contains a dot or port, it's a registry
    if (parts[0].includes('.') || parts[0].includes(':')) {
      [registry, repository] = parts;
    } else {
      [namespace, repository] = parts;
    }
  } else {
    // Just repo
    repository = parts[0];
  }

  return {
    registry,
    namespace,
    repository,
    tag
  };
}

export function formatImageName(image: string): string {
  const parsed = parseImageName(image);
  let result = parsed.repository;

  if (parsed.namespace) {
    result = `${parsed.namespace}/${result}`;
  }

  if (parsed.tag && parsed.tag !== 'latest') {
    result += `:${parsed.tag}`;
  }

  return result;
}

export function getShortId(id: string): string {
  return id.substring(0, 12);
}

// Validation utilities
export function isValidContainerName(name: string): boolean {
  // Docker container names must match [a-zA-Z0-9][a-zA-Z0-9_.-]*
  const regex = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
  return regex.test(name);
}

export function isValidImageTag(tag: string): boolean {
  // Docker image tags must be valid ASCII and may contain lowercase and uppercase letters, digits, underscores, periods and dashes
  // They may not start with a period or dash and may not contain consecutive periods
  const regex = /^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/;
  return regex.test(tag) && !tag.includes('..');
}

// Performance utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Local storage utilities (with fallbacks)
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or not available
    console.warn(`Failed to save ${key} to localStorage`);
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    console.warn(`Failed to remove ${key} from localStorage`);
  }
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('timeout');
}

// Constants
export const DOCKER_STATES = [
  'created',
  'restarting',
  'running',
  'removing',
  'paused',
  'exited',
  'dead'
] as const;

export const REFRESH_INTERVALS = {
  FAST: 2000,    // 2 seconds
  NORMAL: 5000,  // 5 seconds
  SLOW: 10000,   // 10 seconds
  VERY_SLOW: 30000 // 30 seconds
} as const;

export const CONTAINER_ACTIONS = [
  'start',
  'stop',
  'restart',
  'pause',
  'unpause',
  'kill',
  'remove'
] as const;
