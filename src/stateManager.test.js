/**
 * Unit tests for StateManager module
 * Tests additive media pool behavior and state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { eventBus } from './eventBus.js'
import { stateManager } from './stateManager.js'
import { storageFacade } from './facades/storageFacade.js'

// Mock eventBus
vi.mock('./eventBus.js', () => ({
  eventBus: {
    emit: vi.fn(),
    on: vi.fn(), // Add mock for on method
  },
}))

// Mock storageFacade
vi.mock('./facades/storageFacade.js', () => ({
  storageFacade: {
    loadState: vi.fn(),
    saveState: vi.fn(),
  },
}))

// Mock fileSystemAccessFacade
vi.mock('./facades/fileSystemAccessFacade.js', () => ({
  fileSystemAccessFacade: {
    init: vi.fn().mockResolvedValue(false),
    isSupported: false,
    getAllFiles: vi.fn().mockResolvedValue([]),
    storeFileHandle: vi.fn().mockResolvedValue(true),
    removeFileHandle: vi.fn().mockResolvedValue(true),
    clearAllFiles: vi.fn().mockResolvedValue(true),
  },
}))

// Mock URL for test environment
globalThis.URL = globalThis.URL || {}
globalThis.URL.revokeObjectURL = vi.fn()
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')

describe('StateManager', () => {
  beforeEach(() => {
    // Reset state manually instead of calling clearMediaPool to avoid URL.revokeObjectURL calls
    stateManager.state = { mediaPool: [] }
    vi.clearAllMocks()

    // Reset mocks for storageFacade
    storageFacade.loadState.mockReset()
    storageFacade.saveState.mockReset()

    // Reset eventBus.on mock as listeners are set up in init
    eventBus.on.mockReset()
  })

  describe('initial state', () => {
    it('should start with empty media pool', () => {
      expect(stateManager.getMediaPool()).toEqual([])
      expect(stateManager.getMediaCount()).toBe(0)
      expect(stateManager.isMediaPoolEmpty()).toBe(true)
    })
  })

  describe('persistence integration (init)', () => {
    it('should load state from localStorage on init if available', async () => {
      const persistedState = {
        mediaPool: [
          {
            id: 'p1',
            name: 'persisted1.jpg',
            type: 'image',
            mimeType: 'image/jpeg',
            size: 100,
            addedAt: new Date().toISOString(),
            fromFileSystemAPI: true, // Mark as FileSystemAccessAPI file
          },
          {
            id: 'p2',
            name: 'persisted2.mp4',
            type: 'video',
            mimeType: 'video/mp4',
            size: 200,
            addedAt: new Date().toISOString(),
            fromFileSystemAPI: true, // Mark as FileSystemAccessAPI file
          },
        ],
      }
      storageFacade.loadState.mockReturnValue(persistedState)

      await stateManager.init()

      expect(storageFacade.loadState).toHaveBeenCalled()
      const mediaPool = stateManager.getMediaPool()
      expect(mediaPool).toHaveLength(2)
      expect(mediaPool[0].id).toBe('p1')
      expect(mediaPool[0].name).toBe('persisted1.jpg')
      expect(mediaPool[0].file).toBeNull() // File object should NOT be restored
      expect(mediaPool[0].url).toBeNull() // URL should NOT be restored
      expect(mediaPool[0].addedAt).toBeInstanceOf(Date) // addedAt should be converted back to Date
      expect(mediaPool[1].id).toBe('p2')

      // Should emit mediaPoolRestored event, not mediaPoolUpdated
      expect(eventBus.emit).toHaveBeenCalledWith('state.mediaPoolRestored', {
        mediaPool: expect.any(Array),
        totalCount: 2,
        source: 'localStorage-metadata',
      })
      expect(eventBus.emit).not.toHaveBeenCalledWith('state.mediaPoolUpdated', expect.anything())

      // Should set up listener for state.mediaPoolUpdated to trigger save
      expect(eventBus.on).toHaveBeenCalledWith('state.mediaPoolUpdated', expect.any(Function))
    })

    it('should clean up temporary drag & drop files on init and only restore FileSystemAccessAPI files', async () => {
      const persistedState = {
        mediaPool: [
          {
            id: 'fs1',
            name: 'persistent.jpg',
            type: 'image',
            mimeType: 'image/jpeg',
            size: 100,
            addedAt: new Date().toISOString(),
            fromFileSystemAPI: true, // This should be restored
          },
          {
            id: 'dd1',
            name: 'temporary.mp4',
            type: 'video',
            mimeType: 'video/mp4',
            size: 200,
            addedAt: new Date().toISOString(),
            // No fromFileSystemAPI flag - this should be cleaned up
          },
          {
            id: 'dd2',
            name: 'temporary2.png',
            type: 'image',
            mimeType: 'image/png',
            size: 150,
            addedAt: new Date().toISOString(),
            fromFileSystemAPI: false, // Explicitly false - this should be cleaned up
          },
        ],
      }
      storageFacade.loadState.mockReturnValue(persistedState)

      // Spy on console.log to verify cleanup message
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await stateManager.init()

      expect(storageFacade.loadState).toHaveBeenCalled()
      const mediaPool = stateManager.getMediaPool()

      // Only the FileSystemAccessAPI file should remain
      expect(mediaPool).toHaveLength(1)
      expect(mediaPool[0].id).toBe('fs1')
      expect(mediaPool[0].name).toBe('persistent.jpg')
      expect(mediaPool[0].file).toBeNull()
      expect(mediaPool[0].url).toBeNull()

      // Should log cleanup message
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Cleaned up 2 temporary drag & drop files that cannot be restored'
      )

      // Should emit mediaPoolRestored event
      expect(eventBus.emit).toHaveBeenCalledWith('state.mediaPoolRestored', {
        mediaPool: expect.any(Array),
        totalCount: 1,
        source: 'localStorage-metadata',
      })

      consoleLogSpy.mockRestore()
    })

    it('should not load state on init if no persisted state is available', async () => {
      storageFacade.loadState.mockReturnValue(null)

      await stateManager.init()

      expect(storageFacade.loadState).toHaveBeenCalled()
      expect(stateManager.getMediaPool()).toEqual([])
      expect(stateManager.getMediaCount()).toBe(0)
      expect(eventBus.emit).not.toHaveBeenCalledWith('state.mediaPoolRestored', expect.anything())
      expect(eventBus.emit).not.toHaveBeenCalledWith('state.mediaPoolUpdated', expect.anything())

      // Should still set up listener for state.mediaPoolUpdated
      expect(eventBus.on).toHaveBeenCalledWith('state.mediaPoolUpdated', expect.any(Function))
    })

    it('should not load state on init if persisted media pool is empty', async () => {
      const persistedState = { mediaPool: [] }
      storageFacade.loadState.mockReturnValue(persistedState)

      await stateManager.init()

      expect(storageFacade.loadState).toHaveBeenCalled()
      expect(stateManager.getMediaPool()).toEqual([])
      expect(stateManager.getMediaCount()).toBe(0)
      expect(eventBus.emit).not.toHaveBeenCalledWith('state.mediaPoolRestored', expect.anything())
      expect(eventBus.emit).not.toHaveBeenCalledWith('state.mediaPoolUpdated', expect.anything())

      // Should still set up listener for state.mediaPoolUpdated
      expect(eventBus.on).toHaveBeenCalledWith('state.mediaPoolUpdated', expect.any(Function))
    })

    it('should handle storageFacade.loadState errors gracefully on init', async () => {
      storageFacade.loadState.mockImplementation(() => {
        throw new Error('Failed to read storage')
      })

      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await stateManager.init()

      expect(storageFacade.loadState).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(stateManager.getMediaPool()).toEqual([]) // State should remain empty
      expect(eventBus.emit).not.toHaveBeenCalled() // No events should be emitted due to load error

      // Should still set up listener for state.mediaPoolUpdated
      expect(eventBus.on).toHaveBeenCalledWith('state.mediaPoolUpdated', expect.any(Function))

      consoleErrorSpy.mockRestore()
    })
  })

  describe('persistence integration (save)', () => {
    it('should save state when media pool is updated', async () => {
      await stateManager.init() // Ensure listener is set up

      // Verify that the listener was set up correctly
      expect(eventBus.on).toHaveBeenCalledWith('state.mediaPoolUpdated', expect.any(Function))

      // Get the listener function that was registered
      const listenerCall = eventBus.on.mock.calls.find(
        (call) => call[0] === 'state.mediaPoolUpdated'
      )
      const saveStateListener = listenerCall[1]

      vi.clearAllMocks() // Clear mocks after init listener setup

      const mediaItems = [
        {
          id: 'media_1',
          name: 'test1.jpg',
          type: 'image',
          mimeType: 'image/jpeg',
          size: 1000,
          file: new File([''], 'test1.jpg'),
          url: 'blob:test1',
          addedAt: new Date(),
        },
      ]

      stateManager.addMediaToPool(mediaItems)

      // Since the actual eventBus is mocked, we need to manually trigger the listener
      // to simulate what would happen when the event is emitted
      saveStateListener()

      // Verify storageFacade.saveState was called
      expect(storageFacade.saveState).toHaveBeenCalledTimes(1)

      // Verify the data structure passed to saveState
      const savedState = storageFacade.saveState.mock.calls[0][0]
      expect(savedState).toHaveProperty('mediaPool')
      expect(savedState.mediaPool).toHaveLength(1)
      expect(savedState.mediaPool[0]).toEqual({
        id: 'media_1',
        name: 'test1.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 1000,
        addedAt: expect.any(String), // Should be ISO string
      })
      expect(savedState.mediaPool[0]).not.toHaveProperty('file') // Should not save File object
      expect(savedState.mediaPool[0]).not.toHaveProperty('url') // Should not save URL
    })
  })

  describe('addMediaToPool', () => {
    it('should add media items to empty pool', () => {
      const mediaItems = [
        {
          id: 'media_1',
          name: 'test1.jpg',
          type: 'image',
          mimeType: 'image/jpeg',
          size: 1000,
          file: new File([''], 'test1.jpg'),
          url: 'blob:test1',
          addedAt: new Date(),
        },
        {
          id: 'media_2',
          name: 'test2.mp4',
          type: 'video',
          mimeType: 'video/mp4',
          size: 2000,
          file: new File([''], 'test2.mp4'),
          url: 'blob:test2',
          addedAt: new Date(),
        },
      ]

      stateManager.addMediaToPool(mediaItems)

      expect(stateManager.getMediaPool()).toHaveLength(2)
      expect(stateManager.getMediaCount()).toBe(2)
      expect(stateManager.isMediaPoolEmpty()).toBe(false)
      expect(eventBus.emit).toHaveBeenCalledWith('state.mediaPoolUpdated', {
        mediaPool: expect.any(Array),
        addedItems: mediaItems,
        upgradedItems: [],
        totalCount: 2,
      })
    })

    it('should add new media items to existing pool (additive behavior)', () => {
      // Add initial items
      const initialItems = [
        {
          id: 'media_1',
          name: 'existing.jpg',
          type: 'image',
          mimeType: 'image/jpeg',
          size: 1000,
          file: new File([''], 'existing.jpg'),
          url: 'blob:existing',
          addedAt: new Date(),
        },
      ]
      stateManager.addMediaToPool(initialItems)

      // Add new items
      const newItems = [
        {
          id: 'media_2',
          name: 'new1.mp4',
          type: 'video',
          mimeType: 'video/mp4',
          size: 2000,
          file: new File([''], 'new1.mp4'),
          url: 'blob:new1',
          addedAt: new Date(),
        },
        {
          id: 'media_3',
          name: 'new2.png',
          type: 'image',
          mimeType: 'image/png',
          size: 1500,
          file: new File([''], 'new2.png'),
          url: 'blob:new2',
          addedAt: new Date(),
        },
      ]
      stateManager.addMediaToPool(newItems)

      expect(stateManager.getMediaCount()).toBe(3)
      const mediaPool = stateManager.getMediaPool()
      expect(mediaPool[0].name).toBe('existing.jpg')
      expect(mediaPool[1].name).toBe('new1.mp4')
      expect(mediaPool[2].name).toBe('new2.png')
    })

    it('should filter out duplicate files based on name and size', () => {
      // Add initial items
      const initialItems = [
        {
          id: 'media_1',
          name: 'test.jpg',
          type: 'image',
          mimeType: 'image/jpeg',
          size: 1000,
          file: new File([''], 'test.jpg'),
          url: 'blob:test1',
          addedAt: new Date(),
        },
      ]
      stateManager.addMediaToPool(initialItems)

      // Try to add duplicate and new items
      const newItems = [
        {
          id: 'media_2',
          name: 'test.jpg', // Same name and size as existing
          type: 'image',
          mimeType: 'image/jpeg',
          size: 1000,
          file: new File([''], 'test.jpg'),
          url: 'blob:test2',
          addedAt: new Date(),
        },
        {
          id: 'media_3',
          name: 'new.png',
          type: 'image',
          mimeType: 'image/png',
          size: 1500,
          file: new File([''], 'new.png'),
          url: 'blob:new',
          addedAt: new Date(),
        },
      ]
      stateManager.addMediaToPool(newItems)

      expect(stateManager.getMediaCount()).toBe(2) // Only one new item added
      const mediaPool = stateManager.getMediaPool()
      expect(mediaPool.find((item) => item.name === 'test.jpg')).toBeTruthy()
      expect(mediaPool.find((item) => item.name === 'new.png')).toBeTruthy()
    })

    it('should upgrade metadata-only files when re-added with actual File objects', () => {
      // Add metadata-only item (simulating restored from localStorage)
      const metadataOnlyItem = {
        id: 'media_1',
        name: 'restored.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 1000,
        file: null, // No actual file
        url: null, // No URL
        addedAt: new Date(),
      }
      stateManager.state.mediaPool = [metadataOnlyItem] // Direct assignment to simulate restoration

      // Try to add the same file with actual File object
      const upgradeItems = [
        {
          id: 'media_2',
          name: 'restored.jpg', // Same name and size
          type: 'image',
          mimeType: 'image/jpeg',
          size: 1000,
          file: new File([''], 'restored.jpg'),
          url: 'blob:restored',
          addedAt: new Date(),
        },
      ]

      stateManager.addMediaToPool(upgradeItems)

      expect(stateManager.getMediaCount()).toBe(1) // Still only one item
      const upgradedItem = stateManager.getMediaById('media_1')
      expect(upgradedItem.file).toBeTruthy() // Now has File object
      expect(upgradedItem.url).toBe('blob:restored') // Now has URL
      expect(upgradedItem.id).toBe('media_1') // Kept original ID

      // Check event was emitted with upgrade info
      expect(eventBus.emit).toHaveBeenCalledWith('state.mediaPoolUpdated', {
        mediaPool: expect.any(Array),
        addedItems: [],
        upgradedItems: [
          expect.objectContaining({
            id: 'media_1',
            name: 'restored.jpg',
            file: expect.any(File),
            url: 'blob:restored',
          }),
        ],
        totalCount: 1,
      })
    })

    it('should handle invalid input gracefully', () => {
      console.warn = vi.fn()

      stateManager.addMediaToPool(null)
      expect(console.warn).toHaveBeenCalledWith(
        'StateManager.addMediaToPool: newMediaItems must be an array'
      )
      expect(stateManager.getMediaCount()).toBe(0)

      stateManager.addMediaToPool('not an array')
      expect(console.warn).toHaveBeenCalledTimes(2)
      expect(stateManager.getMediaCount()).toBe(0)
    })
  })

  describe('removeMediaFromPool', () => {
    it('should remove media item by ID and emit event', () => {
      const mediaItems = [
        {
          id: 'media_1',
          name: 'test1.jpg',
          type: 'image',
          mimeType: 'image/jpeg',
          size: 1000,
          file: new File([''], 'test1.jpg'),
          url: 'blob:test1',
          addedAt: new Date(),
        },
        {
          id: 'media_2',
          name: 'test2.mp4',
          type: 'video',
          mimeType: 'video/mp4',
          size: 2000,
          file: new File([''], 'test2.mp4'),
          url: 'blob:test2',
          addedAt: new Date(),
        },
      ]
      stateManager.addMediaToPool(mediaItems)

      // Mock URL.revokeObjectURL
      const mockRevokeObjectURL = vi.fn()
      vi.stubGlobal('URL', { revokeObjectURL: mockRevokeObjectURL })

      stateManager.removeMediaFromPool('media_1')

      expect(stateManager.getMediaCount()).toBe(1)
      expect(stateManager.getMediaById('media_1')).toBeNull()
      expect(stateManager.getMediaById('media_2')).toBeTruthy()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test1')
      expect(eventBus.emit).toHaveBeenCalledWith('state.mediaPoolUpdated', {
        mediaPool: expect.any(Array),
        removedItem: expect.objectContaining({ id: 'media_1' }),
        totalCount: 1,
      })
    })

    it('should handle removal of non-existent item gracefully', () => {
      stateManager.removeMediaFromPool('non-existent')
      expect(stateManager.getMediaCount()).toBe(0)
    })
  })

  describe('clearMediaPool', () => {
    it('should clear all media items and emit event', () => {
      const mediaItems = [
        {
          id: 'media_1',
          name: 'test1.jpg',
          type: 'image',
          mimeType: 'image/jpeg',
          size: 1000,
          file: new File([''], 'test1.jpg'),
          url: 'blob:test1',
          addedAt: new Date(),
        },
      ]
      stateManager.addMediaToPool(mediaItems)

      // Mock URL.revokeObjectURL
      const mockRevokeObjectURL = vi.fn()
      vi.stubGlobal('URL', { revokeObjectURL: mockRevokeObjectURL })

      stateManager.clearMediaPool()

      expect(stateManager.getMediaCount()).toBe(0)
      expect(stateManager.isMediaPoolEmpty()).toBe(true)
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test1')
      expect(eventBus.emit).toHaveBeenCalledWith('state.mediaPoolUpdated', {
        mediaPool: [],
        totalCount: 0,
        cleared: true,
      })
    })
  })

  describe('getMediaById', () => {
    it('should return media item by ID', () => {
      const mediaItems = [
        {
          id: 'media_1',
          name: 'test.jpg',
          type: 'image',
          mimeType: 'image/jpeg',
          size: 1000,
          file: new File([''], 'test.jpg'),
          url: 'blob:test',
          addedAt: new Date(),
        },
      ]
      stateManager.addMediaToPool(mediaItems)

      const result = stateManager.getMediaById('media_1')
      expect(result).toBeTruthy()
      expect(result.name).toBe('test.jpg')
    })

    it('should return null for non-existent ID', () => {
      const result = stateManager.getMediaById('non-existent')
      expect(result).toBeNull()
    })
  })
})
