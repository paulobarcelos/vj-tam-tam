/**
 * Unit tests for MediaProcessor module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mediaProcessor } from './mediaProcessor.js'

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

// Mock URL.revokeObjectURL for test environment
globalThis.URL = globalThis.URL || {}
globalThis.URL.revokeObjectURL = vi.fn()
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')

describe('MediaProcessor', () => {
  beforeEach(() => {
    // Clear the media pool before each test
    mediaProcessor.clearPool()
    vi.clearAllMocks()
  })

  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      expect(mediaProcessor.getFileExtension('test.jpg')).toBe('jpg')
      expect(mediaProcessor.getFileExtension('video.MP4')).toBe('mp4')
      expect(mediaProcessor.getFileExtension('image.JPEG')).toBe('jpeg')
      expect(mediaProcessor.getFileExtension('file.with.dots.png')).toBe('png')
    })
  })

  describe('isFileSupported', () => {
    it('should return true for supported image files', () => {
      const supportedImages = [
        { name: 'test.jpg', type: 'image/jpeg' },
        { name: 'test.png', type: 'image/png' },
        { name: 'test.gif', type: 'image/gif' },
        { name: 'test.webp', type: 'image/webp' },
        { name: 'test.heic', type: 'image/heic' },
      ]

      supportedImages.forEach((file) => {
        expect(mediaProcessor.isFileSupported(file)).toBe(true)
      })
    })

    it('should return true for supported video files', () => {
      const supportedVideos = [
        { name: 'test.mp4', type: 'video/mp4' },
        { name: 'test.mov', type: 'video/quicktime' },
        { name: 'test.webm', type: 'video/webm' },
      ]

      supportedVideos.forEach((file) => {
        expect(mediaProcessor.isFileSupported(file)).toBe(true)
      })
    })

    it('should return false for unsupported files', () => {
      const unsupportedFiles = [
        { name: 'test.txt', type: 'text/plain' },
        { name: 'test.pdf', type: 'application/pdf' },
        { name: 'test.doc', type: 'application/msword' },
      ]

      unsupportedFiles.forEach((file) => {
        expect(mediaProcessor.isFileSupported(file)).toBe(false)
      })
    })
  })

  describe('getMediaType', () => {
    it('should return "image" for image files', () => {
      const imageFile = { name: 'test.jpg', type: 'image/jpeg' }
      expect(mediaProcessor.getMediaType(imageFile)).toBe('image')
    })

    it('should return "video" for video files', () => {
      const videoFile = { name: 'test.mp4', type: 'video/mp4' }
      expect(mediaProcessor.getMediaType(videoFile)).toBe('video')
    })
  })

  describe('getSupportedTypesString', () => {
    it('should return formatted string of supported types', () => {
      const supportedTypes = mediaProcessor.getSupportedTypesString()
      expect(supportedTypes).toContain('JPG')
      expect(supportedTypes).toContain('PNG')
      expect(supportedTypes).toContain('MP4')
      expect(supportedTypes).toContain('MOV')
      expect(supportedTypes).toContain('WEBM')
    })
  })

  describe('media pool management', () => {
    it('should start with empty media pool', () => {
      expect(mediaProcessor.getAllMedia()).toHaveLength(0)
    })

    it('should add media items to pool', () => {
      const mediaItem = {
        id: 'test_1',
        name: 'test.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 1024,
        file: {},
        url: 'blob:test',
        addedAt: new Date(),
      }

      mediaProcessor.addToPool(mediaItem)
      expect(mediaProcessor.getAllMedia()).toHaveLength(1)
      expect(mediaProcessor.getAllMedia()[0]).toEqual(mediaItem)
    })
  })

  describe('duplicate detection', () => {
    it('should detect if file is already in pool', () => {
      const file = { name: 'test.jpg', size: 1024, type: 'image/jpeg' }
      const mediaItem = {
        id: 'test_1',
        name: 'test.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 1024,
        file: {},
        url: 'blob:test',
        addedAt: new Date(),
      }

      // Pool is empty - should not be detected as duplicate
      expect(mediaProcessor.isFileAlreadyInPool(file)).toBe(false)

      // Add item to pool
      mediaProcessor.addToPool(mediaItem)

      // Now should be detected as duplicate
      expect(mediaProcessor.isFileAlreadyInPool(file)).toBe(true)
    })

    it('should not detect different files as duplicates', () => {
      const file2 = { name: 'test2.jpg', size: 1024, type: 'image/jpeg' }
      const file3 = { name: 'test1.jpg', size: 2048, type: 'image/jpeg' }

      const mediaItem = {
        id: 'test_1',
        name: 'test1.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 1024,
        file: {},
        url: 'blob:test',
        addedAt: new Date(),
      }

      mediaProcessor.addToPool(mediaItem)

      // Different name - should not be duplicate
      expect(mediaProcessor.isFileAlreadyInPool(file2)).toBe(false)

      // Different size - should not be duplicate
      expect(mediaProcessor.isFileAlreadyInPool(file3)).toBe(false)
    })

    it('should skip duplicate files during processing and show appropriate message', async () => {
      const { toastManager } = await import('./toastManager.js')

      // Add a file to the pool first
      const existingFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(existingFile, 'size', { value: 1024 })

      await mediaProcessor.processFiles([existingFile])

      // Clear mock calls from first processing
      vi.clearAllMocks()

      // Try to add the same file again
      const duplicateFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(duplicateFile, 'size', { value: 1024 })

      await mediaProcessor.processFiles([duplicateFile])

      // Should show duplicate message
      expect(toastManager.error).toHaveBeenCalledWith('1 file already in media pool (skipped)')

      // Should not show success message (no new files added)
      expect(toastManager.success).not.toHaveBeenCalled()

      // Pool should still have only 1 item
      expect(mediaProcessor.getAllMedia()).toHaveLength(1)
    })
  })
})
