/**
 * TestCardManager - Story 6.8: Test Card Overlay Toggle
 *
 * Manages test card overlay display for projection calibration
 * Integrates with projection transformations and color corrections
 */

import { eventBus } from './eventBus.js'
import { stateManager } from './stateManager.js'
import { PROJECTION_EVENTS, COLOR_FILTER_EVENTS } from './constants/events.js'

class TestCardManager {
  constructor() {
    this.isVisible = false
    this.stageElement = null
    this.overlayElement = null
    this.toggleButton = null
    this.isInitialized = false

    // Bind methods to preserve 'this' context
    this.handleToggleClick = this.handleToggleClick.bind(this)
    this.handleProjectionModeChange = this.handleProjectionModeChange.bind(this)
    this.handleStageTransformed = this.handleStageTransformed.bind(this)
    this.handleAspectRatioChanged = this.handleAspectRatioChanged.bind(this)
    this.handleColorFilterChange = this.handleColorFilterChange.bind(this)
  }

  /**
   * Initialize the TestCardManager
   */
  init() {
    // Get DOM elements
    this.stageElement = document.getElementById('stage')
    this.overlayElement = document.getElementById('test-card-overlay')
    this.toggleButton = document.getElementById('test-card-toggle-btn')

    // Check for required DOM elements
    if (!this.stageElement || !this.overlayElement || !this.toggleButton) {
      console.error('TestCardManager: Required DOM elements not found')
      return false
    }

    // Set up event listeners
    this.setupEventListeners()

    // Load saved state
    this.loadSavedState()

    this.isInitialized = true
    console.log('TestCardManager initialized successfully')
    return true
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Toggle button click
    this.toggleButton.addEventListener('click', this.handleToggleClick)

    // Listen for projection mode changes
    eventBus.on(PROJECTION_EVENTS.MODE_ENABLED, this.handleProjectionModeChange)
    eventBus.on(PROJECTION_EVENTS.MODE_DISABLED, this.handleProjectionModeChange)

    // Listen for stage resize (canonical emission from ProjectionManager)
    eventBus.on(PROJECTION_EVENTS.STAGE_RESIZED, this.handleStageTransformed)

    // Listen for color filter changes to ensure test card reflects them (canonical)
    eventBus.on(COLOR_FILTER_EVENTS.APPLIED, this.handleColorFilterChange)
  }

  /**
   * Handle test card toggle button click
   */
  handleToggleClick() {
    this.toggleTestCard()
  }

  /**
   * Toggle test card visibility
   */
  toggleTestCard() {
    this.isVisible = !this.isVisible

    if (this.isVisible) {
      this.showTestCard()
    } else {
      this.hideTestCard()
    }

    this.updateButtonState()
    this.saveState()

    // Emit event for other components
    eventBus.emit('testCard.toggled', {
      visible: this.isVisible,
      timestamp: Date.now(),
    })

    console.log(`Test card ${this.isVisible ? 'shown' : 'hidden'}`)
  }

  /**
   * Show the test card overlay
   */
  showTestCard() {
    // Ensure overlay is inside the stage element to inherit transformations
    if (this.overlayElement.parentElement !== this.stageElement) {
      this.stageElement.appendChild(this.overlayElement)
    }

    this.overlayElement.style.display = 'block'
    this.isVisible = true
  }

  /**
   * Hide the test card overlay
   */
  hideTestCard() {
    this.overlayElement.style.display = 'none'
    this.isVisible = false
  }

  /**
   * Update toggle button state
   */
  updateButtonState() {
    const stateText = this.isVisible ? 'On' : 'Off'

    this.toggleButton.setAttribute('data-active', this.isVisible.toString())
    this.toggleButton.querySelector('.button-state').textContent = stateText
  }

  /**
   * Handle projection mode state changes
   */
  handleProjectionModeChange() {
    // Test card functionality is available when projection mode is active
    // The UI controls are already handled by projection mode visibility
    console.log('TestCardManager: Projection mode changed')
  }

  /**
   * Handle stage transformation events
   */
  handleStageTransformed() {
    // Overlay automatically follows stage transformations since it's a child element
    // This method can be used for any additional positioning logic if needed
    console.log('TestCardManager: Stage transformed - overlay inherits transformations')
  }

  /**
   * Handle aspect ratio changes
   */
  handleAspectRatioChanged() {
    if (this.isVisible) {
      this.updateOverlayAspectRatio()
    }
  }

  /**
   * Update overlay aspect ratio to match stage
   */
  updateOverlayAspectRatio() {
    // Image automatically stretches to fit the stage dimensions
    // No additional logic needed since object-fit: fill handles stretching
    console.log('TestCardManager: Image automatically stretches to stage dimensions')
  }

  /**
   * Handle color filter changes
   */
  handleColorFilterChange() {
    // Test card will automatically inherit color filters since it's a child of the stage
    // No additional action needed - CSS filters applied to stage affect all children
    console.log('TestCardManager: Color filters changed - test card inherits filters')
  }

  /**
   * Save current state to localStorage
   */
  saveState() {
    try {
      stateManager.updateTestCardSettings({ visible: this.isVisible })
      console.log('TestCardManager: State saved')
    } catch (error) {
      console.error('TestCardManager: Failed to save state:', error)
    }
  }

  /**
   * Load saved state from localStorage
   */
  loadSavedState() {
    try {
      const savedSettings = stateManager.getTestCardSettings()

      if (savedSettings && typeof savedSettings.visible === 'boolean') {
        this.isVisible = savedSettings.visible

        if (this.isVisible) {
          this.showTestCard()
        } else {
          this.hideTestCard()
        }

        this.updateButtonState()
        console.log(`TestCardManager: State loaded - visible: ${this.isVisible}`)
      } else {
        // Default to hidden
        this.isVisible = false
        this.hideTestCard()
        this.updateButtonState()
        console.log('TestCardManager: No saved state found, defaulting to hidden')
      }
    } catch (error) {
      console.error('TestCardManager: Failed to load state:', error)
      // Default to hidden on error
      this.isVisible = false
      this.hideTestCard()
      this.updateButtonState()
    }
  }

  /**
   * Get current test card state
   */
  getCurrentState() {
    return {
      visible: this.isVisible,
      initialized: this.isInitialized,
    }
  }

  /**
   * Cleanup method
   */
  cleanup() {
    if (this.toggleButton) {
      this.toggleButton.removeEventListener('click', this.handleToggleClick)
    }

    // Remove event bus listeners
    eventBus.off(PROJECTION_EVENTS.MODE_ENABLED, this.handleProjectionModeChange)
    eventBus.off(PROJECTION_EVENTS.MODE_DISABLED, this.handleProjectionModeChange)
    eventBus.off(PROJECTION_EVENTS.STAGE_RESIZED, this.handleStageTransformed)
    eventBus.off(COLOR_FILTER_EVENTS.APPLIED, this.handleColorFilterChange)

    console.log('TestCardManager cleaned up')
  }
}

// Create and export singleton instance
export const testCardManager = new TestCardManager()
