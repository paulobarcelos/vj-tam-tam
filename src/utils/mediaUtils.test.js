/**
 * Tests for mediaUtils module
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getFileExtension,
  isFileSupported,
  getMediaType,
  filterMediaByType,
  filterMediaByAccess,
  filterMediaNeedingPermission,
  filterTemporaryMedia,
  filterUsableMedia,
  filterRestorableMedia,
  getSupportedTypes,
  hasValidMediaExtension,
} from './mediaUtils.js'

describe('mediaUtils', () => {
  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      expect(getFileExtension('test.jpg')).toBe('jpg')
      expect(getFileExtension('video.MP4')).toBe('mp4')
      expect(getFileExtension('file.name.with.dots.png')).toBe('png')
    })

    it('should handle edge cases', () => {
      expect(getFileExtension('')).toBe('')
      expect(getFileExtension('noextension')).toBe('')
      expect(getFileExtension(null)).toBe('')
      expect(getFileExtension(undefined)).toBe('')
      expect(getFileExtension(123)).toBe('')
    })
  })

  describe('isFileSupported', () => {
    it('should validate supported files', () => {
      const jpgFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const mp4File = new File([''], 'test.mp4', { type: 'video/mp4' })

      expect(isFileSupported(jpgFile)).toBe(true)
      expect(isFileSupported(mp4File)).toBe(true)
    })

    it('should reject unsupported files', () => {
      const txtFile = new File([''], 'test.txt', { type: 'text/plain' })

      expect(isFileSupported(txtFile)).toBe(false)
      expect(isFileSupported(null)).toBe(false)
      expect(isFileSupported(undefined)).toBe(false)
    })
  })

  describe('getMediaType', () => {
    it('should determine media type correctly', () => {
      const jpgFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const mp4File = new File([''], 'test.mp4', { type: 'video/mp4' })

      expect(getMediaType(jpgFile)).toBe('image')
      expect(getMediaType(mp4File)).toBe('video')
    })

    it('should default to image for unknown types', () => {
      expect(getMediaType(null)).toBe('image')
      expect(getMediaType(undefined)).toBe('image')
    })
  })

  describe('filterMediaByType', () => {
    let mediaItems

    beforeEach(() => {
      mediaItems = [
        { id: '1', type: 'image', name: 'photo.jpg' },
        { id: '2', type: 'video', name: 'movie.mp4' },
        { id: '3', type: 'image', name: 'picture.png' },
      ]
    })

    it('should filter by image type', () => {
      const images = filterMediaByType(mediaItems, 'image')
      expect(images).toHaveLength(2)
      expect(images.every((item) => item.type === 'image')).toBe(true)
    })

    it('should filter by video type', () => {
      const videos = filterMediaByType(mediaItems, 'video')
      expect(videos).toHaveLength(1)
      expect(videos[0].type).toBe('video')
    })

    it('should handle invalid input', () => {
      expect(filterMediaByType(null, 'image')).toEqual([])
      expect(filterMediaByType(undefined, 'image')).toEqual([])
      expect(filterMediaByType('not-array', 'image')).toEqual([])
    })
  })

  describe('filterMediaByAccess', () => {
    let mediaItems

    beforeEach(() => {
      mediaItems = [
        { id: '1', file: {}, url: 'blob:url1' }, // Has access
        { id: '2', file: null, url: null }, // No access
        { id: '3', file: {}, url: 'blob:url3' }, // Has access
      ]
    })

    it('should filter items with file access', () => {
      const withAccess = filterMediaByAccess(mediaItems, true)
      expect(withAccess).toHaveLength(2)
      expect(withAccess.every((item) => item.file && item.url)).toBe(true)
    })

    it('should filter items without file access', () => {
      const withoutAccess = filterMediaByAccess(mediaItems, false)
      expect(withoutAccess).toHaveLength(1)
      expect(withoutAccess[0].id).toBe('2')
    })
  })

  describe('filterMediaNeedingPermission', () => {
    let mediaItems

    beforeEach(() => {
      mediaItems = [
        { id: '1', file: null, url: null, fromFileSystemAPI: true }, // Needs permission
        { id: '2', file: {}, url: 'blob:url', fromFileSystemAPI: true }, // Has permission
        { id: '3', file: null, url: null, fromFileSystemAPI: false }, // Drag & drop, no permission needed
      ]
    })

    it('should filter items needing permission restoration', () => {
      const needingPermission = filterMediaNeedingPermission(mediaItems)
      expect(needingPermission).toHaveLength(1)
      expect(needingPermission[0].id).toBe('1')
    })
  })

  describe('filterTemporaryMedia', () => {
    let mediaItems

    beforeEach(() => {
      mediaItems = [
        { id: '1', file: {}, url: 'blob:url', fromFileSystemAPI: false }, // Temporary
        { id: '2', file: {}, url: 'blob:url', fromFileSystemAPI: true }, // Persistent
        { id: '3', file: null, url: null, fromFileSystemAPI: false }, // Temporary metadata
      ]
    })

    it('should filter temporary media items', () => {
      const temporary = filterTemporaryMedia(mediaItems)
      expect(temporary).toHaveLength(2)
      expect(temporary.every((item) => !item.fromFileSystemAPI)).toBe(true)
    })
  })

  describe('filterUsableMedia', () => {
    let mediaItems

    beforeEach(() => {
      mediaItems = [
        { id: '1', file: {}, url: 'blob:url' }, // Usable
        { id: '2', file: null, url: null }, // Not usable
        { id: '3', file: {}, url: 'blob:url' }, // Usable
      ]
    })

    it('should filter usable media items', () => {
      const usable = filterUsableMedia(mediaItems)
      expect(usable).toHaveLength(2)
      expect(usable.every((item) => item.file && item.url)).toBe(true)
    })
  })

  describe('filterRestorableMedia', () => {
    let mediaItems

    beforeEach(() => {
      mediaItems = [
        { id: '1', fromFileSystemAPI: true }, // Restorable
        { id: '2', fromFileSystemAPI: false }, // Not restorable
        { id: '3', fromFileSystemAPI: true }, // Restorable
      ]
    })

    it('should filter restorable media items', () => {
      const restorable = filterRestorableMedia(mediaItems)
      expect(restorable).toHaveLength(2)
      expect(restorable.every((item) => item.fromFileSystemAPI)).toBe(true)
    })
  })

  describe('getSupportedTypes', () => {
    it('should return supported types string', () => {
      const types = getSupportedTypes()
      expect(typeof types).toBe('string')
      expect(types.length).toBeGreaterThan(0)
    })
  })

  describe('hasValidMediaExtension', () => {
    it('should validate media extensions', () => {
      expect(hasValidMediaExtension('photo.jpg')).toBe(true)
      expect(hasValidMediaExtension('video.mp4')).toBe(true)
      expect(hasValidMediaExtension('document.txt')).toBe(false)
      expect(hasValidMediaExtension('noextension')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(hasValidMediaExtension('')).toBe(false)
      expect(hasValidMediaExtension(null)).toBe(false)
      expect(hasValidMediaExtension(undefined)).toBe(false)
    })
  })
})
