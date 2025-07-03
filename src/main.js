/**
 * Main application entry point for VJ Tam Tam
 * Initializes all modules and starts the application
 */

import { uiManager } from './uiManager.js'
import { toastManager } from './toastManager.js'
import { stateManager } from './stateManager.js'
import { playbackEngine } from './playbackEngine.js'
import { textDisplayManager } from './textDisplayManager.js'
import { colorCorrectionManager } from './colorCorrectionManager.js'
import { STRINGS } from './constants/strings.js'

/**
 * Initialize the application
 */
async function init() {
  try {
    console.log('Application initialization started')

    // Update DOM strings from centralized constants
    uiManager.updateDOMStrings()

    // Initialize UI Manager first so it can listen to events
    console.log('Initializing UI Manager')
    uiManager.init()

    // Initialize PlaybackEngine before StateManager so it can listen to restoration events
    console.log('Initializing Playback Engine')
    playbackEngine.init()

    // Initialize Text Display Manager
    console.log('Initializing Text Display Manager')
    if (textDisplayManager.init()) {
      console.log('Text Display Manager initialized successfully')
    } else {
      console.error('Text Display Manager initialization failed')
    }

    // Initialize StateManager last to load persisted state and emit events
    console.log('Initializing State Manager')
    await stateManager.init()

    console.log('State Manager initialization complete')
    console.log('Segment settings status:', stateManager.getSegmentSettings())
    console.log('UI settings status:', stateManager.getUISettings())

    // Initialize Advanced Controls after state is fully restored
    console.log('Initializing Advanced Controls')
    uiManager.initializeAdvancedControlsFromRestoredState()

    // Initialize Color Correction Manager after advanced controls
    console.log('Initializing Color Correction Manager')
    if (colorCorrectionManager.init()) {
      console.log('Color Correction Manager initialized successfully')
    } else {
      console.error('Color Correction Manager initialization failed')
    }

    // Initialize Text Pool display after state is fully restored
    uiManager.initializeTextPoolDisplay()

    // Initialize Frequency Control after state is fully restored
    uiManager.initializeFrequencyControl()

    console.log('Application initialization complete')
    const mediaCount = stateManager.getMediaCount()
    console.log(`Application initialized successfully with ${mediaCount} media files loaded`)

    console.log('Application ready')
  } catch (error) {
    console.error('Application initialization error:', error)
    toastManager.error(STRINGS.USER_MESSAGES.notifications.error.appInitFailed)
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
