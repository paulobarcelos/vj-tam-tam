/**
 * Integration tests for Story 6.1: Advanced Panel Hidden By Default
 * Tests the integration between UI, State Management, and Storage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock dependencies for clean testing
vi.mock('../../../app/src/facades/fileSystemAccessFacade.js', () => ({
  fileSystemAccessFacade: {
    init: vi.fn().mockResolvedValue(false),
    isSupported: false,
    getAllFiles: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('../../../app/src/toastManager.js', () => ({
  toastManager: {
    error: vi.fn(),
    show: vi.fn(),
  },
}))

// Import modules after mocking
import { stateManager } from '../../../app/src/stateManager.js'

describe('Story 6.1: Advanced Panel Hidden By Default - Integration', () => {
  beforeEach(() => {
    // Clear DOM and reset state
    document.body.innerHTML = ''
    localStorage.clear()
    vi.clearAllMocks()

    // Reset state manager
    stateManager.state = {
      mediaPool: [],
      textPool: [],
      segmentSettings: {
        minDuration: 5,
        maxDuration: 5,
        skipStart: 0,
        skipEnd: 0,
      },
      uiSettings: {
        advancedControlsVisible: false,
      },
      textFrequency: 0.5,
      fileSystemAPIWorking: null,
    }
  })

  describe('AC 1.1: Default Hidden State on Fresh Load', () => {
    it('should hide advanced panel when no localStorage key exists', async () => {
      // Setup CSS first
      const style = document.createElement('style')
      style.textContent = `
        .advanced-controls-section {
          display: none;
        }
        .advanced-controls-section.visible {
          display: block;
        }
      `
      document.head.appendChild(style)

      // Setup DOM
      document.body.innerHTML = `
        <div id="advanced-controls-section" class="advanced-controls-section" aria-hidden="true">
          <div class="control-group">Advanced controls content</div>
        </div>
      `

      const advancedSection = document.getElementById('advanced-controls-section')

      // Verify localStorage key doesn't exist
      expect(localStorage.getItem('vjtamtam.ui.advancedPanelVisible')).toBeNull()

      // Verify state manager returns false by default
      expect(stateManager.getUISettings().advancedControlsVisible).toBe(false)

      // Verify state manager defaults to false
      expect(stateManager.getUISettings().advancedControlsVisible).toBe(false)

      // Verify DOM element is hidden via CSS
      const computedStyle = window.getComputedStyle(advancedSection)
      expect(computedStyle.display).toBe('none')

      // Verify accessibility attribute
      expect(advancedSection.getAttribute('aria-hidden')).toBe('true')
    })

    it('should maintain hidden state after StateManager restoration with no persisted data', async () => {
      // Setup DOM
      document.body.innerHTML = `
        <div id="advanced-controls-section" class="advanced-controls-section" aria-hidden="true">
          <div class="control-group">Advanced controls content</div>
        </div>
      `

      // Initialize and restore state (should find no localStorage data)
      await stateManager.restoreFromPersistence()

      // Verify state remains default
      expect(stateManager.getUISettings().advancedControlsVisible).toBe(false)

      // Verify localStorage key still doesn't exist
      expect(localStorage.getItem('vjtamtam.ui.advancedPanelVisible')).toBeNull()
    })
  })

  describe('AC 1.3: CSS-Based Hiding Implementation', () => {
    it('should use CSS display property for hiding', () => {
      // Setup DOM with CSS styles
      const style = document.createElement('style')
      style.textContent = `
        .advanced-controls-section {
          display: none;
        }
        .advanced-controls-section.visible {
          display: block;
        }
      `
      document.head.appendChild(style)

      document.body.innerHTML = `
        <div id="advanced-controls-section" class="advanced-controls-section" aria-hidden="true">
          <div class="control-group">
            <button id="test-button">Test Control</button>
          </div>
        </div>
      `

      const advancedSection = document.getElementById('advanced-controls-section')
      const testButton = document.getElementById('test-button')

      // Verify CSS hiding is active
      const computedStyle = window.getComputedStyle(advancedSection)
      expect(computedStyle.display).toBe('none')

      // Verify hidden controls cannot be interacted with
      // (This is inherent to display: none)
      expect(testButton.offsetParent).toBeNull() // Not visible

      // Verify accessibility compliance
      expect(advancedSection.getAttribute('aria-hidden')).toBe('true')
    })

    it('should prevent screen reader access when hidden', () => {
      document.body.innerHTML = `
        <div id="advanced-controls-section" class="advanced-controls-section" aria-hidden="true">
          <button id="hidden-control">Hidden Control</button>
        </div>
      `

      const advancedSection = document.getElementById('advanced-controls-section')
      const hiddenControl = document.getElementById('hidden-control')

      // Verify ARIA hidden attribute
      expect(advancedSection.getAttribute('aria-hidden')).toBe('true')

      // Verify control is not visible to screen readers
      expect(hiddenControl.offsetParent).toBeNull()
    })
  })

  describe('StateManager UI Settings Integration', () => {
    it('should manage visibility through StateManager UI settings', () => {
      // Test setting visibility to true
      stateManager.updateUISettings({ advancedControlsVisible: true })

      // Verify state was updated
      expect(stateManager.getUISettings().advancedControlsVisible).toBe(true)

      // Test setting to false
      stateManager.updateUISettings({ advancedControlsVisible: false })
      expect(stateManager.getUISettings().advancedControlsVisible).toBe(false)
    })

    it('should handle default UI settings gracefully', () => {
      // Should default to false for new state
      expect(stateManager.getUISettings().advancedControlsVisible).toBe(false)
    })
  })

  describe('State Manager Integration', () => {
    it('should integrate with StateManager UI settings', async () => {
      // Setup localStorage with advanced panel visible
      localStorage.setItem('vjtamtam.ui.advancedPanelVisible', 'true')

      // Setup general state in localStorage
      const persistedState = {
        uiSettings: { advancedControlsVisible: true },
      }
      localStorage.setItem('vj-tam-tam-state', JSON.stringify(persistedState))

      // Restore state
      await stateManager.restoreFromPersistence()

      // Verify state was restored correctly
      expect(stateManager.getUISettings().advancedControlsVisible).toBe(true)
    })
  })
})
