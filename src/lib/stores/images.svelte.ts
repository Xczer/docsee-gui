// src/lib/stores/images.svelte.ts
import type { ImageSummary, ImageInspect } from '../types/image';
import {
  getImages,
  getImageDetails,
  removeImage,
  pullImage,
  handleTauriError
} from '../services/tauri-commands';

// Use a class-based approach to encapsulate the state
class ImagesStore {
  private _images = $state<ImageSummary[]>([]);
  private _selectedImage = $state<ImageSummary | null>(null);
  private _imageDetails = $state<ImageInspect | null>(null);

  // Loading states
  private _isLoadingImages = $state<boolean>(false);
  private _isLoadingImageDetails = $state<boolean>(false);
  private _imageOperationInProgress = $state<string[]>([]);

  // Filter and sorting
  private _imageFilter = $state<string>('all');
  private _imageSortBy = $state<string>('name');
  private _imageSearchTerm = $state<string>('');

  // Error store
  private _imageError = $state<string | null>(null);

  // Auto-refresh interval
  private imageRefreshInterval: ReturnType<typeof setInterval> | null = null;

  // Getters
  get images() {
    return this._images;
  }

  get selectedImage() {
    return this._selectedImage;
  }

  get imageDetails() {
    return this._imageDetails;
  }

  get isLoadingImages() {
    return this._isLoadingImages;
  }

  get isLoadingImageDetails() {
    return this._isLoadingImageDetails;
  }

  get imageOperationInProgress() {
    return this._imageOperationInProgress;
  }

  get imageFilter() {
    return this._imageFilter;
  }

  get imageSortBy() {
    return this._imageSortBy;
  }

  get imageSearchTerm() {
    return this._imageSearchTerm;
  }

  get imageError() {
    return this._imageError;
  }

  // Derived getters for filtered and sorted images
  get filteredImages() {
    let filtered = this._images;

    // Apply usage filter
    if (this._imageFilter !== 'all') {
      filtered = filtered.filter(image => {
        switch (this._imageFilter) {
          case 'used':
            return image.containers > 0;
          case 'unused':
            return image.containers === 0;
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
    if (this._imageSearchTerm) {
      const term = this._imageSearchTerm.toLowerCase();
      filtered = filtered.filter(image => {
        const repoTags = image.repo_tags?.join(' ').toLowerCase() || '';
        const imageId = image.id.toLowerCase();
        return repoTags.includes(term) || imageId.includes(term);
      });
    }

    return filtered;
  }

  get sortedImages() {
    const filtered = this.filteredImages;
    const sorted = [...filtered];

    sorted.sort((a, b) => {
      switch (this._imageSortBy) {
        case 'name': {
          const aName = a.repo_tags?.[0] || a.id;
          const bName = b.repo_tags?.[0] || b.id;
          return aName.localeCompare(bName);
        }
        case 'size':
          return b.size - a.size; // Largest first
        case 'created':
          return b.created - a.created; // Newest first
        case 'containers':
          return b.containers - a.containers; // Most used first
        default:
          return 0;
      }
    });

    return sorted;
  }

  // Setter methods
  setSelectedImage(image: ImageSummary | null) {
    this._selectedImage = image;
  }

  setImageFilter(filter: string) {
    this._imageFilter = filter;
  }

  setImageSortBy(sortBy: string) {
    this._imageSortBy = sortBy;
  }

  setImageSearchTerm(term: string) {
    this._imageSearchTerm = term;
  }

  setImageError(error: string | null) {
    this._imageError = error;
  }

  // Image operations
  async loadImages(all = false) {
    try {
      this._isLoadingImages = true;
      this._imageError = null;

      const imageList = await getImages(all);
      this._images.length = 0;
      this._images.push(...imageList);
      return imageList;
    } catch (error) {
      console.error('Failed to load images:', error);
      const errorMessage = handleTauriError(error);
      this._imageError = errorMessage;
      return [];
    } finally {
      this._isLoadingImages = false;
    }
  }

  async loadImageDetails(id: string) {
    try {
      this._isLoadingImageDetails = true;
      this._imageError = null;

      const details = await getImageDetails(id);
      this._imageDetails = details;
      return details;
    } catch (error) {
      console.error('Failed to load image details:', error);
      const errorMessage = handleTauriError(error);
      this._imageError = errorMessage;
      return null;
    } finally {
      this._isLoadingImageDetails = false;
    }
  }

  async performImageAction(
    action: 'remove' | 'pull',
    imageIdOrName: string,
    options?: { force?: boolean; noPrune?: boolean; tag?: string }
  ) {
    try {
      // Add to operations in progress
      this._imageOperationInProgress.push(`${action}-${imageIdOrName}`);
      this._imageError = null;

      switch (action) {
        case 'remove':
          await removeImage(imageIdOrName, options?.force || false, options?.noPrune || false);
          break;
        case 'pull':
          await pullImage(imageIdOrName, options?.tag);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Refresh images list after successful operation
      await this.loadImages();
      return true;
    } catch (error) {
      console.error(`Failed to ${action} image:`, error);
      const errorMessage = handleTauriError(error);
      this._imageError = errorMessage;
      return false;
    } finally {
      // Remove from operations in progress
      const index = this._imageOperationInProgress.indexOf(`${action}-${imageIdOrName}`);
      if (index > -1) {
        this._imageOperationInProgress.splice(index, 1);
      }
    }
  }

  // Convenience methods for specific actions
  async removeImage(id: string, force?: boolean, noPrune?: boolean) {
    return this.performImageAction('remove', id, { force, noPrune });
  }

  async pullImage(name: string, tag?: string) {
    return this.performImageAction('pull', name, { tag });
  }

  // Auto-refresh functionality
  startAutoRefresh(intervalMs = 10000) {
    if (this.imageRefreshInterval) {
      clearInterval(this.imageRefreshInterval);
    }

    this.imageRefreshInterval = setInterval(async () => {
      await this.loadImages();
    }, intervalMs);
  }

  stopAutoRefresh() {
    if (this.imageRefreshInterval) {
      clearInterval(this.imageRefreshInterval);
      this.imageRefreshInterval = null;
    }
  }

  // Cleanup function
  cleanup() {
    this.stopAutoRefresh();
  }

  // Helper methods
  getImageDisplayName(image: ImageSummary): string {
    if (image.repo_tags && image.repo_tags.length > 0 && image.repo_tags[0] !== '<none>:<none>') {
      return image.repo_tags[0];
    }
    return image.id.substring(7, 19); // Remove sha256: prefix and truncate
  }

  getImageRepository(image: ImageSummary): string {
    if (image.repo_tags && image.repo_tags.length > 0 && image.repo_tags[0] !== '<none>:<none>') {
      const [repo] = image.repo_tags[0].split(':');
      return repo;
    }
    return '<none>';
  }

  getImageTag(image: ImageSummary): string {
    if (image.repo_tags && image.repo_tags.length > 0 && image.repo_tags[0] !== '<none>:<none>') {
      const parts = image.repo_tags[0].split(':');
      return parts.length > 1 ? parts[parts.length - 1] : 'latest';
    }
    return '<none>';
  }

  formatImageSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  formatImageCreated(timestamp: number): string {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
    return `${Math.floor(diff / 31536000)}y ago`;
  }

  isImageInUse(image: ImageSummary): boolean {
    return image.containers > 0;
  }
}

// Create and export a singleton instance
export const imagesStore = new ImagesStore();
