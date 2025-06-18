/**
 * State Manager module for centralized application state management
 * Manages media pool state and coordinates state changes via the event bus
 */

import { eventBus } from './eventBus.js'
import { storageFacade } from './facades/storageFacade.js'
import { fileSystemAccessFacade } from './facades/fileSystemAccessFacade.js'
import { STRINGS, t } from './constants/strings.js'
import { filterRestorableMedia } from './utils/mediaUtils.js'
import { STATE_EVENTS, TEXT_POOL_EVENTS } from './constants/events.js'

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
      // Text pool for text overlay messages
      textPool: [],
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
      // Text frequency for text overlay display (0-1 normalized scale)
      textFrequency: 0.5, // Default middle value (equivalent to step 4 of 8)
      // FileSystem Access API state tracking
      fileSystemAPIWorking: null, // null = unknown, true = working, false = not working
    }
    // Text pool configuration
    this.textPoolMaxSize = 1000 // Configurable limit
    this.textPoolIndex = new Set() // Fast duplicate lookup
    this.textPoolStats = {
      totalAdditions: 0,
      duplicatesRejected: 0,
      averageTextLength: 0,
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
    eventBus.on(STATE_EVENTS.MEDIA_POOL_UPDATED, () => {
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
          eventBus.emit(STATE_EVENTS.MEDIA_POOL_RESTORED, {
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

      // Always restore text pool from localStorage with fallback to defaults
      console.log(
        STRINGS.SYSTEM_MESSAGES.stateManager.aboutToRestoreTextPool,
        persistedState?.textPool
      )
      if (Array.isArray(persistedState?.textPool)) {
        // Validate and clean text pool entries
        this.state.textPool = persistedState.textPool
          .filter((text) => typeof text === 'string' && text.trim().length > 0)
          .map((text) => text.trim())
          .slice(0, this.textPoolMaxSize) // Enforce size limit

        // Rebuild index
        this.rebuildTextPoolIndex()

        console.log(
          STRINGS.SYSTEM_MESSAGES.stateManager.textPoolRestored,
          this.state.textPool.length
        )
      } else {
        console.log(STRINGS.SYSTEM_MESSAGES.stateManager.noTextPool)
      }

      // Always restore text frequency from localStorage with fallback to default
      if (typeof persistedState?.textFrequency === 'number') {
        this.state.textFrequency = Math.max(0, Math.min(1, persistedState.textFrequency))
        console.log(
          t.get('SYSTEM_MESSAGES.stateManager.textFrequencyRestored', {
            frequency: this.state.textFrequency,
          })
        )
      } else {
        console.log(
          t.get('SYSTEM_MESSAGES.stateManager.textFrequencyDefault', {
            frequency: this.state.textFrequency,
          })
        )
      }

      // Always restore FileSystem API working state from localStorage with fallback to null (unknown)
      if (typeof persistedState?.fileSystemAPIWorking === 'boolean') {
        this.state.fileSystemAPIWorking = persistedState.fileSystemAPIWorking
        console.log(
          STRINGS.SYSTEM_MESSAGES.stateManager.fileSystemAPIWorkingStateRestored,
          this.state.fileSystemAPIWorking
        )
      } else {
        console.log(STRINGS.SYSTEM_MESSAGES.stateManager.fileSystemAPIWorkingStateDefault)
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
        eventBus.emit(STATE_EVENTS.MEDIA_POOL_RESTORED, {
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
        // Persist text pool
        textPool: this.state.textPool || [],

        // Persist segment settings
        segmentSettings: this.state.segmentSettings,
        // Persist UI settings
        uiSettings: this.state.uiSettings,
        // Persist text frequency
        textFrequency: this.state.textFrequency,
        // Persist FileSystem API working state
        fileSystemAPIWorking: this.state.fileSystemAPIWorking,
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
      eventBus.emit(STATE_EVENTS.MEDIA_POOL_UPDATED, {
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
      eventBus.emit(STATE_EVENTS.MEDIA_POOL_UPDATED, {
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
   * Clear all media from the pool (aligned with text pool pattern)
   * Also clears all stored file handles
   * @returns {boolean} - True if media pool was cleared, false if already empty
   */
  clearMediaPool() {
    if (this.state.mediaPool.length === 0) {
      console.warn(STRINGS.SYSTEM_MESSAGES.stateManager.mediaPoolAlreadyEmpty)
      return false
    }

    const previousCount = this.state.mediaPool.length

    // Revoke all object URLs
    this.state.mediaPool.forEach((item) => {
      if (item.url) {
        URL.revokeObjectURL(item.url)
      }
    })

    // Clear file handles
    this.clearFileHandlesAsync()

    this.state.mediaPool = []

    // Save state
    this.saveCurrentState()

    // Emit state change notification
    eventBus.emit(STATE_EVENTS.MEDIA_POOL_UPDATED, {
      mediaPool: this.getMediaPool(),
      totalCount: 0,
      previousCount: previousCount,
      cleared: true,
    })

    return true
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
    eventBus.emit(STATE_EVENTS.SEGMENT_SETTINGS_UPDATED, {
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
    eventBus.emit(STATE_EVENTS.UI_SETTINGS_UPDATED, {
      uiSettings: this.getUISettings(),
    })
  }

  // ============================================================================
  // TEXT POOL MANAGEMENT METHODS
  // ============================================================================

  /**
   * Add text to the text pool with validation and duplicate prevention
   * @param {string} text - Text to add to the pool
   * @returns {boolean} - True if text was added, false if rejected
   */
  addText(text) {
    const trimmedText = text.trim()

    // Comprehensive validation
    if (!trimmedText) return false
    if (trimmedText.length > 200) return false
    if (this.state.textPool.length >= this.textPoolMaxSize) return false

    // Additive operation - preserve existing entries
    this.state.textPool.push(trimmedText)

    // Update statistics
    this.textPoolStats.totalAdditions++
    this.updateAverageTextLength()

    // Performance monitoring
    if (this.state.textPool.length > 500) {
      eventBus.emit(TEXT_POOL_EVENTS.PERFORMANCE_WARNING, {
        poolSize: this.state.textPool.length,
        suggestion: 'Consider implementing text pool management features',
      })
    }

    this.saveCurrentState()

    // Comprehensive event emission
    eventBus.emit(TEXT_POOL_EVENTS.UPDATED, {
      action: 'added',
      text: trimmedText,
      textPool: [...this.state.textPool],
      poolSize: this.state.textPool.length,
      timestamp: Date.now(),
    })

    eventBus.emit(TEXT_POOL_EVENTS.SIZE_CHANGED, {
      newSize: this.state.textPool.length,
      previousSize: this.state.textPool.length - 1,
    })

    return true
  }

  /**
   * Get a copy of the text pool array
   * @returns {string[]} - Copy of text pool array
   */
  getTextPool() {
    return [...this.state.textPool] // Always return copy to prevent external mutation
  }

  /**
   * Get the current size of the text pool
   * @returns {number} - Number of text entries in the pool
   */
  getTextPoolSize() {
    return this.state.textPool.length
  }

  /**
   * Check if a text string already exists in the pool
   * @param {string} text - Text to check for existence
   * @returns {boolean} - True if text exists in pool
   */
  hasText(text) {
    return this.state.textPool.includes(text.trim())
  }

  /**
   * Get a random text from the pool
   * @returns {string|null} - Random text from pool or null if empty
   */
  getRandomText() {
    if (this.state.textPool.length === 0) return null
    const randomIndex = Math.floor(Math.random() * this.state.textPool.length)
    return this.state.textPool[randomIndex]
  }

  /**
   * Remove text from the text pool
   * @param {string} text - Text to remove from the pool
   * @returns {boolean} - True if text was removed, false if not found
   */
  removeText(text) {
    const trimmedText = text.trim()
    const index = this.state.textPool.indexOf(trimmedText)

    if (index === -1) {
      console.warn(STRINGS.SYSTEM_MESSAGES.stateManager.textNotFoundInPool, trimmedText)
      return false
    }

    // Remove from array
    this.state.textPool.splice(index, 1)

    // Remove from index set
    if (this.textPoolIndex) {
      this.textPoolIndex.delete(trimmedText)
    }

    // Update statistics
    this.textPoolStats.totalRemovals = (this.textPoolStats.totalRemovals || 0) + 1
    this.updateAverageTextLength()

    // Save state
    this.saveCurrentState()

    // Emit events
    eventBus.emit(TEXT_POOL_EVENTS.UPDATED, {
      action: 'removed',
      text: trimmedText,
      textPool: [...this.state.textPool],
      poolSize: this.state.textPool.length,
      timestamp: Date.now(),
    })

    eventBus.emit(TEXT_POOL_EVENTS.SIZE_CHANGED, {
      newSize: this.state.textPool.length,
      previousSize: this.state.textPool.length + 1,
      isAtLimit: false,
    })

    return true
  }

  /**
   * Clear all text from the text pool
   * @returns {boolean} - True if text pool was cleared, false if already empty
   */
  clearTextPool() {
    if (this.state.textPool.length === 0) {
      console.warn(STRINGS.SYSTEM_MESSAGES.stateManager.textPoolAlreadyEmpty)
      return false
    }

    const previousSize = this.state.textPool.length
    const clearedTexts = [...this.state.textPool] // Keep copy for potential undo

    // Clear text pool array
    this.state.textPool = []

    // Clear text pool index
    if (this.textPoolIndex) {
      this.textPoolIndex.clear()
    }

    // Update statistics
    this.textPoolStats.totalClears = (this.textPoolStats.totalClears || 0) + 1
    this.textPoolStats.lastClearSize = previousSize
    this.textPoolStats.lastClearTimestamp = Date.now()
    this.updateAverageTextLength()

    // Save state
    this.saveCurrentState()

    // Emit events
    eventBus.emit(TEXT_POOL_EVENTS.UPDATED, {
      action: 'cleared',
      textPool: [],
      poolSize: 0,
      previousSize: previousSize,
      clearedTexts: clearedTexts,
      timestamp: Date.now(),
    })

    eventBus.emit(TEXT_POOL_EVENTS.SIZE_CHANGED, {
      newSize: 0,
      previousSize: previousSize,
      isAtLimit: false,
    })

    return true
  }

  /**
   * Get enhanced text pool statistics including removal and clear operations
   * @returns {Object} - Complete text pool statistics
   */
  getTextPoolStats() {
    return {
      ...this.textPoolStats,
      totalEntries: this.state.textPool.length,
      totalAdditions: this.textPoolStats.totalAdditions || 0,
      totalRemovals: this.textPoolStats.totalRemovals || 0,
      totalClears: this.textPoolStats.totalClears || 0,
      lastClearSize: this.textPoolStats.lastClearSize || 0,
      lastClearTimestamp: this.textPoolStats.lastClearTimestamp || null,
    }
  }

  /**
   * Rebuild the text pool index for fast duplicate lookup
   * @private
   */
  rebuildTextPoolIndex() {
    this.textPoolIndex = new Set(this.state.textPool)
  }

  /**
   * Update average text length statistic
   * @private
   */
  updateAverageTextLength() {
    if (this.state.textPool.length === 0) {
      this.textPoolStats.averageTextLength = 0
      return
    }

    const totalLength = this.state.textPool.reduce((sum, text) => sum + text.length, 0)
    this.textPoolStats.averageTextLength = Math.round(totalLength / this.state.textPool.length)
  }

  /**
   * Get the current text frequency setting
   * @returns {number} - Text frequency value (0-1 normalized)
   */
  getTextFrequency() {
    return this.state.textFrequency
  }

  /**
   * Set the text frequency setting
   * @param {number} frequency - Text frequency value (0-1 normalized)
   */
  setTextFrequency(frequency) {
    this.state.textFrequency = Math.max(0, Math.min(1, frequency))
    this.saveCurrentState()
    eventBus.emit(TEXT_POOL_EVENTS.FREQUENCY_CHANGED, {
      frequency: this.state.textFrequency,
      timestamp: Date.now(),
    })
  }

  /**
   * Get FileSystem Access API working state
   * @returns {boolean|null} - true if working, false if not working, null if unknown
   */
  getFileSystemAPIWorking() {
    return this.state.fileSystemAPIWorking
  }

  /**
   * Set FileSystem Access API working state and persist it
   * @param {boolean} isWorking - Whether the API is working
   */
  setFileSystemAPIWorking(isWorking) {
    if (typeof isWorking !== 'boolean') {
      console.warn(STRINGS.SYSTEM_MESSAGES.stateManager.fileSystemAPIWorkingStateInvalid, isWorking)
      return
    }

    this.state.fileSystemAPIWorking = isWorking
    this.saveCurrentState()
  }
}

// Export both the class and singleton instance
export { StateManager }
export const stateManager = new StateManager()
