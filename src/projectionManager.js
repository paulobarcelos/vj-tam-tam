/**
 * ProjectionManager - Story 6.3: Projection Setup Mode Toggle
 *
 * Manages projection mode with fixed-size stage and custom corner handles
 * Implements proper projection mapping paradigm where stage becomes fixed canvas
 */

import { eventBus } from './eventBus.js'
import { stateManager } from './stateManager.js'
import { toastManager } from './toastManager.js'
import { STATE_EVENTS, PROJECTION_EVENTS } from './constants/events.js'
import { t } from './constants/strings.js'

class ProjectionManager {
  constructor() {
    this.isActive = false
    this.maptasticInstance = null
    this.toggleButton = null
    this.stageElement = null
    this.handlesContainer = null
    this.projectionModeControls = null
    this.isInitialized = false

    // Corner handle management
    this.cornerHandles = []
    this.isDragging = false
    this.dragCornerIndex = -1
    this.dragOffset = { x: 0, y: 0 }

    // Default corner positions (pixel coordinates)
    this.cornerPositions = [
      { x: 0, y: 0 }, // top-left
      { x: window.innerWidth, y: 0 }, // top-right
      { x: window.innerWidth, y: window.innerHeight }, // bottom-right
      { x: 0, y: window.innerHeight }, // bottom-left
    ]

    // Aspect ratio management (Story 6.4) - store width/height, calculate ratio on demand
    this.aspectRatioWidth = 16
    this.aspectRatioHeight = 9

    // UI element references for aspect ratio controls
    this.aspectPresetButtons = null
    this.aspectWidthInput = null
    this.aspectHeightInput = null
    this.matchScreenButton = null

    // Projection surface configuration
    this.projectionSurface = {
      aspectRatio: null, // Will be calculated or loaded
      screenWidth: null,
      screenHeight: null,
    }

    // Debounce timer for resize events
    this.resizeTimeout = null

    // Bind methods to preserve 'this' context
    this.handleToggleClick = this.handleToggleClick.bind(this)
    this.handleIdleStateChange = this.handleIdleStateChange.bind(this)
    this.handleWindowResize = this.handleWindowResize.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)

    // Aspect ratio control handlers (Story 6.4)
    this.handleAspectPresetClick = this.handleAspectPresetClick.bind(this)
    this.handleAspectInputChange = this.handleAspectInputChange.bind(this)
    this.handleMatchScreenClick = this.handleMatchScreenClick.bind(this)
  }

  /**
   * Get the current aspect ratio (computed from width/height)
   * @returns {number} - The aspect ratio (width/height)
   */
  get currentAspectRatio() {
    return this.aspectRatioWidth / this.aspectRatioHeight
  }

  /**
   * Initialize ProjectionManager
   * @returns {boolean} - Success status
   */
  init() {
    // Initialize DOM elements
    this.stageElement = document.getElementById('stage')
    this.handlesContainer = document.getElementById('projection-handles-container')
    this.toggleButton = document.getElementById('projection-toggle-btn')
    this.projectionModeControls = document.getElementById('projection-mode-controls')

    // Initialize aspect ratio control elements (Story 6.4)
    this.aspectPresetButtons = document.querySelectorAll('.aspect-preset-btn')
    this.aspectWidthInput = document.getElementById('aspect-width')
    this.aspectHeightInput = document.getElementById('aspect-height')
    this.matchScreenButton = document.getElementById('match-screen-btn')

    // Check for required DOM elements
    if (
      !this.stageElement ||
      !this.handlesContainer ||
      !this.toggleButton ||
      !this.projectionModeControls
    ) {
      console.error(t.get('SYSTEM_MESSAGES.projectionManager.requiredElementsNotFound'))
      return false
    }

    // Check for aspect ratio control elements (Story 6.4)
    if (
      !this.aspectPresetButtons.length ||
      !this.aspectWidthInput ||
      !this.aspectHeightInput ||
      !this.matchScreenButton
    ) {
      console.error(t.get('SYSTEM_MESSAGES.projectionManager.requiredAspectElementsNotFound'))
      return false
    }

    // Set up event listeners
    this.setupEventListeners()

    // Set up aspect ratio control event listeners (Story 6.4)
    this.setupAspectRatioEventListeners()

    // Load persisted state
    this.loadPersistedState()

    this.isInitialized = true
    console.log(t.get('SYSTEM_MESSAGES.projectionManager.initialized'))
    return true
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Button click handler
    this.toggleButton.addEventListener('click', this.handleToggleClick)

    // Listen for idle state changes
    eventBus.on('ui.idleStateChanged', this.handleIdleStateChange)

    // Listen for projection mode state updates
    eventBus.on(STATE_EVENTS.PROJECTION_MODE_UPDATED, this.handleProjectionModeUpdate.bind(this))

    // Listen for window resize events
    window.addEventListener('resize', this.handleWindowResize)
  }

  /**
   * Set up aspect ratio control event listeners (Story 6.4)
   */
  setupAspectRatioEventListeners() {
    // Preset button listeners
    this.aspectPresetButtons.forEach((button) => {
      button.addEventListener('click', this.handleAspectPresetClick)
    })

    // Aspect ratio input listeners
    this.aspectWidthInput.addEventListener('input', this.handleAspectInputChange)
    this.aspectHeightInput.addEventListener('input', this.handleAspectInputChange)

    // Match screen button listener
    this.matchScreenButton.addEventListener('click', this.handleMatchScreenClick)
  }

  /**
   * Handle projection toggle button click
   */
  handleToggleClick() {
    if (this.isActive) {
      this.exitProjectionMode()
    } else {
      this.enterProjectionMode()
    }
  }

  /**
   * Enter Projection Setup Mode (AC 3.2)
   */
  enterProjectionMode() {
    try {
      console.log(t.get('SYSTEM_MESSAGES.projectionManager.enteringMode'))

      // Step 1: Update internal state first (needed for applyAspectRatioToStage)
      this.isActive = true

      // Step 2: Load saved aspect ratio settings (Story 6.4)
      this.loadSavedAspectRatio()

      // Step 3: Apply aspect ratio to stage (Story 6.4)
      this.applyAspectRatioToStage()

      // Step 4: Initialize Maptastic engine (without UI controls)
      this.initializeMaptastic()

      // Step 5: Create our custom corner handles
      this.createCornerHandles()

      // Step 6: Update UI state
      this.updateToggleButton()
      this.showProjectionControls()

      // Step 7: Update state manager
      stateManager.updateProjectionMode({ active: true })

      // Step 8: Emit projection mode enabled event
      eventBus.emit(PROJECTION_EVENTS.MODE_ENABLED, {
        timestamp: Date.now(),
      })

      console.log(t.get('SYSTEM_MESSAGES.projectionManager.modeEntered'))
    } catch (error) {
      console.error('Error entering projection mode:', error)
      toastManager.error(t.projectionModeEnterFailed())
    }
  }

  /**
   * Exit Projection Setup Mode (AC 3.3)
   */
  exitProjectionMode() {
    try {
      console.log(t.get('SYSTEM_MESSAGES.projectionManager.exitingMode'))

      // Remove our custom corner handles
      this.removeCornerHandles()

      // Save current layout before disabling
      this.saveMaptasticLayout()

      // Restore responsive stage styling (Story 6.4 AC 4.5)
      this.restoreResponsiveStage()

      // Update internal state
      this.isActive = false

      // Update UI state
      this.updateToggleButton()
      this.hideProjectionControls()

      // Update state manager
      stateManager.updateProjectionMode({ active: false })

      // Emit projection mode disabled event
      eventBus.emit(PROJECTION_EVENTS.MODE_DISABLED, {
        timestamp: Date.now(),
      })

      console.log(t.get('SYSTEM_MESSAGES.projectionManager.modeExited'))
    } catch (error) {
      console.error('Error exiting projection mode:', error)
      toastManager.error(t.projectionModeExitFailed())
    }
  }

  /**
   * Restore responsive stage styling when exiting projection mode (Story 6.4 AC 4.5)
   */
  restoreResponsiveStage() {
    try {
      console.log('Restoring responsive stage styling')

      // Clear Maptastic transformations first
      if (this.maptasticInstance) {
        // Reset the layout to clear transformations
        this.maptasticInstance.setLayout([])
        this.maptasticInstance = null
      }

      // Clear any CSS transforms that Maptastic might have applied
      this.stageElement.style.transform = ''
      this.stageElement.style.transformOrigin = ''

      // Remove fixed positioning and sizing - return to responsive (AC 4.5)
      this.stageElement.style.position = ''
      this.stageElement.style.top = ''
      this.stageElement.style.left = ''
      this.stageElement.style.width = ''
      this.stageElement.style.height = ''

      // Update stage classes for responsive mode (AC 4.5)
      this.stageElement.classList.remove('projection-mode')
      this.stageElement.classList.add('responsive-mode')

      console.log('Responsive stage styling restored')
    } catch (error) {
      console.error('Error restoring responsive stage:', error)
    }
  }

  /**
   * Initialize Maptastic with the stage element (engine only)
   */
  initializeMaptastic() {
    if (this.maptasticInstance) {
      console.log('Maptastic already initialized')
      return
    }

    try {
      // Initialize Maptastic WITHOUT built-in controls
      this.maptasticInstance = new Maptastic({
        autoLoad: false,
        autoSave: false,
        // No onchange callback - we'll handle updates manually
      })

      // Add the stage element to Maptastic
      this.maptasticInstance.addLayer(this.stageElement)

      // Load saved layout if it exists
      this.loadSavedMaptasticLayout()

      console.log('Maptastic engine initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Maptastic:', error)
      throw error
    }
  }

  /**
   * Create custom corner handles for dragging
   */
  createCornerHandles() {
    // Remove existing handles first
    this.removeCornerHandles()

    // Corner labels for identification
    const cornerLabels = ['TL', 'TR', 'BR', 'BL']

    // Create 4 corner handles
    for (let i = 0; i < 4; i++) {
      const handle = document.createElement('div')
      handle.className = 'projection-corner-handle'
      handle.dataset.cornerIndex = i
      handle.dataset.cornerLabel = cornerLabels[i]

      // Add event listeners for dragging
      handle.addEventListener('mousedown', this.handleMouseDown)
      handle.addEventListener('touchstart', this.handleTouchStart)

      // Add to handles container (not stage element to avoid transformation)
      this.handlesContainer.appendChild(handle)
      this.cornerHandles.push(handle)
    }

    // Position all handles
    this.updateHandlePositions()

    // Add global mouse/touch event listeners for dragging
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mouseup', this.handleMouseUp)
    document.addEventListener('touchmove', this.handleTouchMove)
    document.addEventListener('touchend', this.handleTouchEnd)

    console.log('Corner handles created')
  }

  /**
   * Remove custom corner handles
   */
  removeCornerHandles() {
    // Remove DOM elements
    this.cornerHandles.forEach((handle) => {
      if (handle.parentNode) {
        handle.parentNode.removeChild(handle)
      }
    })
    this.cornerHandles = []

    // Remove global event listeners
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
    document.removeEventListener('touchmove', this.handleTouchMove)
    document.removeEventListener('touchend', this.handleTouchEnd)

    console.log('Corner handles removed')
  }

  /**
   * Handle mouse down on corner handle
   */
  handleMouseDown(event) {
    event.preventDefault()
    const cornerIndex = parseInt(event.target.dataset.cornerIndex)
    this.startDrag(cornerIndex)
  }

  /**
   * Handle touch start on corner handle
   */
  handleTouchStart(event) {
    event.preventDefault()
    const cornerIndex = parseInt(event.target.dataset.cornerIndex)
    this.startDrag(cornerIndex)
  }

  /**
   * Start dragging a corner
   */
  startDrag(cornerIndex) {
    this.isDragging = true
    this.dragCornerIndex = cornerIndex

    // Add dragging class for visual feedback
    const handle = this.cornerHandles[cornerIndex]
    handle.classList.add('dragging')
  }

  /**
   * Handle mouse move during drag
   */
  handleMouseMove(event) {
    if (this.isDragging) {
      this.updateDrag(event.clientX, event.clientY)
    }
  }

  /**
   * Handle touch move during drag
   */
  handleTouchMove(event) {
    if (this.isDragging) {
      const touch = event.touches[0]
      this.updateDrag(touch.clientX, touch.clientY)
    }
  }

  /**
   * Update drag position
   */
  updateDrag(clientX, clientY) {
    // Corner position is exactly where the mouse is - no offset calculation needed
    this.cornerPositions[this.dragCornerIndex] = {
      x: clientX,
      y: clientY,
    }

    // Update handle position to match mouse position exactly
    const handle = this.cornerHandles[this.dragCornerIndex]
    handle.style.left = `${clientX}px`
    handle.style.top = `${clientY}px`

    // Update Maptastic layout
    this.updateMaptasticLayout()
  }

  /**
   * Handle mouse up - end drag
   */
  handleMouseUp() {
    this.endDrag()
  }

  /**
   * Handle touch end - end drag
   */
  handleTouchEnd() {
    this.endDrag()
  }

  /**
   * End dragging operation
   */
  endDrag() {
    if (this.isDragging) {
      this.isDragging = false

      // Remove dragging class
      if (this.dragCornerIndex >= 0 && this.cornerHandles[this.dragCornerIndex]) {
        this.cornerHandles[this.dragCornerIndex].classList.remove('dragging')
      }

      this.dragCornerIndex = -1

      // Save the new layout
      this.saveMaptasticLayout()
    }
  }

  /**
   * Update Maptastic layout based on current corner positions
   */
  updateMaptasticLayout() {
    if (!this.maptasticInstance || !this.stageElement) return

    try {
      // Get current stage dimensions
      const stageWidth = this.stageElement.offsetWidth
      const stageHeight = this.stageElement.offsetHeight

      // Source points: original corners of element in natural state (stage dimensions)
      const sourcePoints = [
        [0, 0], // top-left
        [stageWidth, 0], // top-right
        [stageWidth, stageHeight], // bottom-right
        [0, stageHeight], // bottom-left
      ]

      // Target points: where those corners should be mapped to (pixel coordinates from user dragging)
      const targetPoints = this.cornerPositions.map((pos) => [pos.x, pos.y])

      // Complete layout data structure for Maptastic
      const layout = [
        {
          id: this.stageElement.id,
          sourcePoints: sourcePoints,
          targetPoints: targetPoints,
        },
      ]
      console.log(t.get('SYSTEM_MESSAGES.projectionManager.maptasticLayoutUpdated'), layout)

      this.maptasticInstance.setLayout(layout)
    } catch (error) {
      console.error(t.get('SYSTEM_MESSAGES.projectionManager.maptasticLayoutUpdateError'), error)
    }
  }

  /**
   * Save current Maptastic layout to state
   */
  saveMaptasticLayout() {
    try {
      // Save corner positions to state manager
      stateManager.updateProjectionMode({
        maptasticLayout: {
          corners: [...this.cornerPositions], // Create a copy
        },
      })

      console.log(t.get('SYSTEM_MESSAGES.projectionManager.maptasticLayoutSaved'))
    } catch (error) {
      console.error(t.get('SYSTEM_MESSAGES.projectionManager.maptasticLayoutSaveError'), error)
    }
  }

  /**
   * Load saved Maptastic layout from state
   */
  loadSavedMaptasticLayout() {
    try {
      const savedState = stateManager.getProjectionMode()

      if (savedState && savedState.maptasticLayout && savedState.maptasticLayout.corners) {
        this.cornerPositions = [...savedState.maptasticLayout.corners]

        // Update Maptastic with loaded layout
        this.updateMaptasticLayout()

        console.log(t.get('SYSTEM_MESSAGES.projectionManager.maptasticLayoutLoaded'))
      } else {
        // Initialize with default corner positions (stage corners)
        this.initializeDefaultCornerPositions()
        console.log(t.get('SYSTEM_MESSAGES.projectionManager.noSavedLayout'))
      }
    } catch (error) {
      console.error(t.get('SYSTEM_MESSAGES.projectionManager.maptasticLayoutLoadError'), error)
      // Fallback to default positions
      this.initializeDefaultCornerPositions()
    }
  }

  /**
   * Initialize corner positions to stage corners (default state)
   */
  initializeDefaultCornerPositions() {
    const stageRect = this.stageElement.getBoundingClientRect()

    this.cornerPositions = [
      { x: stageRect.left, y: stageRect.top }, // Top-left
      { x: stageRect.right, y: stageRect.top }, // Top-right
      { x: stageRect.right, y: stageRect.bottom }, // Bottom-right
      { x: stageRect.left, y: stageRect.bottom }, // Bottom-left
    ]

    // Update Maptastic with default layout (stage corners map to stage corners = no distortion)
    this.updateMaptasticLayout()
  }

  /**
   * Update handle positions based on current corner positions
   */
  updateHandlePositions() {
    if (this.cornerHandles.length === 0) return

    // Position handles using pixel coordinates directly
    this.cornerHandles.forEach((handle, index) => {
      if (handle && this.cornerPositions[index]) {
        const pos = this.cornerPositions[index]

        // Use pixel coordinates directly (no normalization)
        handle.style.left = `${pos.x}px`
        handle.style.top = `${pos.y}px`
      }
    })

    console.log(t.get('SYSTEM_MESSAGES.projectionManager.handlesPositioned'))
  }

  /**
   * Update toggle button state
   */
  updateToggleButton() {
    const buttonText = this.toggleButton.querySelector('.button-text')

    if (this.isActive) {
      buttonText.textContent = 'Exit Projection Setup'
      this.toggleButton.setAttribute('data-projection-active', 'true')
      this.toggleButton.setAttribute('aria-expanded', 'true')
    } else {
      buttonText.textContent = 'Enter Projection Setup'
      this.toggleButton.setAttribute('data-projection-active', 'false')
      this.toggleButton.setAttribute('aria-expanded', 'false')
    }
  }

  /**
   * Show projection mode controls
   */
  showProjectionControls() {
    if (this.projectionModeControls) {
      this.projectionModeControls.style.display = 'block'
    }
  }

  /**
   * Hide projection mode controls
   */
  hideProjectionControls() {
    if (this.projectionModeControls) {
      this.projectionModeControls.style.display = 'none'
    }
  }

  /**
   * Handle window resize events
   * In projection mode, handles stay fixed - window resize just changes cropping
   */
  handleWindowResize() {
    if (!this.isActive || this.cornerHandles.length === 0) return

    // In projection mode, corner handles are fixed and don't move with window resize
    // The window resize just changes how the scene is cropped, not where the handles are
    console.log(t.get('SYSTEM_MESSAGES.projectionManager.windowResizeInProjection'))
  }

  /**
   * Handle idle state changes (AC 3.7)
   * @param {Object} data - Event data containing idle state information
   */
  handleIdleStateChange(data) {
    if (!this.isActive) return

    try {
      // Control visibility of our custom corner handles
      this.cornerHandles.forEach((handle) => {
        if (data.isIdle) {
          handle.style.opacity = '0'
          handle.style.pointerEvents = 'none'
        } else {
          handle.style.opacity = '1'
          handle.style.pointerEvents = 'auto'
        }
      })

      console.log(
        t.get('SYSTEM_MESSAGES.projectionManager.handlesVisibilityUpdated', { isIdle: data.isIdle })
      )
    } catch (error) {
      console.error(t.get('SYSTEM_MESSAGES.projectionManager.handlesVisibilityError'), error)
    }
  }

  /**
   * Handle projection mode state updates from StateManager
   * @param {Object} data - Event data containing projection mode state
   */
  handleProjectionModeUpdate(data) {
    try {
      const newActiveState = data.projectionMode?.active ?? false

      // Only sync if state is different
      if (newActiveState !== this.isActive) {
        if (newActiveState) {
          this.enterProjectionMode()
        } else {
          this.exitProjectionMode()
        }

        this.updateToggleButton()
      }
    } catch (error) {
      console.error(t.get('SYSTEM_MESSAGES.projectionManager.stateUpdateError'), error)
    }
  }

  /**
   * Load persisted projection mode state
   */
  loadPersistedState() {
    try {
      const savedState = stateManager.getProjectionMode()
      console.log(t.get('SYSTEM_MESSAGES.projectionManager.stateLoaded', { state: savedState }))

      if (savedState && savedState.active) {
        // Restore active projection mode
        this.enterProjectionMode()
      }
    } catch (error) {
      console.error(t.get('SYSTEM_MESSAGES.projectionManager.stateLoadError'), error)
    }
  }

  /**
   * Check if projection mode is currently active
   * @returns {boolean} - Current active state
   */
  isProjectionModeActive() {
    return this.isActive
  }

  /**
   * Handle aspect ratio preset button clicks (Story 6.4)
   * @param {Event} event - Click event
   */
  handleAspectPresetClick(event) {
    const ratioName = event.target.dataset.ratio
    const [width, height] = ratioName.split(':').map(Number)

    // Update state
    this.aspectRatioWidth = width
    this.aspectRatioHeight = height

    // Update the input fields
    this.aspectWidthInput.value = width
    this.aspectHeightInput.value = height

    // Update UI
    this.updateUIControls()

    // Apply to stage if in projection mode
    if (this.isActive) {
      this.applyAspectRatioToStage()
    }

    // Save settings
    this.saveAspectRatio()
  }

  /**
   * Handle aspect ratio input changes (Story 6.4)
   */
  handleAspectInputChange() {
    const width = parseFloat(this.aspectWidthInput.value)
    const height = parseFloat(this.aspectHeightInput.value)

    // Validate inputs
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      return // Invalid input, don't update
    }

    // Update state
    this.aspectRatioWidth = width
    this.aspectRatioHeight = height

    // Update UI (clear preset selections)
    this.updateUIControls()

    // Apply to stage if in projection mode
    if (this.isActive) {
      this.applyAspectRatioToStage()
    }

    // Save settings
    this.saveAspectRatio()
  }

  /**
   * Handle "Match Current Screen" button click (Story 6.4)
   */
  handleMatchScreenClick() {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    // Update state
    this.aspectRatioWidth = screenWidth
    this.aspectRatioHeight = screenHeight

    // Update the input fields
    this.aspectWidthInput.value = screenWidth
    this.aspectHeightInput.value = screenHeight

    // Update UI (clear preset selections)
    this.updateUIControls()

    // Apply to stage if in projection mode
    if (this.isActive) {
      this.applyAspectRatioToStage()
    }

    // Save settings
    this.saveAspectRatio()

    toastManager.success(t.projectionDimensionsUpdated(screenWidth, screenHeight))
  }

  /**
   * Update UI controls to reflect current aspect ratio state (Story 6.4)
   */
  updateUIControls() {
    // Clear all preset button active states
    this.aspectPresetButtons.forEach((button) => {
      button.classList.remove('active')
    })

    // Check if current dimensions match any preset and activate it
    const currentRatio = this.aspectRatioWidth / this.aspectRatioHeight
    this.aspectPresetButtons.forEach((button) => {
      const [presetWidth, presetHeight] = button.dataset.ratio.split(':').map(Number)
      const presetRatio = presetWidth / presetHeight
      if (Math.abs(currentRatio - presetRatio) < 0.01) {
        button.classList.add('active')
      }
    })

    // Update input fields to reflect current state
    this.aspectWidthInput.value = this.aspectRatioWidth
    this.aspectHeightInput.value = this.aspectRatioHeight
  }

  /**
   * Apply current aspect ratio to stage dimensions (Story 6.4 AC 4.4)
   */
  applyAspectRatioToStage() {
    if (!this.isActive) return

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Always start with screen width, then calculate height from aspect ratio
    let stageWidth = viewportWidth
    let stageHeight = stageWidth / this.currentAspectRatio

    // If calculated height exceeds screen height, constrain by height instead
    if (stageHeight > viewportHeight) {
      stageHeight = viewportHeight
      stageWidth = stageHeight * this.currentAspectRatio
    }

    // Apply dimensions and top-left positioning (AC 4.1, AC 4.4)
    this.stageElement.style.width = `${stageWidth}px`
    this.stageElement.style.height = `${stageHeight}px`
    this.stageElement.style.position = 'fixed'
    this.stageElement.style.top = '0px'
    this.stageElement.style.left = '0px'

    // Update stage class for styling
    this.stageElement.classList.add('projection-mode')
    this.stageElement.classList.remove('responsive-mode')

    console.log(
      t.get('SYSTEM_MESSAGES.projectionManager.stageResized', {
        width: stageWidth,
        height: stageHeight,
        ratio: this.currentAspectRatio.toFixed(3),
      })
    )

    // Notify Maptastic of stage changes after applying
    this.notifyMaptasticOfStageChange()
  }

  /**
   * Load saved aspect ratio from state (Story 6.4)
   */
  loadSavedAspectRatio() {
    try {
      const savedState = stateManager.getProjectionMode()

      if (savedState && savedState.aspectRatio) {
        const aspectRatio = savedState.aspectRatio

        // New format: width/height object
        if (aspectRatio.width && aspectRatio.height) {
          this.aspectRatioWidth = aspectRatio.width
          this.aspectRatioHeight = aspectRatio.height
        }
        // Backward compatibility: simple ratio number
        else if (typeof aspectRatio === 'number') {
          const targetRatio = aspectRatio

          if (Math.abs(targetRatio - 16 / 9) < 0.01) {
            // Close to 16:9
            this.aspectRatioWidth = 16
            this.aspectRatioHeight = 9
          } else if (Math.abs(targetRatio - 4 / 3) < 0.01) {
            // Close to 4:3
            this.aspectRatioWidth = 4
            this.aspectRatioHeight = 3
          } else if (Math.abs(targetRatio - 1) < 0.01) {
            // Close to 1:1
            this.aspectRatioWidth = 1
            this.aspectRatioHeight = 1
          } else {
            // Custom ratio - scale up to reasonable numbers
            this.aspectRatioWidth = Math.round(targetRatio * 100)
            this.aspectRatioHeight = 100
          }
        }
      } else {
        // Default to current screen dimensions (AC 4.3a)
        this.aspectRatioWidth = window.innerWidth
        this.aspectRatioHeight = window.innerHeight
      }

      // Update UI controls to reflect loaded state
      this.updateUIControls()

      console.log(
        t.get('SYSTEM_MESSAGES.projectionManager.aspectRatioLoaded', {
          ratio: this.currentAspectRatio.toFixed(3),
        })
      )
    } catch (error) {
      console.error(t.get('SYSTEM_MESSAGES.projectionManager.aspectRatioLoadError'), error)
      // Fallback to screen dimensions
      this.aspectRatioWidth = window.innerWidth
      this.aspectRatioHeight = window.innerHeight
      this.updateUIControls()
    }
  }

  /**
   * Save current aspect ratio to state (Story 6.4)
   */
  saveAspectRatio() {
    try {
      stateManager.updateProjectionMode({
        aspectRatio: {
          width: this.aspectRatioWidth,
          height: this.aspectRatioHeight,
        },
      })
    } catch (error) {
      console.error(t.get('SYSTEM_MESSAGES.projectionManager.aspectRatioSaveError'), error)
    }
  }

  // updateAspectRatioDisplay method removed - no longer displaying current aspect ratio

  /**
   * Notify Maptastic of stage dimension changes (Story 6.4)
   */
  notifyMaptasticOfStageChange() {
    // Trigger Maptastic to recalculate based on new stage dimensions
    eventBus.emit('projection.stageResized', {
      width: this.stageElement.offsetWidth,
      height: this.stageElement.offsetHeight,
      aspectRatio: {
        width: this.aspectRatioWidth,
        height: this.aspectRatioHeight,
      },
    })

    // DON'T reset corner positions - preserve user's projection mapping
    // Corner positions should only be reset when explicitly loading saved layout
    // or when entering projection mode for the first time

    // Update Maptastic layout if it exists to account for stage size changes
    if (this.maptasticInstance) {
      this.updateMaptasticLayout()
    }
  }

  /**
   * Clean up resources and event listeners
   */
  cleanup() {
    try {
      // Exit projection mode if active
      if (this.isActive) {
        this.exitProjectionMode()
      }

      // Remove corner handles
      this.removeCornerHandles()

      // Remove event listeners
      if (this.toggleButton) {
        this.toggleButton.removeEventListener('click', this.handleToggleClick)
      }

      // Remove aspect ratio control event listeners (Story 6.4)
      if (this.aspectPresetButtons) {
        this.aspectPresetButtons.forEach((button) => {
          button.removeEventListener('click', this.handleAspectPresetClick)
        })
      }
      if (this.aspectWidthInput) {
        this.aspectWidthInput.removeEventListener('input', this.handleAspectInputChange)
      }
      if (this.aspectHeightInput) {
        this.aspectHeightInput.removeEventListener('input', this.handleAspectInputChange)
      }
      if (this.matchScreenButton) {
        this.matchScreenButton.removeEventListener('click', this.handleMatchScreenClick)
      }

      eventBus.off('ui.idleStateChanged', this.handleIdleStateChange)
      eventBus.off(STATE_EVENTS.PROJECTION_MODE_UPDATED, this.handleProjectionModeUpdate)
      window.removeEventListener('resize', this.handleWindowResize)

      // Clear any pending resize timeout
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout)
        this.resizeTimeout = null
      }

      // Reset state
      this.isActive = false
      this.isDragging = false
      this.dragCornerIndex = -1

      this.isInitialized = false

      console.log(t.get('SYSTEM_MESSAGES.projectionManager.cleanupCompleted'))
    } catch (error) {
      console.error(t.get('SYSTEM_MESSAGES.projectionManager.cleanupError'), error)
    }
  }
}

// Create and export singleton instance
export const projectionManager = new ProjectionManager()
