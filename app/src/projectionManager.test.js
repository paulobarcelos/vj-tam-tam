/**
 * @vitest-environment jsdom
 */

/* global global */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { projectionManager } from './projectionManager.js'
import { stateManager } from './stateManager.js'
import { eventBus } from './eventBus.js'
import { toastManager } from './toastManager.js'
import { STATE_EVENTS, PROJECTION_EVENTS } from './constants/events.js'

// Mock dependencies
vi.mock('./stateManager.js', () => ({
  stateManager: {
    getProjectionMode: vi.fn(),
    updateProjectionMode: vi.fn(),
  },
}))

vi.mock('./eventBus.js', () => ({
  eventBus: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}))

vi.mock('./toastManager.js', () => ({
  toastManager: {
    show: vi.fn(),
  },
}))

// Mock Maptastic global
global.Maptastic = vi.fn(() => ({
  addLayer: vi.fn(),
  setConfigEnabled: vi.fn(),
  getLayout: vi.fn(() => []),
  setLayout: vi.fn(),
}))

describe('ProjectionManager - Story 6.3: Projection Setup Mode Toggle', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="stage"></div>
      <div id="projection-handles-container"></div>
      <button id="projection-toggle-btn">
        <span class="button-text">Enter Projection Setup</span>
      </button>
      <div id="projection-mode-controls" style="display: none;">
        <div class="aspect-ratio-section">
          <label class="control-label">Projection Surface Aspect Ratio</label>
          
          <!-- Preset buttons -->
          <div class="aspect-preset-buttons">
            <button class="aspect-preset-btn" data-ratio="16:9" data-value="1.777">16:9</button>
            <button class="aspect-preset-btn" data-ratio="4:3" data-value="1.333">4:3</button>
            <button class="aspect-preset-btn" data-ratio="1:1" data-value="1.000">1:1</button>
          </div>
          
          <!-- Aspect ratio inputs -->
          <div class="custom-aspect-controls">
            <label>Set Aspect Ratio</label>
            <div class="aspect-input-group">
              <input type="number" id="aspect-width" placeholder="Width" min="1" step="0.1" value="16">
              <span class="aspect-separator">:</span>
              <input type="number" id="aspect-height" placeholder="Height" min="1" step="0.1" value="9">
            </div>
            <button id="match-screen-btn" class="secondary-button">Match Current Screen</button>
          </div>
        </div>
      </div>
    `

    // Reset all mocks
    vi.clearAllMocks()

    // Setup default state manager responses
    stateManager.getProjectionMode.mockReturnValue({
      active: false,
      maptasticLayout: null,
    })

    // Reset projection manager state
    projectionManager.isActive = false
    projectionManager.maptasticInstance = null
    projectionManager.isInitialized = false
  })

  afterEach(() => {
    // Clean up
    if (projectionManager.isInitialized) {
      projectionManager.cleanup()
    }
    document.body.innerHTML = ''
  })

  describe('AC 3.1: Projection Toggle Control Presence', () => {
    it('should initialize with required DOM elements', () => {
      const result = projectionManager.init()

      expect(result).toBe(true)
      expect(projectionManager.isInitialized).toBe(true)
      expect(projectionManager.stageElement).toBeTruthy()
      expect(projectionManager.toggleButton).toBeTruthy()
      expect(projectionManager.projectionModeControls).toBeTruthy()
    })

    it('should fail initialization if required elements are missing', () => {
      document.getElementById('stage').remove()
      const result = projectionManager.init()

      expect(result).toBe(false)
      expect(projectionManager.isInitialized).toBe(false)
    })

    it('should set up event listeners on initialization', () => {
      projectionManager.init()

      expect(eventBus.on).toHaveBeenCalledWith('ui.idleStateChanged', expect.any(Function))
      expect(eventBus.on).toHaveBeenCalledWith(
        STATE_EVENTS.PROJECTION_MODE_UPDATED,
        expect.any(Function)
      )
    })
  })

  describe('AC 3.2: Enter Projection Setup Mode', () => {
    beforeEach(() => {
      projectionManager.init()
    })

    it('should enter projection mode when toggle button is clicked', () => {
      const toggleButton = document.getElementById('projection-toggle-btn')

      // Simulate click
      toggleButton.click()

      expect(projectionManager.isActive).toBe(true)
      expect(stateManager.updateProjectionMode).toHaveBeenCalledWith({ active: true })
      expect(eventBus.emit).toHaveBeenCalledWith(PROJECTION_EVENTS.MODE_ENABLED, {
        timestamp: expect.any(Number),
      })
    })

    it('should initialize Maptastic when entering projection mode', () => {
      projectionManager.enterProjectionMode()

      expect(global.Maptastic).toHaveBeenCalledWith({
        autoLoad: false,
        autoSave: false,
      })
      expect(projectionManager.maptasticInstance.addLayer).toHaveBeenCalledWith(
        projectionManager.stageElement
      )
      // Check that corner handles were created
      expect(projectionManager.cornerHandles).toHaveLength(4)
    })

    it('should update button text when entering projection mode', () => {
      const buttonText = document.querySelector('.button-text')

      projectionManager.enterProjectionMode()

      expect(buttonText.textContent).toBe('Exit Projection Setup')
      expect(projectionManager.toggleButton.getAttribute('data-projection-active')).toBe('true')
    })

    it('should show projection controls when entering projection mode', () => {
      const controls = document.getElementById('projection-mode-controls')

      projectionManager.enterProjectionMode()

      expect(controls.style.display).toBe('block')
    })
  })

  describe('AC 3.3: Exit Projection Setup Mode', () => {
    beforeEach(() => {
      projectionManager.init()
      projectionManager.enterProjectionMode()
    })

    it('should exit projection mode when toggle button is clicked', () => {
      const toggleButton = document.getElementById('projection-toggle-btn')

      // Simulate click to exit
      toggleButton.click()

      expect(projectionManager.isActive).toBe(false)
      expect(stateManager.updateProjectionMode).toHaveBeenCalledWith({ active: false })
      expect(eventBus.emit).toHaveBeenCalledWith(PROJECTION_EVENTS.MODE_DISABLED, {
        timestamp: expect.any(Number),
      })
    })

    it('should remove corner handles when exiting projection mode', () => {
      projectionManager.exitProjectionMode()

      // Check that corner handles were removed
      expect(projectionManager.cornerHandles).toHaveLength(0)
    })

    it('should update button text when exiting projection mode', () => {
      const buttonText = document.querySelector('.button-text')

      projectionManager.exitProjectionMode()

      expect(buttonText.textContent).toBe('Enter Projection Setup')
      expect(projectionManager.toggleButton.getAttribute('data-projection-active')).toBe('false')
    })

    it('should hide projection controls when exiting projection mode', () => {
      const controls = document.getElementById('projection-mode-controls')

      projectionManager.exitProjectionMode()

      expect(controls.style.display).toBe('none')
    })
  })

  describe('AC 3.5: Projection Mode State Persistence', () => {
    beforeEach(() => {
      projectionManager.init()
    })

    it('should save Maptastic layout when changes occur', () => {
      projectionManager.enterProjectionMode()

      // Update corner positions to simulate dragging
      projectionManager.cornerPositions[0] = { x: 0.1, y: 0.1 }
      projectionManager.cornerPositions[1] = { x: 0.9, y: 0.1 }
      projectionManager.cornerPositions[2] = { x: 0.9, y: 0.9 }
      projectionManager.cornerPositions[3] = { x: 0.1, y: 0.9 }

      projectionManager.saveMaptasticLayout()

      expect(stateManager.updateProjectionMode).toHaveBeenCalledWith({
        maptasticLayout: {
          corners: projectionManager.cornerPositions,
        },
      })
    })

    it('should load saved Maptastic layout on initialization', () => {
      const savedCorners = [
        { x: 0.1, y: 0.1 },
        { x: 0.9, y: 0.1 },
        { x: 0.9, y: 0.9 },
        { x: 0.1, y: 0.9 },
      ]
      stateManager.getProjectionMode.mockReturnValue({
        active: false,
        maptasticLayout: {
          corners: savedCorners,
        },
      })

      projectionManager.enterProjectionMode()

      expect(projectionManager.cornerPositions).toEqual(savedCorners)
      expect(projectionManager.maptasticInstance.setLayout).toHaveBeenCalled()
    })

    it('should restore active projection mode from persisted state', () => {
      stateManager.getProjectionMode.mockReturnValue({
        active: true,
        maptasticLayout: null,
      })

      projectionManager.loadPersistedState()

      expect(projectionManager.isActive).toBe(true)
      expect(global.Maptastic).toHaveBeenCalled()
    })
  })

  describe('AC 3.7: Idle State Integration', () => {
    beforeEach(() => {
      projectionManager.init()
      projectionManager.enterProjectionMode()
    })

    it('should hide corner handles when UI goes idle', () => {
      projectionManager.handleIdleStateChange({ isIdle: true })

      projectionManager.cornerHandles.forEach((handle) => {
        expect(handle.style.opacity).toBe('0')
        expect(handle.style.pointerEvents).toBe('none')
      })
    })

    it('should show corner handles when UI becomes active', () => {
      // First make it idle
      projectionManager.handleIdleStateChange({ isIdle: true })

      // Then make it active
      projectionManager.handleIdleStateChange({ isIdle: false })

      projectionManager.cornerHandles.forEach((handle) => {
        expect(handle.style.opacity).toBe('1')
        expect(handle.style.pointerEvents).toBe('auto')
      })
    })

    it('should not affect handles when projection mode is inactive', () => {
      projectionManager.exitProjectionMode()

      projectionManager.handleIdleStateChange({ isIdle: true })

      // Should not throw or cause issues
      expect(() => projectionManager.handleIdleStateChange({ isIdle: true })).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      projectionManager.init()
    })

    it('should handle Maptastic initialization errors gracefully', () => {
      global.Maptastic.mockImplementationOnce(() => {
        throw new Error('Maptastic init failed')
      })

      expect(() => projectionManager.enterProjectionMode()).not.toThrow()
      expect(toastManager.show).toHaveBeenCalledWith('Failed to enter projection mode', 'error')
    })

    it('should handle state save errors gracefully', () => {
      projectionManager.enterProjectionMode()

      // Mock stateManager to throw an error
      stateManager.updateProjectionMode.mockImplementationOnce(() => {
        throw new Error('State save error')
      })

      expect(() => projectionManager.saveMaptasticLayout()).not.toThrow()
      // Error should be logged but no toast is shown for state save errors in our new implementation
    })
  })

  describe('Cleanup', () => {
    it('should properly clean up resources', () => {
      projectionManager.init()
      projectionManager.enterProjectionMode()

      projectionManager.cleanup()

      expect(eventBus.off).toHaveBeenCalledWith('ui.idleStateChanged', expect.any(Function))
      expect(eventBus.off).toHaveBeenCalledWith(
        STATE_EVENTS.PROJECTION_MODE_UPDATED,
        expect.any(Function)
      )
      expect(projectionManager.isInitialized).toBe(false)
    })
  })

  describe('Window Resize Handling', () => {
    beforeEach(() => {
      projectionManager.init()
      projectionManager.enterProjectionMode()
    })

    it('should keep handles fixed on window resize', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      // Simulate window resize
      projectionManager.handleWindowResize()

      // In projection mode, handles stay fixed - just logs a message
      expect(consoleSpy).toHaveBeenCalledWith(
        'Window resized in projection mode - handles remain fixed'
      )
    })

    it('should not update handles if projection mode is inactive', () => {
      projectionManager.exitProjectionMode()

      const updateSpy = vi.spyOn(projectionManager, 'updateHandlePositions')

      projectionManager.handleWindowResize()

      expect(updateSpy).not.toHaveBeenCalled()
    })

    it('should not update handles if no handles exist', () => {
      projectionManager.cornerHandles = []

      const updateSpy = vi.spyOn(projectionManager, 'updateHandlePositions')

      projectionManager.handleWindowResize()

      expect(updateSpy).not.toHaveBeenCalled()
    })
  })

  describe('Integration with State Manager', () => {
    beforeEach(() => {
      projectionManager.init()
    })

    it('should sync state when StateManager projection mode is updated', () => {
      const mockData = {
        projectionMode: { active: true },
      }

      projectionManager.handleProjectionModeUpdate(mockData)

      expect(projectionManager.isActive).toBe(true)
    })

    it('should not sync if state is already matching', () => {
      projectionManager.isActive = true
      const mockData = {
        projectionMode: { active: true },
      }

      const updateSpy = vi.spyOn(projectionManager, 'updateToggleButton')
      projectionManager.handleProjectionModeUpdate(mockData)

      expect(updateSpy).not.toHaveBeenCalled()
    })
  })
})
