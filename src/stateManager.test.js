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

/**
 * Helper function to create mock media items for testing
 */
function createMockMediaItem(name, size = 1000) {
  return {
    id: `mock_${Math.random().toString(36).substr(2, 9)}`,
    name,
    type: name.includes('.mp4') ? 'video' : 'image',
    mimeType: name.includes('.mp4') ? 'video/mp4' : 'image/jpeg',
    size,
    file: new File([''], name),
    url: `blob:mock-${name}`,
    addedAt: new Date(),
    fromFileSystemAPI: false,
  }
}

describe('StateManager', () => {
  beforeEach(() => {
    // Reset state manually instead of calling clearMediaPool to avoid URL.revokeObjectURL calls
    // Include complete default state structure
    stateManager.state = {
      mediaPool: [],
      segmentSettings: {
        minDuration: 5,
        maxDuration: 5,
        skipStart: 0,
        skipEnd: 0,
      },
    }
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

    it('should start with default segment settings', () => {
      const segmentSettings = stateManager.getSegmentSettings()
      expect(segmentSettings).toEqual({
        minDuration: 5,
        maxDuration: 5,
        skipStart: 0,
        skipEnd: 0,
      })
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
            addedAt: '2025-06-05T07:06:59.457Z',
            fromFileSystemAPI: true,
          },
          {
            id: 'p2',
            name: 'persisted2.mp4',
            type: 'video',
            mimeType: 'video/mp4',
            size: 200,
            addedAt: '2025-06-05T07:06:59.457Z',
            fromFileSystemAPI: true,
          },
        ],
      }
      storageFacade.loadState.mockReturnValue(persistedState)

      await stateManager.init()

      const mediaPool = stateManager.getMediaPool()
      expect(mediaPool).toHaveLength(2)
      expect(mediaPool[0]).toEqual(
        expect.objectContaining({
          id: 'p1',
          name: 'persisted1.jpg',
          addedAt: expect.any(Date),
        })
      )
    })

    it('should clean up temporary drag & drop files on init and only restore FileSystemAccessAPI files', async () => {
      const persistedState = {
        mediaPool: [
          {
            id: 'persistent',
            name: 'persistent.jpg',
            type: 'image',
            fromFileSystemAPI: true,
          },
          {
            id: 'temp',
            name: 'temp.jpg',
            type: 'image',
            fromFileSystemAPI: false, // drag & drop file
          },
        ],
      }
      storageFacade.loadState.mockReturnValue(persistedState)

      await stateManager.init()

      const mediaPool = stateManager.getMediaPool()
      expect(mediaPool).toHaveLength(1)
      expect(mediaPool[0].id).toBe('persistent')
    })

    it('should not load state on init if no persisted state is available', async () => {
      storageFacade.loadState.mockReturnValue(null)

      await stateManager.init()

      const mediaPool = stateManager.getMediaPool()
      expect(mediaPool).toHaveLength(0)
    })

    it('should not load state on init if persisted media pool is empty', async () => {
      storageFacade.loadState.mockReturnValue({ mediaPool: [] })

      await stateManager.init()

      const mediaPool = stateManager.getMediaPool()
      expect(mediaPool).toHaveLength(0)
    })

    it('should handle storageFacade.loadState errors gracefully on init', async () => {
      // Mock storageFacade.loadState to throw an error
      storageFacade.loadState.mockImplementation(() => {
        throw new Error('localStorage read error')
      })

      // Should not throw - errors should be caught and logged
      await expect(stateManager.init()).resolves.not.toThrow()

      // Media pool should remain empty
      const mediaPool = stateManager.getMediaPool()
      expect(mediaPool).toHaveLength(0)
    })
  })

  describe('persistence integration (save)', () => {
    it('should save state when media pool is updated', async () => {
      // Initialize first
      await stateManager.init()

      // Add media items
      const mockItems = [createMockMediaItem('test1.jpg'), createMockMediaItem('test2.mp4')]
      stateManager.addMediaToPool(mockItems)

      // Should have been called: once during addMediaToPool which triggers save
      expect(storageFacade.saveState).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaPool: expect.arrayContaining([
            expect.objectContaining({ name: 'test1.jpg' }),
            expect.objectContaining({ name: 'test2.mp4' }),
          ]),
          segmentSettings: {
            minDuration: 5,
            maxDuration: 5,
            skipStart: 0,
            skipEnd: 0,
          },
        })
      )
    })
  })

  describe('addMediaToPool', () => {
    it('should add media items to empty pool', () => {
      const mockItems = [createMockMediaItem('test1.jpg'), createMockMediaItem('test2.mp4')]

      stateManager.addMediaToPool(mockItems)

      const mediaPool = stateManager.getMediaPool()
      expect(mediaPool).toHaveLength(2)
      expect(mediaPool[0].name).toBe('test1.jpg')
      expect(mediaPool[1].name).toBe('test2.mp4')
    })

    it('should add new media items to existing pool (additive behavior)', () => {
      // Add initial items
      const initialItems = [createMockMediaItem('existing.jpg')]
      stateManager.addMediaToPool(initialItems)

      // Add more items
      const newItems = [createMockMediaItem('new1.jpg'), createMockMediaItem('new2.mp4')]
      stateManager.addMediaToPool(newItems)

      const mediaPool = stateManager.getMediaPool()
      expect(mediaPool).toHaveLength(3)
      expect(mediaPool.map((item) => item.name)).toEqual(['existing.jpg', 'new1.jpg', 'new2.mp4'])
    })

    it('should filter out duplicate files based on name and size', () => {
      const mockItem1 = createMockMediaItem('test.jpg', 100) // size: 100
      const mockItem2 = createMockMediaItem('test.jpg', 100) // duplicate

      stateManager.addMediaToPool([mockItem1])
      stateManager.addMediaToPool([mockItem2])

      const mediaPool = stateManager.getMediaPool()
      expect(mediaPool).toHaveLength(1) // Should only have one
    })

    it('should upgrade metadata-only files when re-added with actual File objects', () => {
      // Create metadata-only item (no file or url)
      const metadataOnlyItem = {
        id: 'test-id',
        name: 'restored.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 100,
        addedAt: new Date(),
        fromFileSystemAPI: true,
        file: null, // metadata-only
        url: null, // metadata-only
      }

      stateManager.state.mediaPool = [metadataOnlyItem]

      // Now add the same file with actual File object
      const fileWithData = createMockMediaItem('restored.jpg', 100)
      stateManager.addMediaToPool([fileWithData])

      const mediaPool = stateManager.getMediaPool()
      expect(mediaPool).toHaveLength(1) // Should still be one item
      expect(mediaPool[0].file).toBeTruthy() // Should now have file
      expect(mediaPool[0].url).toBeTruthy() // Should now have url
      expect(mediaPool[0].id).toBe('test-id') // Should keep original ID
    })

    it('should handle invalid input gracefully', () => {
      console.warn = vi.fn()

      stateManager.addMediaToPool(null)
      stateManager.addMediaToPool('invalid')
      stateManager.addMediaToPool(123)

      expect(console.warn).toHaveBeenCalledTimes(3)
      expect(stateManager.getMediaPool()).toHaveLength(0)
    })
  })

  describe('removeMediaFromPool', () => {
    it('should remove media item by ID and emit event', () => {
      const mockItems = [createMockMediaItem('test1.jpg'), createMockMediaItem('test2.mp4')]
      stateManager.addMediaToPool(mockItems)

      const itemToRemove = stateManager.getMediaPool()[0]
      stateManager.removeMediaFromPool(itemToRemove.id)

      const mediaPool = stateManager.getMediaPool()
      expect(mediaPool).toHaveLength(1)
      expect(mediaPool[0].name).toBe('test2.mp4')

      expect(eventBus.emit).toHaveBeenCalledWith('media.fileRemoved', {
        id: itemToRemove.id,
        name: itemToRemove.name,
        totalCount: 1,
      })
    })

    it('should handle removal of non-existent item gracefully', () => {
      stateManager.removeMediaFromPool('non-existent-id')

      // Should not throw or crash
      expect(stateManager.getMediaPool()).toHaveLength(0)
    })
  })

  describe('clearMediaPool', () => {
    it('should clear all media items and emit event', () => {
      const mockItems = [createMockMediaItem('test1.jpg'), createMockMediaItem('test2.mp4')]
      stateManager.addMediaToPool(mockItems)

      stateManager.clearMediaPool()

      expect(stateManager.getMediaPool()).toHaveLength(0)
      expect(eventBus.emit).toHaveBeenCalledWith('media.poolCleared', { totalCount: 0 })
    })
  })

  describe('getMediaById', () => {
    it('should return media item by ID', () => {
      const mockItems = [createMockMediaItem('test1.jpg'), createMockMediaItem('test2.mp4')]
      stateManager.addMediaToPool(mockItems)

      const mediaPool = stateManager.getMediaPool()
      const firstItemId = mediaPool[0].id
      const foundItem = stateManager.getMediaById(firstItemId)

      expect(foundItem).toEqual(mediaPool[0])
    })

    it('should return null for non-existent ID', () => {
      const foundItem = stateManager.getMediaById('non-existent-id')
      expect(foundItem).toBeNull()
    })
  })

  describe('segment settings', () => {
    describe('getSegmentSettings', () => {
      it('should return current segment settings', () => {
        const settings = stateManager.getSegmentSettings()

        expect(settings).toEqual({
          minDuration: 5,
          maxDuration: 5,
          skipStart: 0,
          skipEnd: 0,
        })
      })

      it('should return a copy to prevent external mutation', () => {
        const settings = stateManager.getSegmentSettings()
        settings.minDuration = 10

        const settingsAgain = stateManager.getSegmentSettings()
        expect(settingsAgain.minDuration).toBe(5) // Should not be affected
      })
    })

    describe('updateSegmentSettings', () => {
      it('should update valid segment settings', () => {
        const newSettings = {
          minDuration: 3,
          maxDuration: 8,
          skipStart: 2,
          skipEnd: 1,
        }

        stateManager.updateSegmentSettings(newSettings)

        const updatedSettings = stateManager.getSegmentSettings()
        expect(updatedSettings).toEqual(newSettings)
      })

      it('should support partial updates', () => {
        stateManager.updateSegmentSettings({ minDuration: 10 })

        const settings = stateManager.getSegmentSettings()
        expect(settings.minDuration).toBe(10)
        expect(settings.maxDuration).toBe(5) // Should remain unchanged
        expect(settings.skipStart).toBe(0) // Should remain unchanged
        expect(settings.skipEnd).toBe(0) // Should remain unchanged
      })

      it('should validate duration ranges (1-30 seconds)', () => {
        // Valid values
        stateManager.updateSegmentSettings({ minDuration: 1, maxDuration: 30 })
        let settings = stateManager.getSegmentSettings()
        expect(settings.minDuration).toBe(1)
        expect(settings.maxDuration).toBe(30)

        // Invalid values should be ignored
        stateManager.updateSegmentSettings({ minDuration: 0, maxDuration: 31 })
        settings = stateManager.getSegmentSettings()
        expect(settings.minDuration).toBe(1) // Should remain unchanged
        expect(settings.maxDuration).toBe(30) // Should remain unchanged
      })

      it('should validate skip values (0+ seconds)', () => {
        // Valid values
        stateManager.updateSegmentSettings({ skipStart: 0, skipEnd: 100 })
        let settings = stateManager.getSegmentSettings()
        expect(settings.skipStart).toBe(0)
        expect(settings.skipEnd).toBe(100)

        // Invalid negative values should be ignored
        stateManager.updateSegmentSettings({ skipStart: -1, skipEnd: -5 })
        settings = stateManager.getSegmentSettings()
        expect(settings.skipStart).toBe(0) // Should remain unchanged
        expect(settings.skipEnd).toBe(100) // Should remain unchanged
      })

      it('should ignore invalid data types', () => {
        const originalSettings = stateManager.getSegmentSettings()

        stateManager.updateSegmentSettings({
          minDuration: 'invalid',
          maxDuration: null,
          skipStart: undefined,
          skipEnd: {},
        })

        const settings = stateManager.getSegmentSettings()
        expect(settings).toEqual(originalSettings) // Should remain unchanged
      })

      it('should save state after successful update', () => {
        stateManager.updateSegmentSettings({ minDuration: 7 })

        expect(storageFacade.saveState).toHaveBeenCalledWith(
          expect.objectContaining({
            segmentSettings: expect.objectContaining({
              minDuration: 7,
            }),
          })
        )
      })

      it('should emit segmentSettingsUpdated event', () => {
        const newSettings = { minDuration: 8, maxDuration: 12 }
        stateManager.updateSegmentSettings(newSettings)

        expect(eventBus.emit).toHaveBeenCalledWith('state.segmentSettingsUpdated', {
          segmentSettings: expect.objectContaining({
            minDuration: 8,
            maxDuration: 12,
          }),
        })
      })

      it('should handle invalid input gracefully', () => {
        console.warn = vi.fn()

        // Capture current state before invalid calls
        const currentSettings = stateManager.getSegmentSettings()

        stateManager.updateSegmentSettings(null)
        expect(console.warn).toHaveBeenCalledWith(
          'Invalid segment settings provided - must be a valid object'
        )

        stateManager.updateSegmentSettings('invalid')
        expect(console.warn).toHaveBeenCalledTimes(2)

        // Settings should remain unchanged from what they were before
        const settings = stateManager.getSegmentSettings()
        expect(settings).toEqual(currentSettings)
      })
    })

    describe('segment settings persistence', () => {
      it('should restore segment settings from localStorage on init', async () => {
        const persistedState = {
          mediaPool: [],
          segmentSettings: {
            minDuration: 3,
            maxDuration: 15,
            skipStart: 5,
            skipEnd: 2,
          },
        }
        storageFacade.loadState.mockReturnValue(persistedState)

        // Spy on console.log to verify restoration message
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

        await stateManager.init()

        const settings = stateManager.getSegmentSettings()
        expect(settings).toEqual({
          minDuration: 3,
          maxDuration: 15,
          skipStart: 5,
          skipEnd: 2,
        })

        expect(consoleLogSpy).toHaveBeenCalledWith('Segment settings restored from localStorage')

        consoleLogSpy.mockRestore()
      })

      it('should use defaults if no segment settings in localStorage', async () => {
        const persistedState = {
          mediaPool: [],
          // No segmentSettings property
        }
        storageFacade.loadState.mockReturnValue(persistedState)

        await stateManager.init()

        const settings = stateManager.getSegmentSettings()
        expect(settings).toEqual({
          minDuration: 5,
          maxDuration: 5,
          skipStart: 0,
          skipEnd: 0,
        })
      })

      it('should merge persisted settings with defaults', async () => {
        const persistedState = {
          mediaPool: [],
          segmentSettings: {
            minDuration: 10,
            // Missing maxDuration, skipStart, skipEnd
          },
        }
        storageFacade.loadState.mockReturnValue(persistedState)

        await stateManager.init()

        const settings = stateManager.getSegmentSettings()
        expect(settings).toEqual({
          minDuration: 10, // From persisted state
          maxDuration: 5, // From defaults
          skipStart: 0, // From defaults
          skipEnd: 0, // From defaults
        })
      })

      it('should include segment settings in saved state', () => {
        stateManager.updateSegmentSettings({ minDuration: 7, maxDuration: 14 })

        expect(storageFacade.saveState).toHaveBeenCalledWith(
          expect.objectContaining({
            segmentSettings: {
              minDuration: 7,
              maxDuration: 14,
              skipStart: 0,
              skipEnd: 0,
            },
          })
        )
      })
    })
  })
})
