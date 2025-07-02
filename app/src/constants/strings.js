/**
 * ============================================================================
 * VJ TAM TAM - CENTRALIZED STRINGS MODULE
 * ============================================================================
 *
 * All user-facing text are defined here.
 * See docs/operational-guidelines.md Section 16 for usage guidelines.
 */

/**
 * ============================================================================
 * CENTRALIZED STRINGS - FULLY SERIALIZABLE FOR I18N
 * ============================================================================
 */
export const STRINGS = {
  // ========================================================================
  // USER INTERFACE - All visible UI elements
  // ========================================================================
  USER_INTERFACE: {
    // Page metadata
    meta: {
      title: 'VJ Tam Tam',
    },

    // Buttons and controls
    buttons: {
      files: '📄 Files',
      folders: '📁 Folders',
      clearMedia: 'Clear all',
      restoreAccess: '🔓 Restore Access',
      bulkRestore: '↗️ Bulk Restore All',
    },

    // Tooltips and help text
    tooltips: {
      filesButton: 'Browse for individual files',
      foldersButton: 'Browse for entire folders',
      removeMediaItem: 'Remove from pool',
      dismissNotice: 'Dismiss',
      restoreAccess: 'Restore file access',
    },

    // Labels and headings
    labels: {
      mediaPool: 'Media Pool',
      temporaryFiles: 'Temporary Files',
      persistentFiles: 'Persistent Files',
    },

    // Form controls
    controls: {
      skipStart: {
        label: 'Video Skip Start',
        unit: 'sec',
      },
      skipEnd: {
        label: 'Video Skip End',
        unit: 'sec',
      },
    },

    // File status indicators
    fileStatus: {
      needsPermission: 'needs permission',
      metadataOnly: 'metadata only',
      temporary: 'temporary',
      ready: 'ready',
      unknownSize: 'unknown size',
    },

    // Welcome and instruction text
    welcome: {
      heading: 'Welcome to VJ Tam Tam',
      instructions:
        'Please drag and drop your photos and videos here, or click to browse, to start your performance',
      emptyPool: 'Drop media files to get started',
    },

    // Drop zone text
    dropZone: {
      message: 'Drop your media files here',
      supportedFormats: 'Supported: {{supportedTypes}}',
    },

    // Text pool section
    textPool: {
      sectionTitle: 'Text Pool',
      inputPlaceholder: 'Add a message...',
      addButtonTitle: 'Add text',
      emptyMessage: 'No messages added yet',
      clearAllButton: 'Clear all',
      deleteButtonTitle: 'Remove this text',
      deleteButtonAriaLabel: 'Remove text: {{text}}',
      frequencyLabel: 'Text Frequency',
      frequencyNever: 'Never',
      frequencyRare: 'Rare',
      frequencySeldom: 'Seldom',
      frequencyOccasional: 'Occasional',
      frequencyNormal: 'Normal',
      frequencyFrequent: 'Frequent',
      frequencyOften: 'Often',
      frequencyAlways: 'Always',
      frequencyDescription: 'Controls how often text messages appear over the visuals',
    },
  },

  // ========================================================================
  // USER MESSAGES - All messages shown to users
  // ========================================================================
  USER_MESSAGES: {
    // Toast notifications
    notifications: {
      success: {
        mediaAdded: 'Added {{count}} media file{{plural}} to pool',
        accessRestored: 'File access restored',
        bulkRestoreComplete: 'All files restored successfully',
        filesRestored: 'Restored access to {{count}} file{{plural}}',
        mediaCleared: 'Media pool cleared successfully',
        projectionDimensionsUpdated: 'Projection dimensions updated to {{width}}×{{height}}',
      },
      error: {
        fileNotSupported: 'File type not supported. Supported types: {{supportedTypes}}',
        fileAccessFailed: 'Error accessing files. Please try again.',
        folderAccessFailed: 'Error accessing folder. Please try again.',
        fileProcessingFailed: 'Error processing some files. Please try again.',
        appInitFailed: 'Failed to initialize application. Please refresh the page.',
        settingsSaveFailed: 'Settings could not be saved',
        filesSkipped: '{{count}} file{{plural}} already in media pool (skipped)',
        importFailed: 'Some files could not be imported. Supported formats: {{supportedTypes}}',
        fileRestoreFailed: 'Failed to restore file access',
        fileRestoreError: 'Error occurred while restoring files',
        mediaDisplayFailed: 'Failed to display media file',
        mediaDisplayFailedWithName: 'Failed to display {{fileName}}',
        imageLoadFailed: 'Failed to load image: {{fileName}}',
        videoLoadFailed: 'Failed to load video: {{fileName}}',
        projectionModeEnterFailed: 'Failed to enter projection mode',
        projectionModeExitFailed: 'Failed to exit projection mode',
      },
      info: {
        filePickerFallback: 'FileSystemAccessAPI permission denied. Using fallback file picker.',
        folderPickerFallback:
          'FileSystemAccessAPI permission denied. Using fallback folder picker.',
        filePickerActive: 'File picker already active, ignoring click',
      },

      // Text pool notifications
      textPool: {
        textAdded: 'Text message added to pool',
        emptyInputWarning: 'Please enter a message',
        tooLongWarning: 'Message too long (max 200 characters)',
        textRemoved: 'Removed: "{{text}}"',
        textRemovalFailed: 'Failed to remove text',
        poolAlreadyEmpty: 'Text pool is already empty',
        poolCleared: 'Cleared {{count}} text message{{plural}}',
        poolClearFailed: 'Failed to clear text pool',
        confirmClearAll: 'Are you sure you want to clear all {{count}} text message{{plural}}?',
      },

      // Media pool notifications (aligned with text pool pattern)
      media: {
        poolAlreadyEmpty: 'Media pool is already empty',
        poolCleared: 'Cleared {{count}} media item{{plural}}',
        poolClearFailed: 'Failed to clear media pool',
        confirmClearAll: 'Are you sure you want to clear all {{count}} media item{{plural}}?',
        itemRemoved: 'Media item removed from pool',
      },
    },

    // Status banners and notices
    status: {
      permissionNotice: '{{count}} file{{plural}} need permission to be accessed.',
      temporaryNotice: '{{count}} temporary file{{plural}} will be removed on page reload.',
      fileSystemTip:
        'Use 📄 Files or 📁 Folders buttons for persistent files that will be available next time you visit',
      permissionBanner: 'Click to restore access to your files',
      permissionBannerClick: '{{count}} file{{plural}} need permission - click to restore access',
      clearMediaConfirm: 'Clear all media from the pool? This action cannot be undone.',
    },
  },

  // ========================================================================
  // TEMPLATES - Reusable string templates
  // ========================================================================
  TEMPLATES: {
    fileCount: '{{count}} file{{plural}}',
    fileCountWithType: '{{count}} {{type}} file{{plural}}',
    fileDisplay: '{{type}} • {{size}}{{status}}',
    fileDisplayWithStatus: '{{type}} • {{size}} • {{status}}',
    accessCount: '{{validCount}} of {{totalCount}}',
    upgradeNotification: 'Restored access to {{count}} file{{plural}}: {{fileName}}',
    upgradeNotificationSingle: 'Restored access to 1 file: {{fileName}}',
    upgradeNotificationMultiple: 'Restored access to {{count}} files',
    fileRestored: 'File "{{fileName}}" restored successfully',
    fileRestoreFailed: 'Failed to restore file "{{fileName}}"',
    filesRestored: '{{count}} file{{plural}} restored successfully',
    noFilesRestored: 'No files could be restored',
    bulkRestoreFailed: 'Failed to restore file permissions',
  },
}

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Helper function to get a nested string value by path
 * @param {string} path - Dot-separated path (e.g., 'USER_MESSAGES.notifications.success.mediaAdded')
 * @returns {string} - The string value or empty string if not found
 */
export const getString = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], STRINGS) || ''
}

/**
 * Helper function to handle pluralization
 * @param {number} count - Count to determine plurality
 * @returns {string} - 's' if plural, empty string if singular
 */
export const getPlural = (count) => (count !== 1 ? 's' : '')

/**
 * Interpolate a template string with values
 * @param {string} template - Template string with {{key}} placeholders
 * @param {Object} values - Object with values to interpolate
 * @returns {string} - Interpolated string
 */
export const interpolate = (template, values = {}) => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] !== undefined ? values[key] : match
  })
}

/**
 * ============================================================================
 * INTERPOLATION HELPERS
 * ============================================================================
 */
export const t = {
  /**
   * Get string with interpolation and automatic pluralization
   * @param {string} path - Path to string template
   * @param {Object} values - Values to interpolate
   * @returns {string} - Interpolated string
   */
  get: (path, values = {}) => {
    const template = getString(path)
    if (!template) return ''

    // Handle pluralization automatically
    const interpolationValues = {
      ...values,
      plural: values.count !== undefined ? getPlural(values.count) : '',
    }

    return interpolate(template, interpolationValues)
  },

  // Commonly used interpolated strings
  filesAdded: (count) => t.get('USER_MESSAGES.notifications.success.mediaAdded', { count }),
  filesSkipped: (count) => t.get('USER_MESSAGES.notifications.error.filesSkipped', { count }),
  permissionNotice: (count) => t.get('USER_MESSAGES.status.permissionNotice', { count }),
  permissionBannerClick: (count) => t.get('USER_MESSAGES.status.permissionBannerClick', { count }),
  temporaryNotice: (count) => t.get('USER_MESSAGES.status.temporaryNotice', { count }),
  supportedFormats: (supportedTypes) =>
    t.get('USER_INTERFACE.dropZone.supportedFormats', { supportedTypes }),
  fileNotSupported: (supportedTypes) =>
    t.get('USER_MESSAGES.notifications.error.fileNotSupported', { supportedTypes }),
  importFailed: (supportedTypes) =>
    t.get('USER_MESSAGES.notifications.error.importFailed', { supportedTypes }),
  fileType: (type, size, status) => {
    if (status) {
      return t.get('TEMPLATES.fileDisplayWithStatus', { type, size, status })
    }
    return t.get('TEMPLATES.fileDisplay', { type, size, status: '' })
  },
  fileRestored: (fileName) => t.get('TEMPLATES.fileRestored', { fileName }),
  fileRestoreFailed: (fileName) => t.get('TEMPLATES.fileRestoreFailed', { fileName }),
  filesRestored: (count) => t.get('TEMPLATES.filesRestored', { count }),
  noFilesRestored: () => t.get('TEMPLATES.noFilesRestored'),
  bulkRestoreFailed: () => t.get('TEMPLATES.bulkRestoreFailed'),
  projectionDimensionsUpdated: (width, height) =>
    t.get('USER_MESSAGES.notifications.success.projectionDimensionsUpdated', { width, height }),
  projectionModeEnterFailed: () =>
    t.get('USER_MESSAGES.notifications.error.projectionModeEnterFailed'),
  projectionModeExitFailed: () =>
    t.get('USER_MESSAGES.notifications.error.projectionModeExitFailed'),
}
