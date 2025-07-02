/**
 * PlaybackEngine module for managing fullscreen media display
 * Handles displaying images and videos with object-fit: cover behavior,
 * continuous cycling through media pool, and responsive window resizing
 */

import { eventBus } from './eventBus.js'
import { toastManager } from './toastManager.js'
import { stateManager } from './stateManager.js'
import { STRINGS, t } from './constants/strings.js'
import { PLAYBACK_CONFIG, PLAYBACK_STATES } from './constants/playbackConfig.js'
import { filterUsableMedia } from './utils/mediaUtils.js'
import { calculateRandomSegmentDuration, getVideoSegmentParameters } from './utils/mediaUtils.js'
import { STATE_EVENTS, CYCLING_EVENTS } from './constants/events.js'

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
        console.error('Stage element not found')
        return false
      }

      // Set up event listeners
      this.setupEventListeners()

      // Listen for direct media pool events
      eventBus.on(STATE_EVENTS.MEDIA_POOL_UPDATED, this.handleMediaPoolUpdate.bind(this))
      eventBus.on(STATE_EVENTS.MEDIA_POOL_RESTORED, this.handleMediaPoolRestored.bind(this))
      window.addEventListener('resize', this.handleWindowResize.bind(this))

      console.log('PlaybackEngine initialized successfully')
    } catch (error) {
      console.error('PlaybackEngine initialization error:', error)
      throw error
    }
  }

  /**
   * Set up event listeners for state changes and window resize
   */
  setupEventListeners() {
    // Listen for media pool updates and restoration
    eventBus.on(STATE_EVENTS.MEDIA_POOL_UPDATED, this.handleMediaPoolUpdate.bind(this))
    eventBus.on(STATE_EVENTS.MEDIA_POOL_RESTORED, this.handleMediaPoolRestored.bind(this))

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
        console.log('Media pool updated - continuing active playback')
      }
    } catch (error) {
      console.error('Media pool update error:', error)
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
        console.warn('Invalid media item provided for display')
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
        console.warn(`Unsupported media type: ${mediaItem.type}`)
        return
      }

      if (mediaElement) {
        this.currentMediaElement = mediaElement
        this.stageElement.appendChild(mediaElement)
      }
    } catch (error) {
      console.error('Media display error:', error)
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
        // Log image display information for debugging
        console.log(
          `Image segment: ${mediaItem.name}, duration: ${segmentDuration ? segmentDuration.toFixed(2) : '0.00'}s`
        )

        if (this.isCyclingActive) {
          this.scheduleImageTransition(segmentDuration)
        }
      })

      // Handle image load errors
      img.addEventListener('error', () => {
        console.error(`Image load error: ${mediaItem.name}`)
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
      console.error('Image element creation error:', error)
      return null
    }
  }

  /**
   * Create a video element for display with enhanced segment timing precision
   * @param {MediaItem} mediaItem - Video media item
   * @param {Object} segmentSettings - Segment configuration settings
   * @returns {HTMLVideoElement} - Configured video element
   */
  createVideoElement(mediaItem, segmentSettings) {
    console.log(`Creating video element for file: ${mediaItem.name}`)
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

      // Initialize video segment state
      video._segmentState = {
        startPoint: null,
        segmentDuration: null,
        segmentEndTime: null,
        isMonitoring: false,
        fallbackUsed: null,
        seekTarget: null,
        seekAttempts: 0,
        lastTimeUpdateCheck: 0, // For throttling timeupdate checks
      }

      // Handle video end - transition to next media if cycling is active
      video.addEventListener('ended', () => {
        if (this.isCyclingActive) {
          // Clear monitoring state when video ends naturally
          video._segmentState.isMonitoring = false
          this.transitionToNextMedia()
        }
      })

      // Handle video metadata loaded - calculate segment parameters and set start time
      video.addEventListener('loadedmetadata', () => {
        console.log(`Video metadata loaded for file: ${mediaItem.name}`)

        // Get video dimensions and duration
        const duration = video.duration
        const naturalWidth = video.videoWidth
        const naturalHeight = video.videoHeight

        console.log(
          `Video segment debug - duration: ${duration}s, dimensions: ${naturalWidth}x${naturalHeight}, skipStart: ${segmentSettings.skipStart}s, skipEnd: ${segmentSettings.skipEnd}s`
        )

        try {
          // Calculate video segment parameters with fallback logic
          const segmentParams = getVideoSegmentParameters(video.duration, segmentSettings)

          // Store segment parameters in video state
          video._segmentState.startPoint = segmentParams.startPoint
          video._segmentState.segmentDuration = segmentParams.segmentDuration
          video._segmentState.segmentEndTime =
            segmentParams.startPoint + segmentParams.segmentDuration
          video._segmentState.fallbackUsed = segmentParams.fallbackUsed
          video._segmentState.seekTarget = segmentParams.startPoint
          video._segmentState.seekAttempts = 0

          // Store segment parameters on video element
          video._segmentParams = segmentParams

          // Log video segment information for debugging
          console.log(
            `Video segment debug for ${mediaItem.name}: duration=${video.duration.toFixed(2)}s, ` +
              `segmentDuration=${segmentParams.segmentDuration.toFixed(2)}s, ` +
              `startPoint=${segmentParams.startPoint.toFixed(2)}s, ` +
              `endPoint=${(segmentParams.startPoint + segmentParams.segmentDuration).toFixed(2)}s, ` +
              `coverage=${((segmentParams.segmentDuration / video.duration) * 100).toFixed(1)}%, ` +
              `fallback=${segmentParams.fallbackUsed || 'none'}`
          )

          // Seek to start point with retry mechanism
          this.seekToStartPoint(video, segmentParams.startPoint)

          // Video offset fallback applied if needed (no user notification for noise reduction)

          // Start segment monitoring if cycling is active
          if (this.isCyclingActive) {
            video._segmentState.isMonitoring = true
          }
        } catch (error) {
          console.error('Video segment calculation error:', error)
          // Fallback to original behavior if segment calculation fails
          if (this.isCyclingActive) {
            this.scheduleVideoMaxDurationTransition()
          }
        }
      })

      // Enhanced timeupdate event for precise segment timing
      video.addEventListener('timeupdate', () => {
        if (!this.isCyclingActive || !video._segmentState.isMonitoring) {
          return
        }

        const currentTime = video.currentTime
        const segmentState = video._segmentState

        // Throttle timeupdate checks to avoid excessive processing
        if (
          currentTime - segmentState.lastTimeUpdateCheck <
          PLAYBACK_CONFIG.VIDEO_TIMING.TIMEUPDATE_CHECK_THRESHOLD
        ) {
          return
        }
        segmentState.lastTimeUpdateCheck = currentTime

        // Check if segment duration is complete
        if (
          segmentState.segmentEndTime &&
          currentTime >=
            segmentState.segmentEndTime - PLAYBACK_CONFIG.VIDEO_TIMING.SEGMENT_END_TOLERANCE
        ) {
          // Segment duration reached, transition to next media
          segmentState.isMonitoring = false
          this.transitionToNextMedia()
        }
      })

      // Enhanced seeked event for seeking accuracy verification
      video.addEventListener('seeked', () => {
        const segmentState = video._segmentState
        if (!segmentState.seekTarget) return

        const target = segmentState.seekTarget
        const actual = video.currentTime
        const tolerance = PLAYBACK_CONFIG.VIDEO_TIMING.SEEKING_TOLERANCE

        // Check if seeking was accurate enough
        if (
          Math.abs(actual - target) > tolerance &&
          segmentState.seekAttempts < PLAYBACK_CONFIG.VIDEO_TIMING.MAX_SEEKING_ATTEMPTS
        ) {
          // Retry seeking
          segmentState.seekAttempts++
          console.warn(
            `Seeking retry ${segmentState.seekAttempts} for ${mediaItem.name}: target=${target}, actual=${actual}`
          )
          video.currentTime = target
        } else {
          // Seeking complete (successful or max attempts reached)
          if (segmentState.seekAttempts >= PLAYBACK_CONFIG.VIDEO_TIMING.MAX_SEEKING_ATTEMPTS) {
            console.warn(
              `Max seeking attempts reached for ${mediaItem.name}: target=${target}, final=${actual}`
            )
          }
          segmentState.seekTarget = null
          segmentState.seekAttempts = 0
        }
      })

      // Handle video load errors
      video.addEventListener('error', () => {
        console.error(`Video load error for file: ${mediaItem.name}`)
        toastManager.error(
          t.get('USER_MESSAGES.notifications.error.videoLoadFailed', { fileName: mediaItem.name })
        )

        // Clean up segment state
        video._segmentState.isMonitoring = false

        // If cycling is active and video fails to load, transition to next media
        if (this.isCyclingActive) {
          setTimeout(() => this.transitionToNextMedia(), PLAYBACK_CONFIG.MIN_TRANSITION_DELAY)
        }
      })

      return video
    } catch (error) {
      console.error('Video creation error:', error)
      return null
    }
  }

  /**
   * Seek video to start point with retry mechanism
   * @param {HTMLVideoElement} video - Video element to seek
   * @param {number} startPoint - Target start point in seconds
   */
  seekToStartPoint(video, startPoint) {
    try {
      video._segmentState.seekTarget = startPoint
      video._segmentState.seekAttempts = 0
      video.currentTime = startPoint
    } catch (error) {
      console.error('Video seeking error:', error)
      // Continue playback from current position if seeking fails
      video._segmentState.seekTarget = null
    }
  }

  /**
   * Clear the currently displayed media with enhanced cleanup
   */
  clearCurrentMedia() {
    try {
      if (this.currentMediaElement) {
        // Clean up video segment state if it's a video element
        if (
          this.currentMediaElement.tagName === 'VIDEO' &&
          this.currentMediaElement._segmentState
        ) {
          // Stop monitoring
          this.currentMediaElement._segmentState.isMonitoring = false
          // Clear any pending seek operations
          this.currentMediaElement._segmentState.seekTarget = null
        }

        // Remove from DOM
        if (this.currentMediaElement.parentNode) {
          this.currentMediaElement.parentNode.removeChild(this.currentMediaElement)
        }

        // Clean up event listeners if needed
        this.currentMediaElement = null
      }
    } catch (error) {
      console.error('Error clearing current media:', error)
    }
  }

  /**
   * Handle window resize events to maintain responsive behavior
   */
  handleWindowResize() {
    try {
      console.log('Window resized - adjusting media display')
    } catch (error) {
      console.error('Window resize handling error:', error)
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

      console.log('PlaybackEngine cleanup completed')
    } catch (error) {
      console.error('PlaybackEngine cleanup error:', error)
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
      console.error('Random media selection error:', error)
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
   * Transition to the next random media item with enhanced cleanup and error handling
   */
  transitionToNextMedia() {
    try {
      if (!this.isCyclingActive) {
        return
      }

      // Store reference to previous media for cleanup
      const previousMedia = this.currentMediaItem

      // Clean up any video timing state from current media
      if (
        this.currentMediaElement &&
        this.currentMediaElement.tagName === 'VIDEO' &&
        this.currentMediaElement._segmentState
      ) {
        this.currentMediaElement._segmentState.isMonitoring = false
        this.currentMediaElement._segmentState.seekTarget = null
      }

      const nextMediaItem = this.getRandomMediaItem()
      if (nextMediaItem) {
        this.currentMediaItem = nextMediaItem
        this.addToRecentHistory(nextMediaItem)
        this.displayMedia(nextMediaItem)

        // Emit cycling event
        eventBus.emit(CYCLING_EVENTS.MEDIA_CHANGED, {
          previousMedia: previousMedia,
          currentMedia: nextMediaItem,
        })
      } else {
        // No media available, stop cycling
        this.stopCycling()
      }
    } catch (error) {
      console.error('Cycling transition error:', error)

      // Fail-safe: Try to continue cycling with any available media
      try {
        const mediaPool = stateManager.getMediaPool()
        const usableMedia = filterUsableMedia(mediaPool)
        if (usableMedia.length > 0) {
          console.log('Attempting fail-safe transition to any available media')
          // Reset recent history to allow any media to be selected
          this.recentMediaHistory = []
          const fallbackMedia = this.getRandomMediaItem()
          if (fallbackMedia) {
            this.currentMediaItem = fallbackMedia
            this.addToRecentHistory(fallbackMedia)
            this.displayMedia(fallbackMedia)
            return
          }
        }
      } catch (fallbackError) {
        console.error(
          'Fail-safe transition failed - complete playback engine failure:',
          fallbackError
        )
      }

      // Ultimate fallback: stop cycling
      this.stopCycling()
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
        console.log('No usable media available for cycling')
        return
      }

      this.isCyclingActive = true
      this.playbackState = PLAYBACK_STATES.CYCLING
      this.currentMediaItem = firstMediaItem
      this.addToRecentHistory(firstMediaItem)
      this.displayMedia(firstMediaItem)

      console.log('Media cycling started')
      eventBus.emit(CYCLING_EVENTS.STARTED, {
        currentMedia: firstMediaItem,
      })
    } catch (error) {
      console.error('Error starting media cycling:', error)
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

      console.log('Media cycling stopped')
      eventBus.emit(CYCLING_EVENTS.STOPPED, {
        finalMedia: this.currentMediaItem,
      })
    } catch (error) {
      console.error('PlaybackEngine cleanup error:', error)
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
        console.log('Auto playback started')
      } else {
        console.log('Auto playback started but no usable media - showing metadata-only message')
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
      console.log('Auto playback stopped')
    }
  }
}

// Export singleton instance
export const playbackEngine = new PlaybackEngine()
