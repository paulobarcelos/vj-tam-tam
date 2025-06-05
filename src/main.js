/**
 * Main application entry point for VJ Tam Tam
 * Initializes all modules and starts the application
 */

import { uiManager } from './uiManager.js'
import { toastManager } from './toastManager.js'
import { stateManager } from './stateManager.js'
import { playbackEngine } from './playbackEngine.js'
import { STRINGS, t } from './constants/strings.js'

/**
 * Initialize the application
 */
async function init() {
  try {
    console.log('=== APP INIT START ===')

    // Update DOM strings from centralized constants
    uiManager.updateDOMStrings()

    // Initialize UI Manager first so it can listen to events
    console.log('1. Initializing UI Manager...')
    uiManager.init()

    // Initialize PlaybackEngine before StateManager so it can listen to restoration events
    console.log('2. Initializing PlaybackEngine...')
    playbackEngine.init()

    // Initialize StateManager last to load persisted state and emit events
    console.log('3. Initializing StateManager...')
    await stateManager.init()

    console.log(
      '4. StateManager init complete, current segment settings:',
      stateManager.getSegmentSettings()
    )
    console.log('5. StateManager init complete, current UI settings:', stateManager.getUISettings())

    // Initialize Advanced Controls after state is fully restored
    console.log('6. Initializing Advanced Controls...')
    uiManager.initializeAdvancedControlsFromRestoredState()

    console.log('=== APP INIT COMPLETE ===')
    console.log(
      t.get('SYSTEM_MESSAGES.application.initializationSuccess', {
        count: stateManager.getMediaCount(),
      })
    )

    console.log(STRINGS.SYSTEM_MESSAGES.application.initialized)
  } catch (error) {
    console.error(STRINGS.SYSTEM_MESSAGES.application.initializationError, error)
    toastManager.error(STRINGS.USER_MESSAGES.notifications.error.appInitFailed)
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
