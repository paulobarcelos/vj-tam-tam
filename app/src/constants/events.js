/**
 * Event constants for the VJ Tam Tam application
 * Centralized definition of all event names used throughout the application
 */

/**
 * Text Pool related events
 */
export const TEXT_POOL_EVENTS = {
  UPDATED: 'textPool.updated',
  SIZE_CHANGED: 'textPool.sizeChanged',
  PERFORMANCE_WARNING: 'textPool.performanceWarning',
  FREQUENCY_CHANGED: 'textPool.frequencyChanged',
}

/**
 * Text Overlay related events
 */
export const TEXT_OVERLAY_EVENTS = {
  STARTED: 'textOverlay.started',
  STOPPED: 'textOverlay.stopped',
  PAUSED: 'textOverlay.paused',
  RESUMED: 'textOverlay.resumed',
  TEXT_SELECTED: 'textOverlay.textSelected',
  SHOWN: 'textOverlay.shown',
  HIDDEN: 'textOverlay.hidden',
  FREQUENCY_UPDATED: 'textOverlay.frequencyUpdated',
  FONT_SIZE_UPDATED: 'textOverlay.fontSizeUpdated',
  PERFORMANCE_WARNING: 'textOverlay.performanceWarning',
  STYLING_CONFIG_UPDATED: 'textOverlay.stylingConfigUpdated',
}

/**
 * State management related events
 */
export const STATE_EVENTS = {
  MEDIA_POOL_RESTORED: 'state.mediaPoolRestored',
  MEDIA_POOL_UPDATED: 'state.mediaPoolUpdated',
  SEGMENT_SETTINGS_UPDATED: 'state.segmentSettingsUpdated',
  UI_SETTINGS_UPDATED: 'state.uiSettingsUpdated',
  PROJECTION_MODE_UPDATED: 'state.projectionModeUpdated',
}

/**
 * Projection mode related events (Story 6.3)
 */
export const PROJECTION_EVENTS = {
  MODE_ENABLED: 'projection.modeEnabled',
  MODE_DISABLED: 'projection.modeDisabled',
  LAYOUT_CHANGED: 'projection.layoutChanged',
  LAYOUT_SAVED: 'projection.layoutSaved',
  LAYOUT_LOADED: 'projection.layoutLoaded',
}

/**
 * Media processing related events
 */
export const MEDIA_EVENTS = {
  FILES_ADDED: 'media.filesAdded',
  FILE_REMOVED: 'media.fileRemoved',
  POOL_CLEARED: 'media.poolCleared',
}

/**
 * Cycling events for media playback cycling
 */
export const CYCLING_EVENTS = {
  STARTED: 'cycling.started',
  STOPPED: 'cycling.stopped',
  MEDIA_CHANGED: 'cycling.mediaChanged',
  ERROR: 'cycling.error',
}
