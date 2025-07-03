/**
 * Unit tests for ColorCorrectionManager module
 * Tests color filter application, persistence, and event emission
 * Implements Story 6.7: Color Correction Controls testing requirements
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { colorCorrectionManager } from './colorCorrectionManager.js'
import { stateManager } from './stateManager.js'

// Mock dependencies
vi.mock('./eventBus.js', () => ({
  eventBus: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

vi.mock('./stateManager.js', () => ({
  stateManager: {
    getColorFilters: vi.fn(() => ({
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
    })),
    updateColorFilters: vi.fn(),
  },
}))

describe('ColorCorrectionManager', () => {
  let mockStageElement
  let mockSliders
  let mockValueDisplays
  let mockButtons
  let originalDocument

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()

    // Reset stateManager mocks to defaults
    stateManager.getColorFilters.mockReturnValue({
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
    })
    stateManager.updateColorFilters.mockImplementation(() => {})

    // Store original document if it exists
    originalDocument = globalThis.document

    // Create mock DOM elements
    mockStageElement = {
      style: {
        filter: '',
      },
    }

    mockSliders = {
      brightness: { value: '1.0', addEventListener: vi.fn() },
      contrast: { value: '1.0', addEventListener: vi.fn() },
      saturation: { value: '1.0', addEventListener: vi.fn() },
    }

    mockValueDisplays = {
      brightness: { textContent: '100%' },
      contrast: { textContent: '100%' },
      saturation: { textContent: '100%' },
    }

    mockButtons = {
      resetBrightness: { addEventListener: vi.fn() },
      resetContrast: { addEventListener: vi.fn() },
      resetSaturation: { addEventListener: vi.fn() },
      resetAllColors: { addEventListener: vi.fn() },
    }

    // Mock document.getElementById
    Object.defineProperty(globalThis, 'document', {
      value: {
        getElementById: vi.fn((id) => {
          switch (id) {
            case 'stage':
              return mockStageElement
            case 'brightness-slider':
              return mockSliders.brightness
            case 'contrast-slider':
              return mockSliders.contrast
            case 'saturation-slider':
              return mockSliders.saturation
            case 'brightness-value':
              return mockValueDisplays.brightness
            case 'contrast-value':
              return mockValueDisplays.contrast
            case 'saturation-value':
              return mockValueDisplays.saturation
            case 'reset-brightness-btn':
              return mockButtons.resetBrightness
            case 'reset-contrast-btn':
              return mockButtons.resetContrast
            case 'reset-saturation-btn':
              return mockButtons.resetSaturation
            case 'reset-all-colors-btn':
              return mockButtons.resetAllColors
            default:
              return null
          }
        }),
      },
      writable: true,
      configurable: true,
    })

    // Reset manager state
    colorCorrectionManager.isInitialized = false
    colorCorrectionManager.colorFilters = {
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
    }
  })

  afterEach(() => {
    // Restore original document
    if (originalDocument) {
      Object.defineProperty(globalThis, 'document', {
        value: originalDocument,
        writable: true,
        configurable: true,
      })
    } else {
      delete globalThis.document
    }
  })

  describe('initialization', () => {
    it('should initialize successfully with all required DOM elements', () => {
      const result = colorCorrectionManager.init()

      expect(result).toBe(true)
      expect(colorCorrectionManager.isInitialized).toBe(true)
      expect(colorCorrectionManager.stageElement).toBe(mockStageElement)
    })

    it('should fail initialization when stage element is missing', () => {
      document.getElementById = vi.fn((id) => {
        if (id === 'stage') return null
        return mockStageElement // Return mock for other elements
      })

      const result = colorCorrectionManager.init()

      expect(result).toBe(false)
      expect(colorCorrectionManager.isInitialized).toBe(false)
    })

    it('should fail initialization when slider elements are missing', () => {
      document.getElementById = vi.fn((id) => {
        if (id === 'brightness-slider') return null
        if (id === 'stage') return mockStageElement
        return mockSliders.brightness // Return mock for other elements
      })

      const result = colorCorrectionManager.init()

      expect(result).toBe(false)
      expect(colorCorrectionManager.isInitialized).toBe(false)
    })

    it('should set up event listeners during initialization', () => {
      colorCorrectionManager.init()

      expect(mockSliders.brightness.addEventListener).toHaveBeenCalledWith(
        'input',
        expect.any(Function)
      )
      expect(mockSliders.contrast.addEventListener).toHaveBeenCalledWith(
        'input',
        expect.any(Function)
      )
      expect(mockSliders.saturation.addEventListener).toHaveBeenCalledWith(
        'input',
        expect.any(Function)
      )
      expect(mockButtons.resetBrightness.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )
      expect(mockButtons.resetContrast.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )
      expect(mockButtons.resetSaturation.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )
      expect(mockButtons.resetAllColors.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )
    })
  })

  describe('color filter application', () => {
    beforeEach(() => {
      colorCorrectionManager.init()
    })

    it('should apply brightness filter correctly', () => {
      colorCorrectionManager.updateBrightness(1.2)

      expect(colorCorrectionManager.colorFilters.brightness).toBe(1.2)
      expect(mockStageElement.style.filter).toBe('brightness(1.2) contrast(1) saturate(1)')
      expect(mockValueDisplays.brightness.textContent).toBe('120%')
    })

    it('should apply contrast filter correctly', () => {
      colorCorrectionManager.updateContrast(0.8)

      expect(colorCorrectionManager.colorFilters.contrast).toBe(0.8)
      expect(mockStageElement.style.filter).toBe('brightness(1) contrast(0.8) saturate(1)')
      expect(mockValueDisplays.contrast.textContent).toBe('80%')
    })

    it('should apply saturation filter correctly', () => {
      colorCorrectionManager.updateSaturation(1.5)

      expect(colorCorrectionManager.colorFilters.saturation).toBe(1.5)
      expect(mockStageElement.style.filter).toBe('brightness(1) contrast(1) saturate(1.5)')
      expect(mockValueDisplays.saturation.textContent).toBe('150%')
    })

    it('should apply combined filters in correct order', () => {
      colorCorrectionManager.updateBrightness(1.2)
      colorCorrectionManager.updateContrast(0.8)
      colorCorrectionManager.updateSaturation(1.5)

      expect(mockStageElement.style.filter).toBe('brightness(1.2) contrast(0.8) saturate(1.5)')
    })

    it('should emit event when filters are applied', async () => {
      const { eventBus } = await import('./eventBus.js')

      colorCorrectionManager.updateBrightness(1.2)

      expect(eventBus.emit).toHaveBeenCalledWith('colorFilters.applied', {
        brightness: 1.2,
        contrast: 1.0,
        saturation: 1.0,
        filterString: 'brightness(1.2) contrast(1) saturate(1)',
        timestamp: expect.any(Number),
      })
    })
  })

  describe('reset functionality', () => {
    beforeEach(() => {
      colorCorrectionManager.init()
    })

    it('should reset brightness to default', () => {
      colorCorrectionManager.updateBrightness(1.5)
      colorCorrectionManager.resetBrightness()

      expect(colorCorrectionManager.colorFilters.brightness).toBe(1.0)
      expect(mockSliders.brightness.value).toBe(1.0)
      expect(mockValueDisplays.brightness.textContent).toBe('100%')
    })

    it('should reset contrast to default', () => {
      colorCorrectionManager.updateContrast(0.5)
      colorCorrectionManager.resetContrast()

      expect(colorCorrectionManager.colorFilters.contrast).toBe(1.0)
      expect(mockSliders.contrast.value).toBe(1.0)
      expect(mockValueDisplays.contrast.textContent).toBe('100%')
    })

    it('should reset saturation to default', () => {
      colorCorrectionManager.updateSaturation(2.0)
      colorCorrectionManager.resetSaturation()

      expect(colorCorrectionManager.colorFilters.saturation).toBe(1.0)
      expect(mockSliders.saturation.value).toBe(1.0)
      expect(mockValueDisplays.saturation.textContent).toBe('100%')
    })

    it('should reset all colors to default', () => {
      colorCorrectionManager.updateBrightness(1.5)
      colorCorrectionManager.updateContrast(0.5)
      colorCorrectionManager.updateSaturation(2.0)

      colorCorrectionManager.resetAllColors()

      expect(colorCorrectionManager.colorFilters.brightness).toBe(1.0)
      expect(colorCorrectionManager.colorFilters.contrast).toBe(1.0)
      expect(colorCorrectionManager.colorFilters.saturation).toBe(1.0)
      expect(mockStageElement.style.filter).toBe('brightness(1) contrast(1) saturate(1)')
    })
  })

  describe('persistence', () => {
    beforeEach(() => {
      colorCorrectionManager.init()
    })

    it('should save brightness filter via StateManager', () => {
      colorCorrectionManager.updateBrightness(1.2)

      expect(stateManager.updateColorFilters).toHaveBeenCalledWith({ brightness: 1.2 })
    })

    it('should save contrast filter via StateManager', () => {
      colorCorrectionManager.updateContrast(0.8)

      expect(stateManager.updateColorFilters).toHaveBeenCalledWith({ contrast: 0.8 })
    })

    it('should save saturation filter via StateManager', () => {
      colorCorrectionManager.updateSaturation(1.5)

      expect(stateManager.updateColorFilters).toHaveBeenCalledWith({ saturation: 1.5 })
    })

    it('should load saved brightness value during initialization', () => {
      stateManager.getColorFilters.mockReturnValue({
        brightness: 1.3,
        contrast: 1.0,
        saturation: 1.0,
      })

      colorCorrectionManager.loadSavedValues()

      expect(colorCorrectionManager.colorFilters.brightness).toBe(1.3)
      expect(mockSliders.brightness.value).toBe(1.3)
      expect(mockValueDisplays.brightness.textContent).toBe('130%')
    })

    it('should load saved contrast value during initialization', () => {
      stateManager.getColorFilters.mockReturnValue({
        brightness: 1.0,
        contrast: 0.7,
        saturation: 1.0,
      })

      colorCorrectionManager.loadSavedValues()

      expect(colorCorrectionManager.colorFilters.contrast).toBe(0.7)
      expect(mockSliders.contrast.value).toBe(0.7)
      expect(mockValueDisplays.contrast.textContent).toBe('70%')
    })

    it('should load saved saturation value during initialization', () => {
      stateManager.getColorFilters.mockReturnValue({
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.8,
      })

      colorCorrectionManager.loadSavedValues()

      expect(colorCorrectionManager.colorFilters.saturation).toBe(1.8)
      expect(mockSliders.saturation.value).toBe(1.8)
      expect(mockValueDisplays.saturation.textContent).toBe('180%')
    })

    it('should handle missing saved values gracefully', () => {
      stateManager.getColorFilters.mockReturnValue({
        brightness: undefined,
        contrast: undefined,
        saturation: undefined,
      })

      colorCorrectionManager.loadSavedValues()

      // Should remain at default values
      expect(colorCorrectionManager.colorFilters.brightness).toBe(1.0)
      expect(colorCorrectionManager.colorFilters.contrast).toBe(1.0)
      expect(colorCorrectionManager.colorFilters.saturation).toBe(1.0)
    })

    it('should handle StateManager errors gracefully', () => {
      stateManager.getColorFilters.mockImplementation(() => {
        throw new Error('StateManager error')
      })

      // Should not throw error and should maintain default values
      expect(() => {
        colorCorrectionManager.loadSavedValues()
      }).not.toThrow()

      expect(colorCorrectionManager.colorFilters.brightness).toBe(1.0)
      expect(colorCorrectionManager.colorFilters.contrast).toBe(1.0)
      expect(colorCorrectionManager.colorFilters.saturation).toBe(1.0)
    })
  })

  describe('utility methods', () => {
    beforeEach(() => {
      colorCorrectionManager.init()
    })

    it('should return current color filter values', () => {
      colorCorrectionManager.updateBrightness(1.2)
      colorCorrectionManager.updateContrast(0.8)
      colorCorrectionManager.updateSaturation(1.5)

      const values = colorCorrectionManager.getCurrentValues()

      expect(values).toEqual({
        brightness: 1.2,
        contrast: 0.8,
        saturation: 1.5,
      })
    })

    it('should handle cleanup properly', () => {
      colorCorrectionManager.cleanup()

      expect(colorCorrectionManager.isInitialized).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle initialization errors gracefully', () => {
      // Mock getElementById to throw an error
      document.getElementById = vi.fn(() => {
        throw new Error('DOM error')
      })

      const result = colorCorrectionManager.init()

      expect(result).toBe(false)
      expect(colorCorrectionManager.isInitialized).toBe(false)
    })

    it('should handle StateManager update errors gracefully', () => {
      stateManager.updateColorFilters.mockImplementation(() => {
        throw new Error('StateManager update error')
      })

      colorCorrectionManager.init()

      // Should not throw error
      expect(() => {
        colorCorrectionManager.updateBrightness(1.2)
      }).not.toThrow()
    })

    it('should handle StateManager load errors gracefully', () => {
      stateManager.getColorFilters.mockImplementation(() => {
        throw new Error('StateManager load error')
      })

      colorCorrectionManager.init()

      // Should not throw error and should maintain default values
      expect(() => {
        colorCorrectionManager.loadSavedValues()
      }).not.toThrow()

      expect(colorCorrectionManager.colorFilters.brightness).toBe(1.0)
      expect(colorCorrectionManager.colorFilters.contrast).toBe(1.0)
      expect(colorCorrectionManager.colorFilters.saturation).toBe(1.0)
    })
  })
})
