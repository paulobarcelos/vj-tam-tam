/**
 * Playback configuration constants for the VJ Tam Tam application
 * Defines timing, transitions, and other playback behavior settings
 */

/**
 * Playback timing configuration
 */
export const PLAYBACK_CONFIG = {
  // Transition type for media changes
  TRANSITION_TYPE: 'hard-cut', // Future: 'fade', 'slide', etc.

  // Recent items history size to avoid immediate repetition
  RECENT_ITEMS_HISTORY_SIZE: 3,

  // Minimum delay between cycling transitions (milliseconds)
  MIN_TRANSITION_DELAY: 100,

  // Video timing precision settings
  VIDEO_TIMING: {
    // Timing tolerance for segment end detection (seconds)
    SEGMENT_END_TOLERANCE: 0.1,
    // Seeking accuracy tolerance (seconds)
    SEEKING_TOLERANCE: 0.5,
    // Maximum seeking retry attempts
    MAX_SEEKING_ATTEMPTS: 3,
    // Timeupdate monitoring interval check (to avoid excessive processing)
    TIMEUPDATE_CHECK_THRESHOLD: 0.1, // Only check timing every 0.1 seconds
  },

  // Segment settings defaults and ranges
  SEGMENT_SETTINGS: {
    // Default values (in seconds)
    DEFAULT_MIN_DURATION: 2,
    DEFAULT_MAX_DURATION: 5,
    DEFAULT_SKIP_START: 0,
    DEFAULT_SKIP_END: 0,

    // Valid ranges for settings (in seconds)
    DURATION_MIN_LIMIT: 1,
    DURATION_MAX_LIMIT: 30,
    SKIP_MIN_LIMIT: 0,
    SKIP_MAX_LIMIT: 300, // 5 minutes max skip
  },
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
