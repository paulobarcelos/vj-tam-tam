/**
 * Unit tests for TestCardManager - Story 6.8: Test Card Overlay Toggle
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { testCardManager } from './testCardManager.js'
import { eventBus } from './eventBus.js'
import { stateManager } from './stateManager.js'
import { PROJECTION_EVENTS } from './constants/events.js'

// Mock stateManager
vi.mock('./stateManager.js', () => ({
  stateManager: {
    getTestCardSettings: vi.fn(),
    updateTestCardSettings: vi.fn(),
  },
}))

// Mock eventBus
vi.mock('./eventBus.js', () => ({
  eventBus: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}))

describe('TestCardManager - Story 6.8: Test Card Overlay Toggle', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="stage" class="stage">
        <div id="test-card-overlay" class="test-card-overlay" style="display: none;">
          <img src="assets/img/test-card.png" alt="Test Card Pattern" class="test-card-image">
        </div>
      </div>
      <div id="projection-mode-controls">
        <button id="test-card-toggle-btn" class="test-card-button" data-active="false">
          <span class="button-text">Test Card</span>
          <span class="button-state">Off</span>
        </button>
      </div>
    `

    // Reset all mocks
    vi.clearAllMocks()

    // Setup default stateManager responses
    stateManager.getTestCardSettings.mockReturnValue({ visible: false })

    // Reset test card manager state
    testCardManager.isVisible = false
    testCardManager.isInitialized = false
    testCardManager.stageElement = null
    testCardManager.overlayElement = null
    testCardManager.toggleButton = null
  })

  afterEach(() => {
    // Clean up
    if (testCardManager.isInitialized) {
      testCardManager.cleanup()
    }
    document.body.innerHTML = ''
  })

  describe('Initialization', () => {
    it('should initialize successfully with required DOM elements', () => {
      const result = testCardManager.init()

      expect(result).toBe(true)
      expect(testCardManager.isInitialized).toBe(true)
      expect(testCardManager.stageElement).toBeTruthy()
      expect(testCardManager.overlayElement).toBeTruthy()
      expect(testCardManager.toggleButton).toBeTruthy()
    })

    it('should fail initialization if stage element is missing', () => {
      document.getElementById('stage').remove()
      const result = testCardManager.init()

      expect(result).toBe(false)
      expect(testCardManager.isInitialized).toBe(false)
    })

    it('should fail initialization if overlay element is missing', () => {
      document.getElementById('test-card-overlay').remove()
      const result = testCardManager.init()

      expect(result).toBe(false)
      expect(testCardManager.isInitialized).toBe(false)
    })

    it('should fail initialization if toggle button is missing', () => {
      document.getElementById('test-card-toggle-btn').remove()
      const result = testCardManager.init()

      expect(result).toBe(false)
      expect(testCardManager.isInitialized).toBe(false)
    })

    it('should set up event listeners on initialization', () => {
      testCardManager.init()

      expect(eventBus.on).toHaveBeenCalledWith(PROJECTION_EVENTS.MODE_ENABLED, expect.any(Function))
      expect(eventBus.on).toHaveBeenCalledWith(
        PROJECTION_EVENTS.MODE_DISABLED,
        expect.any(Function)
      )
      expect(eventBus.on).toHaveBeenCalledWith('projection.stageTransformed', expect.any(Function))
      expect(eventBus.on).toHaveBeenCalledWith(
        'projection.aspectRatioChanged',
        expect.any(Function)
      )
      expect(eventBus.on).toHaveBeenCalledWith('colorCorrection.updated', expect.any(Function))
    })
  })

  describe('AC 8.2: Test Card Display Functionality', () => {
    beforeEach(() => {
      testCardManager.init()
    })

    it('should show test card when toggled on', () => {
      const overlay = document.getElementById('test-card-overlay')
      const toggleButton = document.getElementById('test-card-toggle-btn')

      // Initially hidden
      expect(overlay.style.display).toBe('none')
      expect(testCardManager.isVisible).toBe(false)

      // Click toggle button
      toggleButton.click()

      // Should be visible
      expect(overlay.style.display).toBe('block')
      expect(testCardManager.isVisible).toBe(true)
      expect(overlay.parentElement.id).toBe('stage')
    })

    it('should update button state when test card is shown', () => {
      const toggleButton = document.getElementById('test-card-toggle-btn')
      const buttonState = toggleButton.querySelector('.button-state')

      toggleButton.click()

      expect(toggleButton.getAttribute('data-active')).toBe('true')
      expect(buttonState.textContent).toBe('On')
    })

    it('should emit testCard.toggled event when shown', () => {
      const toggleButton = document.getElementById('test-card-toggle-btn')

      toggleButton.click()

      expect(eventBus.emit).toHaveBeenCalledWith('testCard.toggled', {
        visible: true,
        timestamp: expect.any(Number),
      })
    })
  })

  describe('AC 8.3: Test Card Hide Functionality', () => {
    beforeEach(() => {
      testCardManager.init()
      // Start with test card visible
      testCardManager.toggleTestCard()
      vi.clearAllMocks()
    })

    it('should hide test card when toggled off', () => {
      const overlay = document.getElementById('test-card-overlay')
      const toggleButton = document.getElementById('test-card-toggle-btn')

      // Initially visible
      expect(overlay.style.display).toBe('block')
      expect(testCardManager.isVisible).toBe(true)

      // Click toggle button to hide
      toggleButton.click()

      // Should be hidden
      expect(overlay.style.display).toBe('none')
      expect(testCardManager.isVisible).toBe(false)
    })

    it('should update button state when test card is hidden', () => {
      const toggleButton = document.getElementById('test-card-toggle-btn')
      const buttonState = toggleButton.querySelector('.button-state')

      toggleButton.click()

      expect(toggleButton.getAttribute('data-active')).toBe('false')
      expect(buttonState.textContent).toBe('Off')
    })

    it('should emit testCard.toggled event when hidden', () => {
      const toggleButton = document.getElementById('test-card-toggle-btn')

      toggleButton.click()

      expect(eventBus.emit).toHaveBeenCalledWith('testCard.toggled', {
        visible: false,
        timestamp: expect.any(Number),
      })
    })
  })

  describe('AC 8.4: Test Card Transformation Inheritance', () => {
    beforeEach(() => {
      testCardManager.init()
    })

    it('should position overlay inside stage element to inherit transformations', () => {
      testCardManager.showTestCard()

      const overlay = document.getElementById('test-card-overlay')
      const stage = document.getElementById('stage')

      expect(overlay.parentElement).toBe(stage)
    })

    it('should handle aspect ratio changes without additional logic', () => {
      testCardManager.showTestCard()

      // Mock getBoundingClientRect to simulate aspect ratio change
      const stage = document.getElementById('stage')
      stage.getBoundingClientRect = vi.fn(() => ({
        width: 1600,
        height: 900, // 16:9 aspect ratio
      }))

      testCardManager.handleAspectRatioChanged()

      // Image automatically stretches to fit - no additional manipulation needed
      const image = document.querySelector('.test-card-image')
      expect(image).toBeTruthy()
    })

    it('should handle stage transformations', () => {
      testCardManager.init()

      // Simulate stage transformation event
      testCardManager.handleStageTransformed()

      // Method should execute without error (transformations inherited by CSS)
      expect(testCardManager.isInitialized).toBe(true)
    })
  })

  describe('State Persistence', () => {
    beforeEach(() => {
      testCardManager.init()
    })

    it('should save state when test card visibility changes', () => {
      testCardManager.toggleTestCard()

      expect(stateManager.updateTestCardSettings).toHaveBeenCalledWith({ visible: true })
    })

    it('should load saved state on initialization', () => {
      stateManager.getTestCardSettings.mockReturnValue({ visible: true })

      // Create new manager instance to test loading
      const manager = new testCardManager.constructor()
      manager.stageElement = document.getElementById('stage')
      manager.overlayElement = document.getElementById('test-card-overlay')
      manager.toggleButton = document.getElementById('test-card-toggle-btn')

      manager.loadSavedState()

      expect(manager.isVisible).toBe(true)
      expect(manager.overlayElement.style.display).toBe('block')
    })

    it('should default to hidden when no saved state exists', () => {
      stateManager.getTestCardSettings.mockReturnValue(null)

      const manager = new testCardManager.constructor()
      manager.stageElement = document.getElementById('stage')
      manager.overlayElement = document.getElementById('test-card-overlay')
      manager.toggleButton = document.getElementById('test-card-toggle-btn')

      manager.loadSavedState()

      expect(manager.isVisible).toBe(false)
      expect(manager.overlayElement.style.display).toBe('none')
    })

    it('should handle state loading errors gracefully', () => {
      stateManager.getTestCardSettings.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const manager = new testCardManager.constructor()
      manager.stageElement = document.getElementById('stage')
      manager.overlayElement = document.getElementById('test-card-overlay')
      manager.toggleButton = document.getElementById('test-card-toggle-btn')

      manager.loadSavedState()

      expect(manager.isVisible).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('Event Handling', () => {
    beforeEach(() => {
      testCardManager.init()
    })

    it('should handle projection mode changes', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      testCardManager.handleProjectionModeChange()

      expect(consoleSpy).toHaveBeenCalledWith('TestCardManager: Projection mode changed')

      consoleSpy.mockRestore()
    })

    it('should handle color filter changes', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      testCardManager.handleColorFilterChange()

      expect(consoleSpy).toHaveBeenCalledWith(
        'TestCardManager: Color filters changed - test card inherits filters'
      )

      consoleSpy.mockRestore()
    })

    it('should update aspect ratio only when visible', () => {
      const updateSpy = vi.spyOn(testCardManager, 'updateOverlayAspectRatio')

      // When hidden, should not update
      testCardManager.isVisible = false
      testCardManager.handleAspectRatioChanged()
      expect(updateSpy).not.toHaveBeenCalled()

      // When visible, should update
      testCardManager.isVisible = true
      testCardManager.handleAspectRatioChanged()
      expect(updateSpy).toHaveBeenCalled()

      updateSpy.mockRestore()
    })
  })

  describe('State Management', () => {
    beforeEach(() => {
      testCardManager.init()
    })

    it('should return current state', () => {
      const state = testCardManager.getCurrentState()

      expect(state).toEqual({
        visible: false,
        initialized: true,
      })
    })

    it('should track visibility state correctly', () => {
      expect(testCardManager.isVisible).toBe(false)

      testCardManager.toggleTestCard()
      expect(testCardManager.isVisible).toBe(true)

      testCardManager.toggleTestCard()
      expect(testCardManager.isVisible).toBe(false)
    })
  })

  describe('Cleanup', () => {
    beforeEach(() => {
      testCardManager.init()
    })

    it('should remove event listeners on cleanup', () => {
      testCardManager.cleanup()

      expect(eventBus.off).toHaveBeenCalledWith(
        PROJECTION_EVENTS.MODE_ENABLED,
        expect.any(Function)
      )
      expect(eventBus.off).toHaveBeenCalledWith(
        PROJECTION_EVENTS.MODE_DISABLED,
        expect.any(Function)
      )
      expect(eventBus.off).toHaveBeenCalledWith('projection.stageTransformed', expect.any(Function))
      expect(eventBus.off).toHaveBeenCalledWith(
        'projection.aspectRatioChanged',
        expect.any(Function)
      )
    })

    it('should handle cleanup with missing toggle button', () => {
      testCardManager.toggleButton = null

      expect(() => testCardManager.cleanup()).not.toThrow()
    })
  })
})
