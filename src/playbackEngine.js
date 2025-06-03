/**
 * PlaybackEngine module for managing fullscreen media display
 * Handles displaying images and videos with object-fit: cover behavior
 * and responsive window resizing
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

class PlaybackEngine {
  constructor() {
    this.stageElement = null
    this.currentMediaElement = null
    this.handleWindowResize = this.handleWindowResize.bind(this)
  }

  /**
   * Initialize the PlaybackEngine
   */
  init() {
    try {
      this.stageElement = document.getElementById('stage')

      if (!this.stageElement) {
        throw new Error('Stage element not found')
      }

      this.setupEventListeners()
      console.log('PlaybackEngine initialized successfully')
    } catch (error) {
      console.error('Error initializing PlaybackEngine:', error)
      throw error
    }
  }

  /**
   * Set up event listeners for state changes and window resize
   */
  setupEventListeners() {
    // Listen for media pool updates
    eventBus.on('state.mediaPoolUpdated', this.handleMediaPoolUpdate.bind(this))

    // Listen for window resize events
    window.addEventListener('resize', this.handleWindowResize)
  }

  /**
   * Handle media pool state updates
   * @param {Object} updateData - Media pool update data
   */
  handleMediaPoolUpdate(updateData) {
    try {
      const { mediaPool, totalCount, cleared } = updateData

      if (cleared || totalCount === 0) {
        this.clearCurrentMedia()
        return
      }

      // Display the first available media item
      if (mediaPool.length > 0) {
        this.displayMedia(mediaPool[0])
      }
    } catch (error) {
      console.error('Error handling media pool update:', error)
      toastManager.error('Failed to update media display')
    }
  }

  /**
   * Display a media item in the stage area
   * @param {MediaItem} mediaItem - Media item to display
   */
  displayMedia(mediaItem) {
    try {
      if (!mediaItem || !mediaItem.url) {
        console.warn('Invalid media item provided to displayMedia')
        return
      }

      // Clear any existing media
      this.clearCurrentMedia()

      let mediaElement

      if (mediaItem.type === 'image') {
        mediaElement = this.createImageElement(mediaItem)
      } else if (mediaItem.type === 'video') {
        mediaElement = this.createVideoElement(mediaItem)
      } else {
        console.warn('Unsupported media type:', mediaItem.type)
        return
      }

      if (mediaElement) {
        this.currentMediaElement = mediaElement
        this.stageElement.appendChild(mediaElement)
      }
    } catch (error) {
      console.error('Error displaying media:', error)
      toastManager.error(`Failed to display ${mediaItem.name}`)
    }
  }

  /**
   * Create an image element for display
   * @param {MediaItem} mediaItem - Image media item
   * @returns {HTMLImageElement} - Configured image element
   */
  createImageElement(mediaItem) {
    try {
      const img = document.createElement('img')
      img.className = 'stage-media image'
      img.src = mediaItem.url
      img.alt = mediaItem.name

      // Handle image load errors
      img.addEventListener('error', () => {
        console.error('Failed to load image:', mediaItem.name)
        toastManager.error(`Failed to load image: ${mediaItem.name}`)
      })

      return img
    } catch (error) {
      console.error('Error creating image element:', error)
      return null
    }
  }

  /**
   * Create a video element for display
   * @param {MediaItem} mediaItem - Video media item
   * @returns {HTMLVideoElement} - Configured video element
   */
  createVideoElement(mediaItem) {
    try {
      const video = document.createElement('video')
      video.className = 'stage-media video'
      video.src = mediaItem.url
      video.autoplay = true
      video.muted = true
      video.loop = true
      video.controls = false

      // Handle video load errors
      video.addEventListener('error', () => {
        console.error('Failed to load video:', mediaItem.name)
        toastManager.error(`Failed to load video: ${mediaItem.name}`)
      })

      // Handle video metadata loaded event
      video.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded:', mediaItem.name)
      })

      return video
    } catch (error) {
      console.error('Error creating video element:', error)
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
      console.error('Error clearing current media:', error)
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
        console.log('Window resized - media element will auto-adjust via CSS')
      }
    } catch (error) {
      console.error('Error handling window resize:', error)
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
      window.removeEventListener('resize', this.handleWindowResize)

      // Clear current media
      this.clearCurrentMedia()

      console.log('PlaybackEngine cleanup completed')
    } catch (error) {
      console.error('Error during PlaybackEngine cleanup:', error)
    }
  }
}

// Export singleton instance
export const playbackEngine = new PlaybackEngine()
