import { writable, type Writable } from 'svelte/store';
import type { DockerConnectionStatus, DockerSystemInfo, DockerStats } from '../types/docker.js';
import { 
  getDockerConnectionStatus, 
  getSystemInfo, 
  getSystemStats, 
  connectDocker, 
  disconnectDocker,
  testDockerConnection 
} from '../services/tauri-commands.js';

// Connection status store
export const connectionStatus: Writable<DockerConnectionStatus> = writable({
  connected: false,
  error: undefined,
  version: undefined,
  api_version: undefined
});

// System info store
export const systemInfo: Writable<DockerSystemInfo | null> = writable(null);

// System stats store
export const systemStats: Writable<DockerStats | null> = writable(null);

// Loading states
export const isConnecting = writable(false);
export const isLoadingSystemInfo = writable(false);
export const isLoadingStats = writable(false);

// Error store
export const dockerError = writable<string | null>(null);

// Connection functions
export async function initializeDockerConnection() {
  try {
    isConnecting.set(true);
    dockerError.set(null);
    
    const status = await getDockerConnectionStatus();
    connectionStatus.set(status);
    
    if (!status.connected) {
      console.log('Docker not connected, attempting to connect...');
      const connected = await connectDocker();
      if (connected) {
        const newStatus = await getDockerConnectionStatus();
        connectionStatus.set(newStatus);
      }
    }
  } catch (error) {
    console.error('Failed to initialize Docker connection:', error);
    dockerError.set(error instanceof Error ? error.message : 'Unknown error');
    connectionStatus.set({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      version: undefined,
      api_version: undefined
    });
  } finally {
    isConnecting.set(false);
  }
}

export async function refreshConnectionStatus() {
  try {
    const status = await getDockerConnectionStatus();
    connectionStatus.set(status);
    return status;
  } catch (error) {
    console.error('Failed to refresh connection status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    dockerError.set(errorMessage);
    connectionStatus.set({
      connected: false,
      error: errorMessage,
      version: undefined,
      api_version: undefined
    });
    return null;
  }
}

export async function connectToDocker() {
  try {
    isConnecting.set(true);
    dockerError.set(null);
    
    const connected = await connectDocker();
    if (connected) {
      await refreshConnectionStatus();
    }
    return connected;
  } catch (error) {
    console.error('Failed to connect to Docker:', error);
    dockerError.set(error instanceof Error ? error.message : 'Unknown error');
    return false;
  } finally {
    isConnecting.set(false);
  }
}

export async function disconnectFromDocker() {
  try {
    await disconnectDocker();
    connectionStatus.set({
      connected: false,
      error: undefined,
      version: undefined,
      api_version: undefined
    });
    systemInfo.set(null);
    systemStats.set(null);
  } catch (error) {
    console.error('Failed to disconnect from Docker:', error);
    dockerError.set(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function loadSystemInfo() {
  try {
    isLoadingSystemInfo.set(true);
    dockerError.set(null);
    
    const info = await getSystemInfo();
    systemInfo.set(info);
    return info;
  } catch (error) {
    console.error('Failed to load system info:', error);
    dockerError.set(error instanceof Error ? error.message : 'Unknown error');
    return null;
  } finally {
    isLoadingSystemInfo.set(false);
  }
}

export async function loadSystemStats() {
  try {
    isLoadingStats.set(true);
    dockerError.set(null);
    
    const stats = await getSystemStats();
    systemStats.set(stats);
    return stats;
  } catch (error) {
    console.error('Failed to load system stats:', error);
    dockerError.set(error instanceof Error ? error.message : 'Unknown error');
    return null;
  } finally {
    isLoadingStats.set(false);
  }
}

// Auto-refresh functionality
let refreshInterval: number | null = null;

export function startAutoRefresh(intervalMs: number = 5000) {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshInterval = setInterval(async () => {
    const status = await refreshConnectionStatus();
    if (status?.connected) {
      await loadSystemStats();
    }
  }, intervalMs);
}

export function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// Cleanup function for component unmounting
export function cleanup() {
  stopAutoRefresh();
}
