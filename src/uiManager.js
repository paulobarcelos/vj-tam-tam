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
import { STATE_EVENTS, TEXT_POOL_EVENTS } from './constants/events.js'

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
   * Initialize the UI Manager and set up event listeners
   */
  init() {
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
      console.error(STRINGS.SYSTEM_MESSAGES.uiManager.requiredElementsNotFound)
      return
    }

    this.setupDragAndDropListeners()
    this.setupEventBusListeners()
    this.setupFilePickerListeners()
    this.setupAdvancedControlsListeners()
    this.setupTextPoolListeners()
    this.setupFrequencyControlListeners()
    this.setupActivityDetection()
    this.updateDOMStrings()

    // Initialize media pool display (will show empty message if no media)
    this.updateMediaPoolDisplay()
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
   * Create thumbnail element for media item
   * @param {object} mediaItem - The media item object
   * @returns {HTMLElement} The thumbnail element
   */
  createThumbnailElement(mediaItem) {
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

        return video
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

        return img
      }
    } else {
      // Create placeholder for files without access
      return this.createPlaceholderThumbnail(mediaItem)
    }
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
    const mediaItems = stateManager.getMediaPool()

    // Clear current displays
    this.mediaPool.innerHTML = ''
    this.mediaPoolNotices.innerHTML = ''

    // Update clear button visibility (aligned with text pool pattern)
    this.updateClearMediaVisibility(mediaItems.length)

    // Handle empty state
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

    // Add notices to the notices container (not the grid)
    this.updateNoticesDisplay(filesNeedingPermission, temporaryFiles)

    // Add each media item to the display
    mediaItems.forEach((item) => {
      const mediaElement = document.createElement('div')
      mediaElement.className = 'media-item'
      mediaElement.dataset.mediaId = item.id

      // Create thumbnail image/video element
      const thumbnailElement = this.createThumbnailElement(item)
      mediaElement.appendChild(thumbnailElement)

      // Add video indicator for video files
      if (item.type === 'video') {
        const videoIndicator = document.createElement('div')
        videoIndicator.className = 'video-indicator'
        mediaElement.appendChild(videoIndicator)

        // Add duration overlay if available
        if (item.duration) {
          const durationElement = document.createElement('div')
          durationElement.className = 'video-duration'
          durationElement.textContent = formatDuration(item.duration)
          mediaElement.appendChild(durationElement)
        }
      }

      // Set native browser tooltip with file info
      const formatTooltipInfo = (name, type, size, status = null) => {
        let tooltip = `${name}\n${type.toUpperCase()} • ${formatFileSize(size)}`
        if (status) {
          tooltip += ` • (${status})`
        }
        return tooltip
      }

      // Set appropriate tooltip and styling based on file status
      if (!item.file || !item.url) {
        if (item.fromFileSystemAPI) {
          mediaElement.title = formatTooltipInfo(
            item.name,
            item.type,
            item.size,
            STRINGS.USER_INTERFACE.fileStatus.needsPermission
          )
          mediaElement.classList.add('needs-permission')
        } else {
          mediaElement.title = formatTooltipInfo(
            item.name,
            item.type,
            item.size,
            STRINGS.USER_INTERFACE.fileStatus.metadataOnly
          )
          mediaElement.classList.add('metadata-only')
        }
      } else {
        if (item.fromFileSystemAPI) {
          mediaElement.title = formatTooltipInfo(item.name, item.type, item.size)
        } else {
          mediaElement.title = formatTooltipInfo(
            item.name,
            item.type,
            item.size,
            STRINGS.USER_INTERFACE.fileStatus.temporary
          )
          mediaElement.classList.add('temporary-file')
        }
      }

      // Add delete button
      const deleteBtn = document.createElement('button')
      deleteBtn.className = 'media-delete-btn'
      deleteBtn.textContent = '×'
      deleteBtn.title = STRINGS.USER_INTERFACE.tooltips.removeMediaItem
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.handleRemoveMediaItem(item.id)
      })
      mediaElement.appendChild(deleteBtn)

      this.mediaPool.appendChild(mediaElement)
    })
  }

  /**
   * Update notices display in the dedicated notices container
   * @param {Array} filesNeedingPermission - Files that need permission restoration
   * @param {Array} temporaryFiles - Temporary drag & drop files
   */
  updateNoticesDisplay(filesNeedingPermission, temporaryFiles) {
    // Always show permission banner if files need permission (non-dismissible)
    if (filesNeedingPermission.length > 0) {
      this.createPermissionBanner(filesNeedingPermission)
    }

    // Add temporary files notice if needed and not dismissed
    // Use persisted FileSystem API working state with fallback to current check
    const apiWorking =
      stateManager.getFileSystemAPIWorking() ?? fileSystemFacade.isFileSystemAccessActuallyWorking()
    if (temporaryFiles.length > 0 && !this.dismissedNotices.temporary && apiWorking) {
      this.createTemporaryNotice(temporaryFiles)
    }
  }

  /**
   * Create permission banner (non-dismissible, thin banner style)
   * @param {Array} filesNeedingPermission - Files that need permission restoration
   */
  createPermissionBanner(filesNeedingPermission) {
    // Check if permission banner already exists and update count
    const existingBanner = this.mediaPoolNotices.querySelector('.permission-banner')
    if (existingBanner) {
      const fileCount = filesNeedingPermission.length
      existingBanner.textContent = t.permissionBannerClick(fileCount)
      return
    }

    const permissionBanner = document.createElement('div')
    permissionBanner.className = 'permission-banner'

    const fileCount = filesNeedingPermission.length
    permissionBanner.textContent = t.permissionBannerClick(fileCount)

    // Make entire banner clickable
    permissionBanner.addEventListener('click', () => {
      this.handleBulkFileRestore(filesNeedingPermission)
    })

    // Insert in the notices area (just before media pool)
    this.mediaPoolNotices.appendChild(permissionBanner)
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
    closeBtn.className = 'notice-close-btn'
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
        eventBus.emit(STATE_EVENTS.MEDIA_POOL_UPDATED, {
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
    deleteBtn.className = 'delete-text-btn'
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
