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

// Use a class-based approach to encapsulate the state
class DockerStore {
  private _connectionStatus = $state<DockerConnectionStatus>({
    connected: false,
    error: undefined,
    version: undefined,
    api_version: undefined
  });

  private _systemInfo = $state<DockerSystemInfo | null>(null);
  private _systemStats = $state<DockerStats | null>(null);
  private _isConnecting = $state<boolean>(false);
  private _isLoadingSystemInfo = $state<boolean>(false);
  private _isLoadingStats = $state<boolean>(false);
  private _dockerError = $state<string | null>(null);
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  // Getters
  get connectionStatus() {
    return this._connectionStatus;
  }

  get systemInfo() {
    return this._systemInfo;
  }

  get systemStats() {
    return this._systemStats;
  }

  get isConnecting() {
    return this._isConnecting;
  }

  get isLoadingSystemInfo() {
    return this._isLoadingSystemInfo;
  }

  get isLoadingStats() {
    return this._isLoadingStats;
  }

  get dockerError() {
    return this._dockerError;
  }

  // Connection functions
  async initializeDockerConnection() {
    try {
      this._isConnecting = true;
      this._dockerError = null;

      const status = await getDockerConnectionStatus();
      this._connectionStatus.connected = status.connected;
      this._connectionStatus.error = status.error;
      this._connectionStatus.version = status.version;
      this._connectionStatus.api_version = status.api_version;

      if (!status.connected) {
        console.log('Docker not connected, attempting to connect...');
        const connected = await connectDocker();
        if (connected) {
          const newStatus = await getDockerConnectionStatus();
          this._connectionStatus.connected = newStatus.connected;
          this._connectionStatus.error = newStatus.error;
          this._connectionStatus.version = newStatus.version;
          this._connectionStatus.api_version = newStatus.api_version;
        }
      }
    } catch (error) {
      console.error('Failed to initialize Docker connection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this._dockerError = errorMessage;
      this._connectionStatus.connected = false;
      this._connectionStatus.error = errorMessage;
      this._connectionStatus.version = undefined;
      this._connectionStatus.api_version = undefined;
    } finally {
      this._isConnecting = false;
    }
  }

  async refreshConnectionStatus() {
    try {
      const status = await getDockerConnectionStatus();
      this._connectionStatus.connected = status.connected;
      this._connectionStatus.error = status.error;
      this._connectionStatus.version = status.version;
      this._connectionStatus.api_version = status.api_version;
      return status;
    } catch (error) {
      console.error('Failed to refresh connection status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this._dockerError = errorMessage;
      this._connectionStatus.connected = false;
      this._connectionStatus.error = errorMessage;
      this._connectionStatus.version = undefined;
      this._connectionStatus.api_version = undefined;
      return null;
    }
  }

  async connectToDocker() {
    try {
      this._isConnecting = true;
      this._dockerError = null;

      const connected = await connectDocker();
      if (connected) {
        await this.refreshConnectionStatus();
      }
      return connected;
    } catch (error) {
      console.error('Failed to connect to Docker:', error);
      this._dockerError = error instanceof Error ? error.message : 'Unknown error';
      return false;
    } finally {
      this._isConnecting = false;
    }
  }

  async disconnectFromDocker() {
    try {
      await disconnectDocker();
      this._connectionStatus.connected = false;
      this._connectionStatus.error = undefined;
      this._connectionStatus.version = undefined;
      this._connectionStatus.api_version = undefined;
      this._systemInfo = null;
      this._systemStats = null;
    } catch (error) {
      console.error('Failed to disconnect from Docker:', error);
      this._dockerError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  async loadSystemInfo() {
    try {
      this._isLoadingSystemInfo = true;
      this._dockerError = null;

      const info = await getSystemInfo();
      this._systemInfo = info;
      return info;
    } catch (error) {
      console.error('Failed to load system info:', error);
      this._dockerError = error instanceof Error ? error.message : 'Unknown error';
      return null;
    } finally {
      this._isLoadingSystemInfo = false;
    }
  }

  async loadSystemStats() {
    try {
      this._isLoadingStats = true;
      this._dockerError = null;

      const stats = await getSystemStats();
      this._systemStats = stats;
      return stats;
    } catch (error) {
      console.error('Failed to load system stats:', error);
      this._dockerError = error instanceof Error ? error.message : 'Unknown error';
      return null;
    } finally {
      this._isLoadingStats = false;
    }
  }

  setDockerError(error: string | null) {
    this._dockerError = error;
  }

  startAutoRefresh(intervalMs: number = 5000) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(async () => {
      const status = await this.refreshConnectionStatus();
      if (status?.connected) {
        await this.loadSystemStats();
      }
    }, intervalMs);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  cleanup() {
    this.stopAutoRefresh();
  }
}

// Create and export a singleton instance
export const dockerStore = new DockerStore();
