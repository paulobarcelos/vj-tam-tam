/**
 * FileSystem Facade for handling file and folder selection
 * Uses FileSystemAccessAPI when available, with fallback to HTML input elements
 */

import { toastManager } from '../toastManager.js'

class FileSystemFacade {
  constructor() {
    this.hasFileSystemAccess = 'showOpenFilePicker' in window && 'showDirectoryPicker' in window
  }

  /**
   * Check if FileSystemAccessAPI is supported
   * @returns {boolean} - True if API is available
   */
  isFileSystemAccessSupported() {
    return this.hasFileSystemAccess
  }

  /**
   * Open unified browse dialog for selecting files or folders
   * @returns {Promise<File[]>} - Promise resolving to array of File objects
   */
  async browse() {
    if (this.hasFileSystemAccess) {
      return this.browseWithAPI()
    } else {
      return this.browseWithInput()
    }
  }

  /**
   * Browse using FileSystemAccessAPI with unified experience
   * @returns {Promise<File[]>} - Promise resolving to array of File objects
   */
  async browseWithAPI() {
    try {
      // First, try to open file picker
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

      // Convert file handles to File objects
      const files = await Promise.all(fileHandles.map((handle) => handle.getFile()))

      return files
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled - this is normal, don't show error
        return []
      }

      console.error('Error browsing files with FileSystemAccessAPI:', error)

      if (error.name === 'NotAllowedError') {
        toastManager.error('File access permission denied. Please try again and allow file access.')
      } else {
        toastManager.error('Error accessing files. Please try again.')
      }

      return []
    }
  }

  /**
   * Fallback browse using HTML input element
   * @returns {Promise<File[]>} - Promise resolving to array of File objects
   */
  browseWithInput() {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = 'image/*,video/*'
      // Enable both files and directories for browsers that support it
      input.webkitdirectory = false

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
