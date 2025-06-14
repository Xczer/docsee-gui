// Container Store - State management for container operations
import { writable, derived, type Readable } from 'svelte/store';
import type { Container, ContainerInspect, ContainerStats, ContainerState } from '../types/container.js';

export interface ContainerStoreState {
  containers: Container[];
  selectedContainer: Container | null;
  containerDetails: Record<string, ContainerInspect>;
  containerStats: Record<string, ContainerStats>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  autoRefresh: boolean;
  refreshInterval: number; // in milliseconds
}

// Create the container store
function createContainerStore() {
  const { subscribe, set, update } = writable<ContainerStoreState>({
    containers: [],
    selectedContainer: null,
    containerDetails: {},
    containerStats: {},
    isLoading: false,
    error: null,
    lastUpdated: null,
    autoRefresh: true,
    refreshInterval: 5000 // 5 seconds
  });

  return {
    subscribe,
    
    // Loading states
    setLoading: (loading: boolean) => {
      update(state => ({ ...state, isLoading: loading }));
    },

    setError: (error: string | null) => {
      update(state => ({ ...state, error }));
    },

    // Container list management
    setContainers: (containers: Container[]) => {
      update(state => ({
        ...state,
        containers,
        lastUpdated: new Date(),
        error: null
      }));
    },

    addContainer: (container: Container) => {
      update(state => ({
        ...state,
        containers: [...state.containers, container]
      }));
    },

    updateContainer: (containerId: string, updatedContainer: Partial<Container>) => {
      update(state => ({
        ...state,
        containers: state.containers.map(container =>
          container.id === containerId
            ? { ...container, ...updatedContainer }
            : container
        )
      }));
    },

    removeContainer: (containerId: string) => {
      update(state => ({
        ...state,
        containers: state.containers.filter(container => container.id !== containerId),
        selectedContainer: state.selectedContainer?.id === containerId ? null : state.selectedContainer
      }));
    },

    // Selected container
    selectContainer: (container: Container | null) => {
      update(state => ({ ...state, selectedContainer: container }));
    },

    // Container details
    setContainerDetails: (containerId: string, details: ContainerInspect) => {
      update(state => ({
        ...state,
        containerDetails: {
          ...state.containerDetails,
          [containerId]: details
        }
      }));
    },

    // Container stats
    setContainerStats: (containerId: string, stats: ContainerStats) => {
      update(state => ({
        ...state,
        containerStats: {
          ...state.containerStats,
          [containerId]: stats
        }
      }));
    },

    // Auto refresh settings
    setAutoRefresh: (autoRefresh: boolean) => {
      update(state => ({ ...state, autoRefresh }));
    },

    setRefreshInterval: (interval: number) => {
      update(state => ({ ...state, refreshInterval: interval }));
    },

    // Reset store
    reset: () => {
      set({
        containers: [],
        selectedContainer: null,
        containerDetails: {},
        containerStats: {},
        isLoading: false,
        error: null,
        lastUpdated: null,
        autoRefresh: true,
        refreshInterval: 5000
      });
    }
  };
}

export const containerStore = createContainerStore();

// Derived stores for filtered data
export const runningContainers: Readable<Container[]> = derived(
  containerStore,
  $store => $store.containers.filter(container => container.state === 'running')
);

export const stoppedContainers: Readable<Container[]> = derived(
  containerStore,
  $store => $store.containers.filter(container => container.state === 'exited')
);

export const pausedContainers: Readable<Container[]> = derived(
  containerStore,
  $store => $store.containers.filter(container => container.state === 'paused')
);

export const containersByState: Readable<Record<ContainerState, Container[]>> = derived(
  containerStore,
  $store => {
    const grouped: Record<ContainerState, Container[]> = {
      created: [],
      restarting: [],
      running: [],
      removing: [],
      paused: [],
      exited: [],
      dead: []
    };

    $store.containers.forEach(container => {
      if (grouped[container.state]) {
        grouped[container.state].push(container);
      }
    });

    return grouped;
  }
);

export const containerCount: Readable<{
  total: number;
  running: number;
  stopped: number;
  paused: number;
  other: number;
}> = derived(
  containerStore,
  $store => {
    const total = $store.containers.length;
    const running = $store.containers.filter(c => c.state === 'running').length;
    const stopped = $store.containers.filter(c => c.state === 'exited').length;
    const paused = $store.containers.filter(c => c.state === 'paused').length;
    const other = total - running - stopped - paused;

    return { total, running, stopped, paused, other };
  }
);

export const selectedContainerDetails: Readable<ContainerInspect | null> = derived(
  [containerStore],
  ([$store]) => {
    if (!$store.selectedContainer) return null;
    return $store.containerDetails[$store.selectedContainer.id] || null;
  }
);

export const selectedContainerStats: Readable<ContainerStats | null> = derived(
  [containerStore],
  ([$store]) => {
    if (!$store.selectedContainer) return null;
    return $store.containerStats[$store.selectedContainer.id] || null;
  }
);

// Search and filter functionality
export function createContainerFilter() {
  const { subscribe, set, update } = writable({
    searchTerm: '',
    stateFilter: 'all' as ContainerState | 'all',
    labelFilters: {} as Record<string, string>,
    sortBy: 'name' as 'name' | 'created' | 'state' | 'image',
    sortOrder: 'asc' as 'asc' | 'desc'
  });

  return {
    subscribe,
    setSearchTerm: (term: string) => update(state => ({ ...state, searchTerm: term })),
    setStateFilter: (state: ContainerState | 'all') => update(s => ({ ...s, stateFilter: state })),
    setLabelFilter: (key: string, value: string) => 
      update(state => ({ 
        ...state, 
        labelFilters: { ...state.labelFilters, [key]: value }
      })),
    removeLabelFilter: (key: string) => 
      update(state => {
        const { [key]: removed, ...rest } = state.labelFilters;
        return { ...state, labelFilters: rest };
      }),
    setSortBy: (sortBy: 'name' | 'created' | 'state' | 'image') => 
      update(state => ({ ...state, sortBy })),
    setSortOrder: (order: 'asc' | 'desc') => 
      update(state => ({ ...state, sortOrder: order })),
    reset: () => set({
      searchTerm: '',
      stateFilter: 'all',
      labelFilters: {},
      sortBy: 'name',
      sortOrder: 'asc'
    })
  };
}

export const containerFilter = createContainerFilter();

// Filtered and sorted containers
export const filteredContainers: Readable<Container[]> = derived(
  [containerStore, containerFilter],
  ([$store, $filter]) => {
    let filtered = $store.containers;

    // Search filter
    if ($filter.searchTerm) {
      const term = $filter.searchTerm.toLowerCase();
      filtered = filtered.filter(container =>
        container.names.some(name => name.toLowerCase().includes(term)) ||
        container.image.toLowerCase().includes(term) ||
        container.id.toLowerCase().includes(term)
      );
    }

    // State filter
    if ($filter.stateFilter !== 'all') {
      filtered = filtered.filter(container => container.state === $filter.stateFilter);
    }

    // Label filters
    Object.entries($filter.labelFilters).forEach(([key, value]) => {
      filtered = filtered.filter(container => 
        container.labels[key] === value
      );
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch ($filter.sortBy) {
        case 'name':
          aValue = a.names[0] || '';
          bValue = b.names[0] || '';
          break;
        case 'created':
          aValue = a.created;
          bValue = b.created;
          break;
        case 'state':
          aValue = a.state;
          bValue = b.state;
          break;
        case 'image':
          aValue = a.image;
          bValue = b.image;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return $filter.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return $filter.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }
);
