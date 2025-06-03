/**
 * FileSystem Facade for handling file and folder selection
 * Uses FileSystemAccessAPI when available, with fallback to HTML input elements
 */

import { toastManager } from '../toastManager.js'

class FileSystemFacade {
  constructor() {
    this.hasFileSystemAccess = 'showOpenFilePicker' in window && 'showDirectoryPicker' in window
    this.browserInfo = this.detectBrowser()
    console.log('FileSystemFacade initialized:', {
      hasFileSystemAccess: this.hasFileSystemAccess,
      browser: this.browserInfo,
    })
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
   * Open file browser for selecting individual files
   * @returns {Promise<File[]>} - Promise resolving to array of File objects
   */
  async browseFiles() {
    if (this.hasFileSystemAccess) {
      return this.browseFilesWithAPI()
    } else {
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
      return this.browseWithInput(true)
    }
  }

  /**
   * Legacy method - defaults to file browsing for backward compatibility
   * @returns {Promise<File[]>} - Promise resolving to array of File objects
   */
  async browse() {
    return this.browseFiles()
  }

  /**
   * Browse files using FileSystemAccessAPI
   * @returns {Promise<File[]>} - Promise resolving to array of File objects
   */
  async browseFilesWithAPI() {
    try {
      console.log('Attempting to open file picker with FileSystemAccessAPI...')
      const fileHandles = await window.showOpenFilePicker({
        multiple: true,
        types: [
          {
            description: 'Images',
            accept: {
              'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.heic', '.webp'],
            },
          },
          {
            description: 'Videos',
            accept: {
              'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
            },
          },
        ],
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

      console.log(`Selected ${files.length} files via FileSystemAccessAPI with handles`)
      return files
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled - this is normal, don't show error
        console.log('File picker cancelled by user')
        return []
      }

      console.error('Error browsing files with FileSystemAccessAPI:', error)
      console.log('Error details:', { name: error.name, message: error.message })

      if (error.name === 'NotAllowedError') {
        console.log('Permission denied, falling back to HTML input file picker')
        toastManager.show('FileSystemAccessAPI permission denied. Using fallback file picker.', {
          type: 'info',
        })
        // Fallback to HTML input
        return this.browseWithInput(false)
      } else {
        toastManager.error('Error accessing files. Please try again.')
        return []
      }
    }
  }

  /**
   * Browse folders using FileSystemAccessAPI
   * @returns {Promise<File[]>} - Promise resolving to array of File objects from folder
   */
  async browseFoldersWithAPI() {
    try {
      console.log('Attempting to open directory picker with FileSystemAccessAPI...')
      const directoryHandle = await window.showDirectoryPicker()

      console.log(`Selected folder: ${directoryHandle.name}`)
      const files = await this.extractFilesFromDirectory(directoryHandle)

      console.log(
        `Found ${files.length} media files in folder via FileSystemAccessAPI with handles`
      )
      return files
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled - this is normal, don't show error
        console.log('Directory picker cancelled by user')
        return []
      }

      console.error('Error browsing folder with FileSystemAccessAPI:', error)
      console.log('Error details:', { name: error.name, message: error.message })

      if (error.name === 'NotAllowedError') {
        console.log('Permission denied, falling back to HTML input folder picker')
        toastManager.show('FileSystemAccessAPI permission denied. Using fallback folder picker.', {
          type: 'info',
        })
        // Fallback to HTML input with webkitdirectory
        return this.browseWithInput(true)
      } else {
        toastManager.error('Error accessing folder. Please try again.')
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
    const supportedExtensions = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'heic',
      'webp',
      'mp4',
      'mov',
      'avi',
      'webm',
      'mkv',
    ]

    try {
      for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === 'file') {
          // Check if file has supported extension
          const extension = name.split('.').pop()?.toLowerCase()
          if (extension && supportedExtensions.includes(extension)) {
            try {
              const file = await handle.getFile()
              // Preserve the file handle for persistence
              file.handle = handle
              mediaFiles.push(file)
            } catch (error) {
              console.warn(`Failed to access file ${name}:`, error)
            }
          }
        } else if (handle.kind === 'directory') {
          // Recursively process subdirectories
          const subFiles = await this.extractFilesFromDirectory(handle)
          mediaFiles.push(...subFiles)
        }
      }
    } catch (error) {
      console.error('Error extracting files from directory:', error)
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
