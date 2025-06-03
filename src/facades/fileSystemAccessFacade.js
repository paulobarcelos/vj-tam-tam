/**
 * File System Access API Facade
 * Handles persistent file access using FileSystemAccessAPI and IndexedDB
 */

import { STRINGS, t } from '../constants/strings.js'

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
      console.log(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.notSupported)
      return false
    }

    try {
      return new Promise((resolve, reject) => {
        const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => {
          console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.dbOpenError, request.error)
          reject(request.error)
        }

        request.onsuccess = () => {
          this.db = request.result
          console.log(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.initialized)
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
      console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.initError, error)
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
          console.log(
            t.get('SYSTEM_MESSAGES.fileSystemAccess.handleStored', { fileName: metadata.name })
          )
          resolve(true)
        }

        request.onerror = () => {
          console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.handleStoreFailed, request.error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.handleStoreError, error)
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
                console.warn(
                  t.get('SYSTEM_MESSAGES.fileSystemAccess.permissionDenied', {
                    fileName: result.metadata.name,
                  })
                )
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
            console.warn(
              t.get('SYSTEM_MESSAGES.fileSystemAccess.fileAccessFailed', {
                fileName: result.metadata.name,
              }),
              error
            )
            resolve(null)
          }
        }

        request.onerror = () => {
          console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.fileRetrieveFailed, request.error)
          resolve(null)
        }
      })
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.fileAccessError, error)
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
        console.log(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.userActivationUnavailable)
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
        t.get('SYSTEM_MESSAGES.fileSystemAccess.userActivationCheck', {
          isActive,
          hasBeenActive,
          result: hasActivation,
        })
      )
      return hasActivation
    } catch (error) {
      console.warn(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.userActivationError, error)
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
              console.log(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.noHandlesFound)
              resolve([])
              return
            }

            console.log(
              t.get('SYSTEM_MESSAGES.fileSystemAccess.handlesFound', { count: results.length })
            )

            // Always return metadata-only files initially to avoid race conditions
            // The user activation will be properly handled via the permission overlay
            console.log(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.metadataOnlyReturn)
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
            console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.fileProcessingError, error)
            resolve([])
          }
        }

        request.onerror = () => {
          console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.fileRetrieveError, request.error)
          resolve([])
        }
      })
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.fileRetrieveError, error)
      return []
    }
  }

  /**
   * Request access to stored files (requires user activation)
   * @returns {Promise<Array>} Array of accessible files
   */
  async requestStoredFilesAccess() {
    if (!this.isSupported || !this.db) {
      console.log(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.accessUnavailable)
      return []
    }

    try {
      console.log(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.accessRequested)
      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)

      return new Promise((resolve) => {
        const request = store.getAll()

        request.onsuccess = async () => {
          try {
            const results = request.result || []
            console.log(
              t.get('SYSTEM_MESSAGES.fileSystemAccess.handlesFoundForAccess', {
                count: results.length,
              })
            )

            if (results.length === 0) {
              resolve([])
              return
            }

            const filePromises = results.map(async (result) => {
              try {
                return await this.getFileFromHandle(result.id)
              } catch (error) {
                console.warn(
                  t.get('SYSTEM_MESSAGES.fileSystemAccess.fileAccessFailed', {
                    fileName: result.metadata.name,
                  }),
                  error
                )
                return null
              }
            })

            const files = await Promise.all(filePromises)
            const validFiles = files.filter((file) => file !== null)
            console.log(
              t.get('SYSTEM_MESSAGES.fileSystemAccess.accessSuccess', {
                validCount: validFiles.length,
                totalCount: results.length,
              })
            )
            resolve(validFiles)
          } catch (error) {
            console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.fileProcessingError, error)
            resolve([])
          }
        }

        request.onerror = () => {
          console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.accessFailed, request.error)
          resolve([])
        }
      })
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.accessError, error)
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
          console.log(t.get('SYSTEM_MESSAGES.fileSystemAccess.handleRemoved', { id }))
          resolve(true)
        }

        request.onerror = () => {
          console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.handleRemoveFailed, request.error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.handleRemoveError, error)
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
          console.log(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.handlesCleared)
          resolve(true)
        }

        request.onerror = () => {
          console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.handlesClearFailed, request.error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.fileSystemAccess.handlesClearError, error)
      return false
    }
  }
}

// Export singleton instance
export const fileSystemAccessFacade = new FileSystemAccessFacade()
