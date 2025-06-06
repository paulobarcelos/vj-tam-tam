/**
 * Storage Facade for localStorage operations
 * Provides error handling and fallback for storage operations
 */

import { toastManager } from '../toastManager.js'
import { STRINGS } from '../constants/strings.js'

const STORAGE_KEY = 'vj-tam-tam-state'

export const storageFacade = {
  /**
   * Save application state to localStorage
   * @param {Object} state - State object to persist
   */
  saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.storageFacade.localStorageSaveError, error)
      // Per error handling strategy: show toast but continue
      toastManager.error(STRINGS.USER_MESSAGES.notifications.error.settingsSaveFailed)
    }
  },

  /**
   * Load application state from localStorage
   * @returns {Object|null} Parsed state or null if not found/invalid
   */
  loadState() {
    try {
      console.log(STRINGS.SYSTEM_MESSAGES.storageFacade.loadingFromLocalStorage)
      const stored = localStorage.getItem(STORAGE_KEY)
      console.log(STRINGS.SYSTEM_MESSAGES.storageFacade.rawLocalStorageValue, stored)

      const parsed = stored ? JSON.parse(stored) : null
      console.log(STRINGS.SYSTEM_MESSAGES.storageFacade.parsedState, parsed)

      return parsed
    } catch (error) {
      console.error(STRINGS.SYSTEM_MESSAGES.storageFacade.localStorageLoadError, error)
      return null
    }
  },
}
