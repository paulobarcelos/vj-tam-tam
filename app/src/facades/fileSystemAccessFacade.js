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
      const isActive = navigator.userActivation.isActive
      const hasBeenActive = navigator.userActivation.hasBeenActive
      const result = isActive || hasBeenActive

      console.log(
        `User activation check: isActive=${isActive}, hasBeenActive=${hasBeenActive}, result=${result}`
      )

      return result
    } catch (error) {
      console.warn('Error checking user activation:', error)
      return false
    }
  }

  /**
   * Get all stored files (metadata only, no file data)
   * @returns {Promise<Array>} Array of file metadata
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

        request.onsuccess = () => {
          const results = request.result

          if (results.length === 0) {
            console.log('No file handles found in storage')
            return resolve([])
          }

          console.log(`Found ${results.length} stored file handles`)

          // Check if we have user activation for permission requests
          if (!this.hasUserActivation()) {
            console.log('Returning metadata-only files to avoid user activation race conditions')
            // Return metadata-only items to avoid triggering permission dialogs during app init
            const metadataFiles = results.map((result) => ({
              ...result.metadata,
              // Ensure addedAt is a proper Date object
              addedAt:
                result.metadata.addedAt instanceof Date
                  ? result.metadata.addedAt
                  : new Date(result.metadata.addedAt),
              fromFileSystemAPI: true,
              needsPermission: true,
            }))
            resolve(metadataFiles)
            return
          }

          // If we have user activation, we could try to access files here,
          // but it's safer to return metadata-only and let the UI request access explicitly
          const metadataFiles = results.map((result) => ({
            ...result.metadata,
            addedAt:
              result.metadata.addedAt instanceof Date
                ? result.metadata.addedAt
                : new Date(result.metadata.addedAt),
            fromFileSystemAPI: true,
            needsPermission: true,
          }))

          resolve(metadataFiles)
        }

        request.onerror = () => {
          console.error('Error processing file handles:', request.error)
          resolve([])
        }
      })
    } catch (error) {
      console.error('Error retrieving all files:', error)
      return []
    }
  }

  /**
   * Request access to stored files with user activation
   * @returns {Promise<Array>} Array of accessible files with URLs
   */
  async requestStoredFilesAccess() {
    if (!this.isSupported || !this.db) {
      console.log('FileSystemAccessAPI not supported or database not available')
      return []
    }

    console.log('Requesting access to stored files with user activation...')

    try {
      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)

      return new Promise((resolve) => {
        const request = store.getAll()

        request.onsuccess = async () => {
          const results = request.result
          console.log(`Found ${results.length} stored file handles for access request`)

          const accessibleFiles = []

          for (const result of results) {
            try {
              // Check permission first
              const permissionStatus = await result.fileHandle.queryPermission({ mode: 'read' })

              if (permissionStatus !== 'granted') {
                // Request permission with user activation
                const newPermission = await result.fileHandle.requestPermission({ mode: 'read' })
                if (newPermission !== 'granted') {
                  console.warn(`Permission denied for file: ${result.metadata.name}`)
                  continue
                }
              }

              // Get file data
              const file = await result.fileHandle.getFile()
              const url = URL.createObjectURL(file)

              accessibleFiles.push({
                ...result.metadata,
                addedAt:
                  result.metadata.addedAt instanceof Date
                    ? result.metadata.addedAt
                    : new Date(result.metadata.addedAt),
                file,
                url,
                fromFileSystemAPI: true,
              })
            } catch (error) {
              console.error('Error processing file handle:', error)
              continue
            }
          }

          console.log(
            `Successfully accessed ${accessibleFiles.length} of ${results.length} stored files`
          )
          resolve(accessibleFiles)
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
   * Remove a file handle from storage
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

export const fileSystemAccessFacade = new FileSystemAccessFacade()
