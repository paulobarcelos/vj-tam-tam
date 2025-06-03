/**
 * State Manager module for centralized application state management
 * Manages media pool state and coordinates state changes via the event bus
 */

import { eventBus } from './eventBus.js'
import { storageFacade } from './facades/storageFacade.js'
import { fileSystemAccessFacade } from './facades/fileSystemAccessFacade.js'

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
    // Add initialization logic here
  }

  /**
   * Initialize the StateManager, load persisted state, and set up listeners.
   */
  async init() {
    // Initialize FileSystemAccessAPI facade first
    try {
      await fileSystemAccessFacade.init()
    } catch (error) {
      console.warn(
        'FileSystemAccessAPI initialization failed, continuing with localStorage only:',
        error
      )
    }

    // Load persisted state
    await this.restoreFromPersistence()

    // Set up listener to save state on updates
    eventBus.on('state.mediaPoolUpdated', () => {
      this.saveCurrentState()
    })
  }

  /**
   * Restore state from localStorage persistence and FileSystemAccessAPI.
   */
  async restoreFromPersistence() {
    try {
      // First, try to restore files from FileSystemAccessAPI if supported
      if (fileSystemAccessFacade.isSupported) {
        console.log('Attempting to restore files from FileSystemAccessAPI...')
        const restoredFiles = await fileSystemAccessFacade.getAllFiles()

        if (restoredFiles.length > 0) {
          console.log(
            `Successfully restored ${restoredFiles.length} files from FileSystemAccessAPI`
          )

          // Ensure all restored files have proper Date objects for addedAt
          const normalizedFiles = restoredFiles.map((file) => ({
            ...file,
            addedAt: file.addedAt instanceof Date ? file.addedAt : new Date(file.addedAt),
          }))

          this.state.mediaPool = normalizedFiles

          // All FileSystemAccessAPI files now need permission since we return metadata-only initially
          const needsPermission = normalizedFiles.some((file) => file.fromFileSystemAPI)

          // Emit restoration event
          eventBus.emit('state.mediaPoolRestored', {
            mediaPool: this.getMediaPool(),
            totalCount: restoredFiles.length,
            source: needsPermission ? 'FileSystemAccessAPI-NeedsPermission' : 'FileSystemAccessAPI',
            needsPermission,
          })
          return // Exit early since we successfully restored from FileSystemAccessAPI
        }
      }

      // Fallback to localStorage metadata restoration
      const persistedState = storageFacade.loadState()
      if (persistedState?.mediaPool?.length > 0) {
        // Create placeholder MediaItems without File objects
        const restoredItems = persistedState.mediaPool.map((item) => ({
          ...item,
          addedAt: new Date(item.addedAt), // Always convert to Date object
          file: null, // Cannot restore File objects from localStorage
          url: null, // Will need to be recreated or show placeholder
        }))

        // Note: This creates a degraded state - user will need to re-add files
        // Future enhancement: Use FileSystemAccessAPI for true persistence
        this.state.mediaPool = restoredItems

        // Emit an event indicating state was restored from persistence
        // Use a different event name to avoid triggering auto-save immediately
        eventBus.emit('state.mediaPoolRestored', {
          mediaPool: this.getMediaPool(),
          totalCount: restoredItems.length,
          source: 'localStorage-metadata',
        })

        console.log(`Restored ${restoredItems.length} items from localStorage (metadata only).`)
      } else {
        console.log('No persisted state found or media pool is empty.')
      }
    } catch (error) {
      console.error('Error during persistence restoration:', error)
    }
  }

  /**
   * Save the current state to localStorage and optionally to FileSystemAccessAPI.
   */
  saveCurrentState() {
    try {
      // Only persist necessary data (exclude File objects and URLs)
      const stateToPersist = {
        mediaPool: this.state.mediaPool.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          mimeType: item.mimeType,
          size: item.size,
          // Safely convert addedAt to ISO string, handling both Date objects and strings
          addedAt: item.addedAt instanceof Date ? item.addedAt.toISOString() : item.addedAt,
        })),
        // Persist other relevant state properties if they exist (e.g., autoPlaybackEnabled)
        // autoPlaybackEnabled: this.state.autoPlaybackEnabled,
        // lastPlaybackState: this.state.lastPlaybackState,
      }
      storageFacade.saveState(stateToPersist)
      console.log('Current state saved to localStorage.')
    } catch (error) {
      console.error('Error saving current state:', error)
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
   * Also store file handles if FileSystemAccessAPI is supported
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

    // Store file handles for the new items if FileSystemAccessAPI is supported
    this.storeFileHandlesAsync(uniqueNewItems)

    // Emit state change notification
    eventBus.emit('state.mediaPoolUpdated', {
      mediaPool: this.getMediaPool(),
      addedItems: uniqueNewItems,
      totalCount: this.state.mediaPool.length,
    })
  }

  /**
   * Store file handles for media items asynchronously
   * @param {MediaItem[]} mediaItems - Items to store handles for
   */
  async storeFileHandlesAsync(mediaItems) {
    if (!fileSystemAccessFacade.isSupported) {
      return
    }

    for (const item of mediaItems) {
      // Only store handles for items that have a valid File object
      if (item.file && typeof item.file.handle !== 'undefined') {
        try {
          const metadata = {
            id: item.id,
            name: item.name,
            type: item.type,
            mimeType: item.mimeType,
            size: item.size,
            // Safely convert addedAt to ISO string, handling both Date objects and strings
            addedAt: item.addedAt instanceof Date ? item.addedAt.toISOString() : item.addedAt,
          }

          await fileSystemAccessFacade.storeFileHandle(item.id, item.file.handle, metadata)
        } catch (error) {
          console.warn(`Failed to store file handle for ${item.name}:`, error)
        }
      }
    }
  }

  /**
   * Remove a media item from the pool by ID
   * Also removes the associated file handle if stored
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

      // Remove file handle if it exists
      this.removeFileHandleAsync(id)

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
   * Remove file handle asynchronously
   * @param {string} id - Media item ID
   */
  async removeFileHandleAsync(id) {
    if (fileSystemAccessFacade.isSupported) {
      try {
        await fileSystemAccessFacade.removeFileHandle(id)
      } catch (error) {
        console.warn(`Failed to remove file handle for ID ${id}:`, error)
      }
    }
  }

  /**
   * Clear all media from the pool
   * Also clears all stored file handles
   */
  clearMediaPool() {
    // Revoke all object URLs
    this.state.mediaPool.forEach((item) => {
      if (item.url) {
        URL.revokeObjectURL(item.url)
      }
    })

    // Clear file handles
    this.clearFileHandlesAsync()

    this.state.mediaPool = []

    // Emit state change notification
    eventBus.emit('state.mediaPoolUpdated', {
      mediaPool: this.getMediaPool(),
      totalCount: 0,
      cleared: true,
    })
  }

  /**
   * Clear all file handles asynchronously
   */
  async clearFileHandlesAsync() {
    if (fileSystemAccessFacade.isSupported) {
      try {
        await fileSystemAccessFacade.clearAllFiles()
      } catch (error) {
        console.warn('Failed to clear file handles:', error)
      }
    }
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
