// src/lib/stores/docker.svelte.ts
import type { DockerConnectionStatus, DockerSystemInfo, DockerStats } from '../types/docker';
import {
  getDockerConnectionStatus,
  getSystemInfo,
  getSystemStats,
  connectDocker,
  disconnectDocker,
  testDockerConnection
} from '../services/tauri-commands';

// Private state using $state
const _connectionStatus = $state<DockerConnectionStatus>({
  connected: false,
  error: undefined,
  version: undefined,
  api_version: undefined
});

const _systemInfo = $state<{ value: DockerSystemInfo | null }>({ value: null });
const _systemStats = $state<{ value: DockerStats | null }>({ value: null });
const _isConnecting = $state<{ value: boolean }>({ value: false });
const _isLoadingSystemInfo = $state<{ value: boolean }>({ value: false });
const _isLoadingStats = $state<{ value: boolean }>({ value: false });
const _dockerError = $state<{ value: string | null }>({ value: null });

// Export getters that return the state values
export function connectionStatus() {
  return _connectionStatus;
}

export function systemInfo() {
  return _systemInfo.value;
}

export function systemStats() {
  return _systemStats.value;
}

export function isConnecting() {
  return _isConnecting.value;
}

export function isLoadingSystemInfo() {
  return _isLoadingSystemInfo.value;
}

export function isLoadingStats() {
  return _isLoadingStats.value;
}

export function dockerError() {
  return _dockerError.value;
}

// Connection functions
export async function initializeDockerConnection() {
  try {
    _isConnecting.value = true;
    _dockerError.value = null;

    const status = await getDockerConnectionStatus();
    _connectionStatus.connected = status.connected;
    _connectionStatus.error = status.error;
    _connectionStatus.version = status.version;
    _connectionStatus.api_version = status.api_version;

    if (!status.connected) {
      console.log('Docker not connected, attempting to connect...');
      const connected = await connectDocker();
      if (connected) {
        const newStatus = await getDockerConnectionStatus();
        _connectionStatus.connected = newStatus.connected;
        _connectionStatus.error = newStatus.error;
        _connectionStatus.version = newStatus.version;
        _connectionStatus.api_version = newStatus.api_version;
      }
    }
  } catch (error) {
    console.error('Failed to initialize Docker connection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    _dockerError.value = errorMessage;
    _connectionStatus.connected = false;
    _connectionStatus.error = errorMessage;
    _connectionStatus.version = undefined;
    _connectionStatus.api_version = undefined;
  } finally {
    _isConnecting.value = false;
  }
}

export async function refreshConnectionStatus() {
  try {
    const status = await getDockerConnectionStatus();
    _connectionStatus.connected = status.connected;
    _connectionStatus.error = status.error;
    _connectionStatus.version = status.version;
    _connectionStatus.api_version = status.api_version;
    return status;
  } catch (error) {
    console.error('Failed to refresh connection status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    _dockerError.value = errorMessage;
    _connectionStatus.connected = false;
    _connectionStatus.error = errorMessage;
    _connectionStatus.version = undefined;
    _connectionStatus.api_version = undefined;
    return null;
  }
}

export async function connectToDocker() {
  try {
    _isConnecting.value = true;
    _dockerError.value = null;

    const connected = await connectDocker();
    if (connected) {
      await refreshConnectionStatus();
    }
    return connected;
  } catch (error) {
    console.error('Failed to connect to Docker:', error);
    _dockerError.value = error instanceof Error ? error.message : 'Unknown error';
    return false;
  } finally {
    _isConnecting.value = false;
  }
}

export async function disconnectFromDocker() {
  try {
    await disconnectDocker();
    _connectionStatus.connected = false;
    _connectionStatus.error = undefined;
    _connectionStatus.version = undefined;
    _connectionStatus.api_version = undefined;
    _systemInfo.value = null;
    _systemStats.value = null;
  } catch (error) {
    console.error('Failed to disconnect from Docker:', error);
    _dockerError.value = error instanceof Error ? error.message : 'Unknown error';
  }
}

export async function loadSystemInfo() {
  try {
    _isLoadingSystemInfo.value = true;
    _dockerError.value = null;

    const info = await getSystemInfo();
    _systemInfo.value = info;
    return info;
  } catch (error) {
    console.error('Failed to load system info:', error);
    _dockerError.value = error instanceof Error ? error.message : 'Unknown error';
    return null;
  } finally {
    _isLoadingSystemInfo.value = false;
  }
}

export async function loadSystemStats() {
  try {
    _isLoadingStats.value = true;
    _dockerError.value = null;

    const stats = await getSystemStats();
    _systemStats.value = stats;
    return stats;
  } catch (error) {
    console.error('Failed to load system stats:', error);
    _dockerError.value = error instanceof Error ? error.message : 'Unknown error';
    return null;
  } finally {
    _isLoadingStats.value = false;
  }
}

// Set error function
export function setDockerError(error: string | null) {
  _dockerError.value = error;
}

// Auto-refresh functionality
let refreshInterval: ReturnType<typeof setInterval> | null = null;

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
