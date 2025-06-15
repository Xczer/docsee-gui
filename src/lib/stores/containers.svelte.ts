// src/lib/stores/containers.svelte.ts
import type { Container, ContainerInspect, ContainerStats, ContainerLogLine } from '../types/container';
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
} from '../services/tauri-commands';

// Private state using $state with object wrappers for primitive values
const _containers = $state<Container[]>([]);
const _selectedContainer = $state<{ value: Container | null }>({ value: null });
const _containerDetails = $state<{ value: ContainerInspect | null }>({ value: null });
const _containerStats = $state<{ value: ContainerStats | null }>({ value: null });

// Loading states
const _isLoadingContainers = $state<{ value: boolean }>({ value: false });
const _isLoadingContainerDetails = $state<{ value: boolean }>({ value: false });
const _isLoadingContainerStats = $state<{ value: boolean }>({ value: false });
const _containerOperationInProgress = $state<{ value: string | null }>({ value: null });

// Filter and sorting
const _containerFilter = $state<{ value: string }>({ value: 'all' });
const _containerSortBy = $state<{ value: string }>({ value: 'name' });
const _containerSearchTerm = $state<{ value: string }>({ value: '' });

// Error store
const _containerError = $state<{ value: string | null }>({ value: null });

// Export getter functions
export function containers() {
  return _containers;
}

export function selectedContainer() {
  return _selectedContainer.value;
}

export function containerDetails() {
  return _containerDetails.value;
}

export function containerStats() {
  return _containerStats.value;
}

export function isLoadingContainers() {
  return _isLoadingContainers.value;
}

export function isLoadingContainerDetails() {
  return _isLoadingContainerDetails.value;
}

export function isLoadingContainerStats() {
  return _isLoadingContainerStats.value;
}

export function containerOperationInProgress() {
  return _containerOperationInProgress.value;
}

export function containerFilter() {
  return _containerFilter.value;
}

export function containerSortBy() {
  return _containerSortBy.value;
}

export function containerSearchTerm() {
  return _containerSearchTerm.value;
}

export function containerError() {
  return _containerError.value;
}

// Setter functions
export function setSelectedContainer(container: Container | null) {
  _selectedContainer.value = container;
}

export function setContainerFilter(filter: string) {
  _containerFilter.value = filter;
}

export function setContainerSortBy(sortBy: string) {
  _containerSortBy.value = sortBy;
}

export function setContainerSearchTerm(term: string) {
  _containerSearchTerm.value = term;
}

export function setContainerError(error: string | null) {
  _containerError.value = error;
}

// Export functions that return derived values instead of exporting derived directly
export function filteredContainers() {
  let filtered = _containers;
  
  // Apply status filter
  if (_containerFilter.value !== 'all') {
    filtered = filtered.filter(container => {
      switch (_containerFilter.value) {
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
  if (_containerSearchTerm.value) {
    const term = _containerSearchTerm.value.toLowerCase();
    filtered = filtered.filter(container => 
      container.names.some(name => name.toLowerCase().includes(term)) ||
      container.image.toLowerCase().includes(term) ||
      container.id.toLowerCase().includes(term)
    );
  }
  
  return filtered;
}

export function sortedContainers() {
  const filtered = filteredContainers();
  const sorted = [...filtered];
  
  sorted.sort((a, b) => {
    switch (_containerSortBy.value) {
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

// Container operations
export async function loadContainers(showAll: boolean = true) {
  try {
    _isLoadingContainers.value = true;
    _containerError.value = null;
    
    const containerList = await getContainers(showAll);
    _containers.length = 0;
    _containers.push(...containerList);
    return containerList;
  } catch (error) {
    console.error('Failed to load containers:', error);
    const errorMessage = handleTauriError(error);
    _containerError.value = errorMessage;
    return [];
  } finally {
    _isLoadingContainers.value = false;
  }
}

export async function loadContainerDetails(id: string) {
  try {
    _isLoadingContainerDetails.value = true;
    _containerError.value = null;
    
    const details = await getContainerDetails(id);
    _containerDetails.value = details;
    return details;
  } catch (error) {
    console.error('Failed to load container details:', error);
    const errorMessage = handleTauriError(error);
    _containerError.value = errorMessage;
    return null;
  } finally {
    _isLoadingContainerDetails.value = false;
  }
}

export async function loadContainerStats(id: string) {
  try {
    _isLoadingContainerStats.value = true;
    _containerError.value = null;
    
    const stats = await getContainerStats(id);
    _containerStats.value = stats;
    return stats;
  } catch (error) {
    console.error('Failed to load container stats:', error);
    const errorMessage = handleTauriError(error);
    _containerError.value = errorMessage;
    return null;
  } finally {
    _isLoadingContainerStats.value = false;
  }
}

export async function performContainerAction(
  action: 'start' | 'stop' | 'restart' | 'remove' | 'kill',
  id: string,
  options?: { timeout?: number; force?: boolean; removeVolumes?: boolean; signal?: string }
) {
  try {
    _containerOperationInProgress.value = `${action}-${id}`;
    _containerError.value = null;
    
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
    _containerError.value = errorMessage;
    return false;
  } finally {
    _containerOperationInProgress.value = null;
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
