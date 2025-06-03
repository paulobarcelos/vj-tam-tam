import { toastManager } from '../toastManager.js'

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
      console.error('Failed to save state to localStorage:', error)
      // Per error handling strategy: show toast but continue
      toastManager.error('Settings could not be saved')
    }
  },

  /**
   * Load application state from localStorage
   * @returns {Object|null} Parsed state or null if not found/invalid
   */
  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Failed to load state from localStorage:', error)
      return null // Graceful fallback to empty state
    }
  },
}
