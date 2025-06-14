import { writable, type Writable } from 'svelte/store';
import type { Container, ContainerInspect, ContainerStats, ContainerLogLine } from '../types/container.js';
import { 
  getContainers, 
  getContainerDetails, 
  startContainer, 
  stopContainer, 
  restartContainer, 
  removeContainer, 
  killContainer,
  getContainerStats,
  getContainerLogs,
  handleTauriError 
} from '../services/tauri-commands.js';

// Containers store
export const containers: Writable<Container[]> = writable([]);
export const selectedContainer: Writable<Container | null> = writable(null);
export const containerDetails: Writable<ContainerInspect | null> = writable(null);
export const containerStats: Writable<ContainerStats | null> = writable(null);

// Loading states
export const isLoadingContainers = writable(false);
export const isLoadingContainerDetails = writable(false);
export const isLoadingContainerStats = writable(false);
export const containerOperationInProgress = writable<string | null>(null);

// Filter and sorting
export const containerFilter = writable('all'); // 'all', 'running', 'stopped', 'paused'
export const containerSortBy = writable('name'); // 'name', 'status', 'created', 'image'
export const containerSearchTerm = writable('');

// Error store
export const containerError = writable<string | null>(null);

// Container operations
export async function loadContainers(showAll: boolean = true) {
  try {
    isLoadingContainers.set(true);
    containerError.set(null);
    
    const containerList = await getContainers(showAll);
    containers.set(containerList);
    return containerList;
  } catch (error) {
    console.error('Failed to load containers:', error);
    const errorMessage = handleTauriError(error);
    containerError.set(errorMessage);
    return [];
  } finally {
    isLoadingContainers.set(false);
  }
}

export async function loadContainerDetails(id: string) {
  try {
    isLoadingContainerDetails.set(true);
    containerError.set(null);
    
    const details = await getContainerDetails(id);
    containerDetails.set(details);
    return details;
  } catch (error) {
    console.error('Failed to load container details:', error);
    const errorMessage = handleTauriError(error);
    containerError.set(errorMessage);
    return null;
  } finally {
    isLoadingContainerDetails.set(false);
  }
}

export async function loadContainerStats(id: string) {
  try {
    isLoadingContainerStats.set(true);
    containerError.set(null);
    
    const stats = await getContainerStats(id);
    containerStats.set(stats);
    return stats;
  } catch (error) {
    console.error('Failed to load container stats:', error);
    const errorMessage = handleTauriError(error);
    containerError.set(errorMessage);
    return null;
  } finally {
    isLoadingContainerStats.set(false);
  }
}

export async function performContainerAction(
  action: 'start' | 'stop' | 'restart' | 'remove' | 'kill',
  id: string,
  options?: { timeout?: number; force?: boolean; removeVolumes?: boolean; signal?: string }
) {
  try {
    containerOperationInProgress.set(`${action}-${id}`);
    containerError.set(null);
    
    switch (action) {
      case 'start':
        await startContainer(id);
        break;
      case 'stop':
        await stopContainer(id, options?.timeout);
        break;
      case 'restart':
        await restartContainer(id, options?.timeout);
        break;
      case 'remove':
        await removeContainer(id, options?.force || false, options?.removeVolumes || false);
        break;
      case 'kill':
        await killContainer(id, options?.signal);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Refresh containers list after successful operation
    await loadContainers();
    return true;
  } catch (error) {
    console.error(`Failed to ${action} container:`, error);
    const errorMessage = handleTauriError(error);
    containerError.set(errorMessage);
    return false;
  } finally {
    containerOperationInProgress.set(null);
  }
}

// Convenience functions for specific actions
export const startContainerAction = (id: string) => performContainerAction('start', id);
export const stopContainerAction = (id: string, timeout?: number) => 
  performContainerAction('stop', id, { timeout });
export const restartContainerAction = (id: string, timeout?: number) => 
  performContainerAction('restart', id, { timeout });
export const removeContainerAction = (id: string, force?: boolean, removeVolumes?: boolean) => 
  performContainerAction('remove', id, { force, removeVolumes });
export const killContainerAction = (id: string, signal?: string) => 
  performContainerAction('kill', id, { signal });

// Derived stores for filtered and sorted containers
import { derived } from 'svelte/store';

export const filteredContainers = derived(
  [containers, containerFilter, containerSearchTerm],
  ([$containers, $filter, $searchTerm]) => {
    let filtered = $containers;
    
    // Apply status filter
    if ($filter !== 'all') {
      filtered = filtered.filter(container => {
        switch ($filter) {
          case 'running':
            return container.state === 'running';
          case 'stopped':
            return container.state === 'exited' || container.state === 'created';
          default:
            return true;
        }
      });
    }
    
    // Apply search filter
    if ($searchTerm) {
      const term = $searchTerm.toLowerCase();
      filtered = filtered.filter(container => 
        container.names.some(name => name.toLowerCase().includes(term)) ||
        container.image.toLowerCase().includes(term) ||
        container.id.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }
);

export const sortedContainers = derived(
  [filteredContainers, containerSortBy],
  ([$filteredContainers, $sortBy]) => {
    const sorted = [...$filteredContainers];
    
    sorted.sort((a, b) => {
      switch ($sortBy) {
        case 'name':
          return (a.names[0] || '').localeCompare(b.names[0] || '');
        case 'status':
          return a.state.localeCompare(b.state);
        case 'created':
          return b.created - a.created; // Newest first
        case 'image':
          return a.image.localeCompare(b.image);
        default:
          return 0;
      }
    });
    
    return sorted;
  }
);

// Auto-refresh functionality
let containerRefreshInterval: number | null = null;

export function startContainerAutoRefresh(intervalMs: number = 3000) {
  if (containerRefreshInterval) {
    clearInterval(containerRefreshInterval);
  }
  
  containerRefreshInterval = setInterval(async () => {
    await loadContainers();
  }, intervalMs);
}

export function stopContainerAutoRefresh() {
  if (containerRefreshInterval) {
    clearInterval(containerRefreshInterval);
    containerRefreshInterval = null;
  }
}

// Cleanup function
export function cleanupContainers() {
  stopContainerAutoRefresh();
}
