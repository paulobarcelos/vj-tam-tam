/**
 * Main application entry point for VJ Tam Tam
 * Initializes all modules and starts the application
 */

import { uiManager } from './uiManager.js'
import { toastManager } from './toastManager.js'
import { stateManager } from './stateManager.js'
import { playbackEngine } from './playbackEngine.js'

/**
 * Initialize the application
 */
function init() {
  try {
    // Initialize core modules
    // StateManager is imported to ensure it's available
    console.log('StateManager initialized with empty media pool:', stateManager.getMediaCount())

    // Initialize UI Manager (which handles drag and drop)
    uiManager.init()

    // Initialize PlaybackEngine (which handles media display)
    playbackEngine.init()

    console.log('VJ Tam Tam initialized successfully')
  } catch (error) {
    console.error('Error initializing VJ Tam Tam:', error)
    toastManager.error('Failed to initialize application. Please refresh the page.')
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
