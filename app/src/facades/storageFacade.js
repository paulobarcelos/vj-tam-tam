/**
 * Storage facade for localStorage operations
 * Handles persistence and retrieval of application state
 */

import { STRINGS } from '../constants/strings.js'
import { toastManager } from '../toastManager.js'

class StorageFacade {
  /**
   * Save state to localStorage with error handling
   * @param {string} key - Storage key
   * @param {any} data - Data to store
   * @returns {boolean} Success status
   */
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Error saving state to localStorage:', error)
      toastManager.error(STRINGS.USER_MESSAGES.notifications.error.settingsSaveFailed)
      return false
    }
  }

  /**
   * Load state from localStorage with error handling
   * @param {string} key - Storage key
   * @returns {any|null} Parsed data or null if not found/error
   */
  load(key) {
    try {
      console.log('Loading from localStorage')
      const stored = localStorage.getItem(key)
      console.log('Raw localStorage value', stored)
      if (!stored) return null
      const parsed = JSON.parse(stored)
      console.log('Parsed state', parsed)
      return parsed
    } catch (error) {
      console.error('Error loading state from localStorage:', error)
      return null
    }
  }
}

export default new StorageFacade()
