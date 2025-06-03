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
async function init() {
  try {
    // Initialize UI Manager first so it can listen to events
    uiManager.init()

    // Initialize PlaybackEngine before StateManager so it can listen to restoration events
    playbackEngine.init()

    // Initialize StateManager last to load persisted state and emit events
    await stateManager.init()

    console.log('StateManager initialized. Media pool size:', stateManager.getMediaCount())

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
