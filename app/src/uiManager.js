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
import { formatFileSize } from './utils/stringUtils.js'

class UIManager {
  constructor() {
    this.stage = null
    this.leftDrawer = null
    this.dropIndicator = null
    this.mediaPool = null
    this.welcomeMessage = null
    this.browseFilesBtn = null
    this.browseFoldersBtn = null
    this.dragCounter = 0 // Track drag enter/leave events
    this.isFilePickerActive = false // Lock to prevent concurrent file picker calls
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

    if (
      !this.stage ||
      !this.leftDrawer ||
      !this.dropIndicator ||
      !this.mediaPool ||
      !this.welcomeMessage ||
      !this.browseFilesBtn ||
      !this.browseFoldersBtn
    ) {
      console.error(STRINGS.SYSTEM_MESSAGES.uiManager.requiredElementsNotFound)
      return
    }

    this.setupDragAndDropListeners()
    this.setupEventBusListeners()
    this.setupFilePickerListeners()
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

      const typeElement = document.createElement('div')
      typeElement.className = 'media-type'

      // Differentiate between different types of metadata-only files
      if (!item.file || !item.url) {
        if (item.fromFileSystemAPI) {
          // File from FileSystemAccessAPI that can be restored
          typeElement.textContent = t.fileType(
            item.type,
            formatFileSize(item.size),
            STRINGS.USER_INTERFACE.fileStatus.needsPermission
          )
          mediaElement.classList.add('needs-permission')
        } else {
          // File from drag & drop - truly metadata-only
          typeElement.textContent = t.fileType(
            item.type,
            formatFileSize(item.size),
            STRINGS.USER_INTERFACE.fileStatus.metadataOnly
          )
          mediaElement.classList.add('metadata-only')
        }
      } else {
        // File with full access - check if it's temporary or persistent
        if (item.fromFileSystemAPI) {
          // Persistent file from FileSystemAccessAPI
          typeElement.textContent = t.fileType(item.type, formatFileSize(item.size))
        } else {
          // Temporary file from drag & drop
          typeElement.textContent = t.fileType(
            item.type,
            formatFileSize(item.size),
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
}

// Export singleton instance
export const uiManager = new UIManager()
