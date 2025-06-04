/**
 * Unit tests for PlaybackEngine module
 * Tests media element creation, fullscreen positioning, and integration with StateManager/EventBus
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { playbackEngine } from './playbackEngine.js'
import { SUPPORTED_IMAGE_MIMES, SUPPORTED_VIDEO_MIMES } from './constants/mediaTypes.js'
import { STRINGS } from './constants/strings.js'

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

// Mock stateManager
vi.mock('./stateManager.js', () => ({
  stateManager: {
    getMediaPool: vi.fn(),
    getMediaCount: vi.fn(), // Add if needed in future tests
    isMediaPoolEmpty: vi.fn(), // Add if needed in future tests
    getSegmentSettings: vi.fn(() => ({
      minDuration: 2,
      maxDuration: 5,
      skipStart: 0,
      skipEnd: 0,
    })),
  },
}))

// Mock mediaUtils
vi.mock('./utils/mediaUtils.js', () => ({
  filterUsableMedia: vi.fn((mediaPool) => mediaPool), // Return all items as usable by default
  calculateRandomSegmentDuration: vi.fn(() => 5), // Return default 5 seconds
  getVideoSegmentParameters: vi.fn(() => ({
    startPoint: 0,
    segmentDuration: 5,
    fallbackUsed: null,
  })),
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
  mimeType: SUPPORTED_IMAGE_MIMES[0],
  size: 1024000,
  file: new File([''], 'test-image.jpg', { type: SUPPORTED_IMAGE_MIMES[0] }),
  url: 'blob:test-image-url',
  addedAt: new Date(),
}

const mockVideoItem = {
  id: 'test-video-1',
  name: 'test-video.mp4',
  type: 'video',
  mimeType: SUPPORTED_VIDEO_MIMES[0],
  size: 5120000,
  file: new File([''], 'test-video.mp4', { type: SUPPORTED_VIDEO_MIMES[0] }),
  url: 'blob:test-video-url',
  addedAt: new Date(),
}

describe('PlaybackEngine', () => {
  // Store original global objects to restore later
  let originalDocument
  let originalWindow
  let originalConsole

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Store original globals if they exist
    originalDocument = globalThis.document
    originalWindow = globalThis.window
    originalConsole = globalThis.console

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
            // Add video control methods used in implementation if necessary
            play: vi.fn(),
            pause: vi.fn(),
          }
          return element
        }),
      },
      writable: true,
      configurable: true, // Make it configurable so we can delete it
    })

    // Mock window
    Object.defineProperty(globalThis, 'window', {
      value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true, // Make it configurable so we can delete it
    })

    // Mock console
    Object.defineProperty(globalThis, 'console', {
      value: {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      },
      writable: true,
      configurable: true, // Make it configurable so we can delete it
    })

    // Reset PlaybackEngine state and mocks
    playbackEngine.currentMediaElement = null
    playbackEngine.stageElement = null
    playbackEngine.isPlaybackActive = false // Reset the new property
    playbackEngine.autoPlaybackEnabled = true // Reset the new property
    vi.clearAllMocks() // Clear all mocks including the new ones

    // Re-mock getElementById and createElement after vi.clearAllMocks()
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
            // Add video control methods used in implementation if necessary
            play: vi.fn(),
            pause: vi.fn(),
          }
          return element
        }),
      },
      writable: true,
      configurable: true,
    })

    // Mock window
    Object.defineProperty(globalThis, 'window', {
      value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
      configurable: true,
    })

    // Mock console
    Object.defineProperty(globalThis, 'console', {
      value: {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    // Clean up
    vi.resetAllMocks()

    // Restore original globals or delete if they didn't exist
    try {
      if (originalDocument !== undefined) {
        globalThis.document = originalDocument
      } else {
        delete globalThis.document
      }
    } catch {
      // Ignore errors during cleanup
    }

    try {
      if (originalWindow !== undefined) {
        globalThis.window = originalWindow
      } else {
        delete globalThis.window
      }
    } catch {
      // Ignore errors during cleanup
    }

    try {
      if (originalConsole !== undefined) {
        globalThis.console = originalConsole
      } else {
        delete globalThis.console
      }
    } catch {
      // Ignore errors during cleanup
    }
  })

  describe('initialization', () => {
    it('should initialize successfully with valid stage element', () => {
      expect(() => playbackEngine.init()).not.toThrow()
      expect(document.getElementById).toHaveBeenCalledWith('stage')
      expect(playbackEngine.stageElement).toBe(mockStageElement)
      expect(playbackEngine.isPlaybackActive).toBe(false) // Initial state
      expect(playbackEngine.autoPlaybackEnabled).toBe(true) // Initial state
    })

    it('should throw error when stage element is not found', () => {
      document.getElementById = vi.fn(() => null)

      expect(() => playbackEngine.init()).toThrow('Stage element not found')
    })

    it('should set up event listeners on initialization', async () => {
      playbackEngine.init()

      const { eventBus } = await import('./eventBus.js')
      // Expect listeners for both mediaPoolUpdated and mediaPoolRestored
      expect(eventBus.on).toHaveBeenCalledWith('state.mediaPoolUpdated', expect.any(Function))
      expect(eventBus.on).toHaveBeenCalledWith('state.mediaPoolRestored', expect.any(Function))
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('automatic playback methods', () => {
    let stateManagerMock

    beforeEach(async () => {
      // Import the mocked stateManager within the test scope
      const stateManagerModule = await import('./stateManager.js')
      stateManagerMock = stateManagerModule.stateManager
      playbackEngine.init() // Ensure engine is initialized before testing these methods
    })

    it('startAutoPlayback should start playback if media pool is populated and not active', () => {
      const mockMediaPool = [mockImageItem]
      stateManagerMock.getMediaPool.mockReturnValue(mockMediaPool)
      playbackEngine.isPlaybackActive = false
      playbackEngine.autoPlaybackEnabled = true
      const startCyclingSpy = vi.spyOn(playbackEngine, 'startCycling')

      playbackEngine.startAutoPlayback()

      expect(stateManagerMock.getMediaPool).toHaveBeenCalled()
      expect(playbackEngine.isPlaybackActive).toBe(true)
      expect(startCyclingSpy).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.autoPlaybackStarted
      )
    })

    it('startAutoPlayback should not start playback if media pool is empty', () => {
      stateManagerMock.getMediaPool.mockReturnValue([])
      playbackEngine.isPlaybackActive = false
      playbackEngine.autoPlaybackEnabled = true
      const displayMediaSpy = vi.spyOn(playbackEngine, 'displayMedia')

      playbackEngine.startAutoPlayback()

      expect(stateManagerMock.getMediaPool).toHaveBeenCalled()
      expect(playbackEngine.isPlaybackActive).toBe(false)
      expect(displayMediaSpy).not.toHaveBeenCalled()
      expect(console.log).not.toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.autoPlaybackStarted
      )
    })

    it('startAutoPlayback should not start playback if already active', () => {
      const mockMediaPool = [mockImageItem]
      stateManagerMock.getMediaPool.mockReturnValue(mockMediaPool)
      playbackEngine.isPlaybackActive = true
      playbackEngine.autoPlaybackEnabled = true
      const displayMediaSpy = vi.spyOn(playbackEngine, 'displayMedia')

      playbackEngine.startAutoPlayback()

      expect(stateManagerMock.getMediaPool).toHaveBeenCalled()
      expect(playbackEngine.isPlaybackActive).toBe(true)
      expect(displayMediaSpy).not.toHaveBeenCalled()
      expect(console.log).not.toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.autoPlaybackStarted
      )
    })

    it('startAutoPlayback should not start playback if auto playback is disabled', () => {
      const mockMediaPool = [mockImageItem]
      stateManagerMock.getMediaPool.mockReturnValue(mockMediaPool)
      playbackEngine.isPlaybackActive = false
      playbackEngine.autoPlaybackEnabled = false
      const displayMediaSpy = vi.spyOn(playbackEngine, 'displayMedia')

      playbackEngine.startAutoPlayback()

      expect(stateManagerMock.getMediaPool).toHaveBeenCalled()
      expect(playbackEngine.isPlaybackActive).toBe(false)
      expect(displayMediaSpy).not.toHaveBeenCalled()
      expect(console.log).not.toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.autoPlaybackStarted
      )
    })

    it('stopAutoPlayback should stop playback if active', () => {
      playbackEngine.isPlaybackActive = true
      const clearMediaSpy = vi.spyOn(playbackEngine, 'clearCurrentMedia')
      const stopCyclingSpy = vi.spyOn(playbackEngine, 'stopCycling')

      playbackEngine.stopAutoPlayback()

      expect(playbackEngine.isPlaybackActive).toBe(false)
      expect(stopCyclingSpy).toHaveBeenCalled()
      expect(clearMediaSpy).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.autoPlaybackStopped
      )
    })

    it('stopAutoPlayback should do nothing if not active', () => {
      playbackEngine.isPlaybackActive = false
      const clearMediaSpy = vi.spyOn(playbackEngine, 'clearCurrentMedia')

      playbackEngine.stopAutoPlayback()

      expect(playbackEngine.isPlaybackActive).toBe(false)
      expect(clearMediaSpy).not.toHaveBeenCalled()
      expect(console.log).not.toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.autoPlaybackStopped
      )
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
      expect(videoElement.loop).toBe(false)
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
      expect(console.error).toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.imageCreationError,
        expect.any(Error)
      )
    })

    it('should handle video creation errors gracefully', () => {
      document.createElement = vi.fn(() => {
        throw new Error('DOM manipulation failed')
      })

      const videoElement = playbackEngine.createVideoElement(mockVideoItem)

      expect(videoElement).toBeNull()
      expect(console.error).toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.videoCreationError,
        expect.any(Error)
      )
    })

    it('should handle unsupported media types', () => {
      const unsupportedItem = { ...mockImageItem, type: 'unsupported' }

      playbackEngine.displayMedia(unsupportedItem)

      expect(mockStageElement.appendChild).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith('Unsupported media type: unsupported')
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
      expect(console.warn).toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.invalidMediaItem
      )
    })

    it('should handle media items without URL gracefully', () => {
      const invalidItem = { ...mockImageItem, url: null }

      playbackEngine.displayMedia(invalidItem)

      expect(mockStageElement.appendChild).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.invalidMediaItem
      )
    })

    it('should handle unsupported media types', () => {
      const unsupportedItem = { ...mockImageItem, type: 'unsupported' }

      playbackEngine.displayMedia(unsupportedItem)

      expect(mockStageElement.appendChild).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalledWith('Unsupported media type: unsupported')
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

  describe('media pool updates', () => {
    // This block will be enhanced to test handleMediaPoolUpdate with auto playback
    beforeEach(() => {
      // Ensure PlaybackEngine is initialized
      playbackEngine.init()
      // Reset playback state for consistent test starts
      playbackEngine.isPlaybackActive = false
      playbackEngine.autoPlaybackEnabled = true

      // Spy on start/stop methods
      vi.spyOn(playbackEngine, 'startAutoPlayback')
      vi.spyOn(playbackEngine, 'stopAutoPlayback')
      vi.spyOn(playbackEngine, 'displayMedia')
    })

    it('should stop playback when media pool is cleared', () => {
      playbackEngine.isPlaybackActive = true // Assume active playback
      const updateData = { mediaPool: [], totalCount: 0, cleared: true }

      playbackEngine.handleMediaPoolUpdate(updateData)

      expect(playbackEngine.stopAutoPlayback).toHaveBeenCalled()
      expect(playbackEngine.startAutoPlayback).not.toHaveBeenCalled()
      expect(playbackEngine.displayMedia).not.toHaveBeenCalled()
    })

    it('should stop playback when media pool becomes empty', () => {
      playbackEngine.isPlaybackActive = true // Assume active playback
      const updateData = { mediaPool: [], totalCount: 0, cleared: false }

      playbackEngine.handleMediaPoolUpdate(updateData)

      expect(playbackEngine.stopAutoPlayback).toHaveBeenCalled()
      expect(playbackEngine.startAutoPlayback).not.toHaveBeenCalled()
      expect(playbackEngine.displayMedia).not.toHaveBeenCalled()
    })

    it('should start playback when media pool becomes populated from empty', async () => {
      playbackEngine.isPlaybackActive = false // Assume not active initially
      const mockMediaPool = [mockImageItem]
      const updateData = { mediaPool: mockMediaPool, totalCount: 1, cleared: false }

      // Don't spy on startAutoPlayback since we want it to execute and call displayMedia
      // Only spy on displayMedia to verify it gets called
      vi.restoreAllMocks() // Clear the spies from beforeEach
      vi.spyOn(playbackEngine, 'displayMedia')

      // Mock stateManager.getMediaPool to return our mock data
      const stateManagerModule = await import('./stateManager.js')
      const stateManagerMock = stateManagerModule.stateManager
      stateManagerMock.getMediaPool.mockReturnValue(mockMediaPool)

      playbackEngine.handleMediaPoolUpdate(updateData)

      // Verify displayMedia was called with the expected media item
      expect(playbackEngine.displayMedia).toHaveBeenCalledWith(mockMediaPool[0])
      expect(console.log).toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.autoPlaybackStarted
      )
    })

    it('should not start playback if media pool becomes populated but auto playback is disabled', () => {
      playbackEngine.isPlaybackActive = false
      playbackEngine.autoPlaybackEnabled = false
      const mockMediaPool = [mockImageItem]
      const updateData = { mediaPool: mockMediaPool, totalCount: 1, cleared: false }

      playbackEngine.handleMediaPoolUpdate(updateData)

      expect(playbackEngine.stopAutoPlayback).not.toHaveBeenCalled()
      expect(playbackEngine.startAutoPlayback).not.toHaveBeenCalled()
      expect(playbackEngine.displayMedia).not.toHaveBeenCalled()
    })

    it('should update display when media pool is updated while playback is active', () => {
      playbackEngine.isPlaybackActive = true // Assume active playback
      playbackEngine.isCyclingActive = false // Not cycling yet
      const updateData = { totalCount: 2, cleared: false }
      const startCyclingSpy = vi.spyOn(playbackEngine, 'startCycling')

      playbackEngine.handleMediaPoolUpdate(updateData)

      expect(playbackEngine.stopAutoPlayback).not.toHaveBeenCalled()
      expect(playbackEngine.startAutoPlayback).not.toHaveBeenCalled() // Should not restart, just update display
      // Expect startCycling to be called since cycling is not active
      expect(startCyclingSpy).toHaveBeenCalled()
    })

    it('should handle mediaPoolRestored event the same as mediaPoolUpdated', async () => {
      // This test checks the event listener setup in init
      // We verify that both events are registered with the handleMediaPoolUpdate handler
      playbackEngine.init()

      const { eventBus } = await import('./eventBus.js')

      // Find the listener function that was registered
      const mediaUpdatedListenerCall = eventBus.on.mock.calls.find(
        (call) => call[0] === 'state.mediaPoolUpdated'
      )
      const mediaRestoredListenerCall = eventBus.on.mock.calls.find(
        (call) => call[0] === 'state.mediaPoolRestored'
      )

      expect(mediaUpdatedListenerCall).toBeDefined()
      expect(mediaRestoredListenerCall).toBeDefined()

      // Verify both events are registered (even though bound functions are different instances)
      expect(mediaUpdatedListenerCall[1]).toEqual(expect.any(Function))
      expect(mediaRestoredListenerCall[1]).toEqual(expect.any(Function))

      // Test that both events call the same underlying method
      const updateDataTest = { mediaPool: [], totalCount: 0, cleared: true }
      const stopSpy = vi.spyOn(playbackEngine, 'stopAutoPlayback')

      // Call both event handlers with the same data
      mediaUpdatedListenerCall[1](updateDataTest)
      mediaRestoredListenerCall[1](updateDataTest)

      // Both should result in the same behavior (stopAutoPlayback called twice)
      expect(stopSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('cleanup', () => {
    it('should remove event listeners and stop playback', async () => {
      // Initialize first to set up listeners
      playbackEngine.init()
      playbackEngine.isPlaybackActive = true // Assume active for cleanup test

      const { eventBus } = await import('./eventBus.js')
      const stopPlaybackSpy = vi.spyOn(playbackEngine, 'stopAutoPlayback')

      playbackEngine.cleanup()

      // Verify event listeners are removed
      expect(eventBus.off).toHaveBeenCalledWith('state.mediaPoolUpdated', expect.any(Function))
      expect(eventBus.off).toHaveBeenCalledWith('state.mediaPoolRestored', expect.any(Function))
      expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))

      // Verify stopAutoPlayback is called
      expect(stopPlaybackSpy).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.cleanupCompleted
      )
    })
  })

  describe('window resize handling', () => {
    beforeEach(() => {
      playbackEngine.init()
    })

    it('should handle window resize when media is displayed', () => {
      playbackEngine.currentMediaElement = document.createElement('img')

      playbackEngine.handleWindowResize()

      expect(console.log).toHaveBeenCalledWith(STRINGS.SYSTEM_MESSAGES.playbackEngine.windowResized)
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
      expect(console.error).toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.windowResizeError,
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
      expect(console.error).toHaveBeenCalledWith(
        STRINGS.SYSTEM_MESSAGES.playbackEngine.currentMediaClearError,
        expect.any(Error)
      )
    })
  })

  describe('media cycling functionality', () => {
    let stateManagerMock
    let eventBusMock

    beforeEach(async () => {
      const stateManagerModule = await import('./stateManager.js')
      stateManagerMock = stateManagerModule.stateManager

      const eventBusModule = await import('./eventBus.js')
      eventBusMock = eventBusModule.eventBus

      playbackEngine.init()

      // Reset cycling state
      playbackEngine.isCyclingActive = false
      playbackEngine.cyclingTimer = null
      playbackEngine.currentMediaItem = null
      playbackEngine.recentMediaHistory = []
      playbackEngine.playbackState = 'inactive'
    })

    describe('getRandomMediaItem', () => {
      it('should return null when media pool is empty', () => {
        stateManagerMock.getMediaPool.mockReturnValue([])

        const result = playbackEngine.getRandomMediaItem()

        expect(result).toBeNull()
      })

      it('should return the only item when media pool has one item', () => {
        const mockMediaPool = [mockImageItem]
        stateManagerMock.getMediaPool.mockReturnValue(mockMediaPool)

        const result = playbackEngine.getRandomMediaItem()

        expect(result).toBe(mockImageItem)
      })

      it('should return a random item from multiple items', () => {
        const mockMediaPool = [mockImageItem, mockVideoItem]
        stateManagerMock.getMediaPool.mockReturnValue(mockMediaPool)

        const result = playbackEngine.getRandomMediaItem()

        expect(mockMediaPool).toContain(result)
      })

      it('should avoid recently played items', () => {
        const mockItem3 = { ...mockImageItem, id: 'test-image-3', name: 'test3.jpg' }
        const mockMediaPool = [mockImageItem, mockVideoItem, mockItem3]
        stateManagerMock.getMediaPool.mockReturnValue(mockMediaPool)

        // Add items to recent history
        playbackEngine.recentMediaHistory = [mockImageItem, mockVideoItem]

        const result = playbackEngine.getRandomMediaItem()

        expect(result).toBe(mockItem3)
      })

      it('should handle errors gracefully', () => {
        stateManagerMock.getMediaPool.mockImplementation(() => {
          throw new Error('State error')
        })

        playbackEngine.startCycling()

        expect(console.error).toHaveBeenCalledWith(
          STRINGS.SYSTEM_MESSAGES.playbackEngine.randomMediaSelectionError,
          expect.any(Error)
        )
        expect(playbackEngine.isCyclingActive).toBe(false)
      })
    })

    describe('addToRecentHistory', () => {
      it('should add item to beginning of history', () => {
        playbackEngine.addToRecentHistory(mockImageItem)

        expect(playbackEngine.recentMediaHistory).toHaveLength(1)
        expect(playbackEngine.recentMediaHistory[0]).toBe(mockImageItem)
      })

      it('should remove duplicate items before adding', () => {
        playbackEngine.recentMediaHistory = [mockVideoItem, mockImageItem]
        playbackEngine.addToRecentHistory(mockImageItem)

        expect(playbackEngine.recentMediaHistory).toHaveLength(2)
        expect(playbackEngine.recentMediaHistory[0]).toBe(mockImageItem)
        expect(playbackEngine.recentMediaHistory[1]).toBe(mockVideoItem)
      })

      it('should limit history size', () => {
        const mockItem3 = { ...mockImageItem, id: 'test-3' }
        const mockItem4 = { ...mockImageItem, id: 'test-4' }
        const mockItem5 = { ...mockImageItem, id: 'test-5' }

        playbackEngine.addToRecentHistory(mockImageItem)
        playbackEngine.addToRecentHistory(mockVideoItem)
        playbackEngine.addToRecentHistory(mockItem3)
        playbackEngine.addToRecentHistory(mockItem4)
        playbackEngine.addToRecentHistory(mockItem5)

        expect(playbackEngine.recentMediaHistory).toHaveLength(3) // RECENT_ITEMS_HISTORY_SIZE
        expect(playbackEngine.recentMediaHistory[0]).toBe(mockItem5)
      })

      it('should handle null input gracefully', () => {
        playbackEngine.addToRecentHistory(null)

        expect(playbackEngine.recentMediaHistory).toHaveLength(0)
      })
    })

    describe('cycling timer management', () => {
      it('should clear cycling timer', () => {
        const mockTimer = setTimeout(() => {}, 1000)
        playbackEngine.cyclingTimer = mockTimer

        playbackEngine.clearCyclingTimer()

        expect(playbackEngine.cyclingTimer).toBeNull()
      })

      it('should schedule image transition', () => {
        vi.useFakeTimers()
        const transitionSpy = vi.spyOn(playbackEngine, 'transitionToNextMedia')

        playbackEngine.scheduleImageTransition()

        expect(playbackEngine.cyclingTimer).toBeDefined()

        vi.advanceTimersByTime(4000) // Default segment duration (was IMAGE_DISPLAY_DURATION)
        expect(transitionSpy).toHaveBeenCalled()

        vi.useRealTimers()
      })

      it('should schedule video max duration transition', () => {
        vi.useFakeTimers()
        const transitionSpy = vi.spyOn(playbackEngine, 'transitionToNextMedia')

        playbackEngine.scheduleVideoMaxDurationTransition()

        expect(playbackEngine.cyclingTimer).toBeDefined()

        vi.advanceTimersByTime(30000) // DURATION_MAX_LIMIT * 1000
        expect(transitionSpy).toHaveBeenCalled()

        vi.useRealTimers()
      })
    })

    describe('startCycling', () => {
      it('should start cycling with first random media item', () => {
        const mockMediaPool = [mockImageItem, mockVideoItem]
        stateManagerMock.getMediaPool.mockReturnValue(mockMediaPool)
        const displayMediaSpy = vi.spyOn(playbackEngine, 'displayMedia')

        playbackEngine.startCycling()

        expect(playbackEngine.isCyclingActive).toBe(true)
        expect(playbackEngine.playbackState).toBe('cycling')
        expect(playbackEngine.currentMediaItem).toBeDefined()
        expect(displayMediaSpy).toHaveBeenCalled()
        expect(eventBusMock.emit).toHaveBeenCalledWith('cycling.started', expect.any(Object))
      })

      it('should not start cycling if already active', () => {
        playbackEngine.isCyclingActive = true
        const displayMediaSpy = vi.spyOn(playbackEngine, 'displayMedia')

        playbackEngine.startCycling()

        expect(displayMediaSpy).not.toHaveBeenCalled()
      })

      it('should not start cycling if no usable media available', () => {
        stateManagerMock.getMediaPool.mockReturnValue([])
        const displayMediaSpy = vi.spyOn(playbackEngine, 'displayMedia')

        playbackEngine.startCycling()

        expect(playbackEngine.isCyclingActive).toBe(false)
        expect(displayMediaSpy).not.toHaveBeenCalled()
      })

      it('should handle errors gracefully', () => {
        stateManagerMock.getMediaPool.mockImplementation(() => {
          throw new Error('State error')
        })

        playbackEngine.startCycling()

        expect(console.error).toHaveBeenCalledWith(
          STRINGS.SYSTEM_MESSAGES.playbackEngine.randomMediaSelectionError,
          expect.any(Error)
        )
        expect(playbackEngine.isCyclingActive).toBe(false)
      })
    })

    describe('stopCycling', () => {
      it('should stop cycling and clear timer', () => {
        playbackEngine.isCyclingActive = true
        playbackEngine.cyclingTimer = setTimeout(() => {}, 1000)
        playbackEngine.currentMediaElement = document.createElement('img')

        playbackEngine.stopCycling()

        expect(playbackEngine.isCyclingActive).toBe(false)
        expect(playbackEngine.cyclingTimer).toBeNull()
        expect(playbackEngine.playbackState).toBe('active')
        expect(eventBusMock.emit).toHaveBeenCalledWith('cycling.stopped', expect.any(Object))
      })

      it('should not stop cycling if not active', () => {
        playbackEngine.isCyclingActive = false

        playbackEngine.stopCycling()

        expect(eventBusMock.emit).not.toHaveBeenCalledWith('cycling.stopped', expect.any(Object))
      })

      it('should set correct playback state based on current media', () => {
        playbackEngine.isCyclingActive = true
        playbackEngine.currentMediaElement = null

        playbackEngine.stopCycling()

        expect(playbackEngine.playbackState).toBe('inactive')
      })
    })

    describe('transitionToNextMedia', () => {
      it('should transition to next media item', () => {
        const mockMediaPool = [mockImageItem, mockVideoItem]
        stateManagerMock.getMediaPool.mockReturnValue(mockMediaPool)
        playbackEngine.isCyclingActive = true
        const displayMediaSpy = vi.spyOn(playbackEngine, 'displayMedia')

        playbackEngine.transitionToNextMedia()

        expect(displayMediaSpy).toHaveBeenCalled()
        expect(playbackEngine.currentMediaItem).toBeDefined()
        expect(eventBusMock.emit).toHaveBeenCalledWith('cycling.mediaChanged', expect.any(Object))
      })

      it('should not transition if cycling is not active', () => {
        playbackEngine.isCyclingActive = false
        const displayMediaSpy = vi.spyOn(playbackEngine, 'displayMedia')

        playbackEngine.transitionToNextMedia()

        expect(displayMediaSpy).not.toHaveBeenCalled()
      })

      it('should stop cycling if no media available', () => {
        playbackEngine.isCyclingActive = true
        stateManagerMock.getMediaPool.mockReturnValue([])
        const stopCyclingSpy = vi.spyOn(playbackEngine, 'stopCycling')

        playbackEngine.transitionToNextMedia()

        expect(stopCyclingSpy).toHaveBeenCalled()
      })

      it('should handle errors gracefully', () => {
        playbackEngine.isCyclingActive = true
        stateManagerMock.getMediaPool.mockImplementation(() => {
          throw new Error('Transition error')
        })

        playbackEngine.transitionToNextMedia()

        expect(console.error).toHaveBeenCalledWith(
          STRINGS.SYSTEM_MESSAGES.playbackEngine.randomMediaSelectionError,
          expect.any(Error)
        )
      })
    })

    describe('integration with media element creation', () => {
      beforeEach(() => {
        playbackEngine.isCyclingActive = true
      })

      it('should schedule image transition when image loads during cycling', () => {
        const scheduleImageTransitionSpy = vi.spyOn(playbackEngine, 'scheduleImageTransition')

        const imageElement = playbackEngine.createImageElement(mockImageItem)

        // Simulate image load event
        const loadHandler = imageElement.addEventListener.mock.calls.find(
          (call) => call[0] === 'load'
        )[1]
        loadHandler()

        expect(scheduleImageTransitionSpy).toHaveBeenCalled()
      })

      it('should transition to next media when image fails to load during cycling', () => {
        vi.useFakeTimers()
        const transitionSpy = vi.spyOn(playbackEngine, 'transitionToNextMedia')

        const imageElement = playbackEngine.createImageElement(mockImageItem)

        // Simulate image error event
        const errorHandler = imageElement.addEventListener.mock.calls.find(
          (call) => call[0] === 'error'
        )[1]
        errorHandler()

        vi.advanceTimersByTime(100) // MIN_TRANSITION_DELAY
        expect(transitionSpy).toHaveBeenCalled()

        vi.useRealTimers()
      })

      it('should transition to next media when video ends during cycling', () => {
        const transitionSpy = vi.spyOn(playbackEngine, 'transitionToNextMedia')

        const videoElement = playbackEngine.createVideoElement(mockVideoItem)

        // Simulate video ended event
        const endedHandler = videoElement.addEventListener.mock.calls.find(
          (call) => call[0] === 'ended'
        )[1]
        endedHandler()

        expect(transitionSpy).toHaveBeenCalled()
      })

      it('should schedule segment transition when video metadata loads during cycling', () => {
        const scheduleVideoSegmentSpy = vi.spyOn(playbackEngine, 'scheduleVideoSegmentTransition')

        const videoElement = playbackEngine.createVideoElement(mockVideoItem, {
          minDuration: 5,
          maxDuration: 5,
          skipStart: 0,
          skipEnd: 0,
        })

        // Mock video duration for segment calculation
        videoElement.duration = 30

        // Simulate video loadedmetadata event
        const metadataHandler = videoElement.addEventListener.mock.calls.find(
          (call) => call[0] === 'loadedmetadata'
        )[1]
        metadataHandler()

        expect(scheduleVideoSegmentSpy).toHaveBeenCalled()
      })

      it('should ensure video loop is disabled for cycling', () => {
        const videoElement = playbackEngine.createVideoElement(mockVideoItem)

        expect(videoElement.loop).toBe(false)
      })
    })
  })
})
