/**
 * Media Processor module for handling file validation and media pool management
 * Validates file types and processes media items for the application
 */

import { eventBus } from './eventBus.js'
import { toastManager } from './toastManager.js'

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
 */

// Supported file types as defined in AC 1.1, 1.2, 1.4
const SUPPORTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'heic', 'webp']
const SUPPORTED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm']
const SUPPORTED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/heic', 'image/webp']
const SUPPORTED_VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/webm']

class MediaProcessor {
  constructor() {
    this.mediaPool = new Map()
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

    const isSupportedImage =
      SUPPORTED_IMAGE_EXTENSIONS.includes(extension) || SUPPORTED_IMAGE_MIMES.includes(mimeType)

    const isSupportedVideo =
      SUPPORTED_VIDEO_EXTENSIONS.includes(extension) || SUPPORTED_VIDEO_MIMES.includes(mimeType)

    return isSupportedImage || isSupportedVideo
  }

  /**
   * Determine media type (image or video) from file
   * @param {File} file - File object
   * @returns {string} - 'image' or 'video'
   */
  getMediaType(file) {
    const extension = this.getFileExtension(file.name)
    const mimeType = file.type.toLowerCase()

    const isImage =
      SUPPORTED_IMAGE_EXTENSIONS.includes(extension) || SUPPORTED_IMAGE_MIMES.includes(mimeType)

    return isImage ? 'image' : 'video'
  }

  /**
   * Process and validate files from drag and drop
   * @param {File[]} files - Array of File objects to process
   */
  async processFiles(files) {
    const supportedFiles = []
    const unsupportedFiles = []

    // Validate each file
    files.forEach((file) => {
      if (this.isFileSupported(file)) {
        supportedFiles.push(file)
      } else {
        unsupportedFiles.push(file)
      }
    })

    // Show error for unsupported files
    if (unsupportedFiles.length > 0) {
      const fileNames = unsupportedFiles.map((f) => f.name).join(', ')
      const supportedTypes = [
        ...SUPPORTED_IMAGE_EXTENSIONS.map((ext) => ext.toUpperCase()),
        ...SUPPORTED_VIDEO_EXTENSIONS.map((ext) => ext.toUpperCase()),
      ].join(', ')

      toastManager.error(
        `Unsupported file type(s): ${fileNames}. Supported formats: ${supportedTypes}`
      )
    }

    // Process supported files
    if (supportedFiles.length > 0) {
      try {
        const mediaItems = await Promise.all(
          supportedFiles.map((file) => this.createMediaItem(file))
        )

        // Add to media pool
        mediaItems.forEach((item) => {
          this.addToPool(item)
        })

        // Notify other modules
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
    return {
      id: `media_${this.nextId++}`,
      name: file.name,
      type: this.getMediaType(file),
      mimeType: file.type,
      size: file.size,
      file: file,
      url: URL.createObjectURL(file),
      addedAt: new Date(),
    }
  }

  /**
   * Add media item to the pool
   * @param {MediaItem} mediaItem - Media item to add
   */
  addToPool(mediaItem) {
    this.mediaPool.set(mediaItem.id, mediaItem)
  }

  /**
   * Get all media items from the pool
   * @returns {MediaItem[]} - Array of media items
   */
  getAllMedia() {
    return Array.from(this.mediaPool.values())
  }

  /**
   * Remove media item from pool
   * @param {string} id - Media item ID
   */
  removeFromPool(id) {
    const mediaItem = this.mediaPool.get(id)
    if (mediaItem) {
      // Revoke object URL to free memory
      URL.revokeObjectURL(mediaItem.url)
      this.mediaPool.delete(id)

      eventBus.emit('media.fileRemoved', { id })
    }
  }

  /**
   * Clear all media from pool
   */
  clearPool() {
    // Revoke all object URLs
    this.mediaPool.forEach((item) => {
      URL.revokeObjectURL(item.url)
    })

    this.mediaPool.clear()
    eventBus.emit('media.poolCleared')
  }

  /**
   * Get supported file types for user display
   * @returns {string} - Formatted string of supported types
   */
  getSupportedTypesString() {
    const imageTypes = SUPPORTED_IMAGE_EXTENSIONS.map((ext) => ext.toUpperCase())
    const videoTypes = SUPPORTED_VIDEO_EXTENSIONS.map((ext) => ext.toUpperCase())
    return [...imageTypes, ...videoTypes].join(', ')
  }
}

// Export singleton instance
export const mediaProcessor = new MediaProcessor()
