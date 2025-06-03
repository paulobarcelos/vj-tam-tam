/**
 * File System Access API Facade
 * Handles persistent file access using FileSystemAccessAPI and IndexedDB
 */

const DB_NAME = 'vj-tam-tam-files'
const DB_VERSION = 1
const STORE_NAME = 'fileHandles'

class FileSystemAccessFacade {
  constructor() {
    this.db = null
    this.isSupported = this.checkSupport()
  }

  /**
   * Check if FileSystemAccessAPI is supported
   * @returns {boolean}
   */
  checkSupport() {
    return 'showOpenFilePicker' in window && 'indexedDB' in window
  }

  /**
   * Initialize IndexedDB for storing file handles
   * @returns {Promise<boolean>} Success status
   */
  async init() {
    if (!this.isSupported) {
      console.log('FileSystemAccessAPI not supported, falling back to metadata-only persistence')
      return false
    }

    try {
      return new Promise((resolve, reject) => {
        const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => {
          console.error('Failed to open IndexedDB:', request.error)
          reject(request.error)
        }

        request.onsuccess = () => {
          this.db = request.result
          console.log('FileSystemAccessAPI facade initialized successfully')
          resolve(true)
        }

        request.onupgradeneeded = (event) => {
          const db = event.target.result
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            store.createIndex('name', 'name', { unique: false })
          }
        }
      })
    } catch (error) {
      console.error('Error initializing FileSystemAccessAPI facade:', error)
      return false
    }
  }

  /**
   * Store a file handle with associated metadata
   * @param {string} id - Unique identifier for the file
   * @param {FileSystemFileHandle} fileHandle - File handle to store
   * @param {Object} metadata - File metadata
   * @returns {Promise<boolean>} Success status
   */
  async storeFileHandle(id, fileHandle, metadata) {
    if (!this.isSupported || !this.db) {
      return false
    }

    try {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const data = {
        id,
        fileHandle,
        metadata,
        storedAt: new Date().toISOString(),
      }

      return new Promise((resolve) => {
        const request = store.put(data)

        request.onsuccess = () => {
          console.log(`File handle stored for ${metadata.name}`)
          resolve(true)
        }

        request.onerror = () => {
          console.error('Failed to store file handle:', request.error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error('Error storing file handle:', error)
      return false
    }
  }

  /**
   * Retrieve a file handle and recreate the File object
   * @param {string} id - File identifier
   * @returns {Promise<Object|null>} File object with metadata or null
   */
  async getFileFromHandle(id) {
    if (!this.isSupported || !this.db) {
      return null
    }

    try {
      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)

      return new Promise((resolve) => {
        const request = store.get(id)

        request.onsuccess = async () => {
          const result = request.result
          if (!result) {
            resolve(null)
            return
          }

          try {
            // Verify we still have permission to access the file
            const permissionStatus = await result.fileHandle.queryPermission({ mode: 'read' })

            if (permissionStatus !== 'granted') {
              // Try to request permission
              const newPermission = await result.fileHandle.requestPermission({ mode: 'read' })
              if (newPermission !== 'granted') {
                console.warn(`Permission denied for file: ${result.metadata.name}`)
                resolve(null)
                return
              }
            }

            // Get the File object from the handle
            const file = await result.fileHandle.getFile()
            const url = URL.createObjectURL(file)

            resolve({
              ...result.metadata,
              // Ensure addedAt is a proper Date object
              addedAt:
                result.metadata.addedAt instanceof Date
                  ? result.metadata.addedAt
                  : new Date(result.metadata.addedAt),
              file,
              url,
              fromFileSystemAPI: true,
            })
          } catch (error) {
            console.warn(`Failed to access file handle for ${result.metadata.name}:`, error)
            resolve(null)
          }
        }

        request.onerror = () => {
          console.error('Failed to retrieve file handle:', request.error)
          resolve(null)
        }
      })
    } catch (error) {
      console.error('Error retrieving file handle:', error)
      return null
    }
  }

  /**
   * Check if we have user activation (required for permission requests)
   * @returns {boolean} True if user activation is available
   */
  hasUserActivation() {
    try {
      // Check if user activation API is available
      if (!navigator.userActivation) {
        console.log('User activation API not available, assuming no activation')
        return false
      }

      // During page load, user activation can be inconsistent
      // We're more conservative and assume no activation unless we're sure
      const isActive = navigator.userActivation.isActive
      const hasBeenActive = navigator.userActivation.hasBeenActive

      // Only consider it active if both isActive is true AND hasBeenActive is true
      // This reduces false positives during page load
      const hasActivation = isActive && hasBeenActive

      console.log(
        `User activation check: isActive=${isActive}, hasBeenActive=${hasBeenActive}, result=${hasActivation}`
      )
      return hasActivation
    } catch (error) {
      console.warn('Error checking user activation:', error)
      return false
    }
  }

  /**
   * Get all stored file handles with improved user activation handling
   * @returns {Promise<Array>} Array of file data or empty array
   */
  async getAllFiles() {
    if (!this.isSupported || !this.db) {
      return []
    }

    try {
      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)

      return new Promise((resolve) => {
        const request = store.getAll()

        request.onsuccess = async () => {
          try {
            const results = request.result || []

            if (results.length === 0) {
              console.log('No file handles found in storage')
              resolve([])
              return
            }

            console.log(`Found ${results.length} stored file handles`)

            // Always return metadata-only files initially to avoid race conditions
            // The user activation will be properly handled via the permission overlay
            console.log('Returning metadata-only files to avoid user activation race conditions')
            const metadataOnlyFiles = results.map((result) => ({
              ...result.metadata,
              // Ensure addedAt is a proper Date object
              addedAt:
                result.metadata.addedAt instanceof Date
                  ? result.metadata.addedAt
                  : new Date(result.metadata.addedAt),
              file: null,
              url: null,
              fromFileSystemAPI: true,
              needsPermission: true,
            }))
            resolve(metadataOnlyFiles)
          } catch (error) {
            console.error('Error processing stored files in onsuccess handler:', error)
            resolve([])
          }
        }

        request.onerror = () => {
          console.error('Failed to retrieve all file handles:', request.error)
          resolve([])
        }
      })
    } catch (error) {
      console.error('Error retrieving all files:', error)
      return []
    }
  }

  /**
   * Request access to stored files (requires user activation)
   * @returns {Promise<Array>} Array of accessible files
   */
  async requestStoredFilesAccess() {
    if (!this.isSupported || !this.db) {
      console.log('FileSystemAccessAPI not supported or database not available')
      return []
    }

    try {
      console.log('Requesting access to stored files with user activation...')
      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)

      return new Promise((resolve) => {
        const request = store.getAll()

        request.onsuccess = async () => {
          try {
            const results = request.result || []
            console.log(`Found ${results.length} stored file handles for access request`)

            if (results.length === 0) {
              resolve([])
              return
            }

            const filePromises = results.map(async (result) => {
              try {
                return await this.getFileFromHandle(result.id)
              } catch (error) {
                console.warn(`Failed to access file handle for ${result.metadata.name}:`, error)
                return null
              }
            })

            const files = await Promise.all(filePromises)
            const validFiles = files.filter((file) => file !== null)
            console.log(
              `Successfully accessed ${validFiles.length} of ${results.length} stored files`
            )
            resolve(validFiles)
          } catch (error) {
            console.error('Error processing stored files after user activation:', error)
            resolve([])
          }
        }

        request.onerror = () => {
          console.error('Failed to retrieve file handles for user activation:', request.error)
          resolve([])
        }
      })
    } catch (error) {
      console.error('Error requesting stored files access:', error)
      return []
    }
  }

  /**
   * Remove a stored file handle
   * @param {string} id - File identifier
   * @returns {Promise<boolean>} Success status
   */
  async removeFileHandle(id) {
    if (!this.isSupported || !this.db) {
      return false
    }

    try {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      return new Promise((resolve) => {
        const request = store.delete(id)

        request.onsuccess = () => {
          console.log(`File handle removed for ID: ${id}`)
          resolve(true)
        }

        request.onerror = () => {
          console.error('Failed to remove file handle:', request.error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error('Error removing file handle:', error)
      return false
    }
  }

  /**
   * Clear all stored file handles
   * @returns {Promise<boolean>} Success status
   */
  async clearAllFiles() {
    if (!this.isSupported || !this.db) {
      return false
    }

    try {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      return new Promise((resolve) => {
        const request = store.clear()

        request.onsuccess = () => {
          console.log('All file handles cleared')
          resolve(true)
        }

        request.onerror = () => {
          console.error('Failed to clear file handles:', request.error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error('Error clearing file handles:', error)
      return false
    }
  }
}

// Export singleton instance
export const fileSystemAccessFacade = new FileSystemAccessFacade()
