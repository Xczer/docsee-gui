// Tauri commands service for frontend
import { invoke } from '@tauri-apps/api/core';
import type { 
  Container, 
  ContainerInspect, 
  ContainerStats, 
  CreateContainerOptions,
  ContainerProcess,
  ContainerLog 
} from '../types/container.js';
import type { ApiResponse } from '../types/docker.js';

// Docker connection commands
export async function connectDocker(): Promise<ApiResponse<void>> {
  try {
    await invoke('connect_docker');
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function disconnectDocker(): Promise<ApiResponse<void>> {
  try {
    await invoke('disconnect_docker');
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function isDockerConnected(): Promise<ApiResponse<boolean>> {
  try {
    const connected = await invoke<boolean>('is_docker_connected');
    return { success: true, data: connected };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Container management commands
export async function listContainers(
  all: boolean = true, 
  size: boolean = false
): Promise<ApiResponse<Container[]>> {
  try {
    const containers = await invoke<Container[]>('list_containers_cmd', { 
      all, 
      size 
    });
    return { success: true, data: containers };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function getContainer(id: string): Promise<ApiResponse<ContainerInspect>> {
  try {
    const container = await invoke<ContainerInspect>('get_container_cmd', { id });
    return { success: true, data: container };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function createContainer(
  options: CreateContainerOptions
): Promise<ApiResponse<string>> {
  try {
    const containerId = await invoke<string>('create_container_cmd', { 
      request: options 
    });
    return { success: true, data: containerId };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function startContainer(id: string): Promise<ApiResponse<void>> {
  try {
    await invoke('start_container_cmd', { id });
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function stopContainer(
  id: string, 
  timeout?: number
): Promise<ApiResponse<void>> {
  try {
    await invoke('stop_container_cmd', { id, timeout });
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function restartContainer(
  id: string, 
  timeout?: number
): Promise<ApiResponse<void>> {
  try {
    await invoke('restart_container_cmd', { id, timeout });
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function pauseContainer(id: string): Promise<ApiResponse<void>> {
  try {
    await invoke('pause_container_cmd', { id });
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function unpauseContainer(id: string): Promise<ApiResponse<void>> {
  try {
    await invoke('unpause_container_cmd', { id });
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function killContainer(
  id: string, 
  signal?: string
): Promise<ApiResponse<void>> {
  try {
    await invoke('kill_container_cmd', { id, signal });
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function removeContainer(
  id: string, 
  force: boolean = false, 
  removeVolumes: boolean = false
): Promise<ApiResponse<void>> {
  try {
    await invoke('remove_container_cmd', { 
      id, 
      force, 
      removeVolumes 
    });
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function renameContainer(
  id: string, 
  newName: string
): Promise<ApiResponse<void>> {
  try {
    await invoke('rename_container_cmd', { id, newName });
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function getContainerStats(id: string): Promise<ApiResponse<ContainerStats>> {
  try {
    const stats = await invoke<ContainerStats>('get_container_stats_cmd', { id });
    return { success: true, data: stats };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function getContainerProcesses(id: string): Promise<ApiResponse<ContainerProcess>> {
  try {
    const processes = await invoke<ContainerProcess>('get_container_processes_cmd', { id });
    return { success: true, data: processes };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function getContainerLogs(
  id: string,
  follow: boolean = false,
  tail?: string,
  since?: string,
  until?: string
): Promise<ApiResponse<ContainerLog[]>> {
  try {
    const logs = await invoke<ContainerLog[]>('get_container_logs_cmd', { 
      id, 
      follow, 
      tail, 
      since, 
      until 
    });
    return { success: true, data: logs };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Utility functions
export function formatContainerName(names: string[]): string {
  if (!names || names.length === 0) return 'Unnamed';
  return names[0].startsWith('/') ? names[0].slice(1) : names[0];
}

export function formatContainerStatus(state: string, status: string): string {
  switch (state) {
    case 'running':
      return `Running ${status}`;
    case 'exited':
      return `Exited ${status}`;
    case 'paused':
      return 'Paused';
    case 'restarting':
      return 'Restarting';
    case 'removing':
      return 'Removing';
    case 'created':
      return 'Created';
    case 'dead':
      return 'Dead';
    default:
      return status || state || 'Unknown';
  }
}

export function getContainerStateColor(state: string): string {
  switch (state) {
    case 'running':
      return 'text-green-600';
    case 'exited':
      return 'text-gray-600';
    case 'paused':
      return 'text-yellow-600';
    case 'restarting':
      return 'text-blue-600';
    case 'removing':
      return 'text-red-600';
    case 'created':
      return 'text-blue-400';
    case 'dead':
      return 'text-red-800';
    default:
      return 'text-gray-400';
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatUptime(created: number): string {
  const now = Date.now();
  const createdDate = new Date(created * 1000);
  const diff = now - createdDate.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
