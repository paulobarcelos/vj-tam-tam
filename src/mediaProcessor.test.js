/**
 * Unit tests for MediaProcessor module
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mediaProcessor } from './mediaProcessor.js'
import {
  SUPPORTED_IMAGE_MIMES,
  SUPPORTED_VIDEO_MIMES,
  SUPPORTED_IMAGE_EXTENSIONS,
  SUPPORTED_VIDEO_EXTENSIONS,
} from './constants/mediaTypes.js'
import { t } from './constants/strings.js'
// Import utility functions that were moved from MediaProcessor
import {
  getFileExtension,
  isFileSupported,
  getMediaType,
  getSupportedTypes,
} from './utils/mediaUtils.js'

// Mock the dependencies
vi.mock('./eventBus.js', () => ({
  eventBus: {
    emit: vi.fn(),
  },
}))

vi.mock('./toastManager.js', () => ({
  toastManager: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('./stateManager.js', () => ({
  stateManager: {
    getMediaPool: vi.fn(() => []),
    addMediaToPool: vi.fn(),
    removeMediaFromPool: vi.fn(),
    clearMediaPool: vi.fn(),
  },
}))

// Mock URL.revokeObjectURL for test environment
globalThis.URL = globalThis.URL || {}
globalThis.URL.revokeObjectURL = vi.fn()
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')

describe('MediaProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('utility functions (now from mediaUtils)', () => {
    describe('getFileExtension', () => {
      it('should extract file extension correctly', () => {
        expect(getFileExtension('test.jpg')).toBe('jpg')
        expect(getFileExtension('video.MP4')).toBe('mp4')
        expect(getFileExtension('image.JPEG')).toBe('jpeg')
        expect(getFileExtension('file.with.dots.png')).toBe('png')
      })
    })

    describe('isFileSupported', () => {
      it('should return true for supported image files', () => {
        const supportedImages = [
          { name: 'test.jpg', type: SUPPORTED_IMAGE_MIMES[0] },
          { name: 'test.png', type: SUPPORTED_IMAGE_MIMES[1] },
          { name: 'test.gif', type: SUPPORTED_IMAGE_MIMES[2] },
          { name: 'test.heic', type: SUPPORTED_IMAGE_MIMES[3] },
          { name: 'test.webp', type: SUPPORTED_IMAGE_MIMES[4] },
        ]

        supportedImages.forEach((file) => {
          expect(isFileSupported(file)).toBe(true)
        })
      })

      it('should return true for supported video files', () => {
        const supportedVideos = [
          { name: 'test.mp4', type: SUPPORTED_VIDEO_MIMES[0] },
          { name: 'test.mov', type: SUPPORTED_VIDEO_MIMES[1] },
          { name: 'test.webm', type: SUPPORTED_VIDEO_MIMES[2] },
          { name: 'test.avi', type: SUPPORTED_VIDEO_MIMES[3] },
          { name: 'test.mkv', type: SUPPORTED_VIDEO_MIMES[4] },
        ]

        supportedVideos.forEach((file) => {
          expect(isFileSupported(file)).toBe(true)
        })
      })

      it('should return false for unsupported files', () => {
        const unsupportedFiles = [
          { name: 'test.txt', type: 'text/plain' },
          { name: 'test.pdf', type: 'application/pdf' },
          { name: 'test.doc', type: 'application/msword' },
        ]

        unsupportedFiles.forEach((file) => {
          expect(isFileSupported(file)).toBe(false)
        })
      })
    })

    describe('getMediaType', () => {
      it('should return "image" for image files', () => {
        const imageFile = { name: 'test.jpg', type: SUPPORTED_IMAGE_MIMES[0] }
        expect(getMediaType(imageFile)).toBe('image')
      })

      it('should return "video" for video files', () => {
        const videoFile = { name: 'test.mp4', type: SUPPORTED_VIDEO_MIMES[0] }
        expect(getMediaType(videoFile)).toBe('video')
      })
    })
  })

  describe('getSupportedTypesString', () => {
    it('should return formatted string of supported types', () => {
      const supportedTypes = getSupportedTypes()
      // Check for uppercase versions of our supported extensions
      SUPPORTED_IMAGE_EXTENSIONS.forEach((ext) => {
        expect(supportedTypes).toContain(ext.toUpperCase())
      })
      SUPPORTED_VIDEO_EXTENSIONS.forEach((ext) => {
        expect(supportedTypes).toContain(ext.toUpperCase())
      })
    })
  })

  describe('media pool management', () => {
    it('should get media from StateManager', async () => {
      const { stateManager } = await import('./stateManager.js')
      const mockMediaPool = [
        {
          id: 'test_1',
          name: 'test.jpg',
          type: 'image',
          mimeType: SUPPORTED_IMAGE_MIMES[0],
          size: 1024,
          file: {},
          url: 'blob:test',
          addedAt: new Date(),
        },
      ]

      stateManager.getMediaPool.mockReturnValue(mockMediaPool)

      expect(mediaProcessor.getAllMedia()).toEqual(mockMediaPool)
      expect(stateManager.getMediaPool).toHaveBeenCalled()
    })

    it('should delegate pool operations to StateManager', async () => {
      const { stateManager } = await import('./stateManager.js')

      mediaProcessor.removeFromPool('test_id')
      expect(stateManager.removeMediaFromPool).toHaveBeenCalledWith('test_id')

      mediaProcessor.clearPool()
      expect(stateManager.clearMediaPool).toHaveBeenCalled()
    })
  })

  describe('duplicate detection', () => {
    it('should detect if file is already in pool using StateManager', async () => {
      const { stateManager } = await import('./stateManager.js')
      const file = { name: 'test.jpg', size: 1024, type: SUPPORTED_IMAGE_MIMES[0] }

      // Mock empty pool
      stateManager.getMediaPool.mockReturnValue([])
      expect(mediaProcessor.isFileAlreadyInPool(file)).toBe(false)

      // Mock pool with matching file that has full data (real duplicate)
      stateManager.getMediaPool.mockReturnValue([
        {
          id: 'test_1',
          name: 'test.jpg',
          size: 1024,
          type: 'image',
          file: new File([''], 'test.jpg'),
          url: 'blob:test',
        },
      ])
      expect(mediaProcessor.isFileAlreadyInPool(file)).toBe(true)

      // Mock pool with matching file that is metadata-only (upgrade candidate)
      stateManager.getMediaPool.mockReturnValue([
        {
          id: 'test_1',
          name: 'test.jpg',
          size: 1024,
          type: 'image',
          file: null,
          url: null,
        },
      ])
      expect(mediaProcessor.isFileAlreadyInPool(file)).toBe(false) // Should allow processing for upgrade
    })

    it('should not detect different files as duplicates', async () => {
      const { stateManager } = await import('./stateManager.js')
      const file2 = { name: 'test2.jpg', size: 1024, type: SUPPORTED_IMAGE_MIMES[0] }
      const file3 = { name: 'test1.jpg', size: 2048, type: SUPPORTED_IMAGE_MIMES[0] }

      stateManager.getMediaPool.mockReturnValue([
        {
          id: 'test_1',
          name: 'test1.jpg',
          size: 1024,
          type: 'image',
          file: new File([''], 'test1.jpg'),
          url: 'blob:test',
        },
      ])

      // Different name - should not be duplicate
      expect(mediaProcessor.isFileAlreadyInPool(file2)).toBe(false)

      // Different size - should not be duplicate
      expect(mediaProcessor.isFileAlreadyInPool(file3)).toBe(false)
    })

    it('should skip real duplicate files during processing and show appropriate message', async () => {
      const { toastManager } = await import('./toastManager.js')
      const { stateManager } = await import('./stateManager.js')

      // Mock existing file in pool with full data (real duplicate, not metadata-only)
      stateManager.getMediaPool.mockReturnValue([
        {
          id: 'test_1',
          name: 'test.jpg',
          size: 1024,
          type: 'image',
          file: new File([''], 'test.jpg'),
          url: 'blob:test',
        },
      ])

      const duplicateFile = new File(['content'], 'test.jpg', { type: SUPPORTED_IMAGE_MIMES[0] })
      Object.defineProperty(duplicateFile, 'size', { value: 1024 })

      await mediaProcessor.processFiles([duplicateFile])

      // Should show duplicate message
      expect(toastManager.error).toHaveBeenCalledWith(t.filesSkipped(1))

      // Should not add to StateManager or show success message
      expect(stateManager.addMediaToPool).not.toHaveBeenCalled()
      expect(toastManager.success).not.toHaveBeenCalled()
    })
  })

  describe('processFiles - additive behavior', () => {
    it('should add new files to StateManager with additive behavior', async () => {
      const { stateManager } = await import('./stateManager.js')
      const { toastManager } = await import('./toastManager.js')

      // Mock empty pool initially
      stateManager.getMediaPool.mockReturnValue([])

      const newFile = new File(['content'], 'new.jpg', { type: SUPPORTED_IMAGE_MIMES[0] })
      Object.defineProperty(newFile, 'size', { value: 2048 })

      await mediaProcessor.processFiles([newFile])

      // Should call StateManager to add media
      expect(stateManager.addMediaToPool).toHaveBeenCalledWith([
        expect.objectContaining({
          name: 'new.jpg',
          type: 'image',
          mimeType: SUPPORTED_IMAGE_MIMES[0],
          size: 2048,
        }),
      ])

      expect(toastManager.success).toHaveBeenCalledWith(t.filesAdded(1))
    })
  })
})
