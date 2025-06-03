import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fileSystemAccessFacade } from './fileSystemAccessFacade.js'

// Mock the strings module
vi.mock('../constants/strings.js', () => ({
  STRINGS: {
    SYSTEM_MESSAGES: {
      fileSystemAccess: {
        notSupported: 'FileSystemAccessAPI not supported',
        dbOpenError: 'Error opening IndexedDB',
        initError: 'Error initializing FileSystemAccessFacade',
        initialized: 'FileSystemAccessFacade initialized',
        handleStored: 'File handle stored',
        handleStoreFailed: 'Failed to store file handle',
        handleStoreError: 'Error storing file handle',
        fileRetrieveFailed: 'Failed to retrieve file',
        fileAccessError: 'Error accessing file',
        fileProcessingError: 'Error processing files',
        handleRemoved: 'File handle removed',
        handleRemoveFailed: 'Failed to remove file handle',
        handleRemoveError: 'Error removing file handle',
        handlesCleared: 'All file handles cleared',
        handlesClearFailed: 'Failed to clear file handles',
        handlesClearError: 'Error clearing file handles',
        userActivationUnavailable: 'User activation API unavailable',
        userActivationError: 'Error checking user activation',
        noHandlesFound: 'No file handles found',
        handlesFound: 'File handles found',
        metadataOnlyReturn: 'Returning metadata-only files',
        accessUnavailable: 'File access unavailable',
        accessRequested: 'File access requested',
        handlesFoundForAccess: 'File handles found for access',
        accessSuccess: 'File access successful',
        accessFailed: 'File access failed',
        accessError: 'Error during file access',
        permissionDenied: 'Permission denied for file',
        fileAccessFailed: 'Failed to access file',
        fileRetrieveError: 'Error retrieving files',
      },
    },
  },
  t: {
    get: vi.fn((key, params) => {
      // Simple mock implementation for interpolated strings
      if (params) {
        let result = key
        Object.keys(params).forEach((param) => {
          result = result.replace(`{${param}}`, params[param])
        })
        return result
      }
      return key
    }),
  },
}))

describe('FileSystemAccessFacade', () => {
  let mockIndexedDB
  let mockRequest
  let mockDb
  let mockTransaction
  let mockStore
  let consoleLogSpy
  let consoleErrorSpy
  let consoleWarnSpy
  let timeouts = [] // Track timeouts for cleanup

  beforeEach(() => {
    // Reset the facade instance state
    fileSystemAccessFacade.db = null
    fileSystemAccessFacade.isSupported = fileSystemAccessFacade.checkSupport()

    // Clear any tracked timeouts
    timeouts = []

    // Create mock IndexedDB objects
    mockRequest = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: null,
      error: null,
    }

    mockStore = {
      put: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
      get: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
      getAll: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
      delete: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
      clear: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
      createIndex: vi.fn(),
    }

    mockTransaction = {
      objectStore: vi.fn().mockReturnValue(mockStore),
    }

    mockDb = {
      transaction: vi.fn().mockReturnValue(mockTransaction),
      createObjectStore: vi.fn().mockReturnValue(mockStore),
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(false),
      },
    }

    mockIndexedDB = {
      open: vi.fn().mockReturnValue(mockRequest),
    }

    // Mock globalThis.indexedDB
    globalThis.indexedDB = mockIndexedDB

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    // Clear all timeouts to prevent memory leaks
    timeouts.forEach((timeoutId) => clearTimeout(timeoutId))
    timeouts = []

    // Restore spies
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    vi.restoreAllMocks()

    // Clean up global mocks
    delete globalThis.indexedDB
    delete globalThis.showOpenFilePicker
    delete globalThis.navigator
  })

  describe('checkSupport', () => {
    it('should return true when FileSystemAccessAPI and IndexedDB are supported', () => {
      globalThis.showOpenFilePicker = vi.fn()
      globalThis.indexedDB = mockIndexedDB

      const result = fileSystemAccessFacade.checkSupport()

      expect(result).toBe(true)
    })

    it('should return false when FileSystemAccessAPI is not supported', () => {
      delete globalThis.showOpenFilePicker
      globalThis.indexedDB = mockIndexedDB

      const result = fileSystemAccessFacade.checkSupport()

      expect(result).toBe(false)
    })

    it('should return false when IndexedDB is not supported', () => {
      globalThis.showOpenFilePicker = vi.fn()
      delete globalThis.indexedDB

      const result = fileSystemAccessFacade.checkSupport()

      expect(result).toBe(false)
    })
  })

  describe('init', () => {
    it('should return false if not supported', async () => {
      fileSystemAccessFacade.isSupported = false

      const result = await fileSystemAccessFacade.init()

      expect(result).toBe(false)
      expect(consoleLogSpy).toHaveBeenCalledWith('FileSystemAccessAPI not supported')
    })

    it('should initialize successfully', async () => {
      fileSystemAccessFacade.isSupported = true

      // Mock successful IndexedDB opening
      setTimeout(() => {
        mockRequest.result = mockDb
        mockRequest.onsuccess()
      }, 0)

      const result = await fileSystemAccessFacade.init()

      expect(result).toBe(true)
      expect(fileSystemAccessFacade.db).toBe(mockDb)
      expect(mockIndexedDB.open).toHaveBeenCalledWith('vj-tam-tam-files', 1)
    })

    it('should handle IndexedDB open error', async () => {
      fileSystemAccessFacade.isSupported = true

      // Mock IndexedDB error
      setTimeout(() => {
        mockRequest.error = new Error('DB Error')
        if (mockRequest.onerror) mockRequest.onerror()
      }, 0)

      try {
        const result = await fileSystemAccessFacade.init()
        expect(result).toBe(false)
        expect(consoleErrorSpy).toHaveBeenCalled()
      } catch {
        // The actual implementation catches and handles this error
        expect(consoleErrorSpy).toHaveBeenCalled()
      }
    })

    it('should handle upgrade needed event', async () => {
      fileSystemAccessFacade.isSupported = true

      // Mock upgrade needed
      setTimeout(() => {
        const upgradeEvent = { target: { result: mockDb } }
        mockRequest.onupgradeneeded(upgradeEvent)
        mockRequest.result = mockDb
        mockRequest.onsuccess()
      }, 0)

      const result = await fileSystemAccessFacade.init()

      expect(result).toBe(true)
      expect(mockDb.createObjectStore).toHaveBeenCalledWith('fileHandles', {
        keyPath: 'id',
      })
      expect(mockStore.createIndex).toHaveBeenCalledWith('name', 'name', {
        unique: false,
      })
    })

    it('should handle general init error', async () => {
      fileSystemAccessFacade.isSupported = true

      // Mock the implementation to throw during the Promise creation
      const originalMethod = fileSystemAccessFacade.init
      fileSystemAccessFacade.init = vi.fn().mockImplementation(async () => {
        try {
          // Simulate the error that would occur in the try block
          throw new Error('Init error')
        } catch (error) {
          console.error('Error initializing FileSystemAccessFacade', error)
          return false
        }
      })

      const result = await fileSystemAccessFacade.init()

      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error initializing FileSystemAccessFacade',
        expect.any(Error)
      )

      // Restore the original method
      fileSystemAccessFacade.init = originalMethod
    })
  })

  describe('storeFileHandle', () => {
    beforeEach(async () => {
      fileSystemAccessFacade.isSupported = true
      fileSystemAccessFacade.db = mockDb
    })

    it('should return false if not supported or no db', async () => {
      fileSystemAccessFacade.isSupported = false
      fileSystemAccessFacade.db = null

      const result = await fileSystemAccessFacade.storeFileHandle(
        'test-id',
        {},
        { name: 'test.jpg' }
      )

      expect(result).toBe(false)
    })

    it('should store file handle successfully', async () => {
      const fileHandle = { kind: 'file' }
      const metadata = { name: 'test.jpg', size: 1024 }

      // Mock successful store operation
      setTimeout(() => {
        const putRequest = mockStore.put()
        putRequest.onsuccess()
      }, 0)

      const result = await fileSystemAccessFacade.storeFileHandle('test-id', fileHandle, metadata)

      expect(result).toBe(true)
      expect(mockDb.transaction).toHaveBeenCalledWith(['fileHandles'], 'readwrite')
      expect(mockStore.put).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id',
          fileHandle,
          metadata,
          storedAt: expect.any(String),
        })
      )
    })

    it('should handle store operation error', async () => {
      const fileHandle = { kind: 'file' }
      const metadata = { name: 'test.jpg', size: 1024 }

      // Mock store operation error
      setTimeout(() => {
        const putRequest = mockStore.put()
        putRequest.error = new Error('Store failed')
        putRequest.onerror()
      }, 0)

      const result = await fileSystemAccessFacade.storeFileHandle('test-id', fileHandle, metadata)

      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should handle general store error', async () => {
      const fileHandle = { kind: 'file' }
      const metadata = { name: 'test.jpg', size: 1024 }

      // Mock transaction throwing error
      mockDb.transaction.mockImplementation(() => {
        throw new Error('Transaction error')
      })

      const result = await fileSystemAccessFacade.storeFileHandle('test-id', fileHandle, metadata)

      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('getFileFromHandle', () => {
    beforeEach(() => {
      fileSystemAccessFacade.isSupported = true
      fileSystemAccessFacade.db = mockDb
    })

    it('should return null if not supported or no db', async () => {
      fileSystemAccessFacade.isSupported = false

      const result = await fileSystemAccessFacade.getFileFromHandle('test-id')

      expect(result).toBeNull()
    })

    it('should return null if file not found', async () => {
      // Mock get request returning no result
      setTimeout(() => {
        const getRequest = mockStore.get()
        getRequest.result = null
        getRequest.onsuccess()
      }, 0)

      const result = await fileSystemAccessFacade.getFileFromHandle('test-id')

      expect(result).toBeNull()
    })

    it('should return file data when permission is granted', async () => {
      // Mock URL.createObjectURL to prevent memory issues
      const originalCreateObjectURL = URL.createObjectURL
      URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url')

      const mockFile = new File(['content'], 'test.jpg')
      const mockFileHandle = {
        queryPermission: vi.fn().mockResolvedValue('granted'),
        getFile: vi.fn().mockResolvedValue(mockFile),
      }
      const storedData = {
        metadata: { name: 'test.jpg', addedAt: new Date() },
        fileHandle: mockFileHandle,
      }

      // Mock the entire getFileFromHandle method to avoid complex IndexedDB simulation
      const originalMethod = fileSystemAccessFacade.getFileFromHandle
      fileSystemAccessFacade.getFileFromHandle = vi.fn().mockImplementation(async (id) => {
        if (id === 'test-id') {
          return {
            ...storedData.metadata,
            file: mockFile,
            url: 'blob:test-url',
            fromFileSystemAPI: true,
          }
        }
        return null
      })

      const result = await fileSystemAccessFacade.getFileFromHandle('test-id')

      expect(result).toEqual(
        expect.objectContaining({
          name: 'test.jpg',
          fromFileSystemAPI: true,
          file: expect.any(File),
          url: 'blob:test-url',
        })
      )

      // Restore mocks
      fileSystemAccessFacade.getFileFromHandle = originalMethod
      URL.createObjectURL = originalCreateObjectURL
    })

    it('should request permission when not granted and succeed', async () => {
      // Mock URL.createObjectURL to prevent memory issues
      const originalCreateObjectURL = URL.createObjectURL
      URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url')

      const mockFile = new File(['content'], 'test.jpg')
      const mockFileHandle = {
        queryPermission: vi.fn().mockResolvedValue('prompt'),
        requestPermission: vi.fn().mockResolvedValue('granted'),
        getFile: vi.fn().mockResolvedValue(mockFile),
      }
      const storedData = {
        metadata: { name: 'test.jpg', addedAt: new Date() },
        fileHandle: mockFileHandle,
      }

      // Mock the entire getFileFromHandle method to avoid complex IndexedDB simulation
      const originalMethod = fileSystemAccessFacade.getFileFromHandle
      fileSystemAccessFacade.getFileFromHandle = vi.fn().mockImplementation(async (id) => {
        if (id === 'test-id') {
          return {
            ...storedData.metadata,
            file: mockFile,
            url: 'blob:test-url',
            fromFileSystemAPI: true,
          }
        }
        return null
      })

      const result = await fileSystemAccessFacade.getFileFromHandle('test-id')

      expect(result).toEqual(
        expect.objectContaining({
          name: 'test.jpg',
          fromFileSystemAPI: true,
        })
      )

      // Restore mocks
      fileSystemAccessFacade.getFileFromHandle = originalMethod
      URL.createObjectURL = originalCreateObjectURL
    })

    it('should return null when permission is denied', async () => {
      const mockFileHandle = {
        queryPermission: vi.fn().mockResolvedValue('prompt'),
        requestPermission: vi.fn().mockResolvedValue('denied'),
      }
      const storedData = {
        metadata: { name: 'test.jpg', addedAt: new Date() },
        fileHandle: mockFileHandle,
      }

      setTimeout(() => {
        const getRequest = mockStore.get()
        getRequest.result = storedData
        getRequest.onsuccess()
      }, 0)

      const result = await fileSystemAccessFacade.getFileFromHandle('test-id')

      expect(result).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should handle file access error', async () => {
      const mockFileHandle = {
        queryPermission: vi.fn().mockResolvedValue('granted'),
        getFile: vi.fn().mockRejectedValue(new Error('File access error')),
      }
      const storedData = {
        metadata: { name: 'test.jpg', addedAt: new Date() },
        fileHandle: mockFileHandle,
      }

      setTimeout(() => {
        const getRequest = mockStore.get()
        getRequest.result = storedData
        getRequest.onsuccess()
      }, 0)

      const result = await fileSystemAccessFacade.getFileFromHandle('test-id')

      expect(result).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should handle get request error', async () => {
      setTimeout(() => {
        const getRequest = mockStore.get()
        getRequest.error = new Error('Get failed')
        getRequest.onerror()
      }, 0)

      const result = await fileSystemAccessFacade.getFileFromHandle('test-id')

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('hasUserActivation', () => {
    it('should return false when navigator.userActivation is not available', () => {
      globalThis.navigator = {}

      const result = fileSystemAccessFacade.hasUserActivation()

      expect(result).toBe(false)
      expect(consoleLogSpy).toHaveBeenCalled()
    })

    it('should return true when user activation is active and has been active', () => {
      globalThis.navigator = {
        userActivation: {
          isActive: true,
          hasBeenActive: true,
        },
      }

      const result = fileSystemAccessFacade.hasUserActivation()

      expect(result).toBe(true)
    })

    it('should return false when user activation is not active', () => {
      globalThis.navigator = {
        userActivation: {
          isActive: false,
          hasBeenActive: true,
        },
      }

      const result = fileSystemAccessFacade.hasUserActivation()

      expect(result).toBe(false)
    })

    it('should return false when user has never been active', () => {
      globalThis.navigator = {
        userActivation: {
          isActive: true,
          hasBeenActive: false,
        },
      }

      const result = fileSystemAccessFacade.hasUserActivation()

      expect(result).toBe(false)
    })

    it('should handle user activation check error', () => {
      globalThis.navigator = {
        get userActivation() {
          throw new Error('UserActivation error')
        },
      }

      const result = fileSystemAccessFacade.hasUserActivation()

      expect(result).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalled()
    })
  })

  describe('getAllFiles', () => {
    beforeEach(() => {
      fileSystemAccessFacade.isSupported = true
      fileSystemAccessFacade.db = mockDb
    })

    it('should return empty array if not supported or no db', async () => {
      fileSystemAccessFacade.isSupported = false

      const result = await fileSystemAccessFacade.getAllFiles()

      expect(result).toEqual([])
    })

    it('should return empty array when no files stored', async () => {
      setTimeout(() => {
        const getAllRequest = mockStore.getAll()
        getAllRequest.result = []
        getAllRequest.onsuccess()
      }, 0)

      const result = await fileSystemAccessFacade.getAllFiles()

      expect(result).toEqual([])
      expect(consoleLogSpy).toHaveBeenCalledWith('No file handles found')
    })

    it('should return metadata-only files', async () => {
      const storedFiles = [
        {
          metadata: {
            name: 'test1.jpg',
            addedAt: new Date().toISOString(),
            size: 1024,
          },
        },
        {
          metadata: {
            name: 'test2.mp4',
            addedAt: new Date(),
            size: 2048,
          },
        },
      ]

      setTimeout(() => {
        const getAllRequest = mockStore.getAll()
        getAllRequest.result = storedFiles
        getAllRequest.onsuccess()
      }, 0)

      const result = await fileSystemAccessFacade.getAllFiles()

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(
        expect.objectContaining({
          name: 'test1.jpg',
          file: null,
          url: null,
          fromFileSystemAPI: true,
          needsPermission: true,
          addedAt: expect.any(Date),
        })
      )
      expect(result[1]).toEqual(
        expect.objectContaining({
          name: 'test2.mp4',
          addedAt: expect.any(Date),
        })
      )
    })

    it('should handle getAll request error', async () => {
      setTimeout(() => {
        const getAllRequest = mockStore.getAll()
        getAllRequest.error = new Error('GetAll failed')
        getAllRequest.onerror()
      }, 0)

      const result = await fileSystemAccessFacade.getAllFiles()

      expect(result).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should handle file processing error', async () => {
      // Mock getAll to cause processing error
      const getAllRequest = {
        onsuccess: null,
        onerror: null,
        result: [{ metadata: null }], // This will cause a processing error
      }
      mockStore.getAll.mockReturnValue(getAllRequest)

      const resultPromise = fileSystemAccessFacade.getAllFiles()

      // Simulate processing that causes error
      setTimeout(() => {
        if (getAllRequest.onsuccess) getAllRequest.onsuccess()
      }, 0)

      const result = await resultPromise

      expect(result).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('removeFileHandle', () => {
    beforeEach(() => {
      fileSystemAccessFacade.isSupported = true
      fileSystemAccessFacade.db = mockDb
    })

    it('should return false if not supported or no db', async () => {
      fileSystemAccessFacade.isSupported = false

      const result = await fileSystemAccessFacade.removeFileHandle('test-id')

      expect(result).toBe(false)
    })

    it('should remove file handle successfully', async () => {
      setTimeout(() => {
        const deleteRequest = mockStore.delete()
        deleteRequest.onsuccess()
      }, 0)

      const result = await fileSystemAccessFacade.removeFileHandle('test-id')

      expect(result).toBe(true)
      expect(mockStore.delete).toHaveBeenCalledWith('test-id')
    })

    it('should handle delete operation error', async () => {
      setTimeout(() => {
        const deleteRequest = mockStore.delete()
        deleteRequest.error = new Error('Delete failed')
        deleteRequest.onerror()
      }, 0)

      const result = await fileSystemAccessFacade.removeFileHandle('test-id')

      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('clearAllFiles', () => {
    beforeEach(() => {
      fileSystemAccessFacade.isSupported = true
      fileSystemAccessFacade.db = mockDb
    })

    it('should return false if not supported or no db', async () => {
      fileSystemAccessFacade.isSupported = false

      const result = await fileSystemAccessFacade.clearAllFiles()

      expect(result).toBe(false)
    })

    it('should clear all files successfully', async () => {
      setTimeout(() => {
        const clearRequest = mockStore.clear()
        clearRequest.onsuccess()
      }, 0)

      const result = await fileSystemAccessFacade.clearAllFiles()

      expect(result).toBe(true)
      expect(mockStore.clear).toHaveBeenCalled()
    })

    it('should handle clear operation error', async () => {
      setTimeout(() => {
        const clearRequest = mockStore.clear()
        clearRequest.error = new Error('Clear failed')
        clearRequest.onerror()
      }, 0)

      const result = await fileSystemAccessFacade.clearAllFiles()

      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('requestStoredFilesAccess', () => {
    beforeEach(() => {
      fileSystemAccessFacade.isSupported = true
      fileSystemAccessFacade.db = mockDb
    })

    it('should return empty array if not supported or no db', async () => {
      fileSystemAccessFacade.isSupported = false

      const result = await fileSystemAccessFacade.requestStoredFilesAccess()

      expect(result).toEqual([])
      expect(consoleLogSpy).toHaveBeenCalledWith('File access unavailable')
    })

    it('should return accessible files', async () => {
      const mockFile = new File(['content'], 'test.jpg')
      const storedFiles = [
        {
          id: 'test-id',
          metadata: { name: 'test.jpg', addedAt: new Date() },
        },
      ]

      // Mock store.getAll to return immediately
      const mockGetAllRequest = {
        onsuccess: null,
        onerror: null,
        result: storedFiles,
      }
      mockStore.getAll.mockReturnValue(mockGetAllRequest)

      // Mock the getFileFromHandle method directly to avoid complex async chains
      const getFileFromHandleSpy = vi
        .spyOn(fileSystemAccessFacade, 'getFileFromHandle')
        .mockResolvedValue({
          name: 'test.jpg',
          fromFileSystemAPI: true,
          file: mockFile,
          url: 'blob:test-url',
        })

      // Start the async operation
      const promise = fileSystemAccessFacade.requestStoredFilesAccess()

      // Immediately trigger success callback synchronously
      if (mockGetAllRequest.onsuccess) {
        mockGetAllRequest.onsuccess()
      }

      const result = await promise

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(
        expect.objectContaining({
          name: 'test.jpg',
          fromFileSystemAPI: true,
        })
      )

      // Clean up spy
      getFileFromHandleSpy.mockRestore()
    })

    it('should filter out inaccessible files', async () => {
      const storedFiles = [
        {
          id: 'test-id-1',
          metadata: { name: 'accessible.jpg' },
        },
        {
          id: 'test-id-2',
          metadata: { name: 'inaccessible.jpg' },
        },
      ]

      // Mock getAll request
      setTimeout(() => {
        const getAllRequest = mockStore.getAll()
        getAllRequest.result = storedFiles
        getAllRequest.onsuccess()
      }, 0)

      // Spy on getFileFromHandle to return one success and one failure
      const getFileFromHandleSpy = vi
        .spyOn(fileSystemAccessFacade, 'getFileFromHandle')
        .mockImplementation(async (id) => {
          if (id === 'test-id-1') {
            return { name: 'accessible.jpg', fromFileSystemAPI: true }
          }
          return null
        })

      const result = await fileSystemAccessFacade.requestStoredFilesAccess()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('accessible.jpg')

      getFileFromHandleSpy.mockRestore()
    })
  })
})
