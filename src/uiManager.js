/**
 * UI Manager module for handling user interface interactions and drag-and-drop functionality
 * Manages visual feedback and coordinates with other modules through the event bus
 */

import { eventBus } from './eventBus.js'
import { mediaProcessor } from './mediaProcessor.js'
import { fileSystemFacade } from './facades/fileSystemFacade.js'
import { stateManager } from './stateManager.js'
import { fileSystemAccessFacade } from './facades/fileSystemAccessFacade.js'

class UIManager {
  constructor() {
    this.stage = null
    this.leftDrawer = null
    this.dropIndicator = null
    this.mediaPool = null
    this.welcomeMessage = null
    this.browseBtn = null
    this.dragCounter = 0 // Track drag enter/leave events
    this.permissionOverlay = null
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
    this.browseBtn = document.getElementById('browse-btn')

    if (
      !this.stage ||
      !this.leftDrawer ||
      !this.dropIndicator ||
      !this.mediaPool ||
      !this.welcomeMessage ||
      !this.browseBtn
    ) {
      console.error('Required DOM elements not found')
      return
    }

    this.setupDragAndDropListeners()
    this.setupEventBusListeners()
    this.setupFilePickerListeners()
    this.createPermissionOverlay()
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
    // Welcome message click handler
    this.welcomeMessage.addEventListener('click', this.handleBrowseClick.bind(this))

    // Browse button handler
    this.browseBtn.addEventListener('click', this.handleBrowseClick.bind(this))
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
  handleMediaPoolStateUpdate() {
    this.updateMediaPoolDisplay()
    this.updateWelcomeMessageVisibility()
  }

  /**
   * Handle media pool restoration with permission check
   */
  handleMediaPoolRestored(data) {
    this.updateMediaPoolDisplay()
    this.updateWelcomeMessageVisibility()

    // Show permission overlay if files need user activation
    if (data.needsPermission && data.totalCount > 0) {
      this.showPermissionOverlay()
    }
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
      emptyMessage.textContent = 'Drop media files to get started'
      this.mediaPool.appendChild(emptyMessage)
      return
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

      // Show if this is metadata-only (restored from localStorage)
      if (!item.file || !item.url) {
        typeElement.textContent = `${item.type} • ${this.formatFileSize(item.size)} • metadata only`
        mediaElement.classList.add('metadata-only')
      } else {
        typeElement.textContent = `${item.type} • ${this.formatFileSize(item.size)}`
      }

      mediaElement.appendChild(nameElement)
      mediaElement.appendChild(typeElement)
      this.mediaPool.appendChild(mediaElement)
    })
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size string
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Handle browse button and welcome message click for file selection
   */
  async handleBrowseClick() {
    const files = await fileSystemFacade.browse()
    if (files.length > 0) {
      await mediaProcessor.processFiles(files)
    }
  }

  /**
   * Update welcome message visibility based on media pool state
   */
  updateWelcomeMessageVisibility() {
    const mediaItems = stateManager.getMediaPool()
    if (mediaItems.length > 0) {
      this.welcomeMessage.classList.add('hidden')
    } else {
      this.welcomeMessage.classList.remove('hidden')
    }
  }

  /**
   * Create permission overlay for user activation
   */
  createPermissionOverlay() {
    this.permissionOverlay = document.createElement('div')
    this.permissionOverlay.id = 'permission-overlay'
    this.permissionOverlay.className = 'permission-overlay hidden'
    this.permissionOverlay.innerHTML = `
      <div class="permission-content">
        <h2>Restore Previous Files</h2>
        <p>Click to restore your previously selected files</p>
        <button id="restore-files-btn" class="restore-btn">Restore Files</button>
        <button id="skip-restore-btn" class="skip-btn">Skip</button>
      </div>
    `

    document.body.appendChild(this.permissionOverlay)

    // Set up click handlers
    const restoreBtn = this.permissionOverlay.querySelector('#restore-files-btn')
    const skipBtn = this.permissionOverlay.querySelector('#skip-restore-btn')

    restoreBtn.addEventListener('click', this.handleRestoreFiles.bind(this))
    skipBtn.addEventListener('click', this.hidePermissionOverlay.bind(this))
  }

  /**
   * Show permission overlay
   */
  showPermissionOverlay() {
    if (this.permissionOverlay) {
      this.permissionOverlay.classList.remove('hidden')
    }
  }

  /**
   * Hide permission overlay
   */
  hidePermissionOverlay() {
    if (this.permissionOverlay) {
      this.permissionOverlay.classList.add('hidden')
    }
  }

  /**
   * Handle restore files click (with user activation)
   */
  async handleRestoreFiles() {
    try {
      this.hidePermissionOverlay()

      // Now we have user activation, request access to stored files
      const files = await fileSystemAccessFacade.requestStoredFilesAccess()

      if (files.length > 0) {
        // Update the state manager with the restored files
        stateManager.state.mediaPool = files

        // Emit event to update UI and trigger playback
        eventBus.emit('state.mediaPoolRestored', {
          mediaPool: files,
          totalCount: files.length,
          source: 'FileSystemAccessAPI-UserActivated',
        })

        console.log(`Successfully restored ${files.length} files with user activation`)
      } else {
        console.log('No files could be restored')
      }
    } catch (error) {
      console.error('Error restoring files:', error)
    }
  }
}

// Export singleton instance
export const uiManager = new UIManager()
