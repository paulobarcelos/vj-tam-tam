/**
 * Media Processor module for handling file validation and media pool management
 * Validates file types and processes media items for the application
 */

import { eventBus } from './eventBus.js'
import { toastManager } from './toastManager.js'
import { stateManager } from './stateManager.js'
import {
  isSupportedMime,
  isSupportedExtension,
  getMediaTypeFromMime,
  getMediaTypeFromExtension,
  getSupportedTypesString,
} from './constants/mediaTypes.js'

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
    this.nextId = 1
  }

  /**
   * Get file extension from filename
   * @param {string} filename - The filename to extract extension from
   * @returns {string} - Lowercase file extension without dot
   */
  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase()
  }

  /**
   * Check if file type is supported based on extension and MIME type
   * @param {File} file - File object to validate
   * @returns {boolean} - True if file is supported
   */
  isFileSupported(file) {
    const extension = this.getFileExtension(file.name)
    const mimeType = file.type.toLowerCase()

    return isSupportedExtension(extension) || isSupportedMime(mimeType)
  }

  /**
   * Determine media type (image or video) from file
   * @param {File} file - File object
   * @returns {string} - 'image' or 'video'
   */
  getMediaType(file) {
    const extension = this.getFileExtension(file.name)
    const mimeType = file.type.toLowerCase()

    // Try MIME type first, then extension
    const typeFromMime = getMediaTypeFromMime(mimeType)
    if (typeFromMime) return typeFromMime

    const typeFromExtension = getMediaTypeFromExtension(extension)
    return typeFromExtension || 'image' // Default to image if unknown
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
      console.log(`File ${file.name} exists as metadata-only, will attempt upgrade`)
      return false // Allow processing to trigger upgrade
    } else {
      console.log(`File ${file.name} already exists with full data, skipping`)
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
      } else if (this.isFileSupported(file)) {
        supportedFiles.push(file)
      } else {
        unsupportedFiles.push(file)
      }
    })

    // Show error for unsupported files
    if (unsupportedFiles.length > 0) {
      const supportedTypes = getSupportedTypesString()

      toastManager.error(`Some files could not be imported. Supported formats: ${supportedTypes}`)
    }

    // Show info for duplicate files
    if (duplicateFiles.length > 0) {
      toastManager.error(
        `${duplicateFiles.length} file${duplicateFiles.length !== 1 ? 's' : ''} already in media pool (skipped)`
      )
    }

    // Process supported files
    if (supportedFiles.length > 0) {
      try {
        const mediaItems = await Promise.all(
          supportedFiles.map((file) => this.createMediaItem(file))
        )

        // Add to media pool via StateManager (additive behavior)
        stateManager.addMediaToPool(mediaItems)

        // Emit legacy event for backward compatibility
        eventBus.emit('media.filesAdded', {
          files: mediaItems,
          count: mediaItems.length,
        })

        toastManager.success(
          `Added ${mediaItems.length} media file${mediaItems.length !== 1 ? 's' : ''} to pool`
        )
      } catch (error) {
        console.error('Error processing files:', error)
        toastManager.error('Error processing some files. Please try again.')
      }
    }
  }

  /**
   * Create a media item object from a file
   * @param {File} file - File object
   * @returns {Promise<MediaItem>} - Promise resolving to media item
   */
  async createMediaItem(file) {
    // Preserve file handle if it exists (from FileSystemAccessAPI)
    // For drag-and-drop files, file.handle will be undefined
    const mediaItem = {
      id: `media_${this.nextId++}`,
      name: file.name,
      type: this.getMediaType(file),
      mimeType: file.type,
      size: file.size,
      file: file, // This may include file.handle if available
      url: URL.createObjectURL(file),
      addedAt: new Date(),
      // Mark files with handles as coming from FileSystemAccessAPI for proper persistence handling
      fromFileSystemAPI: !!file.handle,
    }

    // Log handle availability for debugging
    if (file.handle) {
      console.log(`File handle available for ${file.name} - will be stored for persistence`)
    } else {
      console.log(`No file handle for ${file.name} - drag-and-drop file, metadata-only persistence`)
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
    eventBus.emit('media.fileRemoved', { id })
  }

  /**
   * Clear all media from pool
   */
  clearPool() {
    stateManager.clearMediaPool()
    eventBus.emit('media.poolCleared')
  }

  /**
   * Get supported file types for user display
   * @returns {string} - Formatted string of supported types
   */
  getSupportedTypesString() {
    return getSupportedTypesString()
  }
}

// Export singleton instance
export const mediaProcessor = new MediaProcessor()
