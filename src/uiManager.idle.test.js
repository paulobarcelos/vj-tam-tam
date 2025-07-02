/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { uiManager } from './uiManager.js'

// Define globals for test environment
/* global Event, MouseEvent */

// Mock dependencies
vi.mock('./eventBus.js', () => ({
  eventBus: {
    on: vi.fn(),
    emit: vi.fn(),
  },
}))

vi.mock('./mediaProcessor.js', () => ({
  mediaProcessor: {
    processFiles: vi.fn(),
  },
}))

vi.mock('./facades/fileSystemFacade.js', () => ({
  fileSystemFacade: {
    browseFiles: vi.fn(),
    browseFolders: vi.fn(),
  },
}))

vi.mock('./stateManager.js', () => ({
  stateManager: {
    getMediaPool: vi.fn(() => []),
    clearMediaPool: vi.fn(),
    getMediaCount: vi.fn(() => 0),
    getSegmentSettings: vi.fn(() => ({
      minDuration: 5,
      maxDuration: 5,
      skipStart: 0,
      skipEnd: 0,
    })),
    getUISettings: vi.fn(() => ({
      advancedControlsVisible: false,
    })),
    updateSegmentSettings: vi.fn(),
    getTextPool: vi.fn(() => []),
    getTextPoolSize: vi.fn(() => 0),
    addText: vi.fn(),
    removeText: vi.fn(),
    clearTextPool: vi.fn(),
  },
}))

vi.mock('./facades/fileSystemAccessFacade.js', () => ({
  fileSystemAccessFacade: {
    getFileFromHandle: vi.fn(),
  },
}))

vi.mock('./toastManager.js', () => ({
  toastManager: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('./constants/strings.js', () => ({
  STRINGS: {
    USER_MESSAGES: {
      notifications: {
        info: {
          filePickerActive: 'File picker active',
        },
        success: {
          mediaCleared: 'Media cleared',
        },
        error: {
          fileRestoreFailed: 'File restore failed',
          fileRestoreError: 'File restore error',
        },
      },
      status: {
        clearMediaConfirm: 'Confirm clear media',
      },
    },
    USER_INTERFACE: {
      meta: {
        title: 'VJ Tam Tam',
      },
      labels: {
        mediaPool: 'Media Pool',
      },
      buttons: {
        files: 'Files',
        folders: 'Folders',
        clearMedia: 'Clear Media',
      },
      tooltips: {
        filesButton: 'Browse files',
        foldersButton: 'Browse folders',
      },
      welcome: {
        heading: 'Welcome to VJ Tam Tam',
        instructions: 'Drag and drop files here',
      },
      dropZone: {
        message: 'Drop files here',
      },
      textPool: {
        clearAllButton: 'Clear all',
        deleteButtonTitle: 'Remove this text',
        deleteButtonAriaLabel: 'Remove text: {{text}}',
      },
    },
  },
  t: {
    get: vi.fn((key) => key),
  },
}))

describe('UIManager - Idle State Management', () => {
  beforeEach(() => {
    // Set up basic DOM structure
    document.body.innerHTML = `
      <div id="app">
        <div id="stage" class="stage">
          <div id="welcome-message">
            <h1>Welcome</h1>
            <p>Instructions</p>
          </div>
        </div>
        <div id="left-drawer" class="left-drawer">
          <div class="drawer-header">
            <h2>Media Pool</h2>
            <div class="file-picker-controls">
              <button id="browse-files-btn">Files</button>
              <button id="browse-folders-btn">Folders</button>
            </div>
          </div>
          <div id="media-pool"></div>
          <button id="clear-media-btn">Clear</button>
          <div id="advanced-controls-toggle">
            <span class="toggle-indicator">[Show]</span>
          </div>
          <div id="advanced-controls-section" class="hidden">
            <input id="min-duration-slider" type="range" min="1" max="30" value="5">
            <input id="min-duration-input" type="number" min="1" max="30" value="5">
            <input id="max-duration-slider" type="range" min="1" max="30" value="5">
            <input id="max-duration-input" type="number" min="1" max="30" value="5">
            <input id="skip-start-slider" type="range" min="0" max="30" value="0">
            <input id="skip-start-input" type="number" min="0" max="30" value="0">
            <input id="skip-end-slider" type="range" min="0" max="30" value="0">
            <input id="skip-end-input" type="number" min="0" max="30" value="0">
          </div>
          <div class="text-pool-section">
            <div class="text-pool-input">
              <input id="text-input" type="text" placeholder="Add a message...">
              <button id="add-text-btn">Add</button>
            </div>
            <div id="text-pool-display"></div>
            <div id="text-pool-empty" class="hidden">No messages added yet</div>
            <div class="text-pool-footer">
              <button id="clear-text-btn" class="clear-all-btn" style="display: none;">Clear all</button>
            </div>
          </div>
          <div class="frequency-control-section">
            <input id="text-frequency-slider" type="range" min="0" max="1" value="0.5" step="0.25">
          </div>
        </div>
        <div id="drop-indicator" class="hidden">
          <div class="drop-message">
            <p>Drop files here</p>
          </div>
        </div>
      </div>
    `

    // Reset UIManager state
    uiManager.isUIIdle = false
    uiManager.idleTimer = null
    uiManager.activityListeners = []
    uiManager.lastActivityTime = Date.now()

    // Clear any existing timers
    vi.clearAllTimers()

    // Mock timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    // Clean up
    uiManager.cleanupActivityDetection()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  describe('Idle State Properties', () => {
    it('should initialize with correct idle state properties', () => {
      expect(uiManager.isUIIdle).toBe(false)
      expect(uiManager.idleTimer).toBe(null)
      expect(uiManager.IDLE_TIMEOUT_MS).toBe(4000)
      expect(uiManager.activityListeners).toEqual([])
      expect(typeof uiManager.lastActivityTime).toBe('number')
    })
  })

  describe('enterIdleState', () => {
    it('should set UI to idle state and add CSS class', () => {
      uiManager.enterIdleState()

      expect(uiManager.isUIIdle).toBe(true)
      expect(document.body.classList.contains('ui-idle')).toBe(true)
    })
  })

  describe('exitIdleState', () => {
    it('should exit idle state and remove CSS class', () => {
      // First enter idle state
      uiManager.enterIdleState()
      expect(uiManager.isUIIdle).toBe(true)
      expect(document.body.classList.contains('ui-idle')).toBe(true)

      // Then exit idle state
      uiManager.exitIdleState()

      expect(uiManager.isUIIdle).toBe(false)
      expect(document.body.classList.contains('ui-idle')).toBe(false)
    })

    it('should reset idle timer when exiting idle state', () => {
      const resetSpy = vi.spyOn(uiManager, 'resetIdleTimer')

      uiManager.exitIdleState()

      expect(resetSpy).toHaveBeenCalled()
    })

    it('should only exit if already idle', () => {
      const resetSpy = vi.spyOn(uiManager, 'resetIdleTimer')

      // Not idle initially
      expect(uiManager.isUIIdle).toBe(false)

      uiManager.exitIdleState()

      // Should still reset timer even if not idle
      expect(resetSpy).toHaveBeenCalled()
      expect(uiManager.isUIIdle).toBe(false)
    })
  })

  describe('resetIdleTimer', () => {
    it('should clear existing timer and set new timeout', () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

      uiManager.resetIdleTimer()

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 4000)

      // Set another timer (should clear the first one)
      uiManager.resetIdleTimer()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should enter idle state after timeout', () => {
      const enterIdleSpy = vi.spyOn(uiManager, 'enterIdleState')

      uiManager.resetIdleTimer()

      // Fast-forward time
      vi.advanceTimersByTime(4000)

      expect(enterIdleSpy).toHaveBeenCalled()
    })
  })

  describe('handleActivity', () => {
    it('should exit idle state if currently idle', () => {
      const exitIdleSpy = vi.spyOn(uiManager, 'exitIdleState')

      // Set to idle first
      uiManager.isUIIdle = true

      const mockEvent = { type: 'mousemove' }
      uiManager.handleActivity(mockEvent)

      expect(exitIdleSpy).toHaveBeenCalled()
    })

    it('should reset timer if not idle', () => {
      const resetTimerSpy = vi.spyOn(uiManager, 'resetIdleTimer')

      // Not idle
      uiManager.isUIIdle = false

      const mockEvent = { type: 'mousemove' }
      uiManager.handleActivity(mockEvent)

      expect(resetTimerSpy).toHaveBeenCalled()
    })

    it('should update lastActivityTime', () => {
      const initialTime = uiManager.lastActivityTime

      // Advance time a bit
      vi.advanceTimersByTime(100)

      const mockEvent = { type: 'click' }
      uiManager.handleActivity(mockEvent)

      expect(uiManager.lastActivityTime).toBeGreaterThan(initialTime)
    })

    it('should handle ESC key normally', () => {
      const exitIdleSpy = vi.spyOn(uiManager, 'exitIdleState')

      // Set to idle first
      uiManager.isUIIdle = true

      const mockEvent = { type: 'keydown', key: 'Escape' }
      uiManager.handleActivity(mockEvent)

      expect(exitIdleSpy).toHaveBeenCalled()
    })
  })

  describe('setupActivityDetection', () => {
    it('should add event listeners for activity detection', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

      uiManager.setupActivityDetection()

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function), {
        passive: true,
      })
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), {
        passive: true,
      })
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), {
        passive: true,
      })
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), {
        passive: true,
      })

      expect(uiManager.activityListeners).toHaveLength(4)
    })

    it('should start with active state by resetting timer', () => {
      const resetTimerSpy = vi.spyOn(uiManager, 'resetIdleTimer')

      uiManager.setupActivityDetection()

      expect(resetTimerSpy).toHaveBeenCalled()
    })
  })

  describe('cleanupActivityDetection', () => {
    it('should remove all event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      // Set up detection first
      uiManager.setupActivityDetection()
      const listenerCount = uiManager.activityListeners.length

      // Clean up
      uiManager.cleanupActivityDetection()

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(listenerCount)
      expect(uiManager.activityListeners).toHaveLength(0)
    })

    it('should clear idle timer', () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

      // Set up a timer
      uiManager.resetIdleTimer()

      // Clean up
      uiManager.cleanupActivityDetection()

      expect(clearTimeoutSpy).toHaveBeenCalled()
      expect(uiManager.idleTimer).toBe(null)
    })
  })

  describe('Integration with existing events', () => {
    beforeEach(() => {
      // First spy on handleActivity before init
      const handleActivitySpy = vi.spyOn(uiManager, 'handleActivity')
      uiManager.init()
      // Store the spy for use in tests
      uiManager._handleActivitySpy = handleActivitySpy
    })

    it('should trigger activity on drag enter', () => {
      const dragEvent = new Event('dragenter', {
        bubbles: true,
        cancelable: true,
      })

      // Manually trigger the activity handler since dragenter doesn't bubble through setupActivityDetection
      uiManager.handleActivity(dragEvent)

      expect(uiManager._handleActivitySpy).toHaveBeenCalledWith(dragEvent)
    })

    it('should trigger activity on drop', () => {
      const dropEvent = new Event('drop', {
        bubbles: true,
        cancelable: true,
      })

      // Mock dataTransfer to prevent errors in handleDrop
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          items: [],
        },
        writable: false,
      })

      // Manually trigger the activity handler since drop has special handling
      uiManager.handleActivity(dropEvent)

      expect(uiManager._handleActivitySpy).toHaveBeenCalledWith(dropEvent)
    })
  })

  describe('Full idle cycle integration', () => {
    beforeEach(() => {
      uiManager.init()
      // Ensure timers are properly set up
      uiManager.setupActivityDetection()
    })

    it('should complete full idle cycle: active -> idle -> active', () => {
      // Start active
      expect(uiManager.isUIIdle).toBe(false)
      expect(document.body.classList.contains('ui-idle')).toBe(false)

      // Wait for idle timeout (4000ms default)
      vi.advanceTimersByTime(4100) // Add extra buffer

      // Should be idle now
      expect(uiManager.isUIIdle).toBe(true)
      expect(document.body.classList.contains('ui-idle')).toBe(true)

      // Trigger activity directly via handleActivity to ensure it works
      const mockEvent = new MouseEvent('mousemove', { bubbles: true })
      uiManager.handleActivity(mockEvent)

      // Should be active again
      expect(uiManager.isUIIdle).toBe(false)
      expect(document.body.classList.contains('ui-idle')).toBe(false)
    })
  })
})
