/**
 * Media Processor module for handling file validation and media pool management
 * Validates file types and processes media items for the application
 */

import { eventBus } from './eventBus.js'
import { stateManager } from './stateManager.js'
import { toastManager } from './toastManager.js'
import { STRINGS } from './constants/strings.js'
import { t } from './constants/strings.js'
import { isFileSupported, getMediaType, getSupportedTypes } from './utils/mediaUtils.js'
import { MEDIA_EVENTS } from './constants/events.js'

/**
 * @typedef {Object} MediaItem
 * @property {string} id - Unique identifier for the media item
 * @property {string} name - Original filename
 * @property {string} type - File type (image/video)
 * @property {string} mimeType - MIME type of the file
 * @property {number} size - File size in bytes
 * @property {File} file - Original File object
 * @property {string} url - Object URL for the file
 * @property {Date} addedAt - Timestamp when added
 * @property {boolean} fromFileSystemAPI - Whether file was added via FileSystemAccessAPI (persistent) or drag-and-drop (temporary)
 */

class MediaProcessor {
  constructor() {
    // Using random IDs eliminates collision issues on app restart
  }

  /**
   * Check if a file already exists in the media pool and should be skipped
   * @param {File} file - File object to check
   * @returns {boolean} - True if file should be skipped (real duplicate), false if it should be processed (new or upgrade candidate)
   */
  isFileAlreadyInPool(file) {
    const existingFiles = stateManager.getMediaPool()
    const existingFile = existingFiles.find(
      (mediaItem) => mediaItem.name === file.name && mediaItem.size === file.size
    )

    if (!existingFile) {
      // File doesn't exist, should be processed
      return false
    }

    // File exists - check if it's metadata-only (upgrade candidate) or real duplicate
    const isMetadataOnly = !existingFile.file || !existingFile.url

    if (isMetadataOnly) {
      console.log(
        t.get('SYSTEM_MESSAGES.mediaProcessor.fileMetadataUpgrade', { fileName: file.name })
      )
      return false // Allow processing to trigger upgrade
    } else {
      console.log(
        t.get('SYSTEM_MESSAGES.mediaProcessor.fileDuplicateSkip', { fileName: file.name })
      )
      return true // Real duplicate, skip
    }
  }

  /**
   * Process and validate files from drag and drop or file picker
   * @param {File[]} files - Array of File objects to process
   */
  async processFiles(files) {
    const supportedFiles = []
    const unsupportedFiles = []
    const duplicateFiles = []

    // Validate each file
    files.forEach((file) => {
      if (this.isFileAlreadyInPool(file)) {
        duplicateFiles.push(file)
      } else if (isFileSupported(file)) {
        supportedFiles.push(file)
      } else {
        unsupportedFiles.push(file)
      }
    })

    // Show toast for unsupported files if any
    if (unsupportedFiles.length > 0) {
      const supportedTypes = getSupportedTypes()
      toastManager.error(t.importFailed(supportedTypes))
    }

    // Show toast for duplicate files if any
    if (duplicateFiles.length > 0) {
      toastManager.error(t.filesSkipped(duplicateFiles.length))
    }

    // Process supported files
    if (supportedFiles.length > 0) {
      try {
        const mediaItems = await Promise.all(
          supportedFiles.map((file) => this.createMediaItem(file))
        )

        // Add to media pool via StateManager (additive behavior)
        stateManager.addMediaToPool(mediaItems)

        // Emit events for successful additions
        if (mediaItems.length > 0) {
          eventBus.emit(MEDIA_EVENTS.FILES_ADDED, {
            files: mediaItems,
            count: mediaItems.length,
          })

          // Show success toast
          toastManager.success(t.filesAdded(mediaItems.length))
        }
      } catch (error) {
        console.error(STRINGS.SYSTEM_MESSAGES.mediaProcessor.fileProcessingError, error)
        toastManager.error(STRINGS.USER_MESSAGES.notifications.error.fileProcessingFailed)
      }
    }
  }

  /**
   * Get video duration from file
   * @param {File} file - Video file object
   * @returns {Promise<number|null>} - Promise resolving to duration in seconds or null if error
   */
  async getVideoDuration(file) {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      const url = URL.createObjectURL(file)

      video.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url)
        resolve(video.duration)
      })

      video.addEventListener('error', () => {
        URL.revokeObjectURL(url)
        resolve(null)
      })

      video.src = url
    })
  }

  /**
   * Create a media item object from a file
   * @param {File} file - File object
   * @returns {Promise<MediaItem>} - Promise resolving to media item
   */
  async createMediaItem(file) {
    // Preserve file handle if it exists (from FileSystemAccessAPI)
    // For drag-and-drop files, file.handle will be undefined
    const mediaType = getMediaType(file)

    const mediaItem = {
      id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: mediaType,
      mimeType: file.type,
      size: file.size,
      file: file, // This may include file.handle if available
      url: URL.createObjectURL(file),
      addedAt: new Date(),
      // Mark files with handles as coming from FileSystemAccessAPI for proper persistence handling
      fromFileSystemAPI: !!file.handle,
    }

    // For video files, try to get duration
    if (mediaType === 'video') {
      try {
        const duration = await this.getVideoDuration(file)
        if (duration && duration > 0) {
          mediaItem.duration = duration
        }
      } catch (error) {
        // Duration detection failed, continue without duration
        console.warn(`Failed to detect duration for ${file.name}:`, error)
      }
    }

    // Log handle availability for debugging
    if (file.handle) {
      console.log(
        t.get('SYSTEM_MESSAGES.mediaProcessor.fileHandleAvailable', { fileName: file.name })
      )
    } else {
      console.log(
        t.get('SYSTEM_MESSAGES.mediaProcessor.fileHandleUnavailable', { fileName: file.name })
      )
    }

    return mediaItem
  }

  /**
   * Get all media items from the pool
   * @returns {MediaItem[]} - Array of media items
   */
  getAllMedia() {
    return stateManager.getMediaPool()
  }

  /**
   * Remove media item from pool
   * @param {string} id - Media item ID
   */
  removeFromPool(id) {
    stateManager.removeMediaFromPool(id)
    eventBus.emit(MEDIA_EVENTS.FILE_REMOVED, { id })
  }

  /**
   * Clear all media from pool
   */
  clearPool() {
    stateManager.clearMediaPool()
    eventBus.emit(MEDIA_EVENTS.POOL_CLEARED)
  }

  /**
   * Get supported file types for user display
   * @returns {string} - Formatted string of supported types
   */
  getSupportedTypesString() {
    return getSupportedTypes()
  }
}

// Export singleton instance
export const mediaProcessor = new MediaProcessor()
