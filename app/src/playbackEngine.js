/**
 * PlaybackEngine module for managing fullscreen media display
 * Handles displaying images and videos with object-fit: cover behavior,
 * continuous cycling through media pool, and responsive window resizing
 */

import { eventBus } from './eventBus.js'
import { toastManager } from './toastManager.js'
import { stateManager } from './stateManager.js'
import { STRINGS, t } from './constants/strings.js'
import { PLAYBACK_CONFIG, PLAYBACK_STATES, CYCLING_EVENTS } from './constants/playbackConfig.js'
import { filterUsableMedia } from './utils/mediaUtils.js'
import { calculateRandomSegmentDuration, getVideoSegmentParameters } from './utils/mediaUtils.js'

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

class PlaybackEngine {
  constructor() {
    this.stageElement = null
    this.currentMediaElement = null
    this.handleWindowResize = this.handleWindowResize.bind(this)
    this.isPlaybackActive = false
    this.autoPlaybackEnabled = true

    // Cycling-specific properties
    this.isCyclingActive = false
    this.cyclingTimer = null
    this.currentMediaItem = null
    this.recentMediaHistory = [] // Track recent items to avoid immediate repetition
    this.playbackState = PLAYBACK_STATES.INACTIVE
  }

  /**
   * Initialize the PlaybackEngine
   */
  init() {
    try {
      this.stageElement = document.getElementById('stage')
      if (!this.stageElement) {
        throw new Error(STRINGS.SYSTEM_MESSAGES.playbackEngine.stageElementNotFound)
      }

      // Set up event listeners
      eventBus.on('state.mediaPoolUpdated', this.handleMediaPoolUpdate.bind(this))
      eventBus.on('state.mediaPoolRestored', this.handleMediaPoolRestored.bind(this))
      window.addEventListener('resize', this.handleWindowResize.bind(this))

      console.log(STRINGS.SYSTEM_MESSAGES.playbackEngine.initialized)
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.playbackEngine.initError, error)
      throw error
    }
  }

  /**
   * Set up event listeners for state changes and window resize
   */
  setupEventListeners() {
    // Listen for media pool updates and restoration
    eventBus.on('state.mediaPoolUpdated', this.handleMediaPoolUpdate.bind(this))
    eventBus.on('state.mediaPoolRestored', this.handleMediaPoolRestored.bind(this))

    // Listen for window resize events
    window.addEventListener('resize', this.handleWindowResize)
  }

  /**
   * Handle media pool state updates
   * @param {Object} updateData - Media pool update data
   */
  handleMediaPoolUpdate(updateData) {
    try {
      const { totalCount, cleared } = updateData

      if (cleared || totalCount === 0) {
        this.stopAutoPlayback()
        return
      }

      // If playback is not active and auto playback is enabled, start it
      if (!this.isPlaybackActive && this.autoPlaybackEnabled) {
        this.startAutoPlayback()
      } else if (this.isPlaybackActive) {
        // If cycling is active, let it continue with updated pool
        // If not cycling but playback is active, restart cycling with updated pool
        if (!this.isCyclingActive) {
          this.startCycling()
        }
        console.log(STRINGS.SYSTEM_MESSAGES.playbackEngine.mediaPoolUpdatedActive)
      }
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.playbackEngine.mediaPoolUpdateError, error)
      toastManager.error(STRINGS.USER_MESSAGES.notifications.error.mediaDisplayFailed)
    }
  }

  /**
   * Handle media pool restoration
   */
  handleMediaPoolRestored(updateData) {
    // Same logic as media pool update
    this.handleMediaPoolUpdate(
      updateData || {
        totalCount: stateManager.getMediaCount(),
        cleared: false,
      }
    )
  }

  /**
   * Display a media item in the stage area
   * @param {MediaItem} mediaItem - Media item to display
   */
  displayMedia(mediaItem) {
    try {
      // Validate media item
      if (!mediaItem || !mediaItem.url || !mediaItem.type) {
        console.warn(STRINGS.SYSTEM_MESSAGES.playbackEngine.invalidMediaItem)
        return
      }

      // Get segment settings from state manager
      const segmentSettings = stateManager.getSegmentSettings()

      // Clear any existing media
      this.clearCurrentMedia()

      let mediaElement

      if (mediaItem.type === 'image') {
        // Calculate random segment duration for images
        const segmentDuration = calculateRandomSegmentDuration(
          segmentSettings.minDuration,
          segmentSettings.maxDuration
        )
        mediaElement = this.createImageElement(mediaItem, segmentDuration)
      } else if (mediaItem.type === 'video') {
        mediaElement = this.createVideoElement(mediaItem, segmentSettings)
      } else {
        console.warn(
          t.get('SYSTEM_MESSAGES.playbackEngine.unsupportedMediaType', {
            mediaType: mediaItem.type,
          })
        )
        return
      }

      if (mediaElement) {
        this.currentMediaElement = mediaElement
        this.stageElement.appendChild(mediaElement)
      }
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.playbackEngine.mediaDisplayError, error)
      toastManager.error(
        t.get('USER_MESSAGES.notifications.error.mediaDisplayFailedWithName', {
          fileName: mediaItem.name,
        })
      )
    }
  }

  /**
   * Create an image element for display
   * @param {MediaItem} mediaItem - Image media item
   * @param {number} segmentDuration - Duration of the segment
   * @returns {HTMLImageElement} - Configured image element
   */
  createImageElement(mediaItem, segmentDuration) {
    try {
      const img = document.createElement('img')
      img.className = 'stage-media image'
      img.src = mediaItem.url
      img.alt = mediaItem.name

      // Handle image load success - schedule cycling transition if cycling is active
      img.addEventListener('load', () => {
        if (this.isCyclingActive) {
          this.scheduleImageTransition(segmentDuration)
        }
      })

      // Handle image load errors
      img.addEventListener('error', () => {
        console.error(
          t.get('SYSTEM_MESSAGES.playbackEngine.imageLoadError', { fileName: mediaItem.name })
        )
        toastManager.error(
          t.get('USER_MESSAGES.notifications.error.imageLoadFailed', { fileName: mediaItem.name })
        )

        // If cycling is active and image fails to load, transition to next media
        if (this.isCyclingActive) {
          setTimeout(() => this.transitionToNextMedia(), PLAYBACK_CONFIG.MIN_TRANSITION_DELAY)
        }
      })

      return img
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.playbackEngine.imageCreationError, error)
      return null
    }
  }

  /**
   * Create a video element for display
   * @param {MediaItem} mediaItem - Video media item
   * @param {Object} segmentSettings - Segment settings for the video
   * @returns {HTMLVideoElement} - Configured video element
   */
  createVideoElement(mediaItem, segmentSettings) {
    try {
      const video = document.createElement('video')
      video.className = 'stage-media video'
      video.src = mediaItem.url
      video.autoplay = true
      video.muted = true
      video.loop = false // Disable loop for cycling
      video.controls = false

      // Store segment settings on the video element for later use
      video._segmentSettings = segmentSettings
      video._mediaItem = mediaItem

      // Handle video end - transition to next media if cycling is active
      video.addEventListener('ended', () => {
        if (this.isCyclingActive) {
          this.transitionToNextMedia()
        }
      })

      // Handle video metadata loaded - calculate segment parameters and set start time
      video.addEventListener('loadedmetadata', () => {
        console.log(
          t.get('SYSTEM_MESSAGES.playbackEngine.videoMetadataLoaded', { fileName: mediaItem.name })
        )

        try {
          // Calculate video segment parameters with fallback logic
          const segmentParams = getVideoSegmentParameters(video.duration, segmentSettings)

          // Set video start time to calculated start point
          video.currentTime = segmentParams.startPoint

          // Store segment parameters on video element
          video._segmentParams = segmentParams

          // Show toast notification if fallback was used (AC 1.9)
          if (segmentParams.fallbackUsed === 'both') {
            toastManager.info(STRINGS.USER_MESSAGES.notifications.info.videoOffsetFallback)
          }

          // Schedule segment end transition if cycling is active
          if (this.isCyclingActive) {
            this.scheduleVideoSegmentTransition(segmentParams.segmentDuration)
          }
        } catch (error) {
          console.error('Error calculating video segment parameters:', error)
          // Fallback to original behavior if segment calculation fails
          if (this.isCyclingActive) {
            this.scheduleVideoMaxDurationTransition()
          }
        }
      })

      // Handle video load errors
      video.addEventListener('error', () => {
        console.error(
          t.get('SYSTEM_MESSAGES.playbackEngine.videoLoadError', { fileName: mediaItem.name })
        )
        toastManager.error(
          t.get('USER_MESSAGES.notifications.error.videoLoadFailed', { fileName: mediaItem.name })
        )

        // If cycling is active and video fails to load, transition to next media
        if (this.isCyclingActive) {
          setTimeout(() => this.transitionToNextMedia(), PLAYBACK_CONFIG.MIN_TRANSITION_DELAY)
        }
      })

      return video
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.playbackEngine.videoCreationError, error)
      return null
    }
  }

  /**
   * Clear the currently displayed media
   */
  clearCurrentMedia() {
    try {
      if (this.currentMediaElement) {
        // Remove from DOM
        if (this.currentMediaElement.parentNode) {
          this.currentMediaElement.parentNode.removeChild(this.currentMediaElement)
        }

        // Clean up event listeners if needed
        this.currentMediaElement = null
      }
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.playbackEngine.currentMediaClearError, error)
    }
  }

  /**
   * Handle window resize events to maintain responsive behavior
   */
  handleWindowResize() {
    try {
      // The CSS object-fit: cover property handles most of the resize logic automatically
      // This method is available for future enhancements if needed
      if (this.currentMediaElement) {
        console.log(STRINGS.SYSTEM_MESSAGES.playbackEngine.windowResized)
      }
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.playbackEngine.windowResizeError, error)
    }
  }

  /**
   * Get the currently displayed media element
   * @returns {HTMLElement|null} - Current media element or null
   */
  getCurrentMediaElement() {
    return this.currentMediaElement
  }

  /**
   * Check if media is currently being displayed
   * @returns {boolean} - True if media is being displayed
   */
  hasCurrentMedia() {
    return this.currentMediaElement !== null
  }

  /**
   * Cleanup method to remove event listeners and clear media
   */
  cleanup() {
    try {
      // Remove event listeners
      eventBus.off('state.mediaPoolUpdated', this.handleMediaPoolUpdate.bind(this))
      eventBus.off('state.mediaPoolRestored', this.handleMediaPoolRestored.bind(this))
      window.removeEventListener('resize', this.handleWindowResize)

      // Stop playback and clear current media
      this.stopAutoPlayback()
      this.stopCycling()

      console.log(STRINGS.SYSTEM_MESSAGES.playbackEngine.cleanupCompleted)
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.playbackEngine.cleanupError, error)
    }
  }

  /**
   * Get a random media item from the pool, avoiding recently played items
   * @returns {MediaItem|null} - Random media item or null if none available
   */
  getRandomMediaItem() {
    try {
      const mediaPool = stateManager.getMediaPool()
      const usableMedia = filterUsableMedia(mediaPool)

      if (usableMedia.length === 0) {
        return null
      }

      if (usableMedia.length === 1) {
        return usableMedia[0]
      }

      // Filter out recently played items to avoid immediate repetition
      let availableMedia = usableMedia
      if (this.recentMediaHistory.length > 0) {
        const recentIds = this.recentMediaHistory.map((item) => item.id)
        availableMedia = usableMedia.filter((item) => !recentIds.includes(item.id))

        // If all items are recent, use all items (shouldn't happen with proper history management)
        if (availableMedia.length === 0) {
          availableMedia = usableMedia
        }
      }

      // Select random item from available media
      const randomIndex = Math.floor(Math.random() * availableMedia.length)
      return availableMedia[randomIndex]
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.playbackEngine.randomMediaSelectionError, error)
      return null
    }
  }

  /**
   * Add media item to recent history to avoid immediate repetition
   * @param {MediaItem} mediaItem - Media item to add to history
   */
  addToRecentHistory(mediaItem) {
    if (!mediaItem) return

    // Remove item if it already exists in history
    this.recentMediaHistory = this.recentMediaHistory.filter((item) => item.id !== mediaItem.id)

    // Add to beginning of history
    this.recentMediaHistory.unshift(mediaItem)

    // Limit history size
    if (this.recentMediaHistory.length > PLAYBACK_CONFIG.RECENT_ITEMS_HISTORY_SIZE) {
      this.recentMediaHistory = this.recentMediaHistory.slice(
        0,
        PLAYBACK_CONFIG.RECENT_ITEMS_HISTORY_SIZE
      )
    }
  }

  /**
   * Clear cycling timer and reset cycling state
   */
  clearCyclingTimer() {
    if (this.cyclingTimer) {
      clearTimeout(this.cyclingTimer)
      this.cyclingTimer = null
    }
  }

  /**
   * Schedule transition to next media item after image display duration
   * @param {number} segmentDuration - Duration in seconds
   */
  scheduleImageTransition(segmentDuration) {
    this.clearCyclingTimer()
    this.cyclingTimer = setTimeout(() => {
      this.transitionToNextMedia()
    }, segmentDuration * 1000) // Convert seconds to milliseconds
  }

  /**
   * Schedule transition to next media item after video segment duration
   * @param {number} segmentDuration - Duration in seconds
   */
  scheduleVideoSegmentTransition(segmentDuration) {
    this.clearCyclingTimer()
    this.cyclingTimer = setTimeout(() => {
      this.transitionToNextMedia()
    }, segmentDuration * 1000) // Convert seconds to milliseconds
  }

  /**
   * Schedule transition to next media item after video max duration
   */
  scheduleVideoMaxDurationTransition() {
    this.clearCyclingTimer()
    this.cyclingTimer = setTimeout(() => {
      this.transitionToNextMedia()
    }, PLAYBACK_CONFIG.SEGMENT_SETTINGS.DURATION_MAX_LIMIT * 1000) // Convert seconds to milliseconds
  }

  /**
   * Transition to the next random media item
   */
  transitionToNextMedia() {
    try {
      if (!this.isCyclingActive) {
        return
      }

      const nextMediaItem = this.getRandomMediaItem()
      if (nextMediaItem) {
        this.currentMediaItem = nextMediaItem
        this.addToRecentHistory(nextMediaItem)
        this.displayMedia(nextMediaItem)

        // Emit cycling event
        eventBus.emit(CYCLING_EVENTS.MEDIA_CHANGED, {
          previousMedia: this.currentMediaItem,
          currentMedia: nextMediaItem,
        })
      } else {
        // No media available, stop cycling
        this.stopCycling()
      }
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.playbackEngine.cyclingTransitionError, error)
      eventBus.emit(CYCLING_EVENTS.ERROR, { error })
    }
  }

  /**
   * Start continuous cycling through media pool
   */
  startCycling() {
    try {
      if (this.isCyclingActive) {
        return // Already cycling
      }

      const firstMediaItem = this.getRandomMediaItem()
      if (!firstMediaItem) {
        console.log(STRINGS.SYSTEM_MESSAGES.playbackEngine.noUsableMediaForCycling)
        return
      }

      this.isCyclingActive = true
      this.playbackState = PLAYBACK_STATES.CYCLING
      this.currentMediaItem = firstMediaItem
      this.addToRecentHistory(firstMediaItem)
      this.displayMedia(firstMediaItem)

      console.log(STRINGS.SYSTEM_MESSAGES.playbackEngine.cyclingStarted)
      eventBus.emit(CYCLING_EVENTS.STARTED, {
        currentMedia: firstMediaItem,
      })
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.playbackEngine.cyclingStartError, error)
      eventBus.emit(CYCLING_EVENTS.ERROR, { error })
    }
  }

  /**
   * Stop continuous cycling
   */
  stopCycling() {
    try {
      if (!this.isCyclingActive) {
        return // Not cycling
      }

      this.isCyclingActive = false
      this.clearCyclingTimer()
      this.playbackState = this.hasCurrentMedia()
        ? PLAYBACK_STATES.ACTIVE
        : PLAYBACK_STATES.INACTIVE

      console.log(STRINGS.SYSTEM_MESSAGES.playbackEngine.cyclingStopped)
      eventBus.emit(CYCLING_EVENTS.STOPPED, {
        finalMedia: this.currentMediaItem,
      })
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.playbackEngine.cleanupError, error)
    }
  }

  /**
   * Start automatic playback if media pool is populated and playback is not active.
   */
  startAutoPlayback() {
    const mediaPool = stateManager.getMediaPool()
    if (mediaPool.length > 0 && !this.isPlaybackActive && this.autoPlaybackEnabled) {
      // Find usable media items (with valid URLs)
      const usableMedia = filterUsableMedia(mediaPool)

      if (usableMedia.length > 0) {
        this.isPlaybackActive = true
        this.startCycling() // Start cycling instead of displaying single item
        console.log(STRINGS.SYSTEM_MESSAGES.playbackEngine.autoPlaybackStarted)
      } else {
        console.log(STRINGS.SYSTEM_MESSAGES.playbackEngine.metadataOnlyPoolMessage)
        // Don't start playback, but could show a message to user about re-adding files
      }
    }
  }

  /**
   * Stop automatic playback and clear display.
   */
  stopAutoPlayback() {
    if (this.isPlaybackActive) {
      this.isPlaybackActive = false
      this.stopCycling()
      this.clearCurrentMedia()
      console.log(STRINGS.SYSTEM_MESSAGES.playbackEngine.autoPlaybackStopped)
    }
  }
}

// Export singleton instance
export const playbackEngine = new PlaybackEngine()
