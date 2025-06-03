/**
 * Unit tests for StateManager module
 * Tests additive media pool behavior and state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { eventBus } from './eventBus.js'
import { stateManager } from './stateManager.js'

// Mock eventBus
vi.mock('./eventBus.js', () => ({
  eventBus: {
    emit: vi.fn(),
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
  })

  describe('initial state', () => {
    it('should start with empty media pool', () => {
      expect(stateManager.getMediaPool()).toEqual([])
      expect(stateManager.getMediaCount()).toBe(0)
      expect(stateManager.isMediaPoolEmpty()).toBe(true)
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
