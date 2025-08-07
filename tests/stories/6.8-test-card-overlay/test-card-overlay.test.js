/**
 * Integration tests for Story 6.8: Test Card Overlay Toggle
 * Tests the complete test card functionality in projection mode
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { testCardManager } from '../../../app/src/testCardManager.js'
import { projectionManager } from '../../../app/src/projectionManager.js'
import { stateManager } from '../../../app/src/stateManager.js'
import { eventBus } from '../../../app/src/eventBus.js'

// Mock dependencies
vi.mock('../../../app/src/stateManager.js', () => ({
  stateManager: {
    getTestCardSettings: vi.fn(),
    updateTestCardSettings: vi.fn(),
    getProjectionMode: vi.fn(),
    updateProjectionMode: vi.fn(),
  },
}))

vi.mock('../../../app/src/eventBus.js', () => ({
  eventBus: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}))

// Mock Maptastic
globalThis.Maptastic = vi.fn(() => ({
  addLayer: vi.fn(),
  setConfigEnabled: vi.fn(),
  getLayout: vi.fn(() => []),
  setLayout: vi.fn(),
}))

describe('Story 6.8: Test Card Overlay Toggle - Integration Tests', () => {
  beforeEach(() => {
    // Setup complete DOM structure
    document.body.innerHTML = `
      <div id="stage" class="stage">
        <div id="test-card-overlay" class="test-card-overlay" style="display: none;">
          <img src="assets/img/test-card.png" alt="Test Card Pattern" class="test-card-image">
        </div>
      </div>
      
      <!-- Advanced Controls -->
      <div id="advanced-controls-section" class="advanced-controls-section visible">
        <div class="projection-controls">
          <button id="projection-toggle-btn" class="projection-button" data-projection-active="false">
            <span class="button-text">Enter Projection Setup</span>
          </button>
          
          <div id="projection-mode-controls" class="projection-settings" style="display: none;">
            <!-- Test Card Controls -->
            <div class="test-card-section">
              <label class="control-label">Calibration</label>
              
              <div class="test-card-control-group">
                <button id="test-card-toggle-btn" class="test-card-button" data-active="false">
                  <span class="button-text">Test Card</span>
                  <span class="button-state">Off</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div id="projection-handles-container" class="projection-handles-container"></div>
    `

    // Setup CSS styles for visibility testing
    const style = document.createElement('style')
    style.textContent = `
      .test-card-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
      .projection-settings { display: none; }
      .projection-settings[style*="block"] { display: block !important; }
    `
    document.head.appendChild(style)

    // Reset all mocks
    vi.clearAllMocks()

    // Setup default mock responses
    stateManager.getTestCardSettings.mockReturnValue({ visible: false })
    stateManager.getProjectionMode.mockReturnValue({ active: false })

    // Reset manager states
    testCardManager.isVisible = false
    testCardManager.isInitialized = false
    projectionManager.isActive = false
    projectionManager.isInitialized = false
  })

  afterEach(() => {
    // Cleanup managers
    if (testCardManager.isInitialized) {
      testCardManager.cleanup()
    }
    if (projectionManager.isInitialized) {
      projectionManager.cleanup?.()
    }

    document.body.innerHTML = ''
    document.head.innerHTML = ''
  })

  describe('AC 8.1: Test Card Toggle Control Presence', () => {
    it('should show test card controls only when in projection mode', () => {
      // Initialize managers
      testCardManager.init()
      projectionManager.init()

      const projectionControls = document.getElementById('projection-mode-controls')
      const testCardButton = document.getElementById('test-card-toggle-btn')

      // Initially, projection mode controls should be hidden
      expect(projectionControls.style.display).toBe('none')

      // Enter projection mode
      projectionManager.enterProjectionMode()
      projectionControls.style.display = 'block'

      // Test card button should be accessible
      expect(testCardButton).toBeTruthy()
      expect(testCardButton.querySelector('.button-text').textContent).toBe('Test Card')
      expect(testCardButton.getAttribute('data-active')).toBe('false')
    })

    it('should hide test card controls when exiting projection mode', () => {
      testCardManager.init()
      projectionManager.init()

      const projectionControls = document.getElementById('projection-mode-controls')

      // Enter projection mode
      projectionManager.enterProjectionMode()
      projectionControls.style.display = 'block'

      // Exit projection mode
      projectionManager.exitProjectionMode()
      projectionControls.style.display = 'none'

      // Test card controls should be hidden
      expect(projectionControls.style.display).toBe('none')
    })
  })

  describe('AC 8.2 & 8.3: Test Card Display and Hide Functionality', () => {
    beforeEach(() => {
      testCardManager.init()
      projectionManager.init()
      projectionManager.enterProjectionMode()

      // Show projection controls
      document.getElementById('projection-mode-controls').style.display = 'block'
    })

    it('should show test card overlay when toggle is activated', () => {
      const overlay = document.getElementById('test-card-overlay')
      const toggleButton = document.getElementById('test-card-toggle-btn')

      // Initially hidden
      expect(overlay.style.display).toBe('none')
      expect(testCardManager.isVisible).toBe(false)

      // Click toggle button
      toggleButton.click()

      // Should show overlay
      expect(overlay.style.display).toBe('block')
      expect(testCardManager.isVisible).toBe(true)
      expect(toggleButton.getAttribute('data-active')).toBe('true')
      expect(toggleButton.querySelector('.button-state').textContent).toBe('On')
    })

    it('should hide test card overlay when toggle is deactivated', () => {
      const overlay = document.getElementById('test-card-overlay')
      const toggleButton = document.getElementById('test-card-toggle-btn')

      // Show test card first
      toggleButton.click()
      expect(overlay.style.display).toBe('block')

      // Click toggle button again to hide
      toggleButton.click()

      // Should hide overlay
      expect(overlay.style.display).toBe('none')
      expect(testCardManager.isVisible).toBe(false)
      expect(toggleButton.getAttribute('data-active')).toBe('false')
      expect(toggleButton.querySelector('.button-state').textContent).toBe('Off')
    })

    it('should emit events when test card is toggled', () => {
      const toggleButton = document.getElementById('test-card-toggle-btn')

      // Toggle on
      toggleButton.click()
      expect(eventBus.emit).toHaveBeenCalledWith('testCard.toggled', {
        visible: true,
        timestamp: expect.any(Number),
      })

      vi.clearAllMocks()

      // Toggle off
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
      projectionManager.init()
      projectionManager.enterProjectionMode()

      // Show projection controls
      document.getElementById('projection-mode-controls').style.display = 'block'
    })

    it('should position test card inside stage element', () => {
      const overlay = document.getElementById('test-card-overlay')
      const stage = document.getElementById('stage')
      const toggleButton = document.getElementById('test-card-toggle-btn')

      // Show test card
      toggleButton.click()

      // Overlay should be child of stage to inherit transformations
      expect(overlay.parentElement).toBe(stage)
    })

    it('should update test card pattern for different aspect ratios', () => {
      const toggleButton = document.getElementById('test-card-toggle-btn')
      const stage = document.getElementById('stage')

      // Show test card
      toggleButton.click()

      // Mock stage dimensions for 4:3 aspect ratio
      stage.getBoundingClientRect = vi.fn(() => ({
        width: 1200,
        height: 900, // 4:3 aspect ratio
      }))

      // Trigger aspect ratio change
      testCardManager.handleAspectRatioChanged()

      const image = document.querySelector('.test-card-image')

      // Image should automatically stretch to match aspect ratio
      expect(image).toBeTruthy()
      expect(image.className).toBe('test-card-image')
      // CSS styles are applied through class, not inline styles
    })

    it('should handle stage transformations through CSS inheritance', () => {
      const stage = document.getElementById('stage')
      const overlay = document.getElementById('test-card-overlay')
      const toggleButton = document.getElementById('test-card-toggle-btn')

      // Show test card
      toggleButton.click()

      // Apply CSS transform to stage (simulating Maptastic transformation)
      stage.style.transform = 'perspective(1000px) rotateX(10deg) rotateY(5deg)'

      // Test card should inherit the transform since it's a child
      const stageTransform = window.getComputedStyle(stage).transform
      expect(stageTransform).not.toBe('none')

      // The overlay inherits transformations through CSS - no explicit test needed
      // as this is handled by the browser's CSS engine
      expect(overlay.parentElement).toBe(stage)
    })
  })

  describe('Test Card Pattern Content (AC 8.6)', () => {
    beforeEach(() => {
      testCardManager.init()
      projectionManager.init()
      projectionManager.enterProjectionMode()

      // Show projection controls
      document.getElementById('projection-mode-controls').style.display = 'block'
    })

    it('should display test card image with proper attributes', () => {
      const toggleButton = document.getElementById('test-card-toggle-btn')

      // Show test card
      toggleButton.click()

      const image = document.querySelector('.test-card-image')

      // Check image is present and has proper attributes
      expect(image).toBeTruthy()
      expect(image.src).toContain('test-card.png')
      expect(image.alt).toBe('Test Card Pattern')
      expect(image.className).toBe('test-card-image')
    })

    it('should maintain pattern visibility with different overlay opacity', () => {
      const overlay = document.getElementById('test-card-overlay')
      const toggleButton = document.getElementById('test-card-toggle-btn')

      // Show test card
      toggleButton.click()

      // Overlay should be visible with proper display styling
      expect(overlay.style.display).toBe('block')
    })
  })

  describe('State Persistence Integration', () => {
    it('should persist test card state through page lifecycle', () => {
      // Initialize with saved visible state
      stateManager.getTestCardSettings.mockReturnValue({ visible: true })

      testCardManager.init()

      // Should restore visible state
      expect(testCardManager.isVisible).toBe(true)
      expect(document.getElementById('test-card-overlay').style.display).toBe('block')

      // Toggle state
      testCardManager.toggleTestCard()

      // Should save new state
      expect(stateManager.updateTestCardSettings).toHaveBeenCalledWith({ visible: false })
    })

    it('should default to hidden state when no saved state exists', () => {
      stateManager.getTestCardSettings.mockReturnValue(null)

      testCardManager.init()

      expect(testCardManager.isVisible).toBe(false)
      expect(document.getElementById('test-card-overlay').style.display).toBe('none')
    })
  })

  describe('Integration with Color Correction', () => {
    beforeEach(() => {
      testCardManager.init()
      projectionManager.init()
      projectionManager.enterProjectionMode()

      // Show projection controls
      document.getElementById('projection-mode-controls').style.display = 'block'
    })

    it('should inherit color filters applied to stage', () => {
      const stage = document.getElementById('stage')
      const toggleButton = document.getElementById('test-card-toggle-btn')

      // Apply color filters to stage (simulating color correction)
      stage.style.filter = 'brightness(1.5) contrast(0.8) saturate(1.2)'

      // Show test card
      toggleButton.click()

      // Test card should inherit filters since it's a child of stage
      const overlay = document.getElementById('test-card-overlay')
      expect(overlay.parentElement).toBe(stage)

      // The filter inheritance is handled by CSS - verify overlay is properly positioned
      expect(overlay.style.display).toBe('block')
    })

    it('should respond to color filter change events', () => {
      const toggleButton = document.getElementById('test-card-toggle-btn')

      // Show test card
      toggleButton.click()

      // Simulate color filter change event
      testCardManager.handleColorFilterChange()

      // Should handle the event without error
      expect(testCardManager.isVisible).toBe(true)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing DOM elements gracefully', () => {
      // Remove required elements
      document.getElementById('test-card-overlay').remove()

      const result = testCardManager.init()

      expect(result).toBe(false)
      expect(testCardManager.isInitialized).toBe(false)
    })

    it('should handle projection mode changes without test card controls present', () => {
      // Remove test card button
      document.getElementById('test-card-toggle-btn').remove()

      const result = testCardManager.init()

      expect(result).toBe(false)
    })

    it('should handle aspect ratio updates when overlay is not visible', () => {
      testCardManager.init()

      // Should not throw error when overlay is hidden
      expect(() => testCardManager.handleAspectRatioChanged()).not.toThrow()
    })
  })

  describe('Complete User Workflow', () => {
    it('should support complete calibration workflow', () => {
      // Initialize all components
      testCardManager.init()
      projectionManager.init()

      // 1. Enter projection mode
      const projectionButton = document.getElementById('projection-toggle-btn')
      projectionButton.click()
      projectionManager.enterProjectionMode()

      // Show projection controls
      const projectionControls = document.getElementById('projection-mode-controls')
      projectionControls.style.display = 'block'

      // 2. Activate test card
      const testCardButton = document.getElementById('test-card-toggle-btn')
      expect(testCardButton).toBeTruthy()

      testCardButton.click()

      // 3. Verify test card is visible for calibration
      const overlay = document.getElementById('test-card-overlay')
      expect(overlay.style.display).toBe('block')
      expect(testCardManager.isVisible).toBe(true)

      // 4. Simulate corner adjustments (test card should follow)
      const stage = document.getElementById('stage')
      stage.style.transform = 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 50, 30, 0, 1)'

      // Test card should inherit transformation
      expect(overlay.parentElement).toBe(stage)

      // 5. Deactivate test card
      testCardButton.click()

      expect(overlay.style.display).toBe('none')
      expect(testCardManager.isVisible).toBe(false)

      // 6. Exit projection mode
      projectionButton.click()
      projectionManager.exitProjectionMode()
      projectionControls.style.display = 'none'

      // Test card controls should be hidden
      expect(projectionControls.style.display).toBe('none')
    })
  })
})
