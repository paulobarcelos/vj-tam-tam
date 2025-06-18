/**
 * ============================================================================
 * VJ TAM TAM - CENTRALIZED STRINGS MODULE
 * ============================================================================
 *
 * All user-facing text and console messages are defined here.
 * See docs/operational-guidelines.md Section 16 for usage guidelines.
 */

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
  // SYSTEM MESSAGES - All console and debug messages
  // ========================================================================
  SYSTEM_MESSAGES: {
    // File System Access API messages
    fileSystemAccess: {
      initialized: 'FileSystemAccessAPI facade initialized successfully',
      notSupported: 'FileSystemAccessAPI not supported, falling back to metadata-only persistence',
      initError: 'Error initializing FileSystemAccessAPI facade:',
      dbOpenError: 'Failed to open IndexedDB:',

      // File handle operations
      handleStored: 'File handle stored for {{fileName}}',
      handleStoreFailed: 'Failed to store file handle:',
      handleStoreError: 'Error storing file handle:',
      handleRemoved: 'File handle removed for ID: {{id}}',
      handleRemoveFailed: 'Failed to remove file handle:',
      handleRemoveError: 'Error removing file handle:',
      handlesCleared: 'All file handles cleared',
      handlesClearFailed: 'Failed to clear file handles:',
      handlesClearError: 'Error clearing file handles:',

      // File access and permissions
      permissionDenied: 'Permission denied for file: {{fileName}}',
      fileAccessFailed: 'Failed to access file handle for {{fileName}}:',
      fileAccessError: 'Error retrieving file handle:',
      fileRetrieveFailed: 'Failed to retrieve file handle:',
      fileRetrieveError: 'Error retrieving all files:',

      // User activation
      userActivationUnavailable: 'User activation API not available, assuming no activation',
      userActivationError: 'Error checking user activation:',
      userActivationCheck:
        'User activation check: isActive={{isActive}}, hasBeenActive={{hasBeenActive}}, result={{result}}',

      // File discovery and processing
      noHandlesFound: 'No file handles found in storage',
      handlesFound: 'Found {{count}} stored file handles',
      handlesFoundForAccess: 'Found {{count}} stored file handles for access request',
      metadataOnlyReturn: 'Returning metadata-only files to avoid user activation race conditions',
      accessRequested: 'Requesting access to stored files with user activation...',
      accessSuccess: 'Successfully accessed {{validCount}} of {{totalCount}} stored files',
      accessUnavailable: 'FileSystemAccessAPI not supported or database not available',
      accessError: 'Error requesting stored files access:',
      accessFailed: 'Failed to retrieve file handles for user activation:',
    },

    // File System Facade messages
    fileSystemFacade: {
      initialized:
        'FileSystemFacade initialized: hasFileSystemAccess={{hasAccess}}, browser={{browser}}',
      filePickerAttempt: 'Attempting to open file picker with FileSystemAccessAPI...',
      filesSelected: 'Selected {{count}} files via FileSystemAccessAPI with handles',
      filePickerCancelled: 'File picker cancelled by user',
      filePickerError: 'Error browsing files with FileSystemAccessAPI:',
      filePickerErrorDetails: 'Error details: name={{name}}, message={{message}}',
      filePickerFallback: 'Permission denied, falling back to HTML input file picker',

      directoryPickerAttempt: 'Attempting to open directory picker with FileSystemAccessAPI...',
      directorySelected: 'Selected folder: {{folderName}}',
      directoryFilesFound:
        'Found {{count}} media files in folder via FileSystemAccessAPI with handles',
      directoryPickerCancelled: 'Directory picker cancelled by user',
      directoryPickerError: 'Error browsing folder with FileSystemAccessAPI:',
      directoryPickerFallback: 'Permission denied, falling back to HTML input folder picker',

      fileExtractionError: 'Error extracting files from directory:',
      fileAccessError: 'Failed to access file {{fileName}}:',
    },

    // State Management messages
    stateManager: {
      initError: 'FileSystemAccessAPI initialization failed, continuing with localStorage only:',
      restorationAttempt: 'Attempting to restore files from FileSystemAccessAPI...',
      restorationSuccess: 'Successfully restored {{count}} files from FileSystemAccessAPI',
      restorationNone: 'No persistent files found after cleanup.',
      restorationEmpty: 'No persisted state found or media pool is empty.',
      restorationError: 'Error during persistence restoration:',

      stateSaved: 'Current state saved to localStorage.',
      stateSaveError: 'Error saving current state:',

      invalidInput: 'StateManager.addMediaToPool: newMediaItems must be an array',
      fileUpgrade: 'Upgrading metadata-only file: {{fileName}}',
      fileDuplicate: 'File already in media pool (skipped): {{fileName}}',
      handleStoreFailed: 'Failed to store file handle for {{fileName}}:',
      handleRemoveFailed: 'Failed to remove file handle for ID {{id}}:',
      handlesClearFailed: 'Failed to clear file handles:',
      cleanedUp: 'Cleaned up {{count}} temporary drag & drop files that cannot be restored',
      restored: 'Restored {{count}} FileSystemAccessAPI items from localStorage (metadata only).',

      // Segment settings messages
      segmentSettingsRestored: 'Segment settings restored from localStorage',
      invalidSegmentSettings: 'Invalid segment settings provided - must be a valid object',

      // UI settings messages
      uiSettingsRestored: 'UI settings restored from localStorage',
      invalidUISettings: 'Invalid UI settings provided - must be a valid object',

      // Text pool messages
      textPoolRestored: 'Text pool restored from localStorage with {{count}} entries',
      noTextPool: 'No text pool in persistedState, keeping empty pool',
      aboutToRestoreTextPool: 'About to restore text pool',
      textFrequencyRestored: 'Text frequency restored: {{frequency}}',
      textFrequencyDefault: 'No text frequency found, using default: {{frequency}}',

      // Media pool messages
      mediaPoolAlreadyEmpty: 'Media pool is already empty',

      // Debug messages
      persistedStateLoaded: 'Persisted state loaded from storage',
      segmentSettingsPreRestore: 'Current state before segment settings restoration',
      segmentSettingsPostRestore: 'State after segment settings restoration',
      uiSettingsPreRestore: 'Current UI settings before restoration',
      uiSettingsPostRestore: 'State after UI settings restoration',
      noSegmentSettings: 'No segment settings in persistedState, keeping defaults',
      noUISettings: 'No UI settings in persistedState, keeping defaults',
      aboutToRestoreSegmentSettings: 'About to restore segment settings',
      aboutToRestoreUISettings: 'About to restore UI settings',
    },

    // Media Processor messages
    mediaProcessor: {
      fileMetadataUpgrade: 'File {{fileName}} exists as metadata-only, will attempt upgrade',
      fileDuplicateSkip: 'File {{fileName}} already exists with full data, skipping',
      fileHandleAvailable:
        'File handle available for {{fileName}} - will be stored for persistence',
      fileHandleUnavailable:
        'No file handle for {{fileName}} - drag-and-drop file, metadata-only persistence',
      fileProcessingError: 'Error processing files:',
      droppedItemsError: 'Error processing dropped items:',
    },

    // UI Manager messages
    uiManager: {
      requiredElementsNotFound: 'Required DOM elements not found',
      bulkRestoreAttempt: 'Attempting to restore {{count}} files',
      bulkRestoreSuccess: 'Successfully restored {{count}} files',
      bulkRestoreFailed: 'Failed to restore file: {{fileName}}',
      bulkRestoreError: 'Error restoring individual file {{fileName}}:',
      metadataUpgrade: 'Upgraded {{count}} metadata-only files to full access',
      bulkFileRestoreError: 'Error during bulk file restore:',

      // Debug messages for segment controls
      segmentControlsUpdateCalled: 'updateSegmentControlsDOM called with settings',
      settingMinDuration: 'Setting min duration controls to',
      settingMaxDuration: 'Setting max duration controls to',
      settingSkipStart: 'Setting skip start controls to',
      settingSkipEnd: 'Setting skip end controls to',
      finalDOMValues: 'Final DOM values - minSlider',
      skipStartControlUpdate: 'Updating skip start control to {{value}} seconds',
      skipStartValidation: 'Skip start value validated: {{value}} seconds',
      skipEndControlUpdate: 'Updating skip end control to {{value}} seconds',
      skipEndValidation: 'Skip end value validated: {{value}} seconds',

      // Debug messages for advanced controls initialization
      advancedControlsAlreadyInit: 'Advanced Controls already initialized, skipping',
      advancedControlsInitStart: 'Starting Advanced Controls initialization',
      segmentSettingsFromState: 'Got segment settings from stateManager',
      domUpdatedWithSegmentSettings: 'Updated DOM with segment settings',
      uiSettingsFromState: 'Got UI settings from stateManager',
      advancedControlsVisible: 'Setting advanced controls to visible',
      advancedControlsHidden: 'Setting advanced controls to hidden',
      advancedControlsInitComplete: 'Advanced Controls initialization complete',

      // Idle state management messages
      idleStateEntered: 'UI entered idle state',
      idleStateExited: 'UI exited idle state',
      activityDetectionInitialized: 'Activity detection initialized',

      // Permission restoration console messages
      noPermissionNeeded: '🌐 No files need permission, skipping global hijacking setup',
      globalHijackingSetup:
        '🌐 Setting up global activation hijacking for {{count}} files needing permission',
      globalHijackingRemoval: '🌐 Removing global activation hijacking listeners',
      globalHijackingComplete: '🌐 Global activation hijacking setup complete',
      globalListenersAdding: '🌐 Adding global listeners for events: {{events}}',
      globalHijackerTriggered:
        '🌐 Global hijacker triggered: {{eventType}} on {{tagName}} {{className}}',
      skipEscapeKey: '🌐 Skipping Escape key',
      skipReservedKey: '🌐 Skipping reserved key combination: {{key}}',
      skipNonMousePointer: '🌐 Skipping non-mouse pointerdown: {{pointerType}}',
      skipMousePointerUp: '🌐 Skipping mouse pointerup',
      opportunisticRestore: '🌐 Attempting opportunistic restore for {{count}} files...',
      opportunisticComplete: '🌐 Opportunistic restore completed successfully',
      opportunisticFailed: '🌐 Opportunistic permission restore failed:',
      noFilesNeedPermission: '🌐 No files currently need permission',

      // Individual restore button messages
      createRestoreButton: '🔓 Creating restore button for: {{fileName}}',
      restoreButtonAdded: '🔓 Restore button added to controls for: {{fileName}}',
      restoreButtonClicked: '🔓 Restore button clicked, preventing propagation...',
      singleFileRestore: '🔓 Single file restore clicked for: {{fileName}}',
      singleFileDetails: '🔓 Item details:',
      callingRestoreAccess: '🔓 Calling fileSystemFacade.requestStoredFilesAccess...',
      restoreResult: '🔓 Restore result:',
      restoreSuccessful: '🔓 Successfully restored, updating state manager...',
      noFilesRestored: '🔓 No files were restored',
      restoreError: '🔓 Error restoring file:',

      // Bulk restore messages
      bulkRestoreSilent: '{{prefix}} Bulk restore (silent) for {{count}} files',
      bulkRestoreCall:
        '{{prefix}} Calling fileSystemFacade.requestStoredFilesAccess for bulk restore...',
      bulkRestoreResult: '{{prefix}} Bulk restore result: {{count}} files restored',
      bulkRestoreSilentSuccess: '{{prefix}} Silent bulk restore successful: {{count}} files',
      bulkRestoreSilentNoFiles: '{{prefix}} Silent bulk restore: no files restored',
      bulkRestoreSilentFailed: '{{prefix}} Silent bulk restore failed:',
      bulkRestoreNoFiles: '{{prefix}} No files were restored in bulk operation',

      // Media pool debug messages
      debugMediaPoolHeader: '=== MEDIA POOL DEBUG ===',
      debugTotalItems: 'Total items: {{count}}',
      debugItemDetails: 'Item {{index}}:',
      debugFilesNeedingPermission: 'Files needing permission: {{count}}',
      debugTemporaryFiles: 'Temporary files: {{count}}',
      debugUsableFiles: 'Usable files: {{count}}',
      debugFooter: '========================',
    },

    // Playback Engine messages
    playbackEngine: {
      initialized: 'PlaybackEngine initialized successfully',
      initError: 'Error initializing PlaybackEngine:',
      stageElementNotFound: 'Stage element not found',
      autoPlaybackStarted: 'Automatic playback started',
      autoPlaybackStopped: 'Automatic playback stopped',
      cleanupCompleted: 'PlaybackEngine cleanup completed',
      cleanupError: 'Error during PlaybackEngine cleanup:',

      windowResized: 'Window resized - media element will auto-adjust via CSS',
      windowResizeError: 'Error handling window resize:',

      mediaPoolUpdatedActive: 'Media pool updated while playback active',
      mediaPoolUpdateError: 'Error handling media pool update:',

      invalidMediaItem: 'Invalid media item provided to displayMedia',
      unsupportedMediaType: 'Unsupported media type: {{mediaType}}',
      mediaDisplayError: 'Error displaying media:',
      currentMediaClearError: 'Error clearing current media:',

      imageCreationError: 'Error creating image element:',
      imageLoadError: 'Error loading image: {{fileName}}',
      videoCreationError: 'Error creating video element:',
      videoLoadError: 'Error loading video: {{fileName}}',
      videoMetadataLoaded: 'Video metadata loaded for: {{fileName}}',

      // Video segment and timing
      segmentCalculationError: 'Error calculating video segment parameters:',
      seekingError: 'Error seeking video to start point:',
      failSafeTransitionAttempt: 'Attempting fail-safe media transition',
      failSafeTransitionFailed: 'Fail-safe transition also failed:',
      videoSegmentDebug:
        'Video segment: {{fileName}} | Duration: {{videoDuration}}s | Segment: {{segmentDuration}}s ({{startPoint}}s-{{endPoint}}s) | Coverage: {{coverage}}% | Fallback: {{fallback}}',
      imageSegmentDebug: 'Image display: {{fileName}} | Display duration: {{displayDuration}}s',

      // Cycling-specific messages
      cyclingStarted: 'Media cycling started',
      cyclingStopped: 'Media cycling stopped',
      noUsableMediaForCycling: 'No usable media available for cycling',
      randomMediaSelectionError: 'Error selecting random media item:',
      cyclingStartError: 'Error starting media cycling:',
      cyclingTransitionError: 'Error transitioning to next media:',
      metadataOnlyPoolMessage:
        'Media pool contains items but no valid URLs available (restored from metadata only)',
    },

    // Event Bus messages
    eventBus: {
      listenerError: "Error in event listener for '{{event}}':",
    },

    // Storage Facade messages
    storageFacade: {
      localStorageLoadError: 'Error loading state from localStorage:',
      localStorageSaveError: 'Error saving state to localStorage:',

      // Debug messages
      loadingFromLocalStorage: 'Loading from localStorage',
      rawLocalStorageValue: 'Raw localStorage value',
      parsedState: 'Parsed state',
    },

    // Text Display Manager messages
    textDisplayManager: {
      initialized: 'Text display manager initialized',
      initializationFailed: 'Failed to initialize text display manager',
      elementsNotFound: 'Text overlay elements not found',
      textDisplayStarted: 'Text display started',
      textDisplayStopped: 'Text display stopped',
      textDisplayPaused: 'Text display paused',
      textDisplayResumed: 'Text display resumed',
    },

    // Application initialization messages
    application: {
      initialized: 'VJ Tam Tam application ready',
      initializationSuccess: 'Application initialized successfully. Media count: {{count}}',
      initializationError: 'Error during application initialization:',

      // Detailed initialization step messages
      initializationStart: 'Application initialization started',
      initializationComplete: 'Application initialization completed successfully',
      uiManagerInitializing: 'Initializing UI Manager',
      playbackEngineInitializing: 'Initializing PlaybackEngine',
      stateManagerInitializing: 'Initializing StateManager',
      stateManagerComplete: 'StateManager initialization complete',
      segmentSettingsStatus: 'Current segment settings loaded',
      uiSettingsStatus: 'Current UI settings loaded',
      advancedControlsInitializing: 'Initializing Advanced Controls from restored state',
      textDisplayManagerInitializing: 'Initializing Text Display Manager',
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
const getPlural = (count) => (count !== 1 ? 's' : '')

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
  fileRestored: (fileName) => `File "${fileName}" restored successfully`,
  fileRestoreFailed: (fileName) => `Failed to restore file "${fileName}"`,
  filesRestored: (count) => `${count} file${count === 1 ? '' : 's'} restored successfully`,
  noFilesRestored: () => 'No files could be restored',
  bulkRestoreFailed: () => 'Failed to restore file permissions',
}
