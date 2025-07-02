/**
 * FileSystem Facade for handling file and folder selection
 * Uses FileSystemAccessAPI when available, with fallback to HTML input elements
 */

import { toastManager } from '../toastManager.js'
import { FILE_ACCEPT_PATTERNS } from '../constants/mediaTypes.js'
import { STRINGS } from '../constants/strings.js'
import { hasValidMediaExtension } from '../utils/mediaUtils.js'

class FileSystemFacade {
  constructor() {
    this.hasFileSystemAccess = 'showOpenFilePicker' in window && 'showDirectoryPicker' in window
    this.browserInfo = this.detectBrowser()
    this.lastOperationUsedAPI = false // Track if last operation actually used API vs fallback
    console.log(
      `FileSystemFacade initialized - hasFileSystemAccess: ${this.hasFileSystemAccess}, browser: ${this.browserInfo}`
    )
  }

  /**
   * Detect browser for debugging purposes
   * @returns {string} Browser name
   */
  detectBrowser() {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Arc/')) return 'Arc'
    if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) return 'Chrome'
    if (userAgent.includes('Firefox/')) return 'Firefox'
    if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'Safari'
    if (userAgent.includes('Edg/')) return 'Edge'
    return 'Unknown'
  }

  /**
   * Check if FileSystemAccessAPI is supported
   * @returns {boolean} - True if API is available
   */
  isFileSystemAccessSupported() {
    return this.hasFileSystemAccess
  }

  /**
   * Check if FileSystemAccessAPI is actually working (not just available)
   * Based on the last operation result
   * @returns {boolean} - True if last operation used API successfully
   */
  isFileSystemAccessActuallyWorking() {
    return this.hasFileSystemAccess && this.lastOperationUsedAPI
  }

  /**
   * Open file browser for selecting individual files
   * @returns {Promise<File[]>} - Promise resolving to array of File objects
   */
  async browseFiles() {
    if (this.hasFileSystemAccess) {
      return this.browseFilesWithAPI()
    } else {
      this.lastOperationUsedAPI = false // Mark as fallback used
      return this.browseWithInput(false)
    }
  }

  /**
   * Open folder browser for selecting entire folders
   * @returns {Promise<File[]>} - Promise resolving to array of File objects from folder
   */
  async browseFolders() {
    if (this.hasFileSystemAccess) {
      return this.browseFoldersWithAPI()
    } else {
      this.lastOperationUsedAPI = false // Mark as fallback used
      return this.browseWithInput(true)
    }
  }

  /**
   * Browse files using FileSystemAccessAPI
   * @returns {Promise<File[]>} - Promise resolving to array of File objects
   */
  async browseFilesWithAPI() {
    try {
      console.log('Attempting to open file picker with FileSystemAccessAPI')
      const fileHandles = await window.showOpenFilePicker({
        types: [
          {
            description: 'Media files',
            accept: FILE_ACCEPT_PATTERNS,
          },
        ],
        multiple: true,
      })

      // Convert file handles to File objects with handles preserved
      const files = await Promise.all(
        fileHandles.map(async (handle) => {
          const file = await handle.getFile()
          // Preserve the file handle for persistence
          file.handle = handle
          return file
        })
      )

      console.log(`FileSystemAccessAPI: Selected ${files.length} files`)
      this.lastOperationUsedAPI = true // Mark as successful API usage

      // Update StateManager with API working state
      import('../stateManager.js').then(({ stateManager }) => {
        stateManager.setFileSystemAPIWorking(true)
      })

      return files
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('File picker cancelled by user')
        this.lastOperationUsedAPI = true // User cancellation still counts as API working
        return []
      }

      console.error('File picker error:', error)
      console.log('Falling back to input element')

      if (error.name === 'NotAllowedError') {
        console.log('File picker fallback - using input element')

        toastManager.show(STRINGS.USER_MESSAGES.notifications.info.filePickerFallback, {
          type: 'info',
        })

        // Mark as fallback used since API failed
        this.lastOperationUsedAPI = false

        // Update StateManager with API not working state
        import('../stateManager.js').then(({ stateManager }) => {
          stateManager.setFileSystemAPIWorking(false)
        })

        // Fall back to HTML input file picker
        return this.browseWithInput(false)
      }

      toastManager.error(STRINGS.USER_MESSAGES.notifications.error.fileAccessFailed)
      return []
    }
  }

  /**
   * Browse folders using FileSystemAccessAPI
   * @returns {Promise<File[]>} - Promise resolving to array of File objects from folder
   */
  async browseFoldersWithAPI() {
    try {
      console.log('Attempting to open directory picker with FileSystemAccessAPI')
      const directoryHandle = await window.showDirectoryPicker()

      console.log(`Directory selected: ${directoryHandle.name}`)
      const files = await this.extractFilesFromDirectory(directoryHandle)

      console.log(`DirectoryAPI: Found ${files.length} files in directory`)
      this.lastOperationUsedAPI = true // Mark as successful API usage

      // Update StateManager with API working state
      import('../stateManager.js').then(({ stateManager }) => {
        stateManager.setFileSystemAPIWorking(true)
      })

      return files
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Directory picker cancelled by user')
        this.lastOperationUsedAPI = true // User cancellation still counts as API working
        return []
      }

      console.error('Directory picker error:', error)
      console.log('Falling back to input element')

      if (error.name === 'NotAllowedError') {
        console.log('Directory picker fallback - using input element')

        toastManager.show(STRINGS.USER_MESSAGES.notifications.info.folderPickerFallback, {
          type: 'info',
        })

        // Mark as fallback used since API failed
        this.lastOperationUsedAPI = false

        // Update StateManager with API not working state
        import('../stateManager.js').then(({ stateManager }) => {
          stateManager.setFileSystemAPIWorking(false)
        })

        // Fall back to HTML input folder picker
        return this.browseWithInput(true)
      } else {
        this.lastOperationUsedAPI = false // Mark as fallback used
        toastManager.error(STRINGS.USER_MESSAGES.notifications.error.folderAccessFailed)
        return []
      }
    }
  }

  /**
   * Recursively extract media files from a directory handle
   * @param {FileSystemDirectoryHandle} directoryHandle - Directory to process
   * @returns {Promise<File[]>} - Array of media File objects with handles
   */
  async extractFilesFromDirectory(directoryHandle) {
    const mediaFiles = []

    try {
      for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === 'file') {
          // Check if file has supported extension
          if (hasValidMediaExtension(name)) {
            try {
              const file = await handle.getFile()
              // Preserve the file handle for persistence
              file.handle = handle
              mediaFiles.push(file)
            } catch (error) {
              console.warn(`File access error for ${name}:`, error)
            }
          }
        } else if (handle.kind === 'directory') {
          // Recursively process subdirectories
          const subFiles = await this.extractFilesFromDirectory(handle)
          mediaFiles.push(...subFiles)
        }
      }
    } catch (error) {
      console.error('File extraction error:', error)
    }

    return mediaFiles
  }

  /**
   * Fallback browse using HTML input element
   * @param {boolean} selectFolder - Whether to select folder instead of files
   * @returns {Promise<File[]>} - Promise resolving to array of File objects
   */
  browseWithInput(selectFolder = false) {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = 'image/*,video/*'
      // Enable directory selection for folder mode
      input.webkitdirectory = selectFolder

      input.onchange = (e) => {
        const files = Array.from(e.target.files || [])
        resolve(files)
      }

      input.oncancel = () => {
        resolve([])
      }

      // Trigger file picker
      input.click()
    })
  }
}

// Export singleton instance
export const fileSystemFacade = new FileSystemFacade()
