/**
 * ColorCorrectionManager module for handling brightness, contrast, and saturation controls
 * Manages real-time CSS filter application, persistence, and event emission
 * Implements Story 6.7: Color Correction Controls
 */

import { eventBus } from './eventBus.js'
import { stateManager } from './stateManager.js'

/**
 * @typedef {Object} ColorFilters
 * @property {number} brightness - Brightness multiplier (0.5 to 1.5)
 * @property {number} contrast - Contrast multiplier (0.5 to 1.5)
 * @property {number} saturation - Saturation multiplier (0.0 to 2.0)
 */

class ColorCorrectionManager {
  constructor() {
    // DOM element references
    this.stageElement = null
    this.brightnessSlider = null
    this.contrastSlider = null
    this.saturationSlider = null
    this.brightnessValue = null
    this.contrastValue = null
    this.saturationValue = null
    this.resetBrightnessBtn = null
    this.resetContrastBtn = null
    this.resetSaturationBtn = null
    this.resetAllColorsBtn = null

    // Color filter state
    this.colorFilters = {
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
    }

    // Initialization flag
    this.isInitialized = false
  }

  /**
   * Initialize the ColorCorrectionManager
   * @returns {boolean} - Success status
   */
  init() {
    try {
      // Get DOM element references
      this.stageElement = document.getElementById('stage')
      this.brightnessSlider = document.getElementById('brightness-slider')
      this.contrastSlider = document.getElementById('contrast-slider')
      this.saturationSlider = document.getElementById('saturation-slider')
      this.brightnessValue = document.getElementById('brightness-value')
      this.contrastValue = document.getElementById('contrast-value')
      this.saturationValue = document.getElementById('saturation-value')
      this.resetBrightnessBtn = document.getElementById('reset-brightness-btn')
      this.resetContrastBtn = document.getElementById('reset-contrast-btn')
      this.resetSaturationBtn = document.getElementById('reset-saturation-btn')
      this.resetAllColorsBtn = document.getElementById('reset-all-colors-btn')

      // Check for required DOM elements
      if (
        !this.stageElement ||
        !this.brightnessSlider ||
        !this.contrastSlider ||
        !this.saturationSlider ||
        !this.brightnessValue ||
        !this.contrastValue ||
        !this.saturationValue ||
        !this.resetBrightnessBtn ||
        !this.resetContrastBtn ||
        !this.resetSaturationBtn ||
        !this.resetAllColorsBtn
      ) {
        console.error('Required DOM elements not found for color correction manager initialization')
        return false
      }

      // Set up event listeners
      this.setupEventListeners()

      // Load saved values from persistence
      this.loadSavedValues()

      this.isInitialized = true
      console.log('ColorCorrectionManager initialized successfully')
      return true
    } catch (error) {
      console.error('ColorCorrectionManager initialization error:', error)
      return false
    }
  }

  /**
   * Set up event listeners for color controls
   */
  setupEventListeners() {
    // Brightness slider
    this.brightnessSlider.addEventListener('input', (e) => {
      this.updateBrightness(parseFloat(e.target.value))
    })

    // Contrast slider
    this.contrastSlider.addEventListener('input', (e) => {
      this.updateContrast(parseFloat(e.target.value))
    })

    // Saturation slider
    this.saturationSlider.addEventListener('input', (e) => {
      this.updateSaturation(parseFloat(e.target.value))
    })

    // Reset buttons
    this.resetBrightnessBtn.addEventListener('click', () => {
      this.resetBrightness()
    })

    this.resetContrastBtn.addEventListener('click', () => {
      this.resetContrast()
    })

    this.resetSaturationBtn.addEventListener('click', () => {
      this.resetSaturation()
    })

    this.resetAllColorsBtn.addEventListener('click', () => {
      this.resetAllColors()
    })
  }

  /**
   * Update brightness value and apply filter
   * @param {number} value - Brightness value (0.0 to 2.0)
   */
  updateBrightness(value) {
    this.colorFilters.brightness = value
    this.applyColorFilters()
    this.updateBrightnessDisplay(value)
    this.saveColorFilter('brightness', value)
  }

  /**
   * Update contrast value and apply filter
   * @param {number} value - Contrast value (0.0 to 2.0)
   */
  updateContrast(value) {
    this.colorFilters.contrast = value
    this.applyColorFilters()
    this.updateContrastDisplay(value)
    this.saveColorFilter('contrast', value)
  }

  /**
   * Update saturation value and apply filter
   * @param {number} value - Saturation value (0.0 to 2.0)
   */
  updateSaturation(value) {
    this.colorFilters.saturation = value
    this.applyColorFilters()
    this.updateSaturationDisplay(value)
    this.saveColorFilter('saturation', value)
  }

  /**
   * Apply combined CSS filters to stage element
   * Filters are applied in order: brightness() contrast() saturate()
   */
  applyColorFilters() {
    const { brightness, contrast, saturation } = this.colorFilters

    // Apply filters in specified order: brightness() contrast() saturate()
    const filterString = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`

    this.stageElement.style.filter = filterString

    // Emit event for other components
    eventBus.emit('colorFilters.applied', {
      brightness,
      contrast,
      saturation,
      filterString,
      timestamp: Date.now(),
    })
  }

  /**
   * Update brightness display value
   * @param {number} value - Brightness multiplier
   */
  updateBrightnessDisplay(value) {
    const percentage = Math.round(value * 100)
    this.brightnessValue.textContent = `${percentage}%`
  }

  /**
   * Update contrast display value
   * @param {number} value - Contrast multiplier
   */
  updateContrastDisplay(value) {
    const percentage = Math.round(value * 100)
    this.contrastValue.textContent = `${percentage}%`
  }

  /**
   * Update saturation display value
   * @param {number} value - Saturation multiplier
   */
  updateSaturationDisplay(value) {
    const percentage = Math.round(value * 100)
    this.saturationValue.textContent = `${percentage}%`
  }

  /**
   * Reset brightness to default (100%)
   */
  resetBrightness() {
    this.updateBrightness(1.0)
    this.brightnessSlider.value = 1.0
  }

  /**
   * Reset contrast to default (100%)
   */
  resetContrast() {
    this.updateContrast(1.0)
    this.contrastSlider.value = 1.0
  }

  /**
   * Reset saturation to default (100%)
   */
  resetSaturation() {
    this.updateSaturation(1.0)
    this.saturationSlider.value = 1.0
  }

  /**
   * Reset all color filters to default values (100%)
   */
  resetAllColors() {
    this.resetBrightness()
    this.resetContrast()
    this.resetSaturation()
  }

  /**
   * Save color filter value via StateManager
   * @param {string} filterType - Type of filter (brightness, contrast, saturation)
   * @param {number} value - Filter value to save
   */
  saveColorFilter(filterType, value) {
    try {
      const filterUpdate = { [filterType]: value }
      stateManager.updateColorFilters(filterUpdate)
    } catch (error) {
      console.error(`Failed to save ${filterType} filter:`, error)
    }
  }

  /**
   * Load saved color filter values from StateManager
   */
  loadSavedValues() {
    try {
      const savedFilters = stateManager.getColorFilters()

      // Load brightness
      if (savedFilters.brightness !== undefined) {
        this.updateBrightness(savedFilters.brightness)
        this.brightnessSlider.value = savedFilters.brightness
      }

      // Load contrast
      if (savedFilters.contrast !== undefined) {
        this.updateContrast(savedFilters.contrast)
        this.contrastSlider.value = savedFilters.contrast
      }

      // Load saturation
      if (savedFilters.saturation !== undefined) {
        this.updateSaturation(savedFilters.saturation)
        this.saturationSlider.value = savedFilters.saturation
      }
    } catch (error) {
      console.error('Failed to load saved color filter values:', error)
    }
  }

  /**
   * Get current color filter values
   * @returns {ColorFilters} - Current filter values
   */
  getCurrentValues() {
    return {
      brightness: this.colorFilters.brightness,
      contrast: this.colorFilters.contrast,
      saturation: this.colorFilters.saturation,
    }
  }

  /**
   * Cleanup method for removing event listeners
   */
  cleanup() {
    if (!this.isInitialized) return

    // Remove event listeners would go here if needed
    // Currently using direct element event listeners which are automatically cleaned up

    this.isInitialized = false
    console.log('ColorCorrectionManager cleaned up')
  }
}

// Export singleton instance
export const colorCorrectionManager = new ColorCorrectionManager()
