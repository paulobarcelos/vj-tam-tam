/**
 * Unit tests for video segment timing precision in PlaybackEngine
 * Tests the enhanced video timing functionality implemented in Story 2.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { playbackEngine } from './playbackEngine.js'
import { PLAYBACK_CONFIG } from './constants/playbackConfig.js'
import { stateManager } from './stateManager.js'
import { toastManager } from './toastManager.js'

// Mock dependencies
vi.mock('./eventBus.js')
vi.mock('./stateManager.js')
vi.mock('./toastManager.js')
vi.mock('./constants/strings.js', () => ({
  STRINGS: {
    SYSTEM_MESSAGES: {
      playbackEngine: {
        videoMetadataLoaded: 'Video metadata loaded for {fileName}',
        videoLoadError: 'Video load error for {fileName}',
        videoCreationError: 'Video creation error',
        currentMediaClearError: 'Current media clear error',
        cyclingTransitionError: 'Cycling transition error',
        randomMediaSelectionError: 'Random media selection error',
      },
    },
    USER_MESSAGES: {
      notifications: {
        error: {
          videoLoadFailed: 'Video load failed for {fileName}',
        },
        info: {
          videoOffsetFallback: 'Video offset fallback used',
        },
      },
    },
  },
  t: {
    get: vi.fn((key, params) => {
      if (params) {
        return key.replace(/{(\w+)}/g, (match, param) => params[param] || match)
      }
      return key
    }),
  },
}))

// Mock mediaUtils
vi.mock('./utils/mediaUtils.js', () => ({
  getVideoSegmentParameters: vi.fn(),
  filterUsableMedia: vi.fn(),
}))

describe('PlaybackEngine - Video Segment Timing Precision', () => {
  let mockStageElement
  let mediaItem
  let segmentSettings

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Create mock stage element
    mockStageElement = {
      appendChild: vi.fn(),
      id: 'stage',
    }

    // Mock DOM methods
    vi.stubGlobal('document', {
      getElementById: vi.fn(() => mockStageElement),
      createElement: vi.fn((tagName) => {
        if (tagName === 'video') {
          return createMockVideoElement()
        }
        return {}
      }),
    })

    // Create mock video element with event system
    function createMockVideoElement() {
      const element = {
        tagName: 'VIDEO',
        className: '',
        src: '',
        autoplay: false,
        muted: false,
        loop: false,
        controls: false,
        currentTime: 0,
        duration: 10,
        _segmentSettings: null,
        _mediaItem: null,
        _segmentState: null,
        _segmentParams: null,
        eventListeners: {},
        addEventListener: vi.fn((event, handler) => {
          if (!element.eventListeners[event]) {
            element.eventListeners[event] = []
          }
          element.eventListeners[event].push(handler)
        }),
        removeEventListener: vi.fn(),
        parentNode: {
          removeChild: vi.fn(),
        },
        // Helper method to trigger events
        _triggerEvent: (eventType, eventData = {}) => {
          if (element.eventListeners[eventType]) {
            element.eventListeners[eventType].forEach((handler) => handler(eventData))
          }
        },
      }
      return element
    }

    // Mock media item
    mediaItem = {
      id: 'test-video-1',
      name: 'test-video.mp4',
      type: 'video',
      mimeType: 'video/mp4',
      url: 'blob:test-url',
      file: new File(['test'], 'test-video.mp4', { type: 'video/mp4' }),
    }

    // Mock segment settings
    segmentSettings = {
      minDuration: 2,
      maxDuration: 5,
      skipStart: 0,
      skipEnd: 0,
    }

    // Mock stateManager methods
    stateManager.getMediaPool.mockReturnValue([])

    // Initialize playback engine
    playbackEngine.stageElement = mockStageElement
    playbackEngine.isCyclingActive = true
  })

  afterEach(() => {
    playbackEngine.isCyclingActive = false
    playbackEngine.currentMediaElement = null
    vi.restoreAllMocks()
  })

  describe('AC 2.1: Video playback begins precisely at calculated start point', () => {
    it('should seek to calculated start point when metadata loads', async () => {
      // Mock getVideoSegmentParameters
      const { getVideoSegmentParameters } = await import('./utils/mediaUtils.js')
      getVideoSegmentParameters.mockReturnValue({
        startPoint: 3.5,
        segmentDuration: 4,
        fallbackUsed: null,
      })

      // Create video element
      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)
      expect(videoElement).toBeTruthy()

      // Set video duration and trigger loadedmetadata
      videoElement.duration = 10
      videoElement._triggerEvent('loadedmetadata')

      // Verify seeking was attempted
      expect(videoElement.currentTime).toBe(3.5)
      expect(videoElement._segmentState.seekTarget).toBe(3.5)
      expect(videoElement._segmentState.startPoint).toBe(3.5)
    })

    it('should retry seeking if initial seek is not accurate enough', async () => {
      const { getVideoSegmentParameters } = await import('./utils/mediaUtils.js')
      getVideoSegmentParameters.mockReturnValue({
        startPoint: 3.5,
        segmentDuration: 4,
        fallbackUsed: null,
      })

      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)
      videoElement.duration = 10
      videoElement._triggerEvent('loadedmetadata')

      // Simulate inaccurate seeking (current time doesn't match target)
      videoElement.currentTime = 2.8 // Off by 0.7 seconds (> 0.5 tolerance)
      videoElement._triggerEvent('seeked')

      // Should retry seeking
      expect(videoElement._segmentState.seekAttempts).toBe(1)
      expect(videoElement.currentTime).toBe(3.5) // Should retry with target
    })

    it('should stop retrying after maximum attempts', async () => {
      const { getVideoSegmentParameters } = await import('./utils/mediaUtils.js')
      getVideoSegmentParameters.mockReturnValue({
        startPoint: 3.5,
        segmentDuration: 4,
        fallbackUsed: null,
      })

      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)
      videoElement.duration = 10
      videoElement._triggerEvent('loadedmetadata')

      // Simulate maximum retry attempts
      for (let i = 0; i < PLAYBACK_CONFIG.VIDEO_TIMING.MAX_SEEKING_ATTEMPTS; i++) {
        videoElement.currentTime = 2.8 // Always inaccurate
        videoElement._triggerEvent('seeked')
      }

      // Simulate final seeked event that should stop retrying
      videoElement.currentTime = 2.8 // Still inaccurate but max attempts reached
      videoElement._triggerEvent('seeked')

      // After max attempts, should stop retrying
      expect(videoElement._segmentState.seekAttempts).toBe(0)
      expect(videoElement._segmentState.seekTarget).toBeNull()
    })
  })

  describe('AC 2.2: Video playback continues for exact segment duration', () => {
    it('should monitor timeupdate and transition at segment end', async () => {
      const { getVideoSegmentParameters } = await import('./utils/mediaUtils.js')
      getVideoSegmentParameters.mockReturnValue({
        startPoint: 3.5,
        segmentDuration: 4,
        fallbackUsed: null,
      })

      // Mock transitionToNextMedia to prevent actual execution
      const transitionSpy = vi
        .spyOn(playbackEngine, 'transitionToNextMedia')
        .mockImplementation(() => {})

      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)
      videoElement.duration = 10
      videoElement._triggerEvent('loadedmetadata')

      // Simulate video playing before segment end (outside tolerance)
      // segmentEndTime = 7.5, tolerance = 0.1, so trigger point is 7.4
      videoElement.currentTime = 7.3 // Before trigger point
      videoElement._triggerEvent('timeupdate')

      // Should not transition yet
      expect(transitionSpy).not.toHaveBeenCalled()

      // Simulate reaching segment end within tolerance
      videoElement.currentTime = 7.4 // At trigger point (7.5 - 0.1)
      videoElement._triggerEvent('timeupdate')

      // Should transition now
      expect(transitionSpy).toHaveBeenCalled()
      expect(videoElement._segmentState.isMonitoring).toBe(false)
    })

    it('should transition when approaching segment end within tolerance', async () => {
      const { getVideoSegmentParameters } = await import('./utils/mediaUtils.js')
      getVideoSegmentParameters.mockReturnValue({
        startPoint: 2,
        segmentDuration: 3,
        fallbackUsed: null,
      })

      const transitionSpy = vi
        .spyOn(playbackEngine, 'transitionToNextMedia')
        .mockImplementation(() => {})

      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)
      videoElement.duration = 10
      videoElement._triggerEvent('loadedmetadata')

      // Simulate time slightly before segment end but within tolerance
      const segmentEnd = 5 // 2 + 3
      const tolerance = PLAYBACK_CONFIG.VIDEO_TIMING.SEGMENT_END_TOLERANCE
      videoElement.currentTime = segmentEnd - tolerance + 0.05 // Within tolerance

      videoElement._triggerEvent('timeupdate')

      expect(transitionSpy).toHaveBeenCalled()
    })

    it('should throttle timeupdate checks for performance', async () => {
      const { getVideoSegmentParameters } = await import('./utils/mediaUtils.js')
      getVideoSegmentParameters.mockReturnValue({
        startPoint: 2,
        segmentDuration: 3,
        fallbackUsed: null,
      })

      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)
      videoElement.duration = 10
      videoElement._triggerEvent('loadedmetadata')

      // Set initial time and trigger timeupdate
      videoElement.currentTime = 3
      videoElement._triggerEvent('timeupdate')

      // Immediately trigger again with small time difference (should be throttled)
      videoElement.currentTime = 3.05 // Less than threshold
      videoElement._triggerEvent('timeupdate')

      // Should only process the first timeupdate
      expect(videoElement._segmentState.lastTimeUpdateCheck).toBe(3)
    })
  })

  describe('AC 2.3: Hard cut transition to next media at segment end', () => {
    it('should immediately transition without fade or delay', async () => {
      const { getVideoSegmentParameters } = await import('./utils/mediaUtils.js')
      getVideoSegmentParameters.mockReturnValue({
        startPoint: 1,
        segmentDuration: 2,
        fallbackUsed: null,
      })

      const transitionSpy = vi
        .spyOn(playbackEngine, 'transitionToNextMedia')
        .mockImplementation(() => {})

      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)
      videoElement.duration = 10
      videoElement._triggerEvent('loadedmetadata')

      // Simulate reaching segment end
      videoElement.currentTime = 3 // 1 + 2 = 3
      videoElement._triggerEvent('timeupdate')

      // Should transition immediately
      expect(transitionSpy).toHaveBeenCalledTimes(1)
      expect(videoElement._segmentState.isMonitoring).toBe(false)
    })
  })

  describe('AC 2.4: Early termination when video ends naturally', () => {
    it('should transition immediately when video ends before segment duration', async () => {
      const { getVideoSegmentParameters } = await import('./utils/mediaUtils.js')
      getVideoSegmentParameters.mockReturnValue({
        startPoint: 7,
        segmentDuration: 5, // Would end at 12, but video is only 10 seconds
        fallbackUsed: null,
      })

      const transitionSpy = vi
        .spyOn(playbackEngine, 'transitionToNextMedia')
        .mockImplementation(() => {})

      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)
      videoElement.duration = 10
      videoElement._triggerEvent('loadedmetadata')

      // Simulate video ending naturally
      videoElement._triggerEvent('ended')

      // Should transition immediately and stop monitoring
      expect(transitionSpy).toHaveBeenCalledTimes(1)
      expect(videoElement._segmentState.isMonitoring).toBe(false)
    })

    it('should clean up monitoring state when video ends', async () => {
      const { getVideoSegmentParameters } = await import('./utils/mediaUtils.js')
      getVideoSegmentParameters.mockReturnValue({
        startPoint: 1,
        segmentDuration: 3,
        fallbackUsed: null,
      })

      // Mock transitionToNextMedia to prevent actual execution
      vi.spyOn(playbackEngine, 'transitionToNextMedia').mockImplementation(() => {})

      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)
      videoElement.duration = 10
      videoElement._triggerEvent('loadedmetadata')

      // Verify monitoring is active
      expect(videoElement._segmentState.isMonitoring).toBe(true)

      // Trigger video end
      videoElement._triggerEvent('ended')

      // Monitoring should be stopped
      expect(videoElement._segmentState.isMonitoring).toBe(false)
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle video load errors gracefully', async () => {
      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)

      // Simulate video load error
      videoElement._triggerEvent('error')

      // Should clean up state and attempt transition after delay
      expect(videoElement._segmentState.isMonitoring).toBe(false)
      expect(toastManager.error).toHaveBeenCalled()
    })

    it('should handle segment calculation errors', async () => {
      const { getVideoSegmentParameters } = await import('./utils/mediaUtils.js')
      getVideoSegmentParameters.mockImplementation(() => {
        throw new Error('Segment calculation failed')
      })

      // Should not throw and should create video element
      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)
      expect(videoElement).toBeTruthy()

      // Trigger loadedmetadata
      videoElement.duration = 10
      videoElement._triggerEvent('loadedmetadata')

      // Should handle error gracefully
      expect(videoElement._segmentState.startPoint).toBeNull()
    })

    it('should handle seeking errors gracefully', () => {
      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)

      // Mock seeking to throw error
      Object.defineProperty(videoElement, 'currentTime', {
        set: () => {
          throw new Error('Seeking failed')
        },
        get: () => 0,
      })

      // Should not throw
      expect(() => {
        playbackEngine.seekToStartPoint(videoElement, 3.5)
      }).not.toThrow()

      // Should clear seek target
      expect(videoElement._segmentState.seekTarget).toBeNull()
    })
  })

  describe('Cleanup and state management', () => {
    it('should clean up video state when clearing current media', async () => {
      const { getVideoSegmentParameters } = await import('./utils/mediaUtils.js')
      getVideoSegmentParameters.mockReturnValue({
        startPoint: 2,
        segmentDuration: 3,
        fallbackUsed: null,
      })

      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)
      videoElement.duration = 10
      videoElement._triggerEvent('loadedmetadata')

      playbackEngine.currentMediaElement = videoElement

      // Verify monitoring is active
      expect(videoElement._segmentState.isMonitoring).toBe(true)

      // Clear current media
      playbackEngine.clearCurrentMedia()

      // Should clean up state
      expect(videoElement._segmentState.isMonitoring).toBe(false)
      expect(videoElement._segmentState.seekTarget).toBeNull()
    })

    it('should clean up state during transitions', async () => {
      const { getVideoSegmentParameters } = await import('./utils/mediaUtils.js')
      const { filterUsableMedia } = await import('./utils/mediaUtils.js')

      getVideoSegmentParameters.mockReturnValue({
        startPoint: 2,
        segmentDuration: 3,
        fallbackUsed: null,
      })

      filterUsableMedia.mockReturnValue([mediaItem])
      stateManager.getMediaPool.mockReturnValue([mediaItem])

      const videoElement = playbackEngine.createVideoElement(mediaItem, segmentSettings)
      videoElement.duration = 10
      videoElement._triggerEvent('loadedmetadata')

      playbackEngine.currentMediaElement = videoElement
      playbackEngine.currentMediaItem = mediaItem

      // Mock getRandomMediaItem to return new media
      vi.spyOn(playbackEngine, 'getRandomMediaItem').mockReturnValue({
        ...mediaItem,
        id: 'test-video-2',
      })

      // Trigger transition
      playbackEngine.transitionToNextMedia()

      // Should clean up previous media state
      expect(videoElement._segmentState.isMonitoring).toBe(false)
      expect(videoElement._segmentState.seekTarget).toBeNull()
    })
  })

  describe('Fallback mechanisms', () => {
    it('should attempt fail-safe transition on error', async () => {
      const { filterUsableMedia } = await import('./utils/mediaUtils.js')

      // Mock error during normal transition
      vi.spyOn(playbackEngine, 'getRandomMediaItem').mockImplementation(() => {
        throw new Error('Selection failed')
      })

      // Mock fallback data
      filterUsableMedia.mockReturnValue([mediaItem])
      stateManager.getMediaPool.mockReturnValue([mediaItem])

      // Restore getRandomMediaItem for second call (fallback)
      playbackEngine.getRandomMediaItem.mockRestore()
      vi.spyOn(playbackEngine, 'getRandomMediaItem')
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(mediaItem)

      // Should not throw and should attempt fallback
      expect(() => {
        playbackEngine.transitionToNextMedia()
      }).not.toThrow()
    })

    it('should stop cycling if all fallbacks fail', async () => {
      const { filterUsableMedia } = await import('./utils/mediaUtils.js')

      // Mock all methods to fail
      vi.spyOn(playbackEngine, 'getRandomMediaItem').mockReturnValue(null)
      filterUsableMedia.mockReturnValue([])
      stateManager.getMediaPool.mockReturnValue([])

      const stopCyclingSpy = vi.spyOn(playbackEngine, 'stopCycling')

      playbackEngine.transitionToNextMedia()

      expect(stopCyclingSpy).toHaveBeenCalled()
    })
  })
})
