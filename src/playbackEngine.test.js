/**
 * Unit tests for PlaybackEngine module
 * Tests media element creation, fullscreen positioning, and integration with StateManager/EventBus
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { playbackEngine } from './playbackEngine.js'

// Mock dependencies
vi.mock('./eventBus.js', () => ({
  eventBus: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}))

vi.mock('./toastManager.js', () => ({
  toastManager: {
    error: vi.fn(),
    success: vi.fn(),
    show: vi.fn(),
  },
}))

// Mock DOM
const mockStageElement = {
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  id: 'stage',
}

// Mock media item for testing
const mockImageItem = {
  id: 'test-image-1',
  name: 'test-image.jpg',
  type: 'image',
  mimeType: 'image/jpeg',
  size: 1024000,
  file: new File([''], 'test-image.jpg', { type: 'image/jpeg' }),
  url: 'blob:test-image-url',
  addedAt: new Date(),
}

const mockVideoItem = {
  id: 'test-video-1',
  name: 'test-video.mp4',
  type: 'video',
  mimeType: 'video/mp4',
  size: 5120000,
  file: new File([''], 'test-video.mp4', { type: 'video/mp4' }),
  url: 'blob:test-video-url',
  addedAt: new Date(),
}

describe('PlaybackEngine', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Mock getElementById to return our mock stage element
    Object.defineProperty(globalThis, 'document', {
      value: {
        getElementById: vi.fn((id) => {
          if (id === 'stage') return mockStageElement
          return null
        }),
        createElement: vi.fn((tagName) => {
          const element = {
            tagName: tagName.toUpperCase(),
            className: '',
            src: '',
            alt: '',
            autoplay: false,
            muted: false,
            loop: false,
            controls: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            parentNode: null,
          }
          return element
        }),
      },
      writable: true,
    })

    // Mock window
    Object.defineProperty(globalThis, 'window', {
      value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
    })

    // Mock console
    Object.defineProperty(globalThis, 'console', {
      value: {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      },
      writable: true,
    })

    // Reset PlaybackEngine state
    playbackEngine.currentMediaElement = null
    playbackEngine.stageElement = null
  })

  afterEach(() => {
    // Clean up
    vi.resetAllMocks()
  })

  describe('initialization', () => {
    it('should initialize successfully with valid stage element', () => {
      expect(() => playbackEngine.init()).not.toThrow()
      expect(document.getElementById).toHaveBeenCalledWith('stage')
      expect(playbackEngine.stageElement).toBe(mockStageElement)
    })

    it('should throw error when stage element is not found', () => {
      document.getElementById = vi.fn(() => null)

      expect(() => playbackEngine.init()).toThrow('Stage element not found')
    })

    it('should set up event listeners on initialization', async () => {
      playbackEngine.init()

      const { eventBus } = await import('./eventBus.js')
      expect(eventBus.on).toHaveBeenCalledWith('state.mediaPoolUpdated', expect.any(Function))
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('media element creation', () => {
    beforeEach(() => {
      playbackEngine.init()
    })

    it('should create image element with correct properties', () => {
      const imageElement = playbackEngine.createImageElement(mockImageItem)

      expect(document.createElement).toHaveBeenCalledWith('img')
      expect(imageElement).toBeDefined()
      expect(imageElement.className).toBe('stage-media image')
      expect(imageElement.src).toBe(mockImageItem.url)
      expect(imageElement.alt).toBe(mockImageItem.name)
      expect(imageElement.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should create video element with correct properties', () => {
      const videoElement = playbackEngine.createVideoElement(mockVideoItem)

      expect(document.createElement).toHaveBeenCalledWith('video')
      expect(videoElement).toBeDefined()
      expect(videoElement.className).toBe('stage-media video')
      expect(videoElement.src).toBe(mockVideoItem.url)
      expect(videoElement.autoplay).toBe(true)
      expect(videoElement.muted).toBe(true)
      expect(videoElement.loop).toBe(true)
      expect(videoElement.controls).toBe(false)
      expect(videoElement.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
      expect(videoElement.addEventListener).toHaveBeenCalledWith(
        'loadedmetadata',
        expect.any(Function)
      )
    })

    it('should handle image creation errors gracefully', () => {
      document.createElement = vi.fn(() => {
        throw new Error('DOM manipulation failed')
      })

      const imageElement = playbackEngine.createImageElement(mockImageItem)

      expect(imageElement).toBeNull()
      expect(console.error).toHaveBeenCalledWith('Error creating image element:', expect.any(Error))
    })

    it('should handle video creation errors gracefully', () => {
      document.createElement = vi.fn(() => {
        throw new Error('DOM manipulation failed')
      })

      const videoElement = playbackEngine.createVideoElement(mockVideoItem)

      expect(videoElement).toBeNull()
      expect(console.error).toHaveBeenCalledWith('Error creating video element:', expect.any(Error))
    })
  })

  describe('media display functionality', () => {
    beforeEach(() => {
      playbackEngine.init()
    })

    it('should display image media correctly', () => {
      playbackEngine.displayMedia(mockImageItem)

      expect(mockStageElement.appendChild).toHaveBeenCalledWith(expect.any(Object))
      expect(playbackEngine.hasCurrentMedia()).toBe(true)
      expect(playbackEngine.getCurrentMediaElement()).toBeDefined()
    })

    it('should display video media correctly', () => {
      playbackEngine.displayMedia(mockVideoItem)

      expect(mockStageElement.appendChild).toHaveBeenCalledWith(expect.any(Object))
      expect(playbackEngine.hasCurrentMedia()).toBe(true)
      expect(playbackEngine.getCurrentMediaElement()).toBeDefined()
    })

    it('should clear previous media when displaying new media', () => {
      const mockCurrentElement = {
        parentNode: mockStageElement,
      }
      playbackEngine.currentMediaElement = mockCurrentElement
      mockStageElement.removeChild = vi.fn()

      playbackEngine.displayMedia(mockImageItem)

      expect(mockStageElement.removeChild).toHaveBeenCalledWith(mockCurrentElement)
    })

    it('should handle invalid media items gracefully', () => {
      playbackEngine.displayMedia(null)

      expect(mockStageElement.appendChild).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith('Invalid media item provided to displayMedia')
    })

    it('should handle media items without URL gracefully', () => {
      const invalidItem = { ...mockImageItem, url: null }

      playbackEngine.displayMedia(invalidItem)

      expect(mockStageElement.appendChild).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith('Invalid media item provided to displayMedia')
    })

    it('should handle unsupported media types', () => {
      const unsupportedItem = { ...mockImageItem, type: 'unsupported' }

      playbackEngine.displayMedia(unsupportedItem)

      expect(mockStageElement.appendChild).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith('Unsupported media type:', 'unsupported')
    })

    it('should handle display errors with toast notification', async () => {
      mockStageElement.appendChild = vi.fn(() => {
        throw new Error('DOM error')
      })

      playbackEngine.displayMedia(mockImageItem)

      const { toastManager } = await import('./toastManager.js')
      expect(toastManager.error).toHaveBeenCalledWith(`Failed to display ${mockImageItem.name}`)
    })
  })

  describe('media pool update handling', () => {
    beforeEach(() => {
      playbackEngine.init()
    })

    it('should display first media item when pool is updated', () => {
      const updateData = {
        mediaPool: [mockImageItem, mockVideoItem],
        totalCount: 2,
        cleared: false,
      }

      playbackEngine.handleMediaPoolUpdate(updateData)

      expect(mockStageElement.appendChild).toHaveBeenCalled()
      expect(playbackEngine.hasCurrentMedia()).toBe(true)
    })

    it('should clear media when pool is cleared', () => {
      // Set up existing media
      playbackEngine.currentMediaElement = { parentNode: mockStageElement }
      mockStageElement.removeChild = vi.fn()

      const updateData = {
        mediaPool: [],
        totalCount: 0,
        cleared: true,
      }

      playbackEngine.handleMediaPoolUpdate(updateData)

      expect(mockStageElement.removeChild).toHaveBeenCalled()
      expect(playbackEngine.hasCurrentMedia()).toBe(false)
    })

    it('should clear media when pool becomes empty', () => {
      // Set up existing media
      playbackEngine.currentMediaElement = { parentNode: mockStageElement }
      mockStageElement.removeChild = vi.fn()

      const updateData = {
        mediaPool: [],
        totalCount: 0,
        cleared: false,
      }

      playbackEngine.handleMediaPoolUpdate(updateData)

      expect(mockStageElement.removeChild).toHaveBeenCalled()
      expect(playbackEngine.hasCurrentMedia()).toBe(false)
    })

    it('should handle update errors with toast notification', async () => {
      const updateData = {
        mediaPool: [mockImageItem],
        totalCount: 1,
        cleared: false,
      }

      // Mock error in displayMedia
      playbackEngine.displayMedia = vi.fn(() => {
        throw new Error('Display error')
      })

      playbackEngine.handleMediaPoolUpdate(updateData)

      const { toastManager } = await import('./toastManager.js')
      expect(toastManager.error).toHaveBeenCalledWith('Failed to update media display')
    })
  })

  describe('window resize handling', () => {
    beforeEach(() => {
      playbackEngine.init()
    })

    it('should handle window resize when media is displayed', () => {
      playbackEngine.currentMediaElement = document.createElement('img')

      playbackEngine.handleWindowResize()

      expect(console.log).toHaveBeenCalledWith(
        'Window resized - media element will auto-adjust via CSS'
      )
    })

    it('should handle window resize when no media is displayed', () => {
      playbackEngine.currentMediaElement = null

      expect(() => playbackEngine.handleWindowResize()).not.toThrow()
    })

    it('should handle resize errors gracefully', () => {
      // Mock console.log to throw error
      console.log = vi.fn(() => {
        throw new Error('Console error')
      })

      playbackEngine.currentMediaElement = document.createElement('img')

      expect(() => playbackEngine.handleWindowResize()).not.toThrow()
      expect(console.error).toHaveBeenCalledWith('Error handling window resize:', expect.any(Error))
    })
  })

  describe('cleanup functionality', () => {
    beforeEach(() => {
      playbackEngine.init()
    })

    it('should remove event listeners on cleanup', async () => {
      playbackEngine.cleanup()

      const { eventBus } = await import('./eventBus.js')
      expect(eventBus.off).toHaveBeenCalledWith('state.mediaPoolUpdated', expect.any(Function))
      expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('should clear current media on cleanup', () => {
      // Set up existing media
      playbackEngine.currentMediaElement = { parentNode: mockStageElement }
      mockStageElement.removeChild = vi.fn()

      playbackEngine.cleanup()

      expect(mockStageElement.removeChild).toHaveBeenCalled()
      expect(playbackEngine.hasCurrentMedia()).toBe(false)
    })

    it('should handle cleanup errors gracefully', async () => {
      // Mock eventBus.off to throw error
      const { eventBus } = await import('./eventBus.js')
      eventBus.off = vi.fn(() => {
        throw new Error('EventBus error')
      })

      expect(() => playbackEngine.cleanup()).not.toThrow()
      expect(console.error).toHaveBeenCalledWith(
        'Error during PlaybackEngine cleanup:',
        expect.any(Error)
      )
    })
  })

  describe('utility methods', () => {
    it('should return current media element', () => {
      const mockElement = document.createElement('img')
      playbackEngine.currentMediaElement = mockElement

      expect(playbackEngine.getCurrentMediaElement()).toBe(mockElement)
    })

    it('should return null when no current media', () => {
      playbackEngine.currentMediaElement = null

      expect(playbackEngine.getCurrentMediaElement()).toBeNull()
    })

    it('should correctly report if media is currently displayed', () => {
      playbackEngine.currentMediaElement = null
      expect(playbackEngine.hasCurrentMedia()).toBe(false)

      playbackEngine.currentMediaElement = document.createElement('img')
      expect(playbackEngine.hasCurrentMedia()).toBe(true)
    })
  })

  describe('error scenarios', () => {
    beforeEach(() => {
      playbackEngine.init()
    })

    it('should handle clearCurrentMedia errors gracefully', () => {
      const mockElement = {
        parentNode: {
          removeChild: vi.fn(() => {
            throw new Error('DOM removal error')
          }),
        },
      }
      playbackEngine.currentMediaElement = mockElement

      expect(() => playbackEngine.clearCurrentMedia()).not.toThrow()
      expect(console.error).toHaveBeenCalledWith('Error clearing current media:', expect.any(Error))
    })
  })
})
