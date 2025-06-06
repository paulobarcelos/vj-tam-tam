/**
 * UI Manager module for handling user interface interactions and drag-and-drop functionality
 * Manages visual feedback and coordinates with other modules through the event bus
 */

import { eventBus } from './eventBus.js'
import { mediaProcessor } from './mediaProcessor.js'
import { fileSystemFacade } from './facades/fileSystemFacade.js'
import { stateManager } from './stateManager.js'
import { fileSystemAccessFacade } from './facades/fileSystemAccessFacade.js'
import { toastManager } from './toastManager.js'
import { STRINGS, t } from './constants/strings.js'
import {
  filterMediaNeedingPermission,
  filterTemporaryMedia,
  filterUsableMedia,
} from './utils/mediaUtils.js'
import { formatFileSize, formatDuration } from './utils/stringUtils.js'

class UIManager {
  constructor() {
    this.stage = null
    this.leftDrawer = null
    this.dropIndicator = null
    this.mediaPool = null
    this.welcomeMessage = null
    this.browseFilesBtn = null
    this.browseFoldersBtn = null
    this.clearMediaBtn = null
    this.dragCounter = 0 // Track drag enter/leave events
    this.isFilePickerActive = false // Lock to prevent concurrent file picker calls
    this.advancedControlsToggle = null
    this.advancedControlsSection = null
    this.minDurationSlider = null
    this.minDurationInput = null
    this.maxDurationSlider = null
    this.maxDurationInput = null
    this.skipStartSlider = null
    this.skipStartInput = null
    this.skipEndSlider = null
    this.skipEndInput = null
    this.advancedControlsInitialized = false // Flag to prevent double initialization

    // Idle/Active state management properties
    this.isUIIdle = false
    this.idleTimer = null
    this.IDLE_TIMEOUT_MS = 4000 // 4 seconds default
    this.activityListeners = []
    this.lastActivityTime = Date.now()
  }

  /**
   * Initialize the UI Manager and set up event listeners
   */
  init() {
    this.stage = document.getElementById('stage')
    this.leftDrawer = document.getElementById('left-drawer')
    this.dropIndicator = document.getElementById('drop-indicator')
    this.mediaPool = document.getElementById('media-pool')
    this.welcomeMessage = document.getElementById('welcome-message')
    this.browseFilesBtn = document.getElementById('browse-files-btn')
    this.browseFoldersBtn = document.getElementById('browse-folders-btn')
    this.clearMediaBtn = document.getElementById('clear-media-btn')

    // Advanced Controls elements
    this.advancedControlsToggle = document.getElementById('advanced-controls-toggle')
    this.advancedControlsSection = document.getElementById('advanced-controls-section')
    this.minDurationSlider = document.getElementById('min-duration-slider')
    this.minDurationInput = document.getElementById('min-duration-input')
    this.maxDurationSlider = document.getElementById('max-duration-slider')
    this.maxDurationInput = document.getElementById('max-duration-input')
    this.skipStartSlider = document.getElementById('skip-start-slider')
    this.skipStartInput = document.getElementById('skip-start-input')
    this.skipEndSlider = document.getElementById('skip-end-slider')
    this.skipEndInput = document.getElementById('skip-end-input')

    if (
      !this.stage ||
      !this.leftDrawer ||
      !this.dropIndicator ||
      !this.mediaPool ||
      !this.welcomeMessage ||
      !this.browseFilesBtn ||
      !this.browseFoldersBtn ||
      !this.clearMediaBtn ||
      !this.advancedControlsToggle ||
      !this.advancedControlsSection ||
      !this.minDurationSlider ||
      !this.minDurationInput ||
      !this.maxDurationSlider ||
      !this.maxDurationInput ||
      !this.skipStartSlider ||
      !this.skipStartInput ||
      !this.skipEndSlider ||
      !this.skipEndInput
    ) {
      console.error(STRINGS.SYSTEM_MESSAGES.uiManager.requiredElementsNotFound)
      return
    }

    this.setupDragAndDropListeners()
    this.setupEventBusListeners()
    this.setupFilePickerListeners()
    this.setupAdvancedControlsListeners()
    this.setupActivityDetection()
  }

  /**
   * Set up HTML5 Drag and Drop API event listeners
   */
  setupDragAndDropListeners() {
    // Prevent default drag behaviors on the entire window
    window.addEventListener('dragover', this.handleDragOver.bind(this))
    window.addEventListener('dragenter', this.handleDragEnter.bind(this))
    window.addEventListener('dragleave', this.handleDragLeave.bind(this))
    window.addEventListener('drop', this.handleDrop.bind(this))

    // Prevent default behaviors to enable custom drop handling
    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
      window.addEventListener(eventName, (e) => {
        e.preventDefault()
        e.stopPropagation()
      })
    })
  }

  /**
   * Set up event bus listeners for inter-module communication
   */
  setupEventBusListeners() {
    // Legacy events for backward compatibility
    eventBus.on('media.filesAdded', this.handleMediaFilesAdded.bind(this))
    eventBus.on('media.fileRemoved', this.handleMediaFileRemoved.bind(this))
    eventBus.on('media.poolCleared', this.handleMediaPoolCleared.bind(this))

    // New StateManager events
    eventBus.on('state.mediaPoolUpdated', this.handleMediaPoolStateUpdate.bind(this))
    eventBus.on('state.mediaPoolRestored', this.handleMediaPoolRestored.bind(this))

    // Listen for segment settings updates
    eventBus.on('state.segmentSettingsUpdated', this.handleSegmentSettingsUpdate.bind(this))

    // Listen for UI settings updates
    eventBus.on('state.uiSettingsUpdated', this.handleUISettingsUpdate.bind(this))
  }

  /**
   * Set up file picker event listeners
   */
  setupFilePickerListeners() {
    // Welcome message click handler - defaults to files
    this.welcomeMessage.addEventListener('click', this.handleBrowseFilesClick.bind(this))

    // Browse button handlers
    this.browseFilesBtn.addEventListener('click', this.handleBrowseFilesClick.bind(this))
    this.browseFoldersBtn.addEventListener('click', this.handleBrowseFoldersClick.bind(this))

    // Clear media button handler
    this.clearMediaBtn.addEventListener('click', this.handleClearMediaClick.bind(this))
  }

  /**
   * Handle dragover events
   * @param {DragEvent} e - Drag event
   */
  handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  /**
   * Handle dragenter events
   * @param {DragEvent} e - Drag event
   */
  handleDragEnter(e) {
    e.preventDefault()
    this.dragCounter++

    // Trigger activity for idle state management
    this.handleActivity(e)

    // Only show visual feedback on first drag enter
    if (this.dragCounter === 1) {
      this.showDropFeedback()
    }
  }

  /**
   * Handle dragleave events
   * @param {DragEvent} e - Drag event
   */
  handleDragLeave(e) {
    e.preventDefault()
    this.dragCounter--

    // Only hide visual feedback when all drag operations have left
    if (this.dragCounter === 0) {
      this.hideDropFeedback()
    }
  }

  /**
   * Handle drop events
   * @param {DragEvent} e - Drag event
   */
  async handleDrop(e) {
    e.preventDefault()
    this.dragCounter = 0
    this.hideDropFeedback()

    // Trigger activity for idle state management
    this.handleActivity(e)

    const items = Array.from(e.dataTransfer.items)
    const files = []

    try {
      // Process each dropped item
      for (const item of items) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry()
          if (entry) {
            if (entry.isFile) {
              // Handle individual file
              const file = item.getAsFile()
              if (file) {
                files.push(file)
              }
            } else if (entry.isDirectory) {
              // Handle directory recursively
              const dirFiles = await this.processDirectory(entry)
              files.push(...dirFiles)
            }
          }
        }
      }

      // Process all collected files
      if (files.length > 0) {
        await mediaProcessor.processFiles(files)
      }
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.mediaProcessor.droppedItemsError, error)
    }
  }

  /**
   * Recursively process directory entries to find media files
   * @param {FileSystemDirectoryEntry} directoryEntry - Directory entry to process
   * @returns {Promise<File[]>} - Promise resolving to array of files
   */
  async processDirectory(directoryEntry) {
    const files = []

    return new Promise((resolve, reject) => {
      const reader = directoryEntry.createReader()

      const readEntries = () => {
        reader.readEntries(async (entries) => {
          if (entries.length === 0) {
            // No more entries, resolve with collected files
            resolve(files)
            return
          }

          try {
            // Process each entry
            for (const entry of entries) {
              if (entry.isFile) {
                const file = await this.getFileFromEntry(entry)
                if (file) {
                  files.push(file)
                }
              } else if (entry.isDirectory) {
                // Recursively process subdirectory
                const subFiles = await this.processDirectory(entry)
                files.push(...subFiles)
              }
            }

            // Continue reading more entries
            readEntries()
          } catch (error) {
            reject(error)
          }
        }, reject)
      }

      readEntries()
    })
  }

  /**
   * Get File object from FileSystemFileEntry
   * @param {FileSystemFileEntry} fileEntry - File entry
   * @returns {Promise<File>} - Promise resolving to File object
   */
  getFileFromEntry(fileEntry) {
    return new Promise((resolve, reject) => {
      fileEntry.file(resolve, reject)
    })
  }

  /**
   * Show visual feedback for valid drop targets
   */
  showDropFeedback() {
    this.stage.classList.add('drag-over')
    this.leftDrawer.classList.add('drag-over')
    this.dropIndicator.classList.remove('hidden')
  }

  /**
   * Hide visual feedback for drop targets
   */
  hideDropFeedback() {
    this.stage.classList.remove('drag-over')
    this.leftDrawer.classList.remove('drag-over')
    this.dropIndicator.classList.add('hidden')
  }

  /**
   * Handle media files being added
   */
  handleMediaFilesAdded() {
    this.updateMediaPoolDisplay()
    this.updateWelcomeMessageVisibility()
  }

  /**
   * Handle media file being removed
   */
  handleMediaFileRemoved() {
    this.updateMediaPoolDisplay()
    this.updateWelcomeMessageVisibility()
  }

  /**
   * Handle media pool being cleared
   */
  handleMediaPoolCleared() {
    this.updateMediaPoolDisplay()
    this.updateWelcomeMessageVisibility()
  }

  /**
   * Handle media pool state update
   */
  handleMediaPoolStateUpdate(data) {
    this.updateMediaPoolDisplay()
    this.updateWelcomeMessageVisibility()

    // Provide user feedback for upgraded files
    if (data && data.upgradedItems && data.upgradedItems.length > 0) {
      const upgradeCount = data.upgradedItems.length
      const message =
        upgradeCount === 1
          ? t.get('TEMPLATES.upgradeNotificationSingle', { fileName: data.upgradedItems[0].name })
          : t.get('TEMPLATES.upgradeNotificationMultiple', { count: upgradeCount })

      console.log(t.get('SYSTEM_MESSAGES.uiManager.metadataUpgrade', { count: upgradeCount }))
      // Show a success toast for the upgrade
      toastManager.success(message)
    }
  }

  /**
   * Handle media pool restoration with permission check
   */
  handleMediaPoolRestored() {
    this.updateMediaPoolDisplay()
    this.updateWelcomeMessageVisibility()
    // Banner approach handles permission restoration, no overlay needed

    // DO NOT initialize Advanced Controls here - it's too early in the restoration process
    // Advanced Controls will be initialized from main.js after stateManager.init() is complete
  }

  /**
   * Update the media pool display with current media items
   */
  updateMediaPoolDisplay() {
    const mediaItems = stateManager.getMediaPool()

    // Clear current display
    this.mediaPool.innerHTML = ''

    if (mediaItems.length === 0) {
      const emptyMessage = document.createElement('div')
      emptyMessage.className = 'media-pool-empty'
      emptyMessage.textContent = STRINGS.USER_INTERFACE.welcome.emptyPool
      this.mediaPool.appendChild(emptyMessage)
      return
    }

    // Check if any files need permission restoration
    const filesNeedingPermission = filterMediaNeedingPermission(mediaItems)

    // Check if any files are temporary (drag & drop)
    const temporaryFiles = filterTemporaryMedia(mediaItems)

    // Add restoration notice if needed
    if (filesNeedingPermission.length > 0) {
      const restoreNotice = document.createElement('div')
      restoreNotice.className = 'restore-notice'

      const noticeText = document.createElement('span')
      noticeText.className = 'restore-notice-text'
      const fileCount = filesNeedingPermission.length
      noticeText.textContent = t.permissionNotice(fileCount)

      const restoreButton = document.createElement('button')
      restoreButton.className = 'restore-all-btn'
      restoreButton.textContent = STRINGS.USER_INTERFACE.buttons.restoreAccess
      restoreButton.addEventListener('click', () => {
        this.handleBulkFileRestore(filesNeedingPermission)
      })

      restoreNotice.appendChild(noticeText)
      restoreNotice.appendChild(restoreButton)
      this.mediaPool.appendChild(restoreNotice)
    }

    // Add temporary files notice if needed (only when FileSystemAccessAPI actually provides benefits)
    if (temporaryFiles.length > 0 && fileSystemFacade.isFileSystemAccessActuallyWorking()) {
      const tempNotice = document.createElement('div')
      tempNotice.className = 'temporary-notice'

      const noticeText = document.createElement('span')
      noticeText.className = 'temporary-notice-text'
      const fileCount = temporaryFiles.length
      noticeText.textContent = t.temporaryNotice(fileCount)

      const tipText = document.createElement('div')
      tipText.className = 'temporary-tip'
      tipText.textContent = STRINGS.USER_MESSAGES.status.fileSystemTip

      tempNotice.appendChild(noticeText)
      tempNotice.appendChild(tipText)
      this.mediaPool.appendChild(tempNotice)
    }

    // Add each media item to the display
    mediaItems.forEach((item) => {
      const mediaElement = document.createElement('div')
      mediaElement.className = 'media-item'
      mediaElement.dataset.mediaId = item.id

      const nameElement = document.createElement('div')
      nameElement.className = 'media-name'
      nameElement.textContent = item.name
      nameElement.title = item.name // Show full name on hover

      const typeElement = document.createElement('div')
      typeElement.className = 'media-type'

      // Helper function to format type info with optional duration
      const formatTypeInfo = (type, size, status = null) => {
        let info = `${type} • ${formatFileSize(size)}`

        // Add duration for video files
        if (item.type === 'video' && item.duration) {
          info += ` • ${formatDuration(item.duration)}`
        }

        // Add status if provided
        if (status) {
          info += ` • ${status}`
        }

        return info
      }

      // Differentiate between different types of metadata-only files
      if (!item.file || !item.url) {
        if (item.fromFileSystemAPI) {
          // File from FileSystemAccessAPI that can be restored
          typeElement.textContent = formatTypeInfo(
            item.type,
            item.size,
            STRINGS.USER_INTERFACE.fileStatus.needsPermission
          )
          mediaElement.classList.add('needs-permission')
        } else {
          // File from drag & drop - truly metadata-only
          typeElement.textContent = formatTypeInfo(
            item.type,
            item.size,
            STRINGS.USER_INTERFACE.fileStatus.metadataOnly
          )
          mediaElement.classList.add('metadata-only')
        }
      } else {
        // File with full access - check if it's temporary or persistent
        if (item.fromFileSystemAPI) {
          // Persistent file from FileSystemAccessAPI
          typeElement.textContent = formatTypeInfo(item.type, item.size)
        } else {
          // Temporary file from drag & drop
          typeElement.textContent = formatTypeInfo(
            item.type,
            item.size,
            STRINGS.USER_INTERFACE.fileStatus.temporary
          )
          mediaElement.classList.add('temporary-file')
        }
      }

      mediaElement.appendChild(nameElement)
      mediaElement.appendChild(typeElement)
      this.mediaPool.appendChild(mediaElement)
    })
  }

  /**
   * Handle browse button and welcome message click for file selection
   */
  async handleBrowseFilesClick() {
    // Prevent concurrent file picker calls
    if (this.isFilePickerActive) {
      console.log(STRINGS.USER_MESSAGES.notifications.info.filePickerActive)
      return
    }

    try {
      this.isFilePickerActive = true
      const files = await fileSystemFacade.browseFiles()
      if (files.length > 0) {
        await mediaProcessor.processFiles(files)
      }
    } finally {
      this.isFilePickerActive = false
    }
  }

  /**
   * Handle browse folders button click for folder selection
   */
  async handleBrowseFoldersClick() {
    // Prevent concurrent file picker calls
    if (this.isFilePickerActive) {
      console.log(STRINGS.USER_MESSAGES.notifications.info.filePickerActive)
      return
    }

    try {
      this.isFilePickerActive = true
      const files = await fileSystemFacade.browseFolders()
      if (files.length > 0) {
        await mediaProcessor.processFiles(files)
      }
    } finally {
      this.isFilePickerActive = false
    }
  }

  /**
   * Handle clear media button click
   */
  handleClearMediaClick() {
    const mediaItems = stateManager.getMediaPool()

    // Only show confirmation if there are items to clear
    if (mediaItems.length === 0) {
      return
    }

    // Show confirmation dialog
    const confirmed = window.confirm(STRINGS.USER_MESSAGES.status.clearMediaConfirm)

    if (confirmed) {
      stateManager.clearMediaPool()
      toastManager.success(t.get('USER_MESSAGES.notifications.success.mediaCleared'))
    }
  }

  /**
   * Update welcome message visibility based on media pool state
   */
  updateWelcomeMessageVisibility() {
    const mediaItems = stateManager.getMediaPool()

    // Check for usable media (files that actually have file and url access)
    const usableMedia = filterUsableMedia(mediaItems)

    if (usableMedia.length > 0) {
      this.welcomeMessage.classList.add('hidden')
    } else {
      this.welcomeMessage.classList.remove('hidden')
    }
  }

  /**
   * Handle bulk file restore
   * @param {Array} filesNeedingPermission - Array of files needing restoration
   */
  async handleBulkFileRestore(filesNeedingPermission) {
    try {
      console.log(
        t.get('SYSTEM_MESSAGES.uiManager.bulkRestoreAttempt', {
          count: filesNeedingPermission.length,
        })
      )

      let upgradedCount = 0
      const upgradedItems = []

      // Process each file that needs permission
      for (const item of filesNeedingPermission) {
        try {
          // Get the file from FileSystemAccessAPI
          const restoredFile = await fileSystemAccessFacade.getFileFromHandle(item.id)

          if (restoredFile) {
            // Update the existing item in StateManager with the restored file
            const existingItem = stateManager.getMediaById(item.id)
            if (existingItem) {
              const upgradedItem = {
                ...existingItem,
                file: restoredFile.file,
                url: restoredFile.url,
                fromFileSystemAPI: true, // Keep the flag
              }

              // Replace the item in the media pool
              stateManager.state.mediaPool = stateManager.state.mediaPool.map((poolItem) =>
                poolItem.id === item.id ? upgradedItem : poolItem
              )

              upgradedItems.push(upgradedItem)
              upgradedCount++
            }
          } else {
            console.warn(
              t.get('SYSTEM_MESSAGES.uiManager.bulkRestoreFailed', { fileName: item.name })
            )
          }
        } catch (error) {
          console.warn(
            t.get('SYSTEM_MESSAGES.uiManager.bulkRestoreError', { fileName: item.name }),
            error
          )
        }
      }

      if (upgradedCount > 0) {
        // Emit update event to refresh UI and trigger other components
        eventBus.emit('state.mediaPoolUpdated', {
          mediaPool: stateManager.getMediaPool(),
          addedItems: [],
          upgradedItems: upgradedItems,
          totalCount: stateManager.getMediaCount(),
        })

        // Toast will be shown by handleMediaPoolStateUpdate when the event is processed
        console.log(t.get('SYSTEM_MESSAGES.uiManager.bulkRestoreSuccess', { count: upgradedCount }))
      } else {
        toastManager.error(STRINGS.USER_MESSAGES.notifications.error.fileRestoreFailed)
      }
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.uiManager.bulkFileRestoreError, error)
      toastManager.error(STRINGS.USER_MESSAGES.notifications.error.fileRestoreError)
    }
  }

  /**
   * Update DOM elements with centralized strings
   * Call this after DOM is loaded to replace static content with dynamic strings
   */
  updateDOMStrings() {
    // Update page title
    if (document.title !== STRINGS.USER_INTERFACE.meta.title) {
      document.title = STRINGS.USER_INTERFACE.meta.title
    }

    // Update media pool header
    const mediaPoolHeader = document.querySelector('.drawer-header h2')
    if (mediaPoolHeader) {
      mediaPoolHeader.textContent = STRINGS.USER_INTERFACE.labels.mediaPool
    }

    // Update button texts
    const filesBtn = document.getElementById('browse-files-btn')
    if (filesBtn) {
      filesBtn.textContent = STRINGS.USER_INTERFACE.buttons.files
      filesBtn.title = STRINGS.USER_INTERFACE.tooltips.filesButton
    }

    const foldersBtn = document.getElementById('browse-folders-btn')
    if (foldersBtn) {
      foldersBtn.textContent = STRINGS.USER_INTERFACE.buttons.folders
      foldersBtn.title = STRINGS.USER_INTERFACE.tooltips.foldersButton
    }

    const clearBtn = document.getElementById('clear-media-btn')
    if (clearBtn) {
      clearBtn.textContent = STRINGS.USER_INTERFACE.buttons.clearMedia
    }

    // Update welcome message
    const welcomeHeading = document.querySelector('#welcome-message h1')
    if (welcomeHeading) {
      welcomeHeading.textContent = STRINGS.USER_INTERFACE.welcome.heading
    }

    const welcomeText = document.querySelector('#welcome-message p')
    if (welcomeText) {
      welcomeText.textContent = STRINGS.USER_INTERFACE.welcome.instructions
    }

    // Update drop message
    const dropMessageEl = document.querySelector('.drop-message p:first-child')
    if (dropMessageEl) {
      dropMessageEl.textContent = STRINGS.USER_INTERFACE.dropZone.message
    }
  }

  /**
   * Set up advanced controls event listeners
   */
  setupAdvancedControlsListeners() {
    // Don't initialize controls here - wait for state restoration
    // initializeAdvancedControls() will be called from handleMediaPoolRestored()

    // Toggle button functionality
    this.advancedControlsToggle.addEventListener(
      'click',
      this.handleAdvancedControlsToggle.bind(this)
    )

    // Segment duration controls
    this.setupSegmentDurationControls()
  }

  /**
   * Handle Advanced Controls toggle button click
   */
  handleAdvancedControlsToggle() {
    const isHidden = this.advancedControlsSection.classList.contains('hidden')
    const indicator = this.advancedControlsToggle.querySelector('.toggle-indicator')

    this.advancedControlsSection.classList.toggle('hidden')
    indicator.textContent = isHidden ? '[Hide]' : '[Show]'

    // Update state manager instead of localStorage directly
    const isVisible = !this.advancedControlsSection.classList.contains('hidden')
    stateManager.updateUISettings({ advancedControlsVisible: isVisible })
  }

  /**
   * Set up segment duration controls with synchronization and validation
   */
  setupSegmentDurationControls() {
    // Sync slider and input values for minimum duration
    this.syncControls(this.minDurationSlider, this.minDurationInput)

    // Sync slider and input values for maximum duration
    this.syncControls(this.maxDurationSlider, this.maxDurationInput)

    // Sync slider and input values for skip start
    this.syncControls(this.skipStartSlider, this.skipStartInput)

    // Sync slider and input values for skip end
    this.syncControls(this.skipEndSlider, this.skipEndInput)
  }

  /**
   * Synchronize slider and input controls
   * @param {HTMLInputElement} slider - Range input element
   * @param {HTMLInputElement} input - Number input element
   */
  syncControls(slider, input) {
    // Get validation range from the input element attributes
    const min = parseFloat(input.getAttribute('min')) || 0
    const max = parseFloat(input.getAttribute('max')) || 30
    const defaultValue = min

    slider.addEventListener('input', () => {
      input.value = slider.value
      this.updateSegmentSettings()
    })

    input.addEventListener('input', () => {
      const value = Math.max(min, Math.min(max, parseFloat(input.value) || defaultValue))
      input.value = value
      slider.value = value
      this.updateSegmentSettings()
    })
  }

  /**
   * Centralized method to update segment duration controls from settings
   * @param {Object} settings - Segment settings object
   * @private
   */
  updateSegmentControlsDOM(settings) {
    console.log(STRINGS.SYSTEM_MESSAGES.uiManager.segmentControlsUpdateCalled, settings)

    // Set min duration controls (both property and attribute for proper DOM updates)
    console.log(STRINGS.SYSTEM_MESSAGES.uiManager.settingMinDuration, settings.minDuration)
    this.minDurationSlider.value = settings.minDuration
    this.minDurationSlider.setAttribute('value', settings.minDuration)
    this.minDurationInput.value = settings.minDuration
    this.minDurationInput.setAttribute('value', settings.minDuration)

    // Set max duration controls (both property and attribute for proper DOM updates)
    console.log(STRINGS.SYSTEM_MESSAGES.uiManager.settingMaxDuration, settings.maxDuration)
    this.maxDurationSlider.value = settings.maxDuration
    this.maxDurationSlider.setAttribute('value', settings.maxDuration)
    this.maxDurationInput.value = settings.maxDuration
    this.maxDurationInput.setAttribute('value', settings.maxDuration)

    // Set skip start controls (both property and attribute for proper DOM updates)
    console.log(STRINGS.SYSTEM_MESSAGES.uiManager.settingSkipStart, settings.skipStart)
    this.skipStartSlider.value = settings.skipStart
    this.skipStartSlider.setAttribute('value', settings.skipStart)
    this.skipStartInput.value = settings.skipStart
    this.skipStartInput.setAttribute('value', settings.skipStart)

    // Set skip end controls (both property and attribute for proper DOM updates)
    console.log(STRINGS.SYSTEM_MESSAGES.uiManager.settingSkipEnd, settings.skipEnd)
    this.skipEndSlider.value = settings.skipEnd
    this.skipEndSlider.setAttribute('value', settings.skipEnd)
    this.skipEndInput.value = settings.skipEnd
    this.skipEndInput.setAttribute('value', settings.skipEnd)

    console.log(
      STRINGS.SYSTEM_MESSAGES.uiManager.finalDOMValues,
      this.minDurationSlider.value,
      'minInput:',
      this.minDurationInput.value,
      'maxSlider:',
      this.maxDurationSlider.value,
      'maxInput:',
      this.maxDurationInput.value,
      'skipStartSlider:',
      this.skipStartSlider.value,
      'skipStartInput:',
      this.skipStartInput.value,
      'skipEndSlider:',
      this.skipEndSlider.value,
      'skipEndInput:',
      this.skipEndInput.value
    )
  }

  /**
   * Update segment settings with min/max relationship enforcement
   */
  updateSegmentSettings() {
    const minDuration = parseFloat(this.minDurationInput.value)
    const maxDuration = parseFloat(this.maxDurationInput.value)
    const skipStart = parseFloat(this.skipStartInput.value)
    const skipEnd = parseFloat(this.skipEndInput.value)

    // Enforce min/max relationship (AC 3.5)
    let adjustedMin = minDuration
    let adjustedMax = maxDuration

    if (minDuration > maxDuration) {
      adjustedMax = minDuration
      // Update DOM immediately for visual feedback
      this.maxDurationSlider.value = adjustedMax
      this.maxDurationInput.value = adjustedMax
    } else if (maxDuration < minDuration) {
      adjustedMin = maxDuration
      // Update DOM immediately for visual feedback
      this.minDurationSlider.value = adjustedMin
      this.minDurationInput.value = adjustedMin
    }

    // Update state with all segment settings
    stateManager.updateSegmentSettings({
      minDuration: adjustedMin,
      maxDuration: adjustedMax,
      skipStart: Math.max(0, skipStart), // Ensure non-negative
      skipEnd: Math.max(0, skipEnd), // Ensure non-negative
    })
  }

  /**
   * Handle segment settings updates from state manager
   * @param {Object} data - Event data containing updated settings
   */
  handleSegmentSettingsUpdate(data) {
    const settings = data.segmentSettings

    // Only update DOM if values actually changed to avoid infinite loops
    // Use proper float comparison with small tolerance for precision
    const currentMin = parseFloat(this.minDurationSlider.value)
    const currentMax = parseFloat(this.maxDurationSlider.value)
    const currentSkipStart = parseFloat(this.skipStartSlider.value)
    const currentSkipEnd = parseFloat(this.skipEndSlider.value)
    const tolerance = 0.01

    if (
      Math.abs(currentMin - settings.minDuration) > tolerance ||
      Math.abs(currentMax - settings.maxDuration) > tolerance ||
      Math.abs(currentSkipStart - settings.skipStart) > tolerance ||
      Math.abs(currentSkipEnd - settings.skipEnd) > tolerance
    ) {
      this.updateSegmentControlsDOM(settings)
    }
  }

  /**
   * Handle UI settings updates
   * @param {Object} data - Event data containing updated UI settings
   */
  handleUISettingsUpdate(data) {
    const uiSettings = data.uiSettings
    const indicator = this.advancedControlsToggle.querySelector('.toggle-indicator')

    // Update advanced controls visibility
    if (uiSettings.advancedControlsVisible) {
      this.advancedControlsSection.classList.remove('hidden')
      indicator.textContent = '[Hide]'
    } else {
      this.advancedControlsSection.classList.add('hidden')
      indicator.textContent = '[Show]'
    }
  }

  /**
   * Initialize Advanced Controls from restored state
   */
  initializeAdvancedControlsFromRestoredState() {
    // Prevent double initialization
    if (this.advancedControlsInitialized) {
      console.log(STRINGS.SYSTEM_MESSAGES.uiManager.advancedControlsAlreadyInit)
      return
    }

    console.log(STRINGS.SYSTEM_MESSAGES.uiManager.advancedControlsInitStart)

    // Load current settings using centralized DOM update method
    const settings = stateManager.getSegmentSettings()
    console.log(STRINGS.SYSTEM_MESSAGES.uiManager.segmentSettingsFromState, settings)
    this.updateSegmentControlsDOM(settings)
    console.log(STRINGS.SYSTEM_MESSAGES.uiManager.domUpdatedWithSegmentSettings)

    // Restore UI settings from state manager
    const uiSettings = stateManager.getUISettings()
    console.log(STRINGS.SYSTEM_MESSAGES.uiManager.uiSettingsFromState, uiSettings)
    const indicator = this.advancedControlsToggle.querySelector('.toggle-indicator')

    if (uiSettings.advancedControlsVisible) {
      console.log(STRINGS.SYSTEM_MESSAGES.uiManager.advancedControlsVisible)
      this.advancedControlsSection.classList.remove('hidden')
      indicator.textContent = '[Hide]'
    } else {
      console.log(STRINGS.SYSTEM_MESSAGES.uiManager.advancedControlsHidden)
      this.advancedControlsSection.classList.add('hidden')
      indicator.textContent = '[Show]'
    }

    // Set the flag to true to prevent double initialization
    this.advancedControlsInitialized = true
    console.log(STRINGS.SYSTEM_MESSAGES.uiManager.advancedControlsInitComplete)
  }

  /**
   * Enter idle state - hide UI elements
   */
  enterIdleState() {
    this.isUIIdle = true
    document.body.classList.add('ui-idle')
    console.log(STRINGS.SYSTEM_MESSAGES.uiManager.idleStateEntered)
  }

  /**
   * Exit idle state - show UI elements and reset timer
   */
  exitIdleState() {
    if (this.isUIIdle) {
      this.isUIIdle = false
      document.body.classList.remove('ui-idle')
      console.log(STRINGS.SYSTEM_MESSAGES.uiManager.idleStateExited)
    }
    this.resetIdleTimer()
  }

  /**
   * Reset the idle timer
   */
  resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
    }
    this.idleTimer = setTimeout(() => {
      this.enterIdleState()
    }, this.IDLE_TIMEOUT_MS)
  }

  /**
   * Handle user activity for idle state management
   * @param {Event} event - User activity event
   */
  handleActivity(event) {
    // Special handling for ESC in fullscreen - don't treat as activity
    if (event.type === 'keydown' && event.key === 'Escape' && document.fullscreenElement) {
      return
    }

    if (this.isUIIdle) {
      this.exitIdleState()
    } else {
      this.resetIdleTimer()
    }

    this.lastActivityTime = Date.now()
  }

  /**
   * Set up activity detection for idle state management
   */
  setupActivityDetection() {
    const events = ['mousemove', 'mousedown', 'keydown', 'click']
    events.forEach((eventName) => {
      const listener = (event) => this.handleActivity(event)
      document.addEventListener(eventName, listener, { passive: true })
      this.activityListeners.push({ eventName, listener })
    })

    // Start with active state
    this.resetIdleTimer()
    console.log(STRINGS.SYSTEM_MESSAGES.uiManager.activityDetectionInitialized)
  }

  /**
   * Clean up activity detection listeners
   */
  cleanupActivityDetection() {
    this.activityListeners.forEach(({ eventName, listener }) => {
      document.removeEventListener(eventName, listener)
    })
    this.activityListeners = []

    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }
  }
}

// Export singleton instance
export const uiManager = new UIManager()
