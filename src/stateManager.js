/**
 * State Manager module for centralized application state management
 * Manages media pool state and coordinates state changes via the event bus
 */

import { eventBus } from './eventBus.js'

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

class StateManager {
  constructor() {
    this.state = {
      mediaPool: [],
    }
  }

  /**
   * Get the current media pool
   * @returns {MediaItem[]} - Array of media items
   */
  getMediaPool() {
    return [...this.state.mediaPool] // Return a copy to prevent external mutation
  }

  /**
   * Add media items to the existing media pool (additive behavior)
   * @param {MediaItem[]} newMediaItems - Array of new media items to add
   */
  addMediaToPool(newMediaItems) {
    if (!Array.isArray(newMediaItems)) {
      console.warn('StateManager.addMediaToPool: newMediaItems must be an array')
      return
    }

    // Filter out duplicates based on name and size
    const existingItems = this.state.mediaPool
    const uniqueNewItems = newMediaItems.filter((newItem) => {
      return !existingItems.some(
        (existingItem) => existingItem.name === newItem.name && existingItem.size === newItem.size
      )
    })

    // Add unique items to the pool
    this.state.mediaPool = [...this.state.mediaPool, ...uniqueNewItems]

    // Emit state change notification
    eventBus.emit('state.mediaPoolUpdated', {
      mediaPool: this.getMediaPool(),
      addedItems: uniqueNewItems,
      totalCount: this.state.mediaPool.length,
    })
  }

  /**
   * Remove a media item from the pool by ID
   * @param {string} id - Media item ID to remove
   */
  removeMediaFromPool(id) {
    const itemIndex = this.state.mediaPool.findIndex((item) => item.id === id)

    if (itemIndex !== -1) {
      const removedItem = this.state.mediaPool[itemIndex]

      // Revoke object URL to free memory
      if (removedItem.url) {
        URL.revokeObjectURL(removedItem.url)
      }

      this.state.mediaPool.splice(itemIndex, 1)

      // Emit state change notification
      eventBus.emit('state.mediaPoolUpdated', {
        mediaPool: this.getMediaPool(),
        removedItem: removedItem,
        totalCount: this.state.mediaPool.length,
      })
    }
  }

  /**
   * Clear all media from the pool
   */
  clearMediaPool() {
    // Revoke all object URLs
    this.state.mediaPool.forEach((item) => {
      if (item.url) {
        URL.revokeObjectURL(item.url)
      }
    })

    this.state.mediaPool = []

    // Emit state change notification
    eventBus.emit('state.mediaPoolUpdated', {
      mediaPool: this.getMediaPool(),
      totalCount: 0,
      cleared: true,
    })
  }

  /**
   * Get a specific media item by ID
   * @param {string} id - Media item ID
   * @returns {MediaItem|null} - The media item or null if not found
   */
  getMediaById(id) {
    return this.state.mediaPool.find((item) => item.id === id) || null
  }

  /**
   * Get the total count of media items
   * @returns {number} - Total number of media items
   */
  getMediaCount() {
    return this.state.mediaPool.length
  }

  /**
   * Check if the media pool is empty
   * @returns {boolean} - True if media pool is empty
   */
  isMediaPoolEmpty() {
    return this.state.mediaPool.length === 0
  }
}

// Export singleton instance
export const stateManager = new StateManager()
