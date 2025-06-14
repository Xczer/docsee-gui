// Docker Store - Main state management for Docker operations
import { writable, derived, type Readable } from 'svelte/store';
import type { DockerInfo, DockerVersion, ApiResponse } from '../types/docker.js';

export interface DockerState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  info: DockerInfo | null;
  version: DockerVersion | null;
  lastChecked: Date | null;
}

// Create the main Docker store
function createDockerStore() {
  const { subscribe, set, update } = writable<DockerState>({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    info: null,
    version: null,
    lastChecked: null
  });

  return {
    subscribe,
    // Connection management
    setConnecting: (connecting: boolean) => {
      update(state => ({ ...state, isConnecting: connecting }));
    },
    
    setConnected: (connected: boolean, error?: string) => {
      update(state => ({
        ...state,
        isConnected: connected,
        isConnecting: false,
        connectionError: error || null,
        lastChecked: new Date()
      }));
    },

    setInfo: (info: DockerInfo) => {
      update(state => ({ ...state, info }));
    },

    setVersion: (version: DockerVersion) => {
      update(state => ({ ...state, version }));
    },

    reset: () => {
      set({
        isConnected: false,
        isConnecting: false,
        connectionError: null,
        info: null,
        version: null,
        lastChecked: null
      });
    }
  };
}

export const dockerStore = createDockerStore();

// Derived stores for specific data
export const dockerInfo: Readable<DockerInfo | null> = derived(
  dockerStore,
  $docker => $docker.info
);

export const dockerVersion: Readable<DockerVersion | null> = derived(
  dockerStore,
  $docker => $docker.version
);

export const isDockerConnected: Readable<boolean> = derived(
  dockerStore,
  $docker => $docker.isConnected
);

export const dockerConnectionStatus: Readable<{
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}> = derived(
  dockerStore,
  $docker => ({
    isConnected: $docker.isConnected,
    isConnecting: $docker.isConnecting,
    error: $docker.connectionError
  })
);

// System stats derived store
export const systemStats: Readable<{
  totalContainers: number;
  runningContainers: number;
  pausedContainers: number;
  stoppedContainers: number;
  totalImages: number;
  memTotal: number;
  ncpu: number;
} | null> = derived(
  dockerInfo,
  $info => {
    if (!$info) return null;
    
    return {
      totalContainers: $info.containers,
      runningContainers: $info.containers_running,
      pausedContainers: $info.containers_paused,
      stoppedContainers: $info.containers_stopped,
      totalImages: $info.images,
      memTotal: $info.mem_total,
      ncpu: $info.ncpu
    };
  }
);
