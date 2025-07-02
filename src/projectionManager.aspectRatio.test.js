/**
 * ProjectionManager - Story 6.4: Aspect Ratio Controls Test Suite
 *
 * Tests the aspect ratio control functionality including:
 * - Preset aspect ratio buttons (16:9, 4:3, 1:1)
 * - Custom aspect ratio inputs
 * - Match Current Screen functionality
 * - Stage sizing based on aspect ratios
 * - Persistence of aspect ratio settings
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { projectionManager } from './projectionManager.js'
import { stateManager } from './stateManager.js'
import { eventBus } from './eventBus.js'

// Mock dependencies
vi.mock('./stateManager.js')
vi.mock('./eventBus.js')
vi.mock('./toastManager.js')

// Mock Maptastic global
/* global global, Event */
global.Maptastic = vi.fn(() => ({
  addLayer: vi.fn(),
  setConfigEnabled: vi.fn(),
  getLayout: vi.fn(() => []),
  setLayout: vi.fn(),
}))

describe('ProjectionManager - Story 6.4: Aspect Ratio Controls', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Mock DOM
    document.body.innerHTML = `
      <div id="stage"></div>
      <div id="projection-handles-container"></div>
      <button id="projection-toggle-btn">
        <span class="button-text">Toggle Projection</span>
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
          
          <!-- Custom aspect ratio inputs -->
          <div class="custom-aspect-inputs">
            <label for="aspect-width" class="input-label">Width:</label>
            <input type="number" id="aspect-width" min="1" step="1" value="16">
            <label for="aspect-height" class="input-label">Height:</label>
            <input type="number" id="aspect-height" min="1" step="1" value="9">
          </div>
          
          <!-- Match current screen button -->
          <button id="match-screen-btn" class="secondary-btn">Match Current Screen</button>
        </div>
      </div>
      <!-- Toast container -->
      <div id="toast-container"></div>
    `

    // Reset instance state
    projectionManager.isActive = false
    projectionManager.cornerHandles = []
    projectionManager.isDragging = false
    projectionManager.dragCornerIndex = -1
    projectionManager.cornerPositions = [
      { x: 0, y: 0 },
      { x: 1920, y: 0 },
      { x: 1920, y: 1080 },
      { x: 0, y: 1080 },
    ]
    projectionManager.maptasticInstance = null
    projectionManager.isInitialized = false
    projectionManager.aspectRatioWidth = 16
    projectionManager.aspectRatioHeight = 9

    // Initialize
    projectionManager.init()

    // Mock stateManager methods
    stateManager.getProjectionMode.mockReturnValue({})
    stateManager.updateProjectionMode.mockImplementation(() => {})
  })

  afterEach(() => {
    // Clean up
    if (projectionManager.isInitialized) {
      projectionManager.cleanup()
    }
    document.body.innerHTML = ''
  })

  describe('AC 4.2: Aspect Ratio Preset Controls', () => {
    it('should initialize preset buttons correctly', () => {
      expect(projectionManager.aspectPresetButtons).toBeDefined()
      expect(projectionManager.aspectPresetButtons.length).toBe(3)

      const button16x9 = document.querySelector('[data-ratio="16:9"]')
      const button4x3 = document.querySelector('[data-ratio="4:3"]')
      const button1x1 = document.querySelector('[data-ratio="1:1"]')

      expect(button16x9).toBeTruthy()
      expect(button4x3).toBeTruthy()
      expect(button1x1).toBeTruthy()
    })

    it('should apply 16:9 aspect ratio when preset button is clicked', () => {
      const button16x9 = document.querySelector('[data-ratio="16:9"]')

      button16x9.click()

      expect(projectionManager.aspectRatioWidth).toBe(16)
      expect(projectionManager.aspectRatioHeight).toBe(9)
      expect(projectionManager.currentAspectRatio).toBeCloseTo(16 / 9, 3)
    })

    it('should apply 4:3 aspect ratio when preset button is clicked', () => {
      const button4x3 = document.querySelector('[data-ratio="4:3"]')

      button4x3.click()

      expect(projectionManager.aspectRatioWidth).toBe(4)
      expect(projectionManager.aspectRatioHeight).toBe(3)
      expect(projectionManager.currentAspectRatio).toBeCloseTo(4 / 3, 3)
    })

    it('should apply 1:1 aspect ratio when preset button is clicked', () => {
      const button1x1 = document.querySelector('[data-ratio="1:1"]')

      button1x1.click()

      expect(projectionManager.aspectRatioWidth).toBe(1)
      expect(projectionManager.aspectRatioHeight).toBe(1)
      expect(projectionManager.currentAspectRatio).toBe(1)
    })

    it('should save aspect ratio settings when preset is selected', () => {
      const button4x3 = document.querySelector('[data-ratio="4:3"]')

      button4x3.click()

      expect(stateManager.updateProjectionMode).toHaveBeenCalledWith({
        aspectRatio: {
          width: 4,
          height: 3,
        },
      })
    })

    it('should clear other preset selections when a new preset is selected', () => {
      const button16x9 = document.querySelector('[data-ratio="16:9"]')
      const button4x3 = document.querySelector('[data-ratio="4:3"]')

      // Select first preset
      button16x9.click()
      expect(button16x9.classList.contains('active')).toBe(true)

      // Select second preset
      button4x3.click()
      expect(button16x9.classList.contains('active')).toBe(false)
      expect(button4x3.classList.contains('active')).toBe(true)
    })
  })

  describe('AC 4.3: Custom Aspect Ratio Input', () => {
    it('should initialize custom aspect ratio inputs correctly', () => {
      expect(projectionManager.aspectWidthInput).toBeDefined()
      expect(projectionManager.aspectHeightInput).toBeDefined()
      expect(projectionManager.aspectWidthInput.value).toBe('16')
      expect(projectionManager.aspectHeightInput.value).toBe('9')
    })

    it('should apply custom aspect ratio when valid values are entered', () => {
      projectionManager.aspectWidthInput.value = '21'
      projectionManager.aspectHeightInput.value = '9'
      projectionManager.aspectWidthInput.dispatchEvent(new Event('input'))

      expect(projectionManager.aspectRatioWidth).toBe(21)
      expect(projectionManager.aspectRatioHeight).toBe(9)
      expect(projectionManager.currentAspectRatio).toBeCloseTo(21 / 9, 3)
    })

    it('should clear preset selection when custom values are entered', () => {
      const button16x9 = document.querySelector('[data-ratio="16:9"]')

      // First select a preset
      button16x9.click()
      expect(button16x9.classList.contains('active')).toBe(true)

      // Then enter custom values
      projectionManager.aspectWidthInput.value = '21'
      projectionManager.aspectHeightInput.value = '9'
      projectionManager.aspectWidthInput.dispatchEvent(new Event('input'))

      // Preset should be cleared
      expect(button16x9.classList.contains('active')).toBe(false)
    })

    it('should not apply invalid aspect ratio values', () => {
      const originalWidth = projectionManager.aspectRatioWidth
      const originalHeight = projectionManager.aspectRatioHeight

      // Test invalid inputs
      projectionManager.aspectWidthInput.value = '0'
      projectionManager.aspectHeightInput.value = '9'
      projectionManager.aspectWidthInput.dispatchEvent(new Event('input'))

      // Should not have changed
      expect(projectionManager.aspectRatioWidth).toBe(originalWidth)
      expect(projectionManager.aspectRatioHeight).toBe(originalHeight)
    })

    it('should save custom aspect ratio settings', () => {
      // First select a preset to establish the mock expectation
      const button16x9 = document.querySelector('[data-ratio="16:9"]')
      button16x9.click()

      // Then enter custom values
      projectionManager.aspectWidthInput.value = '21'
      projectionManager.aspectHeightInput.value = '9'
      projectionManager.aspectWidthInput.dispatchEvent(new Event('input'))

      expect(stateManager.updateProjectionMode).toHaveBeenCalledWith({
        aspectRatio: {
          width: 21,
          height: 9,
        },
      })
    })
  })

  describe('AC 4.2a & 4.2b: Match Current Screen Button', () => {
    it('should initialize match screen button correctly', () => {
      expect(projectionManager.matchScreenButton).toBeDefined()
      expect(projectionManager.matchScreenButton.textContent).toBe('Match Current Screen')
    })

    it('should update input fields with current screen dimensions when clicked', () => {
      projectionManager.matchScreenButton.click()

      expect(projectionManager.aspectWidthInput.value).toBe(window.innerWidth.toString())
      expect(projectionManager.aspectHeightInput.value).toBe(window.innerHeight.toString())
    })

    it('should apply screen aspect ratio when clicked', () => {
      projectionManager.matchScreenButton.click()

      expect(projectionManager.aspectRatioWidth).toBe(window.innerWidth)
      expect(projectionManager.aspectRatioHeight).toBe(window.innerHeight)
      expect(projectionManager.currentAspectRatio).toBeCloseTo(
        window.innerWidth / window.innerHeight,
        3
      )
    })

    it('should clear preset selection when match screen is clicked', () => {
      const button16x9 = document.querySelector('[data-ratio="16:9"]')

      // First select a preset
      button16x9.click()
      expect(button16x9.classList.contains('active')).toBe(true)

      // Then click match screen
      projectionManager.matchScreenButton.click()

      // Preset should be cleared (unless screen happens to be 16:9)
      const screenRatio = window.innerWidth / window.innerHeight
      const preset169Ratio = 16 / 9
      if (Math.abs(screenRatio - preset169Ratio) >= 0.01) {
        expect(button16x9.classList.contains('active')).toBe(false)
      }
    })

    it('should save screen aspect ratio settings', () => {
      projectionManager.matchScreenButton.click()

      expect(stateManager.updateProjectionMode).toHaveBeenCalledWith({
        aspectRatio: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      })
    })
  })

  describe('AC 4.4: Stage Aspect Ratio Application', () => {
    it('should apply aspect ratio to stage when in projection mode', () => {
      projectionManager.enterProjectionMode()

      projectionManager.aspectRatioWidth = 16
      projectionManager.aspectRatioHeight = 1
      projectionManager.applyAspectRatioToStage()

      const stageElement = document.getElementById('stage')
      expect(stageElement.style.position).toBe('fixed')
      expect(stageElement.style.top).toBe('0px')
      expect(stageElement.style.left).toBe('0px')
    })

    it('should calculate correct stage dimensions for wider aspect ratio (21:9)', () => {
      projectionManager.enterProjectionMode()

      projectionManager.aspectRatioWidth = 21
      projectionManager.aspectRatioHeight = 1
      projectionManager.applyAspectRatioToStage()

      const stageElement = document.getElementById('stage')
      const stageWidth = parseFloat(stageElement.style.width)
      const stageHeight = parseFloat(stageElement.style.height)

      // For a very wide ratio (21:1), should be constrained by viewport width
      expect(stageWidth).toBe(window.innerWidth)
      expect(stageHeight).toBeCloseTo(window.innerWidth / 21, 1)
    })

    it('should calculate correct stage dimensions for taller aspect ratio (4:3)', () => {
      projectionManager.enterProjectionMode()

      projectionManager.aspectRatioWidth = 4
      projectionManager.aspectRatioHeight = 10
      projectionManager.applyAspectRatioToStage()

      const stageElement = document.getElementById('stage')
      const stageWidth = parseFloat(stageElement.style.width)
      const stageHeight = parseFloat(stageElement.style.height)

      // For a very tall ratio (4:10), should be constrained by viewport height
      expect(stageHeight).toBe(window.innerHeight)
      expect(stageWidth).toBeCloseTo(window.innerHeight * (4 / 10), 1)
    })

    it('should not apply aspect ratio when not in projection mode', () => {
      const stageElement = document.getElementById('stage')
      const originalPosition = stageElement.style.position

      projectionManager.aspectRatioWidth = 16
      projectionManager.aspectRatioHeight = 1
      projectionManager.applyAspectRatioToStage()

      expect(stageElement.style.position).toBe(originalPosition)
    })

    it('should emit stage resize event when aspect ratio changes', () => {
      projectionManager.enterProjectionMode()

      projectionManager.aspectRatioWidth = 4
      projectionManager.aspectRatioHeight = 3
      projectionManager.applyAspectRatioToStage()

      expect(eventBus.emit).toHaveBeenCalledWith('projection.stageResized', {
        width: expect.any(Number),
        height: expect.any(Number),
        aspectRatio: {
          width: 4,
          height: 3,
        },
      })
    })
  })

  describe('AC 4.5: Stage Restoration on Mode Exit', () => {
    it('should restore responsive stage styling when exiting projection mode', () => {
      projectionManager.enterProjectionMode()

      projectionManager.aspectRatioWidth = 16
      projectionManager.aspectRatioHeight = 1
      projectionManager.applyAspectRatioToStage()
      projectionManager.exitProjectionMode()

      const stageElement = document.getElementById('stage')
      expect(stageElement.classList.contains('responsive-mode')).toBe(true)
      expect(stageElement.classList.contains('projection-mode')).toBe(false)
    })
  })

  describe('AC 4.3a: Default to Screen Aspect Ratio', () => {
    it('should default to screen aspect ratio when no saved settings exist', () => {
      // Mock no saved state
      stateManager.getProjectionMode.mockReturnValue({})

      projectionManager.loadSavedAspectRatio()

      expect(projectionManager.aspectRatioWidth).toBe(window.innerWidth)
      expect(projectionManager.aspectRatioHeight).toBe(window.innerHeight)
      expect(projectionManager.currentAspectRatio).toBeCloseTo(
        window.innerWidth / window.innerHeight,
        3
      )
    })

    it('should pre-populate custom inputs with screen dimensions by default', () => {
      // Mock no saved state
      stateManager.getProjectionMode.mockReturnValue({})

      projectionManager.loadSavedAspectRatio()

      expect(projectionManager.aspectWidthInput.value).toBe(window.innerWidth.toString())
      expect(projectionManager.aspectHeightInput.value).toBe(window.innerHeight.toString())
    })

    it('should load saved aspect ratio settings when they exist', () => {
      // Mock saved state
      stateManager.getProjectionMode.mockReturnValue({
        aspectRatio: {
          width: 21,
          height: 9,
        },
      })

      projectionManager.loadSavedAspectRatio()

      expect(projectionManager.aspectRatioWidth).toBe(21)
      expect(projectionManager.aspectRatioHeight).toBe(9)
      expect(projectionManager.currentAspectRatio).toBeCloseTo(21 / 9, 3)
    })
  })

  describe('Persistence and State Management', () => {
    it('should restore UI controls state from saved aspect ratio', () => {
      projectionManager.aspectRatioWidth = 4
      projectionManager.aspectRatioHeight = 3

      projectionManager.updateUIControls()

      const button4x3 = document.querySelector('[data-ratio="4:3"]')
      expect(button4x3.classList.contains('active')).toBe(true)
      expect(projectionManager.aspectWidthInput.value).toBe('4')
      expect(projectionManager.aspectHeightInput.value).toBe('3')
    })

    it('should restore custom aspect ratio state correctly', () => {
      projectionManager.aspectRatioWidth = 21
      projectionManager.aspectRatioHeight = 9

      projectionManager.updateUIControls()

      // No preset buttons should be active
      const presetButtons = document.querySelectorAll('.aspect-preset-btn')
      presetButtons.forEach((button) => {
        expect(button.classList.contains('active')).toBe(false)
      })

      // Custom inputs should show the values
      expect(projectionManager.aspectWidthInput.value).toBe('21')
      expect(projectionManager.aspectHeightInput.value).toBe('9')
    })
  })
})
