/**
 * UI Manager module for handling user interface interactions and drag-and-drop functionality
 * Manages visual feedback and coordinates with other modules through the event bus
 */

import { stateManager } from './stateManager.js'
import { eventBus } from './eventBus.js'
import { STATE_EVENTS, TEXT_POOL_EVENTS } from './constants/events.js'
import { toastManager } from './toastManager.js'
import { fileSystemFacade } from './facades/fileSystemFacade.js'
import { fileSystemAccessFacade } from './facades/fileSystemAccessFacade.js'
import { STRINGS, t } from './constants/strings.js'
import {
  filterUsableMedia,
  filterTemporaryMedia,
  filterMediaNeedingPermission,
} from './utils/mediaUtils.js'
import { formatDuration } from './utils/stringUtils.js'
import { mediaProcessor } from './mediaProcessor.js'
import { projectionManager } from './projectionManager.js'

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

    // Text pool elements
    this.textInput = null
    this.addTextBtn = null
    this.textPoolDisplay = null
    this.textPoolEmpty = null
    this.clearTextBtn = null
    this.textPoolFooter = null
    this.textPillElements = new Map() // Track text pill DOM elements

    // Frequency control elements
    this.textFrequencySlider = null
    this.frequencyControlSection = null

    // Idle/Active state management properties
    this.isUIIdle = false
    this.idleTimer = null
    this.IDLE_TIMEOUT_MS = 4000 // 4 seconds default
    this.activityListeners = []
    this.lastActivityTime = Date.now()

    // Educational notices tracking (per page load)
    this.dismissedNotices = {
      temporary: false,
    }
  }

  /**
   * Initialize the UI Manager
   */
  init() {
    // Initialize DOM elements
    this.stage = document.getElementById('stage')
    this.leftDrawer = document.getElementById('left-drawer')
    this.dropIndicator = document.getElementById('drop-indicator')
    this.mediaPool = document.getElementById('media-pool')
    this.mediaPoolNotices = document.getElementById('media-pool-notices')
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

    // Text pool elements
    this.textInput = document.getElementById('text-input')
    this.addTextBtn = document.getElementById('add-text-btn')
    this.textPoolDisplay = document.getElementById('text-pool-display')
    this.textPoolEmpty = document.getElementById('text-pool-empty')
    this.clearTextBtn = document.getElementById('clear-text-btn')
    this.textPoolFooter = document.querySelector('.text-pool-footer')

    // Frequency control elements
    this.textFrequencySlider = document.getElementById('text-frequency-slider')
    this.frequencyControlSection = document.querySelector('.frequency-control-section')

    // Check for required DOM elements
    if (
      !this.stage ||
      !this.leftDrawer ||
      !this.dropIndicator ||
      !this.mediaPool ||
      !this.mediaPoolNotices ||
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
      !this.skipEndInput ||
      !this.textInput ||
      !this.addTextBtn ||
      !this.textPoolDisplay ||
      !this.textPoolEmpty ||
      !this.clearTextBtn ||
      !this.textPoolFooter ||
      !this.textFrequencySlider ||
      !this.frequencyControlSection
    ) {
      console.error('Required UI elements not found')
      return false
    }

    // Make debug method available in console
    window.debugMediaPool = () => this.debugMediaPoolState()

    // Set up event listeners
    this.setupDragAndDropListeners()
    this.setupEventBusListeners()
    this.setupFilePickerListeners()
    this.setupAdvancedControlsListeners()
    this.setupTextPoolListeners()
    this.setupFrequencyControlListeners()

    // Initialize activity detection for idle state management
    this.setupActivityDetection()

    // Update DOM strings
    this.updateDOMStrings()

    // NOTE: Advanced controls initialization is deferred until after StateManager.init()
    // This happens in main.js after state restoration is complete

    // Initialize text pool display
    this.initializeTextPoolDisplay()

    // Initialize media pool display (will show empty message if no media)
    this.updateMediaPoolDisplay()

    return true
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
    // New StateManager events
    eventBus.on(STATE_EVENTS.MEDIA_POOL_UPDATED, this.handleMediaPoolStateUpdate.bind(this))
    eventBus.on(STATE_EVENTS.MEDIA_POOL_RESTORED, this.handleMediaPoolRestored.bind(this))

    // Listen for segment settings updates
    eventBus.on(STATE_EVENTS.SEGMENT_SETTINGS_UPDATED, this.handleSegmentSettingsUpdate.bind(this))

    // Listen for UI settings updates
    eventBus.on(STATE_EVENTS.UI_SETTINGS_UPDATED, this.handleUISettingsUpdate.bind(this))

    // Listen for text pool updates
    eventBus.on(TEXT_POOL_EVENTS.UPDATED, this.handleTextPoolUpdate.bind(this))
    eventBus.on(TEXT_POOL_EVENTS.SIZE_CHANGED, this.handleTextPoolSizeChange.bind(this))

    // Listen for frequency changes
    eventBus.on(TEXT_POOL_EVENTS.FREQUENCY_CHANGED, this.handleFrequencyChange.bind(this))
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
      console.error('Error processing dropped items:', error)
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

      console.log(`Metadata upgrade completed for ${upgradeCount} files`)
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
   * Create thumbnail element for media item
   * @param {object} mediaItem - The media item object
   * @returns {HTMLElement} The thumbnail container element
   */
  createThumbnailElement(mediaItem) {
    // Create a container for the thumbnail that can hold both media and indicators
    const thumbnailContainer = document.createElement('div')
    thumbnailContainer.className = 'media-thumbnail-container'

    if (mediaItem.url && (mediaItem.file || mediaItem.fromFileSystemAPI)) {
      // Create actual image/video thumbnail
      if (mediaItem.type === 'video') {
        const video = document.createElement('video')
        video.className = 'media-thumbnail'
        video.src = mediaItem.url
        video.muted = true
        video.preload = 'metadata'

        // Set video to first frame for thumbnail
        video.addEventListener('loadedmetadata', () => {
          video.currentTime = 0.1 // Small offset to avoid black frame
        })

        thumbnailContainer.appendChild(video)
      } else {
        const img = document.createElement('img')
        img.className = 'media-thumbnail'
        img.src = mediaItem.url
        img.alt = mediaItem.name

        // Handle load error
        img.addEventListener('error', () => {
          img.style.display = 'none'
          const placeholder = this.createPlaceholderThumbnail(mediaItem)
          img.parentNode?.replaceChild(placeholder, img)
        })

        thumbnailContainer.appendChild(img)
      }
    } else {
      // Create placeholder for files without access
      const placeholder = this.createPlaceholderThumbnail(mediaItem)
      thumbnailContainer.appendChild(placeholder)
    }

    return thumbnailContainer
  }

  /**
   * Create placeholder thumbnail for files without access
   * @param {object} mediaItem - The media item object
   * @returns {HTMLElement} The placeholder element
   */
  createPlaceholderThumbnail(mediaItem) {
    const placeholder = document.createElement('div')
    placeholder.className = 'media-thumbnail'
    placeholder.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #333 0%, #555 100%);
      color: #aaa;
      font-family: Arial, sans-serif;
      font-weight: bold;
      font-size: 1.5rem;
    `

    // Set appropriate icon based on media type
    const icon = mediaItem.type === 'video' ? '🎬' : '🖼️'
    placeholder.textContent = icon

    return placeholder
  }

  /**
   * Handle removal of individual media item
   * @param {string} mediaId - The ID of the media item to remove
   */
  handleRemoveMediaItem(mediaId) {
    stateManager.removeMediaFromPool(mediaId)
    toastManager.show(STRINGS.USER_MESSAGES.notifications.media.itemRemoved, {
      type: 'info',
    })
  }

  /**
   * Update the media pool display with current media items
   */
  updateMediaPoolDisplay() {
    this.mediaPool.innerHTML = ''

    const mediaItems = stateManager.getMediaPool()

    // Update clear button visibility
    this.updateClearMediaVisibility(mediaItems.length)

    if (mediaItems.length === 0) {
      this.showEmptyMediaPoolMessage()
      return
    }

    mediaItems.forEach((item) => {
      const mediaElement = this.createMediaElement(item)
      this.mediaPool.appendChild(mediaElement)
    })

    // Check for temporary files and update notices
    const temporaryFiles = filterTemporaryMedia(mediaItems)
    this.updateNoticesDisplay([], temporaryFiles)

    // Set up global user activation hijacking for permission restoration
    this.setupGlobalActivationHijacking()
  }

  /**
   * Set up global user activation hijacking to opportunistically restore permissions
   */
  setupGlobalActivationHijacking() {
    const filesNeedingPermission = filterMediaNeedingPermission(stateManager.getMediaPool())

    if (filesNeedingPermission.length === 0) {
      console.log('No files need permission restoration')
      return // No files need permission, no hijacking needed
    }

    console.log(
      `Setting up global activation hijacking for ${filesNeedingPermission.length} files needing permission`
    )

    // Remove any existing hijacking listeners to avoid duplicates
    this.removeGlobalActivationHijacking()

    // Events that constitute valid user activation
    const activationEvents = [
      'click',
      'keydown',
      'mousedown',
      'pointerdown',
      'pointerup',
      'touchend',
    ]

    this.activationHijacker = async (event) => {
      console.log(
        `Global hijacker triggered: ${event.type} on ${event.target.tagName}, class: ${event.target.className || '[no class]'}`
      )

      // Skip if this is the Escape key (not valid for activation)
      if (event.type === 'keydown' && event.key === 'Escape') {
        console.log('Skipping Escape key - not valid for file access activation')
        return
      }

      // Skip if this is a reserved key (like Cmd+R, Ctrl+T, etc.)
      if (event.type === 'keydown' && (event.metaKey || event.ctrlKey)) {
        console.log(`Skipping reserved key combination: ${event.key}`)
        return
      }

      // Skip pointerdown if not mouse
      if (event.type === 'pointerdown' && event.pointerType !== 'mouse') {
        console.log(`Skipping non-mouse pointer: ${event.pointerType}`)
        return
      }

      // Skip pointerup if it's mouse (should be handled by pointerdown)
      if (event.type === 'pointerup' && event.pointerType === 'mouse') {
        console.log('Skipping mouse pointerup - handled by pointerdown')
        return
      }

      // Try to restore permissions opportunistically
      const currentFilesNeedingPermission = filterMediaNeedingPermission(
        stateManager.getMediaPool()
      )

      if (currentFilesNeedingPermission.length > 0) {
        console.log(
          `Attempting opportunistic restore for ${currentFilesNeedingPermission.length} files`
        )
        try {
          await this.handleBulkFileRestore(currentFilesNeedingPermission, true) // silent mode
          console.log('Opportunistic file access restoration completed')
        } catch (error) {
          // Silent failure - we're just being opportunistic
          console.debug('Opportunistic file access restoration failed:', error)
        }
      } else {
        console.log('No files currently need permission')
      }
    }

    console.log(`Adding global listeners for events: ${activationEvents.join(', ')}`)
    // Add listeners to document for global coverage
    activationEvents.forEach((eventType) => {
      document.addEventListener(eventType, this.activationHijacker, {
        passive: true,
        capture: true,
      })
    })
    console.log('Global activation hijacking setup complete')
  }

  /**
   * Remove global activation hijacking listeners
   */
  removeGlobalActivationHijacking() {
    if (this.activationHijacker) {
      const activationEvents = [
        'click',
        'keydown',
        'mousedown',
        'pointerdown',
        'pointerup',
        'touchend',
      ]
      activationEvents.forEach((eventType) => {
        document.removeEventListener(eventType, this.activationHijacker, {
          passive: true,
          capture: true,
        })
      })
      this.activationHijacker = null
    }
  }

  /**
   * Create media element with thumbnails and controls
   */
  createMediaElement(item) {
    const mediaElement = document.createElement('div')
    mediaElement.className = 'media-item'
    mediaElement.dataset.id = item.id

    // Determine status based on actual item properties (not relying on status field)
    const needsPermission = (!item.file || !item.url) && item.fromFileSystemAPI
    const isTemporary =
      (item.file && item.url && !item.fromFileSystemAPI) ||
      (!item.file && !item.url && !item.fromFileSystemAPI)
    const isMetadataOnly = !item.file && !item.url

    // Add status classes based on actual state
    if (needsPermission) {
      mediaElement.classList.add('needs-permission')
    } else if (isTemporary) {
      mediaElement.classList.add('temporary-file')
    } else if (isMetadataOnly) {
      mediaElement.classList.add('metadata-only')
    }

    // Create thumbnail using existing method
    const thumbnail = this.createThumbnailElement(item)

    // Add video indicator for video files
    if (item.type === 'video') {
      const videoIndicator = document.createElement('div')
      videoIndicator.className = 'video-indicator'

      const playIcon = document.createElement('div')
      playIcon.className = 'play-icon'
      playIcon.innerHTML = '▶'
      videoIndicator.appendChild(playIcon)

      if (item.duration) {
        const durationDisplay = document.createElement('div')
        durationDisplay.className = 'video-duration'
        durationDisplay.textContent = this.formatDuration(item.duration)
        videoIndicator.appendChild(durationDisplay)
      }

      thumbnail.appendChild(videoIndicator)
    }

    mediaElement.appendChild(thumbnail)

    // Create controls container
    const controls = document.createElement('div')
    controls.className = 'media-controls'

    // Add restore button for files needing permission
    if (needsPermission) {
      console.log(`Creating restore button for file: ${item.name}`)
      const restoreBtn = document.createElement('button')
      restoreBtn.className = 'btn btn--icon-small media-restore-btn'
      restoreBtn.innerHTML = '🔓'
      restoreBtn.title = t.get('USER_INTERFACE.tooltips.restoreAccess')
      restoreBtn.addEventListener('click', async (e) => {
        console.log('File restore button clicked')
        e.stopPropagation()
        try {
          await this.handleSingleFileRestore(item)
        } catch (error) {
          console.error('File restore error:', error)
        }
      })
      controls.appendChild(restoreBtn)
      console.log(`Restore button added for file: ${item.name}`)
    }

    // Add delete button
    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'btn btn--icon-small btn--danger media-delete-btn'
    deleteBtn.innerHTML = '×'
    deleteBtn.title = t.get('USER_INTERFACE.tooltips.removeMediaItem')
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.removeMediaItem(item.id)
    })
    controls.appendChild(deleteBtn)

    mediaElement.appendChild(controls)

    // Add native tooltip with file info
    const sizeText = item.size
      ? `${(item.size / 1024 / 1024).toFixed(1)} MB`
      : t.get('USER_INTERFACE.fileStatus.unknownSize') || 'Unknown size'
    const statusText = needsPermission
      ? t.get('USER_INTERFACE.fileStatus.needsPermission')
      : isMetadataOnly
        ? t.get('USER_INTERFACE.fileStatus.metadataOnly')
        : isTemporary
          ? t.get('USER_INTERFACE.fileStatus.temporary')
          : t.get('USER_INTERFACE.fileStatus.ready') || 'Ready'

    mediaElement.title = `${item.name}\n${sizeText}\n${statusText.toUpperCase()}`

    return mediaElement
  }

  /**
   * Handle single file restore operation
   * @param {Object} item - Media item to restore
   */
  async handleSingleFileRestore(item) {
    console.log(`Starting single file restore for: ${item.name}`)
    console.log('File details:', {
      id: item.id,
      name: item.name,
      fromFileSystemAPI: item.fromFileSystemAPI,
      hasFile: !!item.file,
      hasUrl: !!item.url,
    })

    console.log('Calling fileSystemAccessFacade.restoreAccess')
    const restoredFiles = await fileSystemAccessFacade.restoreAccess([item])
    console.log('Restore result:', restoredFiles)

    if (restoredFiles && restoredFiles.length > 0) {
      console.log('File restore successful')
      // Let StateManager handle the restoration and UI updates
      stateManager.upgradeMediaWithFileHandles(restoredFiles)

      // Show success toast
      toastManager.success(t.fileRestored(item.name))
    } else {
      console.log('No files were restored')
      toastManager.error(t.fileRestoreFailed(item.name))
    }
  }

  /**
   * Handle bulk file restore for multiple files
   * @param {Array} filesNeedingPermission - Array of media items needing permission
   * @param {boolean} silent - Whether to suppress toast notifications
   */
  async handleBulkFileRestore(filesNeedingPermission, silent = false) {
    const logPrefix = silent ? '[SILENT]' : '[USER]'

    console.log(`${logPrefix} Bulk restore attempt for ${filesNeedingPermission.length} files`)

    if (silent) {
      console.log(`${logPrefix} Running in silent mode - no user notifications`)
    }

    console.log(`${logPrefix} Bulk restore: calling fileSystemAccessFacade`)
    const restoredFiles = await fileSystemAccessFacade.restoreAccess(filesNeedingPermission)

    console.log(
      `${logPrefix} Bulk restore result: ${restoredFiles?.length || 0} files restored from ${filesNeedingPermission.length} attempted`
    )

    if (restoredFiles && restoredFiles.length > 0) {
      // Upgrade media items in state manager with restored file handles
      const upgradedCount = stateManager.upgradeMediaWithFileHandles(restoredFiles)

      console.log(`${logPrefix} Bulk restore successful: ${restoredFiles.length} files restored`)

      if (!silent) {
        console.log(`${logPrefix} Showing success notification`)
        toastManager.success(t.filesRestored(restoredFiles.length))
      }

      // Notify about metadata upgrades
      console.log(`Metadata upgrade completed for ${upgradedCount} files`)

      // Remove global hijacking since files have been restored
      this.removeGlobalActivationHijacking()
    } else {
      console.log(`${logPrefix} No files were restored`)

      if (!silent) {
        console.log(`${logPrefix} Silent mode - not showing failure notification`)
      }
    }

    // Handle individual file failures
    const failedFiles = filesNeedingPermission.filter(
      (file) => !restoredFiles?.some((restored) => restored.id === file.id)
    )

    if (failedFiles.length > 0) {
      failedFiles.forEach((file) => {
        console.log(`${logPrefix} File restoration failed: ${file.name}`)
        console.error(
          `${logPrefix} File restoration error: ${file.name}`,
          new Error('File access could not be restored')
        )
      })

      if (!silent) {
        console.log(`${logPrefix} Silent mode - not showing individual failure notifications`)
      }
    } else if (!silent) {
      console.error('Bulk file restore operation error')
    }
  }

  /**
   * Update notices display (now only for temporary files)
   * @param {Array} filesNeedingPermission - Files that need permission restoration (ignored now)
   * @param {Array} temporaryFiles - Files that are temporary
   */
  updateNoticesDisplay(filesNeedingPermission, temporaryFiles) {
    // Clear all notices first
    this.mediaPoolNotices.innerHTML = ''

    // Only show temporary files notice if needed and not dismissed
    // Use persisted FileSystem API working state with fallback to current check
    const apiWorking =
      stateManager.getFileSystemAPIWorking() ?? fileSystemFacade.isFileSystemAccessActuallyWorking()
    if (temporaryFiles.length > 0 && !this.dismissedNotices.temporary && apiWorking) {
      this.createTemporaryNotice(temporaryFiles)
    }
  }

  /**
   * Clean up when component is destroyed
   */
  cleanup() {
    this.removeGlobalActivationHijacking()
    this.cleanupActivityDetection()

    // Clean up projection manager
    if (projectionManager) {
      projectionManager.cleanup()
    }

    // Clear any pending timeouts
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
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
   * Update clear media button visibility based on pool size (aligned with text pool pattern)
   * @param {number} poolSize - Current media pool size
   */
  updateClearMediaVisibility(poolSize) {
    if (poolSize > 0) {
      this.clearMediaBtn.style.display = 'block'
    } else {
      this.clearMediaBtn.style.display = 'none'
    }
  }

  /**
   * Handle browse button and welcome message click for file selection
   */
  async handleBrowseFilesClick() {
    // Prevent concurrent file picker calls
    if (this.isFilePickerActive) {
      console.log('File picker already active, ignoring click')
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
      console.log('File picker already active, ignoring click')
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
   * Handle clear media button click (aligned with text pool pattern)
   */
  handleClearMediaClick() {
    const mediaItems = stateManager.getMediaPool()

    if (mediaItems.length === 0) {
      toastManager.show(STRINGS.USER_MESSAGES.notifications.media.poolAlreadyEmpty, {
        type: 'info',
      })
      return
    }

    // Show confirmation dialog for larger pools (aligned with text pool pattern)
    if (mediaItems.length > 5) {
      const confirmed = window.confirm(
        t.get('USER_MESSAGES.notifications.media.confirmClearAll', { count: mediaItems.length })
      )
      if (!confirmed) {
        return
      }
    }

    if (stateManager.clearMediaPool()) {
      toastManager.success(
        t.get('USER_MESSAGES.notifications.media.poolCleared', { count: mediaItems.length })
      )
    } else {
      toastManager.error(STRINGS.USER_MESSAGES.notifications.media.poolClearFailed)
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

    // Update text pool button texts
    if (this.clearTextBtn) {
      this.clearTextBtn.textContent = STRINGS.USER_INTERFACE.textPool.clearAllButton
    }

    // Update frequency control elements
    const frequencyLabel = document.getElementById('frequency-label')
    const frequencyLabelMin = document.getElementById('frequency-label-min')
    const frequencyLabelMax = document.getElementById('frequency-label-max')
    const frequencyDescription = document.getElementById('frequency-description')

    if (frequencyLabel) frequencyLabel.textContent = STRINGS.USER_INTERFACE.textPool.frequencyLabel
    if (frequencyLabelMin)
      frequencyLabelMin.textContent = STRINGS.USER_INTERFACE.textPool.frequencyNever
    if (frequencyLabelMax)
      frequencyLabelMax.textContent = STRINGS.USER_INTERFACE.textPool.frequencyAlways
    if (frequencyDescription)
      frequencyDescription.textContent = STRINGS.USER_INTERFACE.textPool.frequencyDescription
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

    // Initialize toggle state from current UI settings
    this.initializeAdvancedPanelToggleState()
  }

  /**
   * Initialize advanced panel toggle state from StateManager (Story 6.2)
   */
  initializeAdvancedPanelToggleState() {
    const uiSettings = stateManager.getUISettings()
    this.updateAdvancedPanelVisibility(uiSettings.advancedControlsVisible)
  }

  /**
   * Handle Advanced Controls toggle button click (Story 6.2)
   */
  handleAdvancedControlsToggle() {
    // Get current state
    const currentState = stateManager.getUISettings().advancedControlsVisible
    const newState = !currentState

    // Update state manager (which handles persistence automatically)
    stateManager.updateUISettings({ advancedControlsVisible: newState })
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
   * Update segment controls DOM with current settings
   * @param {Object} settings - Segment settings object
   */
  updateSegmentControlsDOM(settings) {
    console.log('Segment controls update called with settings:', settings)

    // Update minimum duration
    console.log(`Setting min duration to: ${settings.minDuration}`)
    this.minDurationSlider.value = settings.minDuration
    this.minDurationInput.value = settings.minDuration

    // Update maximum duration
    console.log(`Setting max duration to: ${settings.maxDuration}`)
    this.maxDurationSlider.value = settings.maxDuration
    this.maxDurationInput.value = settings.maxDuration

    // Update skip start
    console.log(`Setting skip start to: ${settings.skipStart}`)
    this.skipStartSlider.value = settings.skipStart
    this.skipStartInput.value = settings.skipStart

    // Update skip end
    console.log(`Setting skip end to: ${settings.skipEnd}`)
    this.skipEndSlider.value = settings.skipEnd
    this.skipEndInput.value = settings.skipEnd

    console.log('Final DOM values:', {
      minDuration: this.minDurationSlider.value,
      maxDuration: this.maxDurationSlider.value,
      skipStart: this.skipStartSlider.value,
      skipEnd: this.skipEndSlider.value,
    })
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
   * Handle UI settings updates (Story 6.2)
   * @param {Object} data - Event data containing updated UI settings
   */
  handleUISettingsUpdate(data) {
    const uiSettings = data.uiSettings

    // Update advanced controls visibility with new toggle structure
    this.updateAdvancedPanelVisibility(uiSettings.advancedControlsVisible)
  }

  /**
   * Update advanced panel visibility and toggle button state (Story 6.2)
   * @param {boolean} isVisible - Whether the panel should be visible
   */
  updateAdvancedPanelVisibility(isVisible) {
    const toggleIcon = this.advancedControlsToggle.querySelector('.toggle-icon')

    if (isVisible) {
      this.advancedControlsSection.classList.remove('hidden')
      this.advancedControlsSection.classList.add('visible')
      this.advancedControlsSection.setAttribute('aria-hidden', 'false')
      this.advancedControlsToggle.setAttribute('aria-expanded', 'true')
      if (toggleIcon) toggleIcon.textContent = '▼'
    } else {
      this.advancedControlsSection.classList.add('hidden')
      this.advancedControlsSection.classList.remove('visible')
      this.advancedControlsSection.setAttribute('aria-hidden', 'true')
      this.advancedControlsToggle.setAttribute('aria-expanded', 'false')
      if (toggleIcon) toggleIcon.textContent = '▶'
    }
  }

  // ============================================================================
  // TEXT POOL MANAGEMENT METHODS
  // ============================================================================

  /**
   * Set up text pool event listeners
   */
  setupTextPoolListeners() {
    // Add button click
    this.addTextBtn.addEventListener('click', () => this.handleAddText())

    // Enter key submission
    this.textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleAddText()
      }
    })

    // Clear all button click
    this.clearTextBtn.addEventListener('click', () => this.handleClearAll())

    // Initialize text pool display with existing data
    this.initializeTextPoolDisplay()
  }

  /**
   * Initialize text pool display with existing data from state
   */
  initializeTextPoolDisplay() {
    const textPool = stateManager.getTextPool()
    this.renderTextPoolDisplay(textPool)
  }

  /**
   * Handle adding text to the pool
   */
  handleAddText() {
    const text = this.textInput.value.trim()

    if (!text) {
      toastManager.error(STRINGS.USER_MESSAGES.notifications.textPool.emptyInputWarning)
      return
    }

    if (text.length > 200) {
      toastManager.error(STRINGS.USER_MESSAGES.notifications.textPool.tooLongWarning)
      return
    }

    if (stateManager.addText(text)) {
      this.textInput.value = ''
      this.textInput.focus() // Keep focus for continuous entry
      toastManager.success(STRINGS.USER_MESSAGES.notifications.textPool.textAdded)
    }
  }

  /**
   * Handle text pool update events
   * @param {Object} event - Text pool update event data
   */
  handleTextPoolUpdate(event) {
    const { action, text, textPool } = event

    switch (action) {
      case 'added':
        this.addTextPill(text)
        break
      case 'removed':
        this.removeTextPill(text)
        break
      case 'cleared':
        this.clearTextPoolDisplay()
        break
      default:
        // Fall back to full re-render for unknown actions
        this.renderTextPoolDisplay(textPool)
    }
  }

  /**
   * Handle text pool size change events
   * @param {Object} event - Size change event data
   */
  handleTextPoolSizeChange(event) {
    const { newSize } = event

    this.updateClearAllVisibility(newSize)

    if (newSize === 0) {
      this.showEmptyState()
    } else {
      this.hideEmptyState()
    }
  }

  /**
   * Render the complete text pool display
   * @param {string[]} textPool - Array of text strings
   */
  renderTextPoolDisplay(textPool) {
    // Clear existing display
    this.textPoolDisplay.innerHTML = ''
    this.textPillElements.clear()

    this.updateClearAllVisibility(textPool.length)

    if (textPool.length === 0) {
      this.showEmptyState()
      return
    }

    this.hideEmptyState()

    // Render text pills - each entry gets its own pill (including duplicates)
    textPool.forEach((text, index) => {
      const pill = this.createTextPill(text, index)
      this.textPoolDisplay.appendChild(pill)
      // Use index as key to allow duplicates
      this.textPillElements.set(index, pill)
    })
  }

  /**
   * Create a text pill element
   * @param {string} text - Text content
   * @param {number} index - Index in the text pool (optional, for unique identification)
   * @returns {HTMLElement} - Text pill element
   */
  createTextPill(text, index = null) {
    const pill = document.createElement('div')
    pill.className = 'text-pill entering'
    pill.dataset.text = text
    pill.title = text // Full text on hover for truncated content
    if (index !== null) {
      pill.dataset.index = index
    }

    const content = document.createElement('span')
    content.className = 'text-pill-content'
    content.textContent = text

    // Create delete button
    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'btn btn--icon-small btn--danger delete-text-btn'
    deleteBtn.innerHTML = '×'
    deleteBtn.title = STRINGS.USER_INTERFACE.textPool.deleteButtonTitle
    deleteBtn.setAttribute(
      'aria-label',
      t.get('USER_INTERFACE.textPool.deleteButtonAriaLabel', { text })
    )

    // Add delete button click handler
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation() // Prevent pill click event
      this.handleRemoveText(text)
    })

    // Add keyboard support for delete button
    deleteBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        deleteBtn.click()
      }
    })

    pill.appendChild(content)
    pill.appendChild(deleteBtn)

    // Add click handler for text expansion (if needed)
    content.addEventListener('click', () => {
      content.classList.toggle('expanded')
    })

    // Remove entering animation class after animation completes
    setTimeout(() => {
      pill.classList.remove('entering')
    }, 300)

    return pill
  }

  /**
   * Add a new text pill to the display
   * @param {string} text - Text to add
   */
  addTextPill(text) {
    this.hideEmptyState()

    // Get current text pool to determine the correct index
    const textPool = stateManager.getTextPool()
    const index = textPool.length - 1 // New text is at the end

    // Create pill for new text (duplicates are allowed)
    const pill = this.createTextPill(text, index)
    this.textPoolDisplay.appendChild(pill)

    // Add to tracking Map with correct index
    this.textPillElements.set(index, pill)

    // Scroll to bottom to show new pill
    this.textPoolDisplay.parentElement.scrollTop = this.textPoolDisplay.parentElement.scrollHeight
  }

  /**
   * Remove a text pill from the display
   * @param {string} text - Text to remove
   */
  removeTextPill(text) {
    // Find the first pill with matching text in tracked elements
    let pillToRemove = null
    let indexToRemove = null

    for (const [index, pill] of this.textPillElements.entries()) {
      if (pill.dataset.text === text) {
        pillToRemove = pill
        indexToRemove = index
        break
      }
    }

    // Fallback: search in DOM if not found in tracked elements
    if (!pillToRemove) {
      const domPills = this.textPoolDisplay.querySelectorAll('.text-pill')
      for (const pill of domPills) {
        if (pill.dataset.text === text) {
          pillToRemove = pill
          break
        }
      }
    }

    if (!pillToRemove) return

    // Add delete button animation if it exists
    const deleteBtn = pillToRemove.querySelector('.delete-text-btn')
    if (deleteBtn) {
      deleteBtn.classList.add('deleting')
    }

    // Add leaving animation to pill
    pillToRemove.classList.add('leaving')

    // Remove from DOM after animation
    setTimeout(() => {
      if (pillToRemove.parentElement) {
        pillToRemove.parentElement.removeChild(pillToRemove)
      }

      // Remove from tracking Map if it was tracked
      if (indexToRemove !== null) {
        this.textPillElements.delete(indexToRemove)
      }

      // Check if we should show empty state by counting remaining pills
      const remainingPills = this.textPoolDisplay.querySelectorAll('.text-pill').length
      if (remainingPills === 0) {
        this.showEmptyState()
        this.updateClearAllVisibility(0)
      }
    }, 200)
  }

  /**
   * Clear all text pills from the display
   */
  clearTextPoolDisplay() {
    const pills = Array.from(this.textPillElements.values())

    if (pills.length === 0) {
      this.showEmptyState()
      this.updateClearAllVisibility(0)
      return
    }

    // Add staggered leaving animations
    pills.forEach((pill, index) => {
      setTimeout(() => {
        pill.classList.add('leaving')
      }, index * 50) // 50ms stagger between pills
    })

    // Clear DOM after all animations complete
    const totalAnimationTime = pills.length * 50 + 200 // Animation duration
    setTimeout(() => {
      this.textPoolDisplay.innerHTML = ''
      this.textPillElements.clear()
      this.showEmptyState()
      this.updateClearAllVisibility(0)
    }, totalAnimationTime)
  }

  /**
   * Handle individual text removal
   * @param {string} text - Text to remove
   */
  handleRemoveText(text) {
    if (stateManager.removeText(text)) {
      // Success - state manager will emit events that trigger UI updates
      const truncatedText = text.substring(0, 30) + (text.length > 30 ? '...' : '')
      toastManager.show(
        t.get('USER_MESSAGES.notifications.textPool.textRemoved', { text: truncatedText }),
        { type: 'info' }
      )
    } else {
      // Error handling
      toastManager.error(STRINGS.USER_MESSAGES.notifications.textPool.textRemovalFailed)
    }
  }

  /**
   * Handle clear all text pool operation
   */
  handleClearAll() {
    const textPoolSize = stateManager.getTextPoolSize()

    if (textPoolSize === 0) {
      toastManager.show(STRINGS.USER_MESSAGES.notifications.textPool.poolAlreadyEmpty, {
        type: 'info',
      })
      return
    }

    // Show confirmation dialog for larger pools
    if (textPoolSize > 5) {
      const confirmed = window.confirm(
        t.get('USER_MESSAGES.notifications.textPool.confirmClearAll', { count: textPoolSize })
      )
      if (!confirmed) {
        return
      }
    }

    if (stateManager.clearTextPool()) {
      toastManager.success(
        t.get('USER_MESSAGES.notifications.textPool.poolCleared', { count: textPoolSize })
      )
    } else {
      toastManager.error(STRINGS.USER_MESSAGES.notifications.textPool.poolClearFailed)
    }
  }

  /**
   * Update clear all button visibility based on pool size
   * @param {number} poolSize - Current text pool size
   */
  updateClearAllVisibility(poolSize) {
    if (poolSize > 0) {
      this.clearTextBtn.style.display = 'block'
      this.textPoolFooter.classList.remove('hidden')
    } else {
      this.clearTextBtn.style.display = 'none'
      this.textPoolFooter.classList.add('hidden')
    }
  }

  /**
   * Show the empty state message
   */
  showEmptyState() {
    this.textPoolEmpty.style.display = 'block'
    this.textPoolDisplay.style.display = 'none'
  }

  /**
   * Hide the empty state message
   */
  hideEmptyState() {
    this.textPoolEmpty.style.display = 'none'
    this.textPoolDisplay.style.display = 'flex'
  }

  // ============================================================================
  // ADVANCED CONTROLS MANAGEMENT METHODS
  // ============================================================================

  /**
   * Set up frequency control event listeners
   */
  setupFrequencyControlListeners() {
    // Frequency slider input
    this.textFrequencySlider.addEventListener('input', () => {
      this.handleFrequencyChange()
    })

    // Frequency slider change (for final value)
    this.textFrequencySlider.addEventListener('change', (e) => {
      const frequency = parseFloat(e.target.value)
      this.handleFrequencyChangeComplete(frequency)
    })

    // Listen for frequency changes from other sources
    eventBus.on('textPool.frequencyChanged', (event) => {
      this.updateFrequencyDisplay(event.frequency)
    })

    // Keyboard accessibility
    this.textFrequencySlider.addEventListener('keydown', (e) => {
      // Allow arrow keys for fine control
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const currentFrequency = parseFloat(this.textFrequencySlider.value)
        const delta = e.key === 'ArrowRight' ? 0.25 : -0.25
        const newFrequency = Math.max(0, Math.min(1, currentFrequency + delta))

        this.textFrequencySlider.value = newFrequency
        this.handleFrequencyChange()
        this.handleFrequencyChangeComplete(newFrequency)
      }
    })
  }

  initializeFrequencyControl() {
    // Set initial frequency from state
    const currentFrequency = stateManager.getTextFrequency()
    this.textFrequencySlider.value = currentFrequency
    this.updateFrequencyDisplay(currentFrequency)
  }

  handleFrequencyChange() {
    // No immediate visual feedback needed for simplified slider
  }

  handleFrequencyChangeComplete(frequency) {
    // Final frequency change
    stateManager.setTextFrequency(frequency)
  }

  updateFrequencyDisplay(frequency) {
    // Update slider if change came from external source
    this.textFrequencySlider.value = frequency
  }

  /**
   * Initialize Advanced Controls from restored state
   */
  initializeAdvancedControlsFromRestoredState() {
    // Prevent double initialization
    if (this.advancedControlsInitialized) {
      console.log('Advanced controls already initialized - skipping')
      return
    }

    console.log('Starting advanced controls initialization from restored state')

    // Load current settings using centralized DOM update method
    const settings = stateManager.getSegmentSettings()
    console.log('Segment settings loaded from state:', settings)
    this.updateSegmentControlsDOM(settings)
    console.log('DOM updated with segment settings')

    // Restore UI settings from state manager
    const uiSettings = stateManager.getUISettings()
    console.log('UI settings loaded from state:', uiSettings)

    // Use the existing method to update panel visibility and toggle state
    this.updateAdvancedPanelVisibility(uiSettings.advancedControlsVisible)

    if (uiSettings.advancedControlsVisible) {
      console.log('Advanced controls are visible')
    } else {
      console.log('Advanced controls are hidden')
    }

    // Initialize projection manager after advanced controls (Story 6.3)
    if (projectionManager.init()) {
      console.log('ProjectionManager initialized as part of advanced controls')
    } else {
      console.warn('ProjectionManager failed to initialize')
    }

    // Set the flag to true to prevent double initialization
    this.advancedControlsInitialized = true
    console.log('Advanced controls initialization complete')
  }

  /**
   * Enter idle state - hide UI elements
   */
  enterIdleState() {
    this.isUIIdle = true
    document.body.classList.add('ui-idle')
    console.log('UI entering idle state')

    // Emit idle state change for projection manager (AC 3.7)
    eventBus.emit('ui.idleStateChanged', { isIdle: true })
  }

  /**
   * Exit idle state - show UI elements and reset timer
   */
  exitIdleState() {
    if (this.isUIIdle) {
      this.isUIIdle = false
      document.body.classList.remove('ui-idle')
      console.log('UI exiting idle state')

      // Emit idle state change for projection manager (AC 3.7)
      eventBus.emit('ui.idleStateChanged', { isIdle: false })
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
  handleActivity() {
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
    console.log('Activity detection initialized for idle state management')
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

  /**
   * Show empty media pool message
   */
  showEmptyMediaPoolMessage() {
    const emptyMessage = document.createElement('div')
    emptyMessage.className = 'media-pool-empty'
    emptyMessage.textContent = STRINGS.USER_INTERFACE.welcome.emptyPool
    this.mediaPool.appendChild(emptyMessage)
  }

  /**
   * Format duration in seconds to readable string
   * @param {number} duration - Duration in seconds
   * @returns {string} Formatted duration string
   */
  formatDuration(duration) {
    return formatDuration(duration)
  }

  /**
   * Remove media item from pool
   * @param {string} itemId - ID of item to remove
   */
  removeMediaItem(itemId) {
    stateManager.removeMediaFromPool(itemId)
  }

  /**
   * Show toast message
   * @param {string} message - Message to show
   * @param {string} type - Type of toast (success, error, etc.)
   */
  showToast(message, type) {
    if (type === 'success') {
      toastManager.success(message)
    } else if (type === 'error') {
      toastManager.error(message)
    } else {
      toastManager.show(message)
    }
  }

  /**
   * Create temporary files notice with close functionality
   * @param {Array} temporaryFiles - Temporary drag & drop files
   */
  createTemporaryNotice(temporaryFiles) {
    // Check if temporary notice already exists and update count
    const existingNotice = this.mediaPoolNotices.querySelector('.temporary-notice')
    if (existingNotice) {
      const noticeText = existingNotice.querySelector('.notice-text')
      if (noticeText) {
        const fileCount = temporaryFiles.length
        noticeText.textContent = t.temporaryNotice(fileCount)
      }
      return
    }

    const tempNotice = document.createElement('div')
    tempNotice.className = 'notice temporary-notice'

    const noticeContent = document.createElement('div')
    noticeContent.className = 'notice-content'

    const noticeText = document.createElement('span')
    noticeText.className = 'notice-text'
    const fileCount = temporaryFiles.length
    noticeText.textContent = t.temporaryNotice(fileCount)

    const tipText = document.createElement('div')
    tipText.className = 'notice-tip'
    tipText.textContent = STRINGS.USER_MESSAGES.status.fileSystemTip

    // Close button
    const closeBtn = document.createElement('button')
    closeBtn.className = 'btn btn--icon-small notice-close-btn'
    closeBtn.textContent = '×'
    closeBtn.title = STRINGS.USER_INTERFACE.tooltips.dismissNotice
    closeBtn.addEventListener('click', () => {
      this.dismissedNotices.temporary = true
      tempNotice.remove()
    })

    noticeContent.appendChild(noticeText)
    noticeContent.appendChild(tipText)
    tempNotice.appendChild(noticeContent)
    tempNotice.appendChild(closeBtn)

    this.mediaPoolNotices.appendChild(tempNotice)
  }

  /**
   * Debug method to display current media pool state
   * Available as window.debugMediaPool() for console debugging
   */
  debugMediaPoolState() {
    console.log('=== Media Pool Debug Information ===')
    const mediaItems = eventBus.getData('mediaPool') || []
    console.log(`Total media items: ${mediaItems.length}`)

    let permissionCount = 0
    let temporaryCount = 0
    let usableCount = 0

    mediaItems.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, item)

      if (item.needsPermission) permissionCount++
      if (item.isTemporary) temporaryCount++
      if (!item.needsPermission && !item.isTemporary) usableCount++
    })

    console.log(`Files needing permission: ${permissionCount}`)
    console.log(`Temporary files: ${temporaryCount}`)
    console.log(`Usable files: ${usableCount}`)
    console.log('=== End Debug Information ===')
  }
}

// Export singleton instance
export const uiManager = new UIManager()
