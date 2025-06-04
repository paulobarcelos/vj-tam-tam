/**
 * Tests for media utilities
 */

import { describe, it, expect } from 'vitest'
import {
  getFileExtension,
  isFileSupported,
  getMediaType,
  filterMediaByType,
  filterMediaByAccess,
  filterUsableMedia,
  filterRestorableMedia,
  getSupportedTypes,
  hasValidMediaExtension,
  // Segment calculation functions
  calculateRandomSegmentDuration,
  calculateValidVideoRange,
  calculateRandomStartPoint,
  getVideoSegmentParameters,
} from './mediaUtils.js'

// Mock file objects for testing
const createMockFile = (name, type, size = 1000) => ({
  name,
  type,
  size,
})

describe('mediaUtils', () => {
  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      expect(getFileExtension('test.jpg')).toBe('jpg')
      expect(getFileExtension('video.mp4')).toBe('mp4')
      expect(getFileExtension('file.name.with.dots.png')).toBe('png')
    })

    it('should handle files without extensions', () => {
      expect(getFileExtension('noextension')).toBe('')
      expect(getFileExtension('')).toBe('')
    })

    it('should handle invalid inputs', () => {
      expect(getFileExtension(null)).toBe('')
      expect(getFileExtension(undefined)).toBe('')
      expect(getFileExtension(123)).toBe('')
    })
  })

  describe('isFileSupported', () => {
    it('should return true for supported image files', () => {
      const jpgFile = createMockFile('test.jpg', 'image/jpeg')
      const pngFile = createMockFile('test.png', 'image/png')
      expect(isFileSupported(jpgFile)).toBe(true)
      expect(isFileSupported(pngFile)).toBe(true)
    })

    it('should return true for supported video files', () => {
      const mp4File = createMockFile('test.mp4', 'video/mp4')
      const webmFile = createMockFile('test.webm', 'video/webm')
      expect(isFileSupported(mp4File)).toBe(true)
      expect(isFileSupported(webmFile)).toBe(true)
    })

    it('should return false for unsupported files', () => {
      const txtFile = createMockFile('test.txt', 'text/plain')
      const docFile = createMockFile('test.doc', 'application/msword')
      expect(isFileSupported(txtFile)).toBe(false)
      expect(isFileSupported(docFile)).toBe(false)
    })

    it('should handle null/undefined files', () => {
      expect(isFileSupported(null)).toBe(false)
      expect(isFileSupported(undefined)).toBe(false)
    })
  })

  describe('getMediaType', () => {
    it('should return correct media type for images', () => {
      const jpgFile = createMockFile('test.jpg', 'image/jpeg')
      const pngFile = createMockFile('test.png', 'image/png')
      expect(getMediaType(jpgFile)).toBe('image')
      expect(getMediaType(pngFile)).toBe('image')
    })

    it('should return correct media type for videos', () => {
      const mp4File = createMockFile('test.mp4', 'video/mp4')
      const webmFile = createMockFile('test.webm', 'video/webm')
      expect(getMediaType(mp4File)).toBe('video')
      expect(getMediaType(webmFile)).toBe('video')
    })

    it('should default to image for unknown types', () => {
      const unknownFile = createMockFile('test.unknown', 'unknown/type')
      expect(getMediaType(unknownFile)).toBe('image')
    })

    it('should handle null/undefined files', () => {
      expect(getMediaType(null)).toBe('image')
      expect(getMediaType(undefined)).toBe('image')
    })
  })

  describe('filter functions', () => {
    const mockMediaItems = [
      {
        id: '1',
        name: 'image1.jpg',
        type: 'image',
        file: { name: 'image1.jpg' },
        url: 'blob:url1',
        fromFileSystemAPI: false,
      },
      {
        id: '2',
        name: 'video1.mp4',
        type: 'video',
        file: { name: 'video1.mp4' },
        url: 'blob:url2',
        fromFileSystemAPI: true,
      },
      {
        id: '3',
        name: 'image2.png',
        type: 'image',
        file: null,
        url: null,
        fromFileSystemAPI: true,
      },
      {
        id: '4',
        name: 'video2.webm',
        type: 'video',
        file: null,
        url: null,
        fromFileSystemAPI: false,
      },
    ]

    describe('filterMediaByType', () => {
      it('should filter by image type', () => {
        const images = filterMediaByType(mockMediaItems, 'image')
        expect(images).toHaveLength(2)
        expect(images.every((item) => item.type === 'image')).toBe(true)
      })

      it('should filter by video type', () => {
        const videos = filterMediaByType(mockMediaItems, 'video')
        expect(videos).toHaveLength(2)
        expect(videos.every((item) => item.type === 'video')).toBe(true)
      })

      it('should handle empty arrays', () => {
        expect(filterMediaByType([], 'image')).toEqual([])
      })

      it('should handle invalid input', () => {
        expect(filterMediaByType(null, 'image')).toEqual([])
        expect(filterMediaByType(undefined, 'image')).toEqual([])
      })
    })

    describe('filterMediaByAccess', () => {
      it('should filter items with file access', () => {
        const withAccess = filterMediaByAccess(mockMediaItems, true)
        expect(withAccess).toHaveLength(2)
        expect(withAccess.every((item) => item.file && item.url)).toBe(true)
      })

      it('should filter items without file access', () => {
        const withoutAccess = filterMediaByAccess(mockMediaItems, false)
        expect(withoutAccess).toHaveLength(2)
        expect(withoutAccess.every((item) => !item.file || !item.url)).toBe(true)
      })
    })

    describe('filterUsableMedia', () => {
      it('should return only items with file and url', () => {
        const usable = filterUsableMedia(mockMediaItems)
        expect(usable).toHaveLength(2)
        expect(usable.every((item) => item.file && item.url)).toBe(true)
      })
    })

    describe('filterRestorableMedia', () => {
      it('should return only FileSystemAccessAPI items', () => {
        const restorable = filterRestorableMedia(mockMediaItems)
        expect(restorable).toHaveLength(2)
        expect(restorable.every((item) => item.fromFileSystemAPI)).toBe(true)
      })
    })
  })

  // ============================================================================
  // SEGMENT CALCULATION TESTS
  // ============================================================================

  describe('calculateRandomSegmentDuration', () => {
    it('should return a value between min and max duration', () => {
      const minDuration = 2
      const maxDuration = 10

      // Test multiple times to ensure randomness works
      for (let i = 0; i < 10; i++) {
        const result = calculateRandomSegmentDuration(minDuration, maxDuration)
        expect(result).toBeGreaterThanOrEqual(minDuration)
        expect(result).toBeLessThanOrEqual(maxDuration)
        expect(typeof result).toBe('number')
      }
    })

    it('should return the same value when min equals max', () => {
      const duration = 5
      const result = calculateRandomSegmentDuration(duration, duration)
      expect(result).toBe(duration)
    })

    it('should handle edge case with very small durations', () => {
      const result = calculateRandomSegmentDuration(0.1, 0.2)
      expect(result).toBeGreaterThanOrEqual(0.1)
      expect(result).toBeLessThanOrEqual(0.2)
    })

    it('should throw error for invalid input types', () => {
      expect(() => calculateRandomSegmentDuration('5', 10)).toThrow(
        'Duration values must be numbers'
      )
      expect(() => calculateRandomSegmentDuration(5, '10')).toThrow(
        'Duration values must be numbers'
      )
      expect(() => calculateRandomSegmentDuration(null, 10)).toThrow(
        'Duration values must be numbers'
      )
    })

    it('should throw error for negative durations', () => {
      expect(() => calculateRandomSegmentDuration(-1, 10)).toThrow(
        'Duration values must be non-negative'
      )
      expect(() => calculateRandomSegmentDuration(5, -1)).toThrow(
        'Duration values must be non-negative'
      )
    })

    it('should throw error when min > max', () => {
      expect(() => calculateRandomSegmentDuration(10, 5)).toThrow(
        'Minimum duration cannot be greater than maximum duration'
      )
    })
  })

  describe('calculateValidVideoRange', () => {
    it('should calculate valid range without offsets', () => {
      const result = calculateValidVideoRange(60, 10, 0, 0)
      expect(result.validStartMin).toBe(0)
      expect(result.validStartMax).toBe(50) // 60 - 0 - 10
      expect(result.fallbackUsed).toBeNull()
    })

    it('should calculate valid range with skip start', () => {
      const result = calculateValidVideoRange(60, 10, 5, 0)
      expect(result.validStartMin).toBe(5)
      expect(result.validStartMax).toBe(50) // 60 - 0 - 10
      expect(result.fallbackUsed).toBeNull()
    })

    it('should calculate valid range with skip end', () => {
      const result = calculateValidVideoRange(60, 10, 0, 5)
      expect(result.validStartMin).toBe(0)
      expect(result.validStartMax).toBe(45) // 60 - 5 - 10
      expect(result.fallbackUsed).toBeNull()
    })

    it('should calculate valid range with both offsets', () => {
      const result = calculateValidVideoRange(60, 10, 5, 5)
      expect(result.validStartMin).toBe(5)
      expect(result.validStartMax).toBe(45) // 60 - 5 - 10
      expect(result.fallbackUsed).toBeNull()
    })

    it('should use fallback when skipEnd makes range invalid', () => {
      const result = calculateValidVideoRange(20, 10, 5, 10) // 5 > (20 - 10 - 10 = 0)
      expect(result.validStartMin).toBe(5)
      expect(result.validStartMax).toBe(10) // 20 - 10 (ignoring skipEnd)
      expect(result.fallbackUsed).toBe('skipEnd')
    })

    it('should use both fallback when both offsets make range invalid', () => {
      const result = calculateValidVideoRange(15, 10, 8, 5) // 8 > (15 - 5 - 10 = 0)
      expect(result.validStartMin).toBe(0)
      expect(result.validStartMax).toBe(5) // 15 - 10 (ignoring both offsets)
      expect(result.fallbackUsed).toBe('both')
    })

    it('should throw error for invalid input types', () => {
      expect(() => calculateValidVideoRange('60', 10, 0, 0)).toThrow(
        'All parameters must be numbers'
      )
      expect(() => calculateValidVideoRange(60, '10', 0, 0)).toThrow(
        'All parameters must be numbers'
      )
    })

    it('should throw error for non-positive durations', () => {
      expect(() => calculateValidVideoRange(0, 10, 0, 0)).toThrow(
        'Video duration and segment duration must be positive'
      )
      expect(() => calculateValidVideoRange(60, 0, 0, 0)).toThrow(
        'Video duration and segment duration must be positive'
      )
      expect(() => calculateValidVideoRange(-10, 5, 0, 0)).toThrow(
        'Video duration and segment duration must be positive'
      )
    })

    it('should throw error for negative skip values', () => {
      expect(() => calculateValidVideoRange(60, 10, -1, 0)).toThrow(
        'Skip values must be non-negative'
      )
      expect(() => calculateValidVideoRange(60, 10, 0, -1)).toThrow(
        'Skip values must be non-negative'
      )
    })

    it('should throw error when segment duration > video duration', () => {
      expect(() => calculateValidVideoRange(10, 15, 0, 0)).toThrow(
        'Segment duration cannot be longer than video duration'
      )
    })

    it('should throw error when segment is impossible even with fallbacks', () => {
      expect(() => calculateValidVideoRange(5, 10, 0, 0)).toThrow(
        'Segment duration cannot be longer than video duration'
      )
    })
  })

  describe('calculateRandomStartPoint', () => {
    it('should return a value between min and max', () => {
      const validStartMin = 5
      const validStartMax = 15

      // Test multiple times to ensure randomness works
      for (let i = 0; i < 10; i++) {
        const result = calculateRandomStartPoint(validStartMin, validStartMax)
        expect(result).toBeGreaterThanOrEqual(validStartMin)
        expect(result).toBeLessThanOrEqual(validStartMax)
        expect(typeof result).toBe('number')
      }
    })

    it('should return the same value when min equals max', () => {
      const point = 10
      const result = calculateRandomStartPoint(point, point)
      expect(result).toBe(point)
    })

    it('should handle zero values', () => {
      const result = calculateRandomStartPoint(0, 5)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(5)
    })

    it('should throw error for invalid input types', () => {
      expect(() => calculateRandomStartPoint('5', 10)).toThrow('Range values must be numbers')
      expect(() => calculateRandomStartPoint(5, '10')).toThrow('Range values must be numbers')
    })

    it('should throw error for negative values', () => {
      expect(() => calculateRandomStartPoint(-1, 10)).toThrow('Range values must be non-negative')
      expect(() => calculateRandomStartPoint(5, -1)).toThrow('Range values must be non-negative')
    })

    it('should throw error when min > max', () => {
      expect(() => calculateRandomStartPoint(10, 5)).toThrow(
        'Minimum start point cannot be greater than maximum start point'
      )
    })
  })

  describe('getVideoSegmentParameters', () => {
    const mockSegmentSettings = {
      minDuration: 5,
      maxDuration: 10,
      skipStart: 2,
      skipEnd: 3,
    }

    it('should return complete segment parameters', () => {
      const result = getVideoSegmentParameters(60, mockSegmentSettings)

      expect(result).toHaveProperty('segmentDuration')
      expect(result).toHaveProperty('startPoint')
      expect(result).toHaveProperty('fallbackUsed')

      expect(result.segmentDuration).toBeGreaterThanOrEqual(5)
      expect(result.segmentDuration).toBeLessThanOrEqual(10)
      expect(result.startPoint).toBeGreaterThanOrEqual(2)
      expect(result.fallbackUsed).toBeNull()
    })

    it('should handle fallback scenarios', () => {
      const shortVideoSettings = {
        minDuration: 5,
        maxDuration: 8,
        skipStart: 10,
        skipEnd: 10,
      }

      const result = getVideoSegmentParameters(15, shortVideoSettings)
      expect(result.fallbackUsed).toBe('both')
      expect(result.startPoint).toBeGreaterThanOrEqual(0)
    })

    it('should throw error for invalid segment settings', () => {
      expect(() => getVideoSegmentParameters(60, null)).toThrow(
        'Segment settings must be a valid object'
      )
      expect(() => getVideoSegmentParameters(60, 'invalid')).toThrow(
        'Segment settings must be a valid object'
      )
      expect(() => getVideoSegmentParameters(60, undefined)).toThrow(
        'Segment settings must be a valid object'
      )
    })

    it('should handle edge case with minimal video duration', () => {
      const minimalSettings = {
        minDuration: 1,
        maxDuration: 1,
        skipStart: 0,
        skipEnd: 0,
      }

      const result = getVideoSegmentParameters(2, minimalSettings)
      expect(result.segmentDuration).toBe(1)
      expect(result.startPoint).toBeGreaterThanOrEqual(0)
      expect(result.startPoint).toBeLessThanOrEqual(1)
    })
  })

  describe('getSupportedTypes', () => {
    it('should return a string of supported types', () => {
      const result = getSupportedTypes()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('hasValidMediaExtension', () => {
    it('should return true for valid media extensions', () => {
      expect(hasValidMediaExtension('test.jpg')).toBe(true)
      expect(hasValidMediaExtension('video.mp4')).toBe(true)
      expect(hasValidMediaExtension('image.png')).toBe(true)
    })

    it('should return false for invalid extensions', () => {
      expect(hasValidMediaExtension('document.txt')).toBe(false)
      expect(hasValidMediaExtension('archive.zip')).toBe(false)
    })

    it('should handle files without extensions', () => {
      expect(hasValidMediaExtension('noextension')).toBe(false)
      expect(hasValidMediaExtension('')).toBe(false)
    })

    it('should handle invalid inputs', () => {
      expect(hasValidMediaExtension(null)).toBe(false)
      expect(hasValidMediaExtension(undefined)).toBe(false)
      expect(hasValidMediaExtension(123)).toBe(false)
    })
  })
})
