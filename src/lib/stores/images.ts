import { writable, type Writable } from 'svelte/store';
import type { ImageSummary, ImageInspect } from '../types/image.js';
import { 
  getImages, 
  getImageDetails, 
  removeImage,
  pullImage,
  handleTauriError 
} from '../services/tauri-commands.js';

// Images store
export const images: Writable<ImageSummary[]> = writable([]);
export const selectedImage: Writable<ImageSummary | null> = writable(null);
export const imageDetails: Writable<ImageInspect | null> = writable(null);

// Loading states
export const isLoadingImages = writable(false);
export const isLoadingImageDetails = writable(false);
export const imageOperationInProgress = writable<string | null>(null);

// Filter and sorting
export const imageFilter = writable('all'); // 'all', 'tagged', 'untagged'
export const imageSortBy = writable('created'); // 'name', 'created', 'size'
export const imageSearchTerm = writable('');

// Error store
export const imageError = writable<string | null>(null);

// Image operations
export async function loadImages(showAll: boolean = false) {
  try {
    isLoadingImages.set(true);
    imageError.set(null);
    
    const imageList = await getImages(showAll);
    images.set(imageList);
    return imageList;
  } catch (error) {
    console.error('Failed to load images:', error);
    const errorMessage = handleTauriError(error);
    imageError.set(errorMessage);
    return [];
  } finally {
    isLoadingImages.set(false);
  }
}

export async function loadImageDetails(id: string) {
  try {
    isLoadingImageDetails.set(true);
    imageError.set(null);
    
    const details = await getImageDetails(id);
    imageDetails.set(details);
    return details;
  } catch (error) {
    console.error('Failed to load image details:', error);
    const errorMessage = handleTauriError(error);
    imageError.set(errorMessage);
    return null;
  } finally {
    isLoadingImageDetails.set(false);
  }
}

export async function performImageAction(
  action: 'remove' | 'pull',
  id: string,
  options?: { force?: boolean; noPrune?: boolean; imageName?: string; tag?: string }
) {
  try {
    imageOperationInProgress.set(`${action}-${id}`);
    imageError.set(null);
    
    switch (action) {
      case 'remove':
        await removeImage(id, options?.force || false, options?.noPrune || false);
        break;
      case 'pull':
        if (!options?.imageName) {
          throw new Error('Image name is required for pull operation');
        }
        await pullImage(options.imageName, options.tag);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Refresh images list after successful operation
    await loadImages();
    return true;
  } catch (error) {
    console.error(`Failed to ${action} image:`, error);
    const errorMessage = handleTauriError(error);
    imageError.set(errorMessage);
    return false;
  } finally {
    imageOperationInProgress.set(null);
  }
}

// Convenience function for remove action
export const removeImageAction = (id: string, force?: boolean, noPrune?: boolean) => 
  performImageAction('remove', id, { force, noPrune });

// Convenience function for pull action
export const pullImageAction = (imageName: string, tag?: string) => 
  performImageAction('pull', imageName, { imageName, tag });

// Derived stores for filtered and sorted images
import { derived } from 'svelte/store';

export const filteredImages = derived(
  [images, imageFilter, imageSearchTerm],
  ([$images, $filter, $searchTerm]) => {
    let filtered = $images;
    
    // Apply filter
    if ($filter !== 'all') {
      filtered = filtered.filter(image => {
        switch ($filter) {
          case 'tagged':
            return image.repo_tags && image.repo_tags.length > 0 && !image.repo_tags.includes('<none>:<none>');
          case 'untagged':
            return !image.repo_tags || image.repo_tags.length === 0 || image.repo_tags.includes('<none>:<none>');
          default:
            return true;
        }
      });
    }
    
    // Apply search filter
    if ($searchTerm) {
      const term = $searchTerm.toLowerCase();
      filtered = filtered.filter(image => 
        image.repo_tags.some(tag => tag.toLowerCase().includes(term)) ||
        image.id.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }
);

export const sortedImages = derived(
  [filteredImages, imageSortBy],
  ([$filteredImages, $sortBy]) => {
    const sorted = [...$filteredImages];
    
    sorted.sort((a, b) => {
      switch ($sortBy) {
        case 'name':
          const aName = a.repo_tags[0] || a.id;
          const bName = b.repo_tags[0] || b.id;
          return aName.localeCompare(bName);
        case 'created':
          return b.created - a.created; // Newest first
        case 'size':
          return b.size - a.size; // Largest first
        default:
          return 0;
      }
    });
    
    return sorted;
  }
);

// Auto-refresh functionality
let imageRefreshInterval: number | null = null;

export function startImageAutoRefresh(intervalMs: number = 10000) {
  if (imageRefreshInterval) {
    clearInterval(imageRefreshInterval);
  }
  
  imageRefreshInterval = setInterval(async () => {
    await loadImages();
  }, intervalMs);
}

export function stopImageAutoRefresh() {
  if (imageRefreshInterval) {
    clearInterval(imageRefreshInterval);
    imageRefreshInterval = null;
  }
}

// Cleanup function
export function cleanupImages() {
  stopImageAutoRefresh();
}
