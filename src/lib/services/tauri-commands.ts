import { invoke } from '@tauri-apps/api/core';
import type { 
  DockerConnectionStatus, 
  DockerSystemInfo, 
  DockerStats 
} from '../types/docker';
import type { 
  Container, 
  ContainerInspect, 
  ContainerStats,
  ContainerLogLine 
} from '../types/container';
import type { 
  ImageSummary, 
  ImageInspect 
} from '../types/image';

// System API
export async function connectDocker(): Promise<boolean> {
  return await invoke('connect_docker');
}

export async function disconnectDocker(): Promise<void> {
  return await invoke('disconnect_docker');
}

export async function getDockerConnectionStatus(): Promise<DockerConnectionStatus> {
  return await invoke('get_docker_connection_status');
}

export async function getSystemInfo(): Promise<DockerSystemInfo> {
  return await invoke('get_system_info');
}

export async function getSystemStats(): Promise<DockerStats> {
  return await invoke('get_system_stats');
}

export async function testDockerConnection(): Promise<boolean> {
  return await invoke('test_docker_connection');
}

// Container API
export async function getContainers(all: boolean = true): Promise<Container[]> {
  return await invoke('get_containers', { all });
}

export async function getContainerDetails(id: string): Promise<ContainerInspect> {
  return await invoke('get_container_details', { id });
}

export async function startContainer(id: string): Promise<void> {
  return await invoke('start_container_cmd', { id });
}

export async function stopContainer(id: string, timeout?: number): Promise<void> {
  return await invoke('stop_container_cmd', { id, timeout });
}

export async function restartContainer(id: string, timeout?: number): Promise<void> {
  return await invoke('restart_container_cmd', { id, timeout });
}

export async function removeContainer(id: string, force: boolean = false, removeVolumes: boolean = false): Promise<void> {
  return await invoke('remove_container_cmd', { id, force, removeVolumes });
}

export async function killContainer(id: string, signal?: string): Promise<void> {
  return await invoke('kill_container_cmd', { id, signal });
}

export async function getContainerStats(id: string): Promise<ContainerStats> {
  return await invoke('get_container_stats_cmd', { id });
}

export async function getContainerLogs(
  id: string,
  follow?: boolean,
  tail?: string,
  since?: string,
  until?: string
): Promise<ContainerLogLine[]> {
  return await invoke('get_container_logs_cmd', { 
    id, 
    follow, 
    tail, 
    since, 
    until 
  });
}

// Image API
export async function getImages(all: boolean = false): Promise<ImageSummary[]> {
  return await invoke('get_images', { all });
}

export async function getImageDetails(id: string): Promise<ImageInspect> {
  return await invoke('get_image_details', { id });
}

export async function removeImage(id: string, force: boolean = false, noPrune: boolean = false): Promise<void> {
  return await invoke('remove_image_cmd', { id, force, noPrune });
}

export async function pullImage(name: string, tag?: string): Promise<void> {
  return await invoke('pull_image_cmd', { name, tag });
}

// Helper function to handle API errors
export function handleTauriError(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unknown error occurred';
}
