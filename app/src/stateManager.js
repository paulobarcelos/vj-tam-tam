/**
 * State Manager module for centralized application state management
 * Manages media pool state and coordinates state changes via the event bus
 */

import { eventBus } from './eventBus.js'
import { storageFacade } from './facades/storageFacade.js'
import { fileSystemAccessFacade } from './facades/fileSystemAccessFacade.js'
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
      // Projection mode settings (Story 6.3)
      projectionMode: {
        active: false, // default projection mode inactive
        maptasticLayout: null, // saved corner positions
        projectionSurfaceAspectRatio: null, // saved projection surface aspect ratio
      },
      // Text frequency for text overlay display (0-1 normalized scale)
      textFrequency: 0.5, // Default middle value (equivalent to step 4 of 8)
      // Color correction settings (Story 6.7)
      colorFilters: {
        brightness: 1.0, // Default 100% (1.0 multiplier, range 0.5-1.5)
        contrast: 1.0, // Default 100% (1.0 multiplier, range 0.5-1.5)
        saturation: 1.0, // Default 100% (1.0 multiplier, range 0.0-2.0)
      },
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
      console.warn(
        'FileSystemAccessAPI initialization failed, continuing with localStorage only:',
        error
      )
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
      console.log('Persisted state loaded from storage', persistedState)

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
      console.log('About to restore segment settings', persistedState?.segmentSettings)
      if (persistedState?.segmentSettings) {
        console.log('Current state before segment settings restoration', this.state.segmentSettings)
        this.state.segmentSettings = {
          ...this.state.segmentSettings, // Start with defaults
          ...persistedState.segmentSettings, // Override with persisted values
        }
        console.log('State after segment settings restoration', this.state.segmentSettings)
        console.log('Segment settings restored from localStorage')
      } else {
        console.log(
          'No segment settings in persistedState, keeping defaults',
          this.state.segmentSettings
        )
      }

      // Always restore UI settings from localStorage with fallback to defaults
      console.log('About to restore UI settings', persistedState?.uiSettings)
      if (persistedState?.uiSettings) {
        console.log('Current UI settings before restoration', this.state.uiSettings)
        this.state.uiSettings = {
          ...this.state.uiSettings, // Start with defaults
          ...persistedState.uiSettings, // Override with persisted values
        }
        console.log('State after UI settings restoration', this.state.uiSettings)
        console.log('UI settings restored from localStorage')
      } else {
        console.log('No UI settings in persistedState, keeping defaults', this.state.uiSettings)
      }

      // Always restore projection mode from localStorage with fallback to defaults
      console.log('About to restore projection mode', persistedState?.projectionMode)
      if (persistedState?.projectionMode) {
        this.state.projectionMode = {
          ...this.state.projectionMode, // Start with defaults
          ...persistedState.projectionMode, // Override with persisted values
        }
        console.log('Projection mode settings restored from localStorage')
      } else {
        console.log(
          'No projection mode in persistedState, keeping defaults',
          this.state.projectionMode
        )
      }

      // Always restore text pool from localStorage with fallback to empty
      console.log('About to restore text pool')
      if (persistedState?.textPool && Array.isArray(persistedState.textPool)) {
        this.state.textPool = persistedState.textPool
        this.rebuildTextPoolIndex()
        console.log(
          `Text pool restored from localStorage with ${this.state.textPool.length} entries`
        )
      } else {
        console.log('No text pool in persistedState, keeping empty pool')
      }

      // Always restore text frequency from localStorage with fallback to default
      if (persistedState?.textFrequency !== undefined) {
        console.log(`Text frequency restored: ${persistedState.textFrequency}`)
        this.state.textFrequency = persistedState.textFrequency
      } else {
        console.log(`No text frequency found, using default: ${this.state.textFrequency}`)
      }

      // Always restore color correction settings from localStorage with fallback to defaults
      if (persistedState?.colorFilters) {
        console.log('Color correction settings restored:', persistedState.colorFilters)
        this.state.colorFilters = {
          ...this.state.colorFilters,
          ...persistedState.colorFilters,
        }
      } else {
        console.log('No color correction settings found, using defaults')
      }

      // Always restore FileSystem API working state from localStorage with fallback to null
      if (persistedState?.fileSystemAPIWorking !== undefined) {
        console.log('FileSystem API working state restored:', persistedState.fileSystemAPIWorking)
        this.state.fileSystemAPIWorking = persistedState.fileSystemAPIWorking
      } else {
        console.log('No FileSystem API working state found, using default: null')
      }
    } catch (error) {
      console.error('Error during persistence restoration:', error)
    }
  }

  /**
   * Restore media from localStorage fallback when FileSystemAccessAPI is not available
   * @param {Object} persistedState - Persisted state from localStorage
   */
  restoreMediaFromLocalStorage(persistedState) {
    if (persistedState?.mediaPool && Array.isArray(persistedState.mediaPool)) {
      // Filter out temporary files that can't be restored (drag & drop)
      const restorableMedia = filterRestorableMedia(persistedState.mediaPool)

      // Log cleanup information
      const removedDragDropCount = persistedState.mediaPool.length - restorableMedia.length
      if (removedDragDropCount > 0) {
        console.log(
          `Cleaned up ${removedDragDropCount} temporary drag & drop files that cannot be restored`
        )
      }

      // Only process media items from FileSystemAccessAPI (with handles)
      const restoredItems = restorableMedia.filter((item) => item.fromFileSystemAPI)

      if (restoredItems.length > 0) {
        // Ensure all restored items have proper Date objects for addedAt
        const normalizedItems = restoredItems.map((item) => ({
          ...item,
          addedAt: item.addedAt instanceof Date ? item.addedAt : new Date(item.addedAt),
          // Mark as needing permission since they're metadata-only
          needsPermission: true,
        }))

        this.state.mediaPool = normalizedItems
        console.log(
          `Restored ${restoredItems.length} FileSystemAccessAPI items from localStorage (metadata only).`
        )

        // Emit restoration event
        eventBus.emit(STATE_EVENTS.MEDIA_POOL_RESTORED, {
          mediaPool: this.getMediaPool(),
          totalCount: restoredItems.length,
          source: 'localStorage',
          needsPermission: true,
        })
      } else {
        console.log('No persistent files found after cleanup.')
      }
    } else {
      console.log('No persisted state found or media pool is empty.')
    }
  }

  /**
   * Save current state to localStorage
   */
  saveCurrentState() {
    try {
      storageFacade.saveState(this.state)
      console.log('Current state saved to localStorage.')
    } catch (error) {
      console.error('Error saving current state:', error)
    }
  }

  /**
   * Return current media pool
   * @returns {MediaItem[]} Current media pool
   */
  getMediaPool() {
    return this.state.mediaPool
  }

  /**
   * Add new media items to the pool (additive behavior)
   * @param {MediaItem[]} newMediaItems - Array of media items to add
   */
  addMediaToPool(newMediaItems) {
    if (!Array.isArray(newMediaItems)) {
      console.warn('StateManager.addMediaToPool: newMediaItems must be an array')
      return
    }

    let upgradedItems = []

    newMediaItems.forEach((newItem) => {
      const existingIndex = this.state.mediaPool.findIndex(
        (item) => item.name === newItem.name && item.size === newItem.size
      )

      if (existingIndex !== -1) {
        // Check if this is a metadata-only upgrade
        const existingItem = this.state.mediaPool[existingIndex]
        const isUpgrade = !existingItem.file || !existingItem.url

        if (isUpgrade) {
          console.log(`Upgrading metadata-only file: ${newItem.name}`)
          // Upgrade existing item while preserving original metadata (especially ID)
          const upgradedItem = {
            ...existingItem, // Keep original metadata including ID
            file: newItem.file, // Update with actual file
            url: newItem.url, // Update with actual URL
            // Update other file-specific properties if they're missing
            ...(newItem.mimeType && !existingItem.mimeType && { mimeType: newItem.mimeType }),
            ...(newItem.type && !existingItem.type && { type: newItem.type }),
          }
          this.state.mediaPool[existingIndex] = upgradedItem
          upgradedItems.push(upgradedItem)
        } else {
          console.log(`File already in media pool (skipped): ${newItem.name}`)
        }
      } else {
        // New item, add to pool
        this.state.mediaPool.push(newItem)
      }
    })

    // Store file handles for FileSystemAccessAPI files (async but doesn't block)
    this.storeFileHandlesAsync(newMediaItems)

    // Emit event with upgrade information
    eventBus.emit(STATE_EVENTS.MEDIA_POOL_UPDATED, {
      mediaPool: this.getMediaPool(),
      addedItems: newMediaItems,
      upgradedItems,
    })
  }

  /**
   * Store file handles for FileSystemAccessAPI files (async operation)
   * @param {MediaItem[]} mediaItems - Media items to store handles for
   */
  async storeFileHandlesAsync(mediaItems) {
    for (const item of mediaItems) {
      if (item.file && item.file.handle && item.fromFileSystemAPI) {
        try {
          const success = await fileSystemAccessFacade.storeFileHandle(item.id, item.file.handle, {
            id: item.id,
            name: item.name,
            type: item.type,
            mimeType: item.mimeType,
            size: item.size,
            addedAt: item.addedAt,
            fromFileSystemAPI: item.fromFileSystemAPI,
          })

          if (!success) {
            console.warn(`Failed to store file handle for ${item.name}:`, 'Storage failed')
          }
        } catch (error) {
          console.warn(`Failed to store file handle for ${item.name}:`, error)
        }
      }
    }
  }

  /**
   * Upgrade media items with restored file handles
   * @param {MediaItem[]} restoredFiles - Array of restored files with full data
   * @returns {number} Number of items that were upgraded
   */
  upgradeMediaWithFileHandles(restoredFiles) {
    if (!Array.isArray(restoredFiles) || restoredFiles.length === 0) {
      console.log('No files to upgrade')
      return 0
    }

    console.log(`Upgrading ${restoredFiles.length} files with restored data`)

    // Track upgrade count
    const initialUpgradedCount = this.state.mediaPool.filter(
      (item) => !item.file || !item.url
    ).length

    // Use addMediaToPool which already handles upgrading metadata-only items
    this.addMediaToPool(restoredFiles)

    // Calculate how many were actually upgraded
    const finalUpgradedCount = this.state.mediaPool.filter((item) => !item.file || !item.url).length
    const upgradedCount = initialUpgradedCount - finalUpgradedCount

    console.log(`Successfully upgraded ${upgradedCount} files from metadata-only to full data`)
    return upgradedCount
  }

  /**
   * Remove a media item from the pool
   * @param {string} id - Media item ID to remove
   */
  removeMediaFromPool(id) {
    const initialLength = this.state.mediaPool.length
    const itemToRemove = this.state.mediaPool.find((item) => item.id === id)
    this.state.mediaPool = this.state.mediaPool.filter((item) => item.id !== id)

    if (this.state.mediaPool.length < initialLength && itemToRemove) {
      // Remove file handle from storage (async but doesn't block)
      this.removeFileHandleAsync(id)

      eventBus.emit(STATE_EVENTS.MEDIA_POOL_UPDATED, {
        mediaPool: this.getMediaPool(),
        removedItem: itemToRemove,
        totalCount: this.state.mediaPool.length,
      })
    }
  }

  /**
   * Remove file handle from storage (async operation)
   * @param {string} id - File ID to remove handle for
   */
  async removeFileHandleAsync(id) {
    try {
      await fileSystemAccessFacade.removeFileHandle(id)
    } catch (error) {
      console.warn(`Failed to remove file handle for ID ${id}:`, error)
    }
  }

  /**
   * Clear all media from the pool
   * @returns {boolean} Success status
   */
  clearMediaPool() {
    if (this.state.mediaPool.length === 0) {
      console.warn('Media pool is already empty')
      return false
    }

    // Get count before clearing
    const previousCount = this.state.mediaPool.length

    // Clear the pool
    this.state.mediaPool = []

    // Clear file handles from storage (async but doesn't block)
    this.clearFileHandlesAsync()

    // Emit event
    eventBus.emit(STATE_EVENTS.MEDIA_POOL_UPDATED, {
      mediaPool: [],
      totalCount: 0,
      previousCount,
      cleared: true,
    })

    return true
  }

  /**
   * Clear all file handles from storage (async operation)
   */
  async clearFileHandlesAsync() {
    try {
      await fileSystemAccessFacade.clearAllFiles()
    } catch (error) {
      console.warn('Failed to clear file handles:', error)
    }
  }

  /**
   * Get a media item by ID
   * @param {string} id - Media item ID
   * @returns {MediaItem|null} Media item or null if not found
   */
  getMediaById(id) {
    return this.state.mediaPool.find((item) => item.id === id) || null
  }

  /**
   * Get the current count of media items
   * @returns {number} Number of media items
   */
  getMediaCount() {
    return this.state.mediaPool.length
  }

  /**
   * Check if media pool is empty
   * @returns {boolean} True if empty
   */
  isMediaPoolEmpty() {
    return this.state.mediaPool.length === 0
  }

  /**
   * Get current segment settings
   * @returns {Object} Current segment settings
   */
  getSegmentSettings() {
    return { ...this.state.segmentSettings }
  }

  /**
   * Update segment settings
   * @param {Object} newSettings - New segment settings to merge
   */
  updateSegmentSettings(newSettings) {
    if (!this.validateSegmentSettings(newSettings)) {
      console.warn('Invalid segment settings provided - must be a valid object')
      return
    }

    // Merge with current settings
    this.state.segmentSettings = {
      ...this.state.segmentSettings,
      ...newSettings,
    }

    // Emit event for listeners
    eventBus.emit(STATE_EVENTS.SEGMENT_SETTINGS_UPDATED, {
      segmentSettings: this.getSegmentSettings(),
    })

    // Save to persistence
    this.saveCurrentState()
  }

  /**
   * Validate segment settings object
   * @param {Object} settings - Settings to validate
   * @returns {boolean} True if valid
   */
  validateSegmentSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      return false
    }

    // Check individual properties if they exist and filter out invalid ranges
    const filteredSettings = {}

    // Duration ranges: 1-30 seconds
    if ('minDuration' in settings) {
      if (
        typeof settings.minDuration === 'number' &&
        settings.minDuration >= 1 &&
        settings.minDuration <= 30
      ) {
        filteredSettings.minDuration = settings.minDuration
      }
    }

    if ('maxDuration' in settings) {
      if (
        typeof settings.maxDuration === 'number' &&
        settings.maxDuration >= 1 &&
        settings.maxDuration <= 30
      ) {
        filteredSettings.maxDuration = settings.maxDuration
      }
    }

    // Skip values: 0+ seconds
    if ('skipStart' in settings) {
      if (typeof settings.skipStart === 'number' && settings.skipStart >= 0) {
        filteredSettings.skipStart = settings.skipStart
      }
    }

    if ('skipEnd' in settings) {
      if (typeof settings.skipEnd === 'number' && settings.skipEnd >= 0) {
        filteredSettings.skipEnd = settings.skipEnd
      }
    }

    // Replace the original settings with filtered valid ones
    Object.keys(settings).forEach((key) => {
      if (!(key in filteredSettings)) {
        delete settings[key]
      } else {
        settings[key] = filteredSettings[key]
      }
    })

    return Object.keys(filteredSettings).length > 0
  }

  /**
   * Get current UI settings
   * @returns {Object} Current UI settings
   */
  getUISettings() {
    return { ...this.state.uiSettings }
  }

  /**
   * Update UI settings
   * @param {Object} newSettings - New UI settings to merge
   */
  updateUISettings(newSettings) {
    if (!newSettings || typeof newSettings !== 'object') {
      console.warn('Invalid UI settings provided - must be a valid object')
      return
    }

    // Merge with current settings
    this.state.uiSettings = {
      ...this.state.uiSettings,
      ...newSettings,
    }

    // Emit event for listeners
    eventBus.emit(STATE_EVENTS.UI_SETTINGS_UPDATED, {
      uiSettings: this.getUISettings(),
    })

    // Save to persistence
    this.saveCurrentState()
  }

  /**
   * Get current projection mode settings
   * @returns {Object} Current projection mode settings
   */
  getProjectionMode() {
    return { ...this.state.projectionMode }
  }

  /**
   * Update projection mode settings
   * @param {Object} newSettings - New projection mode settings to merge
   */
  updateProjectionMode(newSettings) {
    if (!newSettings || typeof newSettings !== 'object') {
      console.warn('Invalid projection mode settings provided - must be a valid object')
      return
    }

    // Merge with current settings
    this.state.projectionMode = {
      ...this.state.projectionMode,
      ...newSettings,
    }

    // Emit event for listeners
    eventBus.emit(STATE_EVENTS.PROJECTION_MODE_UPDATED, {
      projectionMode: this.getProjectionMode(),
    })

    // Save to persistence
    this.saveCurrentState()
  }

  /**
   * Add text to the text pool
   * @param {string} text - Text to add
   * @returns {boolean} True if text was added, false if invalid
   */
  addText(text) {
    // Basic validation
    if (!text || typeof text !== 'string') {
      return false
    }

    const trimmedText = text.trim()
    if (!trimmedText) {
      return false
    }

    // Check length limit (200 characters)
    if (trimmedText.length > 200) {
      return false
    }

    // Check pool size limit
    if (this.state.textPool.length >= this.textPoolMaxSize) {
      // Remove oldest text to make room
      const removedText = this.state.textPool.shift()
      if (this.textPoolIndex) {
        this.textPoolIndex.delete(removedText)
      }
    }

    // Add new text (duplicates are allowed)
    this.state.textPool.push(trimmedText)
    if (this.textPoolIndex) {
      this.textPoolIndex.add(trimmedText)
    }

    // Update statistics
    if (this.textPoolStats) {
      this.textPoolStats.totalAdditions++
      this.updateAverageTextLength()
    }

    // Emit events
    eventBus.emit('textPool.updated', {
      action: 'added',
      text: trimmedText,
      textPool: [...this.state.textPool],
      poolSize: this.state.textPool.length,
      timestamp: Date.now(),
    })

    eventBus.emit('textPool.sizeChanged', {
      newSize: this.state.textPool.length,
      previousSize: this.state.textPool.length - 1,
    })

    // Save to persistence
    this.saveCurrentState()

    return true
  }

  /**
   * Get the current text pool
   * @returns {string[]} Array of text strings
   */
  getTextPool() {
    return [...this.state.textPool]
  }

  /**
   * Get current text pool size
   * @returns {number} Number of text entries
   */
  getTextPoolSize() {
    return this.state.textPool.length
  }

  /**
   * Check if text exists in the pool
   * @param {string} text - Text to check
   * @returns {boolean} True if text exists
   */
  hasText(text) {
    if (!text || typeof text !== 'string') return false
    const trimmedText = text.trim()
    return this.state.textPool.includes(trimmedText)
  }

  /**
   * Get a random text from the pool
   * @returns {string|null} Random text or null if pool is empty
   */
  getRandomText() {
    if (this.state.textPool.length === 0) {
      return null
    }
    const randomIndex = Math.floor(Math.random() * this.state.textPool.length)
    return this.state.textPool[randomIndex]
  }

  /**
   * Remove text from the pool (removes first occurrence)
   * @param {string} text - Text to remove
   * @returns {boolean} True if text was removed
   */
  removeText(text) {
    const trimmedText = text?.trim()
    if (!trimmedText) {
      return false
    }

    // Remove first occurrence from array
    const index = this.state.textPool.indexOf(trimmedText)
    if (index === -1) {
      return false
    }

    const previousSize = this.state.textPool.length
    this.state.textPool.splice(index, 1)

    // Update index if it exists
    if (this.textPoolIndex) {
      this.textPoolIndex.delete(trimmedText)
    }

    // Update statistics
    if (this.textPoolStats) {
      this.textPoolStats.totalRemovals = (this.textPoolStats.totalRemovals || 0) + 1
    }
    if (this.updateAverageTextLength) {
      this.updateAverageTextLength()
    }

    // Emit events
    eventBus.emit('textPool.updated', {
      action: 'removed',
      text: trimmedText,
      textPool: [...this.state.textPool],
      poolSize: this.state.textPool.length,
      timestamp: Date.now(),
    })

    eventBus.emit('textPool.sizeChanged', {
      newSize: this.state.textPool.length,
      previousSize,
      isAtLimit: false,
    })

    // Save to persistence
    this.saveCurrentState()

    return true
  }

  /**
   * Clear all text from the pool
   * @returns {boolean} True if pool was cleared
   */
  clearTextPool() {
    if (this.state.textPool.length === 0) {
      console.warn('Text pool is already empty')
      return false
    }

    const previousSize = this.state.textPool.length
    const previousPool = [...this.state.textPool]

    // Clear the arrays
    this.state.textPool = []
    if (this.textPoolIndex) {
      this.textPoolIndex.clear()
    }

    // Reset statistics
    if (this.textPoolStats) {
      this.textPoolStats.averageTextLength = 0
      // Update clear statistics
      this.textPoolStats.totalClears = (this.textPoolStats.totalClears || 0) + 1
      this.textPoolStats.lastClearSize = previousSize
      this.textPoolStats.lastClearTimestamp = Date.now()
    }

    // Emit events
    eventBus.emit('textPool.updated', {
      action: 'cleared',
      textPool: [],
      poolSize: 0,
      previousSize,
      clearedTexts: previousPool,
      timestamp: Date.now(),
    })

    eventBus.emit('textPool.sizeChanged', {
      newSize: 0,
      previousSize,
      isAtLimit: false,
    })

    // Save to persistence
    this.saveCurrentState()

    return true
  }

  /**
   * Get text pool statistics
   * @returns {Object} Statistics about the text pool
   */
  getTextPoolStats() {
    return {
      totalEntries: this.state.textPool.length,
      totalAdditions: this.textPoolStats?.totalAdditions || 0,
      totalRemovals: this.textPoolStats?.totalRemovals || 0,
      totalClears: this.textPoolStats?.totalClears || 0,
      lastClearSize: this.textPoolStats?.lastClearSize,
      lastClearTimestamp: this.textPoolStats?.lastClearTimestamp,
      averageTextLength: this.textPoolStats?.averageTextLength || 0,
      currentSize: this.state.textPool.length,
      maxSize: this.textPoolMaxSize || 1000,
      utilizationPercent: Math.round(
        (this.state.textPool.length / (this.textPoolMaxSize || 1000)) * 100
      ),
    }
  }

  /**
   * Rebuild the text pool index (used during restoration)
   * @private
   */
  rebuildTextPoolIndex() {
    this.textPoolIndex.clear()
    this.state.textPool.forEach((text) => {
      this.textPoolIndex.add(text)
    })
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
   * Get current text frequency setting
   * @returns {number} Frequency value (0-1)
   */
  getTextFrequency() {
    return this.state.textFrequency
  }

  /**
   * Set text frequency
   * @param {number} frequency - Frequency value (0-1)
   */
  setTextFrequency(frequency) {
    if (typeof frequency !== 'number' || frequency < 0 || frequency > 1) {
      return
    }

    this.state.textFrequency = frequency

    // Emit event
    eventBus.emit(TEXT_POOL_EVENTS.FREQUENCY_UPDATED, {
      frequency: this.state.textFrequency,
    })

    // Save to persistence
    this.saveCurrentState()
  }

  /**
   * Get FileSystem API working state
   * @returns {boolean|null} Working state or null if unknown
   */
  getFileSystemAPIWorking() {
    return this.state.fileSystemAPIWorking
  }

  /**
   * Set FileSystem API working state
   * @param {boolean} isWorking - Whether the API is working
   */
  setFileSystemAPIWorking(isWorking) {
    if (typeof isWorking !== 'boolean') {
      console.warn('FileSystem API working state must be boolean', isWorking)
      return
    }

    this.state.fileSystemAPIWorking = isWorking
    this.saveCurrentState()
  }

  /**
   * Get current color filter settings
   * @returns {Object} Color filter settings
   */
  getColorFilters() {
    return { ...this.state.colorFilters }
  }

  /**
   * Update color filter settings
   * @param {Object} newFilters - New color filter values
   */
  updateColorFilters(newFilters) {
    const validatedFilters = this.validateColorFilters(newFilters)
    this.state.colorFilters = {
      ...this.state.colorFilters,
      ...validatedFilters,
    }
    this.saveCurrentState()
    console.log('Color filters updated:', this.state.colorFilters)
  }

  /**
   * Validate color filter settings
   * @param {Object} filters - Color filter values to validate
   * @returns {Object} Validated color filter values
   */
  validateColorFilters(filters) {
    const validated = {}

    if (filters.brightness !== undefined) {
      const brightness = parseFloat(filters.brightness)
      if (!isNaN(brightness) && brightness >= 0.5 && brightness <= 1.5) {
        validated.brightness = brightness
      }
    }

    if (filters.contrast !== undefined) {
      const contrast = parseFloat(filters.contrast)
      if (!isNaN(contrast) && contrast >= 0.5 && contrast <= 1.5) {
        validated.contrast = contrast
      }
    }

    if (filters.saturation !== undefined) {
      const saturation = parseFloat(filters.saturation)
      if (!isNaN(saturation) && saturation >= 0.0 && saturation <= 2.0) {
        validated.saturation = saturation
      }
    }

    return validated
  }
}

// Export singleton instance
export const stateManager = new StateManager()

// Export class for testing
export { StateManager }
