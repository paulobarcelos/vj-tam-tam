/**
 * Playback configuration constants for the VJ Tam Tam application
 * Defines timing, transitions, and other playback behavior settings
 */

/**
 * Playback timing configuration
 */
export const PLAYBACK_CONFIG = {
  // Image display duration in milliseconds (4 seconds)
  IMAGE_DISPLAY_DURATION: 4000,

  // Maximum video playback duration in milliseconds (30 seconds)
  VIDEO_MAX_DURATION: 30000,

  // Transition type for media changes
  TRANSITION_TYPE: 'hard-cut', // Future: 'fade', 'slide', etc.

  // Recent items history size to avoid immediate repetition
  RECENT_ITEMS_HISTORY_SIZE: 3,

  // Minimum delay between cycling transitions (milliseconds)
  MIN_TRANSITION_DELAY: 100,
}

/**
 * Playback state constants
 */
export const PLAYBACK_STATES = {
  INACTIVE: 'inactive',
  ACTIVE: 'active',
  CYCLING: 'cycling',
  PAUSED: 'paused',
}

/**
 * Cycling events for EventBus
 */
export const CYCLING_EVENTS = {
  STARTED: 'cycling.started',
  STOPPED: 'cycling.stopped',
  MEDIA_CHANGED: 'cycling.mediaChanged',
  ERROR: 'cycling.error',
}
