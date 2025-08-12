/**
 * TextDisplayManager module for text overlay display
 * Handles random text selection, overlay presentation, and timing management
 * synchronized with media segment transitions
 */

import { eventBus } from './eventBus.js'
import { stateManager } from './stateManager.js'
import {
  TEXT_OVERLAY_EVENTS,
  TEXT_POOL_EVENTS,
  CYCLING_EVENTS,
  PROJECTION_EVENTS,
} from './constants/events.js'

class TextDisplayManager {
  constructor() {
    // DOM references
    this.overlayContainer = null
    this.overlayElement = null

    // State properties
    this.isActive = false
    this.currentText = null
    this.segmentLife = 0 // How many segments the current text has been displayed
    this.maxLife = 0 // How many segments this text should stay (1-maxSegmentLife)

    // Configuration
    this.maxSegmentLife = 4 // Maximum segments a text can persist (1-4 range)
  }

  init() {
    this.overlayContainer = document.getElementById('text-overlay-container')
    this.overlayElement = document.getElementById('text-overlay')

    if (!this.overlayContainer || !this.overlayElement) {
      console.error('Required text display elements not found')
      return false
    }

    this.setupEventListeners()
    return true
  }

  setupEventListeners() {
    // Listen for cycling events from playback engine
    eventBus.on(CYCLING_EVENTS.STARTED, () => this.startTextDisplay())
    eventBus.on(CYCLING_EVENTS.STOPPED, () => this.stopTextDisplay())
    eventBus.on(CYCLING_EVENTS.MEDIA_CHANGED, () => this.handleSegmentTransition())

    // Listen for text pool changes
    eventBus.on(TEXT_POOL_EVENTS.UPDATED, () => this.handleTextPoolChange())
    eventBus.on(TEXT_POOL_EVENTS.SIZE_CHANGED, (event) => this.handleTextPoolSizeChange(event))

    // Listen for frequency changes (canonical event name)
    eventBus.on(TEXT_POOL_EVENTS.FREQUENCY_CHANGED, (event) =>
      this.updateFrequency(event.frequency)
    )

    // Listen for projection mode changes to update font sizing
    eventBus.on(PROJECTION_EVENTS.MODE_ENABLED, () => this.handleProjectionModeChange())
    eventBus.on(PROJECTION_EVENTS.MODE_DISABLED, () => this.handleProjectionModeChange())
  }

  startTextDisplay() {
    if (this.isActive) return

    this.isActive = true

    // Give text a chance to appear immediately using the same frequency logic as transitions
    this.decideTextTransition()

    eventBus.emit(TEXT_OVERLAY_EVENTS.STARTED, {
      timestamp: Date.now(),
    })
  }

  stopTextDisplay() {
    this.isActive = false
    this.hideCurrentText()

    eventBus.emit(TEXT_OVERLAY_EVENTS.STOPPED, {
      timestamp: Date.now(),
    })
  }

  pauseTextDisplay() {
    // Text remains visible during pause, no changes needed
    eventBus.emit(TEXT_OVERLAY_EVENTS.PAUSED, {
      timestamp: Date.now(),
    })
  }

  resumeTextDisplay() {
    if (this.isActive) {
      // Text continues from where it was, changes resume at next segment transition
      eventBus.emit(TEXT_OVERLAY_EVENTS.RESUMED, {
        timestamp: Date.now(),
      })
    }
  }

  // Handle segment transitions (replaces timer-based scheduling)
  handleSegmentTransition() {
    if (!this.isActive) return

    const textPoolSize = stateManager.getTextPoolSize()
    if (textPoolSize === 0) {
      // No texts available, hide current text if any
      if (this.currentText) {
        this.hideCurrentText()
      }
      return
    }

    // If there is currentText, increment segmentLife and check if it should be transitioned
    if (this.currentText) {
      this.segmentLife++

      if (this.segmentLife > this.maxLife) {
        this.decideTextTransition()
      }
      return
    }

    // If there is no currentText, decide what to do next
    this.decideTextTransition()
  }

  /**
   * Decide whether to show new text or hide current text based on frequency
   * This method encapsulates the coin flip logic to avoid duplication
   */
  decideTextTransition() {
    const frequency = stateManager.getTextFrequency()

    // Hide current text first if any
    if (this.currentText) {
      this.hideCurrentText()
    }

    // Flip the coin to decide whether to show new text
    if (Math.random() < frequency) {
      this.displayRandomText()
    }
    // If coin flip fails, text remains hidden (no action needed)
  }

  displayRandomText() {
    const randomText = stateManager.getRandomText()
    if (!randomText) return

    this.currentText = randomText
    this.segmentLife = 0 // Reset segment counter
    this.maxLife = Math.floor(Math.random() * this.maxSegmentLife) + 1 // Set random duration (1-maxSegmentLife segments)

    this.showText(randomText)

    eventBus.emit(TEXT_OVERLAY_EVENTS.TEXT_SELECTED, {
      text: randomText,
      maxLife: this.maxLife,
      timestamp: Date.now(),
    })
  }

  /**
   * Update CSS variables for text sizing based on projection surface dimensions
   * This ensures proper scaling in projection mode while keeping styling in CSS
   */
  updateTextSizingVariables() {
    // Get projection mode state to determine if we're in projection mode
    const projectionState = stateManager.getProjectionMode()

    let surfaceWidth, surfaceHeight

    if (projectionState && projectionState.active) {
      // In projection mode: use projection surface dimensions
      surfaceWidth = projectionState.screenWidth || window.innerWidth
      surfaceHeight = projectionState.screenHeight || window.innerHeight
    } else {
      // In normal mode: clear CSS variables to use viewport units fallback
      document.documentElement.style.removeProperty('--text-base-size')
      document.documentElement.style.removeProperty('--text-short-size')
      document.documentElement.style.removeProperty('--text-medium-size')
      document.documentElement.style.removeProperty('--text-long-size')
      return
    }

    // Calculate font sizes as percentage of surface dimensions
    const baseSize = Math.max(Math.floor(surfaceHeight * 0.2), 16)
    const shortSize = Math.max(Math.floor(Math.min(surfaceWidth * 0.2, surfaceHeight * 0.2)), 16)
    const mediumSize = Math.max(Math.floor(Math.min(surfaceWidth * 0.13, surfaceHeight * 0.13)), 16)
    const longSize = Math.max(Math.floor(Math.min(surfaceWidth * 0.1, surfaceHeight * 0.1)), 16)

    // Set CSS variables on the document root
    document.documentElement.style.setProperty('--text-base-size', `${baseSize}px`)
    document.documentElement.style.setProperty('--text-short-size', `${shortSize}px`)
    document.documentElement.style.setProperty('--text-medium-size', `${mediumSize}px`)
    document.documentElement.style.setProperty('--text-long-size', `${longSize}px`)

    return {
      baseSize,
      shortSize,
      mediumSize,
      longSize,
    }
  }

  showText(text) {
    if (!text || !this.overlayElement) return

    // Set text content
    this.overlayElement.textContent = text

    // Apply text length classification and styling
    this.applyTextClassification(text)

    // Update CSS variables for projection-aware sizing
    const fontSizes = this.updateTextSizingVariables()

    // Apply random color (pure black or white)
    this.applyRandomColor()

    // Show immediately without animation (clean hard cut)
    this.overlayElement.classList.remove('hidden')
    this.overlayElement.classList.add('visible')

    // Reset display life counter
    this.segmentLife = 0

    eventBus.emit(TEXT_OVERLAY_EVENTS.SHOWN, {
      text,
      classification: this.getTextClassification(text),
      fontSizes: fontSizes,
      timestamp: Date.now(),
    })
  }

  hideCurrentText() {
    if (!this.overlayElement || !this.currentText) return

    const prev = this.currentText
    this.currentText = null
    this.segmentLife = 0
    this.maxLife = 0

    // Hide immediately (hard cut)
    this.overlayElement.classList.remove('visible')
    this.overlayElement.classList.add('hidden')
    this.overlayElement.textContent = ''

    // Clear classification classes
    this.overlayElement.classList.remove('text-short', 'text-medium', 'text-long')

    eventBus.emit(TEXT_OVERLAY_EVENTS.HIDDEN, {
      text: prev,
      timestamp: Date.now(),
    })
  }

  /**
   * Apply text classification based on character count
   * Short: < 15 characters
   * Medium: 15-80 characters
   * Long: > 80 characters
   */
  applyTextClassification(text) {
    // Remove existing classification classes
    this.overlayElement.classList.remove('text-short', 'text-medium', 'text-long')

    // Add appropriate classification class
    const classification = this.getTextClassification(text)
    this.overlayElement.classList.add(`text-${classification}`)
  }

  getTextClassification(text) {
    const charCount = text.length

    if (charCount < 15) {
      return 'short'
    } else if (charCount <= 80) {
      return 'medium'
    } else {
      return 'long'
    }
  }

  applyRandomColor() {
    this.overlayElement.classList.remove('color-white', 'color-black')
    const colorClass = Math.random() < 0.5 ? 'color-white' : 'color-black'
    this.overlayElement.classList.add(colorClass)
  }

  handleTextPoolChange() {
    // Text pool content changed - continue normal operation
    // No immediate action needed, next scheduled display will use updated pool
  }

  handleTextPoolSizeChange(event) {
    if (event.newSize === 0 && this.currentText) {
      // Text pool is now empty, hide current text
      this.hideCurrentText()
    }
  }

  updateFrequency(frequency) {
    // Update frequency setting for future displays
    eventBus.emit(TEXT_OVERLAY_EVENTS.FREQUENCY_UPDATED, {
      frequency: frequency,
      timestamp: Date.now(),
    })
  }

  /**
   * Handle projection mode changes - update CSS variables for font sizing
   */
  handleProjectionModeChange() {
    // Update CSS variables for all text sizes
    const fontSizes = this.updateTextSizingVariables()

    if (this.currentText) {
      eventBus.emit(TEXT_OVERLAY_EVENTS.FONT_SIZE_UPDATED, {
        text: this.currentText,
        fontSizes: fontSizes,
        classification: this.getTextClassification(this.currentText),
        timestamp: Date.now(),
      })
    }
  }

  getCurrentText() {
    return this.currentText
  }

  isDisplaying() {
    return this.currentText !== null
  }
}

// Create global instance and export as named export for consistency
export const textDisplayManager = new TextDisplayManager()
