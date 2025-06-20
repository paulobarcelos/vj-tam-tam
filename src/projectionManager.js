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

    // Default corner positions (normalized 0-1)
    this.cornerPositions = [
      { x: 0, y: 0 }, // top-left
      { x: 1, y: 0 }, // top-right
      { x: 1, y: 1 }, // bottom-right
      { x: 0, y: 1 }, // bottom-left
    ]

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

    // Check for required DOM elements
    if (
      !this.stageElement ||
      !this.handlesContainer ||
      !this.toggleButton ||
      !this.projectionModeControls
    ) {
      console.error('Required projection elements not found')
      return false
    }

    // Set up event listeners
    this.setupEventListeners()

    // Load persisted state
    this.loadPersistedState()

    this.isInitialized = true
    console.log('ProjectionManager initialized')
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
      console.log('Entering projection mode')

      // Step 1: Configure projection surface and fix stage size
      this.configureProjectionSurface()

      // Step 2: Initialize Maptastic engine (without UI controls)
      this.initializeMaptastic()

      // Step 3: Create our custom corner handles
      this.createCornerHandles()

      // Step 4: Update internal state
      this.isActive = true

      // Step 5: Update UI state
      this.updateToggleButton()
      this.showProjectionControls()

      // Step 6: Update state manager
      stateManager.updateProjectionMode({ active: true })

      // Step 7: Emit projection mode enabled event
      eventBus.emit(PROJECTION_EVENTS.MODE_ENABLED, {
        timestamp: Date.now(),
      })

      console.log('Projection mode entered')
    } catch (error) {
      console.error('Error entering projection mode:', error)
      toastManager.show('Failed to enter projection mode', 'error')
    }
  }

  /**
   * Exit Projection Setup Mode (AC 3.3)
   */
  exitProjectionMode() {
    try {
      console.log('Exiting projection mode')

      // Remove our custom corner handles
      this.removeCornerHandles()

      // Save current layout before disabling
      this.saveMaptasticLayout()

      // Restore responsive stage styling
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

      console.log('Projection mode exited')
    } catch (error) {
      console.error('Error exiting projection mode:', error)
      toastManager.show('Failed to exit projection mode', 'error')
    }
  }

  /**
   * Configure projection surface and fix stage dimensions
   */
  configureProjectionSurface() {
    try {
      console.log('Configuring projection surface')

      // Step 1-3: Remove responsive styling and position stage at top-left
      this.stageElement.style.width = 'auto'
      this.stageElement.style.height = 'auto'
      this.stageElement.style.position = 'fixed'
      this.stageElement.style.top = '0px'
      this.stageElement.style.left = '0px'

      // Step 4: Measure and store screen dimensions
      this.projectionSurface.screenWidth = window.innerWidth
      this.projectionSurface.screenHeight = window.innerHeight

      // Step 5: Set stage width to screen width
      this.stageElement.style.width = `${this.projectionSurface.screenWidth}px`

      // Step 6: Check for stored projection surface aspect ratio
      const savedState = stateManager.getProjectionMode()
      if (savedState && savedState.projectionSurfaceAspectRatio) {
        this.projectionSurface.aspectRatio = savedState.projectionSurfaceAspectRatio
        console.log(
          'Using saved projection surface aspect ratio:',
          this.projectionSurface.aspectRatio
        )
      } else {
        // Calculate screen aspect ratio as default
        this.projectionSurface.aspectRatio =
          this.projectionSurface.screenWidth / this.projectionSurface.screenHeight
        console.log(
          'Calculated projection surface aspect ratio from screen:',
          this.projectionSurface.aspectRatio
        )

        // Save the calculated aspect ratio
        stateManager.updateProjectionMode({
          projectionSurfaceAspectRatio: this.projectionSurface.aspectRatio,
        })
      }

      // Step 7: Calculate and set stage height based on aspect ratio
      const stageHeight = this.projectionSurface.screenWidth / this.projectionSurface.aspectRatio
      this.stageElement.style.height = `${stageHeight}px`

      console.log(
        `Stage configured: ${this.projectionSurface.screenWidth}x${stageHeight} (aspect: ${this.projectionSurface.aspectRatio})`
      )
    } catch (error) {
      console.error('Error configuring projection surface:', error)
      throw error
    }
  }

  /**
   * Restore responsive stage styling when exiting projection mode
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

      // Remove fixed positioning and sizing
      this.stageElement.style.position = ''
      this.stageElement.style.top = ''
      this.stageElement.style.left = ''
      this.stageElement.style.width = ''
      this.stageElement.style.height = ''

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

    // Create 4 corner handles
    for (let i = 0; i < 4; i++) {
      const handle = document.createElement('div')
      handle.className = 'projection-corner-handle'
      handle.dataset.cornerIndex = i

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
    this.startDrag(cornerIndex, event.clientX, event.clientY)
  }

  /**
   * Handle touch start on corner handle
   */
  handleTouchStart(event) {
    event.preventDefault()
    const cornerIndex = parseInt(event.target.dataset.cornerIndex)
    const touch = event.touches[0]
    this.startDrag(cornerIndex, touch.clientX, touch.clientY)
  }

  /**
   * Start dragging a corner
   */
  startDrag(cornerIndex, clientX, clientY) {
    this.isDragging = true
    this.dragCornerIndex = cornerIndex

    const handle = this.cornerHandles[cornerIndex]
    const handleRect = handle.getBoundingClientRect()

    this.dragOffset = {
      x: clientX - handleRect.left,
      y: clientY - handleRect.top,
    }

    // Add dragging class for visual feedback
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
    const stageRect = this.stageElement.getBoundingClientRect()

    // Calculate position relative to stage (with drag offset)
    const relativeX = clientX - this.dragOffset.x - stageRect.left
    const relativeY = clientY - this.dragOffset.y - stageRect.top

    // Normalize to 0-1 range
    const normalizedX = Math.max(0, Math.min(1, relativeX / stageRect.width))
    const normalizedY = Math.max(0, Math.min(1, relativeY / stageRect.height))

    // Update corner position
    this.cornerPositions[this.dragCornerIndex] = {
      x: normalizedX,
      y: normalizedY,
    }

    // Update handle position (absolute positioning relative to stage)
    const handle = this.cornerHandles[this.dragCornerIndex]
    handle.style.left = `${stageRect.left + normalizedX * stageRect.width}px`
    handle.style.top = `${stageRect.top + normalizedY * stageRect.height}px`

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
      const stageRect = this.stageElement.getBoundingClientRect()

      // Source points: original corners of element in natural state
      const sourcePoints = [
        [0, 0], // top-left
        [stageRect.width, 0], // top-right
        [stageRect.width, stageRect.height], // bottom-right
        [0, stageRect.height], // bottom-left
      ]

      // Target points: where those corners should be mapped to (based on user dragging)
      const targetPoints = this.cornerPositions.map((pos) => [
        stageRect.left + pos.x * stageRect.width,
        stageRect.top + pos.y * stageRect.height,
      ])

      // Complete layout data structure for Maptastic
      const layout = [
        {
          id: this.stageElement.id,
          sourcePoints: sourcePoints,
          targetPoints: targetPoints,
        },
      ]

      this.maptasticInstance.setLayout(layout)
    } catch (error) {
      console.error('Error updating Maptastic layout:', error)
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

      console.log('Maptastic layout saved')
    } catch (error) {
      console.error('Failed to save Maptastic layout:', error)
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

        console.log('Maptastic layout loaded')
      } else {
        console.log('No saved Maptastic layout found')
      }
    } catch (error) {
      console.error('Error loading saved Maptastic layout:', error)
    }
  }

  /**
   * Update handle positions based on current corner positions
   */
  updateHandlePositions() {
    if (!this.stageElement || this.cornerHandles.length === 0) return

    // In projection mode, handles are positioned based on screen coordinates, not stage coordinates
    // Initial positions are calculated from stage, but then they become independent
    if (!this.cornerHandles[0].style.left || this.cornerHandles[0].style.left === '') {
      // First time positioning - use stage as reference
      const stageRect = this.stageElement.getBoundingClientRect()

      this.cornerHandles.forEach((handle, index) => {
        if (handle && this.cornerPositions[index]) {
          const pos = this.cornerPositions[index]

          // Calculate initial pixel position based on stage
          const pixelX = stageRect.left + pos.x * stageRect.width
          const pixelY = stageRect.top + pos.y * stageRect.height

          handle.style.left = `${pixelX}px`
          handle.style.top = `${pixelY}px`
        }
      })

      console.log('Corner handles positioned initially based on stage')
    }
    // If handles already have positions, don't move them - they're fixed in projection mode
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
    console.log('Window resized in projection mode - handles remain fixed')
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

      console.log('Corner handles visibility updated for idle state:', data.isIdle)
    } catch (error) {
      console.error('Error handling idle state change:', error)
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
      console.error('Error handling projection mode update:', error)
    }
  }

  /**
   * Load persisted projection mode state
   */
  loadPersistedState() {
    try {
      const savedState = stateManager.getProjectionMode()
      console.log('Projection mode state loaded:', savedState)

      if (savedState && savedState.active) {
        // Restore active projection mode
        this.enterProjectionMode()
      }
    } catch (error) {
      console.error('Error loading persisted projection state:', error)
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

      console.log('ProjectionManager cleaned up')
    } catch (error) {
      console.error('Error during ProjectionManager cleanup:', error)
    }
  }
}

// Create and export singleton instance
export const projectionManager = new ProjectionManager()
