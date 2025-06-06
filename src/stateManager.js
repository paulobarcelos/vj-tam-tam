/**
 * State Manager module for centralized application state management
 * Manages media pool state and coordinates state changes via the event bus
 */

import { eventBus } from './eventBus.js'
import { storageFacade } from './facades/storageFacade.js'
import { fileSystemAccessFacade } from './facades/fileSystemAccessFacade.js'
import { STRINGS, t } from './constants/strings.js'
import { filterRestorableMedia } from './utils/mediaUtils.js'

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
      // Segment settings configuration
      segmentSettings: {
        minDuration: 5, // seconds (default 5s as per Story 2.3 requirements)
        maxDuration: 5, // seconds (default 5s as per Story 2.3 requirements)
        skipStart: 0, // seconds (default 0s)
        skipEnd: 0, // seconds (default 0s)
      },
      // UI settings configuration
      uiSettings: {
        advancedControlsVisible: false, // default collapsed
      },
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
      console.warn(STRINGS.SYSTEM_MESSAGES.stateManager.initError, error)
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
      // Load persisted state first, always
      const persistedState = storageFacade.loadState()
      console.log(STRINGS.SYSTEM_MESSAGES.stateManager.persistedStateLoaded, persistedState)

      // First, try to restore files from FileSystemAccessAPI if supported
      if (fileSystemAccessFacade.isSupported) {
        console.log(STRINGS.SYSTEM_MESSAGES.stateManager.restorationAttempt)
        const restoredFiles = await fileSystemAccessFacade.getAllFiles()

        if (restoredFiles.length > 0) {
          console.log(
            t.get('SYSTEM_MESSAGES.stateManager.restorationSuccess', {
              count: restoredFiles.length,
            })
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

          // Continue to restore segment settings even if FileSystemAccessAPI was used
        } else {
          // No FileSystemAccessAPI files, try localStorage fallback for media
          this.restoreMediaFromLocalStorage(persistedState)
        }
      } else {
        // FileSystemAccessAPI not supported, try localStorage fallback for media
        this.restoreMediaFromLocalStorage(persistedState)
      }

      // Always restore segment settings from localStorage with fallback to defaults
      console.log(
        STRINGS.SYSTEM_MESSAGES.stateManager.aboutToRestoreSegmentSettings,
        persistedState?.segmentSettings
      )
      if (persistedState?.segmentSettings) {
        console.log(
          STRINGS.SYSTEM_MESSAGES.stateManager.segmentSettingsPreRestore,
          this.state.segmentSettings
        )
        this.state.segmentSettings = {
          ...this.state.segmentSettings, // Start with defaults
          ...persistedState.segmentSettings, // Override with persisted values
        }
        console.log(
          STRINGS.SYSTEM_MESSAGES.stateManager.segmentSettingsPostRestore,
          this.state.segmentSettings
        )
        console.log(STRINGS.SYSTEM_MESSAGES.stateManager.segmentSettingsRestored)
      } else {
        console.log(
          STRINGS.SYSTEM_MESSAGES.stateManager.noSegmentSettings,
          this.state.segmentSettings
        )
      }

      // Always restore UI settings from localStorage with fallback to defaults
      console.log(
        STRINGS.SYSTEM_MESSAGES.stateManager.aboutToRestoreUISettings,
        persistedState?.uiSettings
      )
      if (persistedState?.uiSettings) {
        console.log(
          STRINGS.SYSTEM_MESSAGES.stateManager.uiSettingsPreRestore,
          this.state.uiSettings
        )
        this.state.uiSettings = {
          ...this.state.uiSettings, // Start with defaults
          ...persistedState.uiSettings, // Override with persisted values
        }
        console.log(
          STRINGS.SYSTEM_MESSAGES.stateManager.uiSettingsPostRestore,
          this.state.uiSettings
        )
        console.log(STRINGS.SYSTEM_MESSAGES.stateManager.uiSettingsRestored)
      } else {
        console.log(STRINGS.SYSTEM_MESSAGES.stateManager.noUISettings, this.state.uiSettings)
      }
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.stateManager.restorationError, error)
    }
  }

  /**
   * Restore media from localStorage metadata
   * @param {Object} persistedState - The persisted state from localStorage
   * @private
   */
  restoreMediaFromLocalStorage(persistedState) {
    if (persistedState?.mediaPool?.length > 0) {
      // Filter out drag & drop files since they cannot be truly restored
      // Only keep files that were originally from FileSystemAccessAPI
      const restorableItems = filterRestorableMedia(persistedState.mediaPool)
      const removedDragDropCount = persistedState.mediaPool.length - restorableItems.length

      if (removedDragDropCount > 0) {
        console.log(
          t.get('SYSTEM_MESSAGES.stateManager.cleanedUp', { count: removedDragDropCount })
        )
      }

      if (restorableItems.length > 0) {
        // Create placeholder MediaItems without File objects for FileSystemAccessAPI files only
        const restoredItems = restorableItems.map((item) => ({
          ...item,
          addedAt: new Date(item.addedAt), // Always convert to Date object
          file: null, // Cannot restore File objects from localStorage
          url: null, // Will need to be recreated or show placeholder
        }))

        this.state.mediaPool = restoredItems

        // Emit an event indicating state was restored from persistence
        // Use a different event name to avoid triggering auto-save immediately
        eventBus.emit('state.mediaPoolRestored', {
          mediaPool: this.getMediaPool(),
          totalCount: restoredItems.length,
          source: 'localStorage-metadata',
        })

        console.log(t.get('SYSTEM_MESSAGES.stateManager.restored', { count: restoredItems.length }))
      } else {
        console.log(STRINGS.SYSTEM_MESSAGES.stateManager.restorationNone)
      }
    } else {
      console.log(STRINGS.SYSTEM_MESSAGES.stateManager.restorationEmpty)
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
          // Persist video duration if available
          ...(item.duration && { duration: item.duration }),
        })),
        // Persist segment settings
        segmentSettings: this.state.segmentSettings,
        // Persist UI settings
        uiSettings: this.state.uiSettings,
        // Persist other relevant state properties if they exist (e.g., autoPlaybackEnabled)
        // autoPlaybackEnabled: this.state.autoPlaybackEnabled,
        // lastPlaybackState: this.state.lastPlaybackState,
      }
      storageFacade.saveState(stateToPersist)
      console.log(STRINGS.SYSTEM_MESSAGES.stateManager.stateSaved)
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.stateManager.stateSaveError, error)
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
      console.warn(STRINGS.SYSTEM_MESSAGES.stateManager.invalidInput)
      return
    }

    const existingItems = this.state.mediaPool
    const upgradedItems = []
    const actuallyNewItems = []

    // Process each new item to check for duplicates and metadata-only upgrades
    newMediaItems.forEach((newItem) => {
      const existingIndex = existingItems.findIndex(
        (existingItem) => existingItem.name === newItem.name && existingItem.size === newItem.size
      )

      if (existingIndex !== -1) {
        const existingItem = existingItems[existingIndex]

        // Check if existing item is metadata-only (no file or url) and new item has actual file
        if ((!existingItem.file || !existingItem.url) && newItem.file && newItem.url) {
          console.log(t.get('SYSTEM_MESSAGES.stateManager.fileUpgrade', { fileName: newItem.name }))

          // Upgrade the existing item with the actual File object and URL
          const upgradedItem = {
            ...existingItem, // Keep existing metadata (id, addedAt, etc.)
            file: newItem.file,
            url: newItem.url,
            // Update any other properties that might have changed
            mimeType: newItem.mimeType,
            type: newItem.type,
          }

          // Replace the existing item in the pool
          this.state.mediaPool[existingIndex] = upgradedItem
          upgradedItems.push(upgradedItem)
        } else {
          // True duplicate - skip
          console.log(
            t.get('SYSTEM_MESSAGES.stateManager.fileDuplicate', { fileName: newItem.name })
          )
        }
      } else {
        // Truly new item
        actuallyNewItems.push(newItem)
      }
    })

    // Add truly new items to the pool
    if (actuallyNewItems.length > 0) {
      this.state.mediaPool = [...this.state.mediaPool, ...actuallyNewItems]
    }

    // Store file handles for new and upgraded items
    if (actuallyNewItems.length > 0) {
      this.storeFileHandlesAsync(actuallyNewItems)
    }
    if (upgradedItems.length > 0) {
      this.storeFileHandlesAsync(upgradedItems)
    }

    // Emit state change notification if anything was added or upgraded
    if (actuallyNewItems.length > 0 || upgradedItems.length > 0) {
      eventBus.emit('state.mediaPoolUpdated', {
        mediaPool: this.getMediaPool(),
        addedItems: actuallyNewItems,
        upgradedItems: upgradedItems,
        totalCount: this.state.mediaPool.length,
      })
    }
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
            // Persist video duration if available
            ...(item.duration && { duration: item.duration }),
          }

          await fileSystemAccessFacade.storeFileHandle(item.id, item.file.handle, metadata)
        } catch (error) {
          console.warn(
            t.get('SYSTEM_MESSAGES.stateManager.handleStoreFailed', { fileName: item.name }),
            error
          )
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
        console.warn(t.get('SYSTEM_MESSAGES.stateManager.handleRemoveFailed', { id }), error)
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
        console.warn(STRINGS.SYSTEM_MESSAGES.stateManager.handlesClearFailed, error)
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

  /**
   * Get the current segment settings
   * @returns {Object} - Segment settings configuration
   */
  getSegmentSettings() {
    return { ...this.state.segmentSettings } // Return a copy to prevent external mutation
  }

  /**
   * Update segment settings
   * @param {Object} newSettings - New segment settings (partial update supported)
   */
  updateSegmentSettings(newSettings) {
    if (typeof newSettings !== 'object' || newSettings === null) {
      console.warn(STRINGS.SYSTEM_MESSAGES.stateManager.invalidSegmentSettings)
      return
    }

    // Validate settings before applying
    const validatedSettings = this.validateSegmentSettings(newSettings)

    this.state.segmentSettings = {
      ...this.state.segmentSettings,
      ...validatedSettings,
    }

    // Save to localStorage
    this.saveCurrentState()

    // Emit event for settings change
    eventBus.emit('state.segmentSettingsUpdated', {
      segmentSettings: this.getSegmentSettings(),
    })
  }

  /**
   * Validate segment settings values
   * @param {Object} settings - Settings to validate
   * @returns {Object} - Validated settings
   * @private
   */
  validateSegmentSettings(settings) {
    const validated = {}

    // Validate minDuration (1-30 seconds)
    if (
      typeof settings.minDuration === 'number' &&
      settings.minDuration >= 1 &&
      settings.minDuration <= 30
    ) {
      validated.minDuration = settings.minDuration
    }

    // Validate maxDuration (1-30 seconds)
    if (
      typeof settings.maxDuration === 'number' &&
      settings.maxDuration >= 1 &&
      settings.maxDuration <= 30
    ) {
      validated.maxDuration = settings.maxDuration
    }

    // Validate skipStart (0+ seconds)
    if (typeof settings.skipStart === 'number' && settings.skipStart >= 0) {
      validated.skipStart = settings.skipStart
    }

    // Validate skipEnd (0+ seconds)
    if (typeof settings.skipEnd === 'number' && settings.skipEnd >= 0) {
      validated.skipEnd = settings.skipEnd
    }

    return validated
  }

  /**
   * Get the current UI settings
   * @returns {Object} - UI settings configuration
   */
  getUISettings() {
    return { ...this.state.uiSettings } // Return a copy to prevent external mutation
  }

  /**
   * Update UI settings
   * @param {Object} newSettings - New UI settings (partial update supported)
   */
  updateUISettings(newSettings) {
    if (typeof newSettings !== 'object' || newSettings === null) {
      console.warn(STRINGS.SYSTEM_MESSAGES.stateManager.invalidUISettings)
      return
    }

    this.state.uiSettings = {
      ...this.state.uiSettings,
      ...newSettings,
    }

    // Save to localStorage
    this.saveCurrentState()

    // Emit event for UI settings change
    eventBus.emit('state.uiSettingsUpdated', {
      uiSettings: this.getUISettings(),
    })
  }
}

// Export singleton instance
export const stateManager = new StateManager()
