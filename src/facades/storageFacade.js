/**
 * Storage Facade module for localStorage operations
 * Provides centralized storage management with error handling
 */

import { toastManager } from '../toastManager.js'
import { STRINGS } from '../constants/strings.js'

class StorageFacade {
  constructor() {
    this.STATE_KEY = 'vj-tam-tam-state'
  }

  /**
   * Save state to localStorage with error handling
   * @param {any} data - Data to save
   * @param {string} [key='vj-tam-tam-state'] - Storage key
   */
  save(data, key = 'vj-tam-tam-state') {
    try {
      console.log('Saving to localStorage')
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving state to localStorage:', error)

      // Handle QuotaExceededError specifically
      if (error.name === 'QuotaExceededError') {
        toastManager.error(STRINGS.USER_MESSAGES.notifications.error.settingsSaveFailed)
      }
    }
  }

  /**
   * Load state from localStorage with error handling
   * @param {string} [key='vj-tam-tam-state'] - Storage key
   * @returns {any|null} Parsed data or null if not found/error
   */
  load(key = 'vj-tam-tam-state') {
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

  /**
   * For backwards compatibility
   * @param {any} data - Data to save
   * @param {string} [key='vj-tam-tam-state'] - Storage key
   */
  saveState(data, key) {
    this.save(data, key)
  }

  /**
   * For backwards compatibility
   * @param {string} [key='vj-tam-tam-state'] - Storage key
   * @returns {any|null} Parsed data or null if not found/error
   */
  loadState(key) {
    return this.load(key)
  }

  /**
   * Set a simple string value in localStorage
   * @param {string} key - Storage key
   * @param {string} value - String value to store
   * @returns {boolean} Success status
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error('Error setting item in localStorage:', error)
      return false
    }
  }

  /**
   * Get a simple string value from localStorage
   * @param {string} key - Storage key
   * @returns {string|null} String value or null if not found/error
   */
  getItem(key) {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error('Error getting item from localStorage:', error)
      return null
    }
  }

  /**
   * Remove an item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing item from localStorage:', error)
      return false
    }
  }
}

export const storageFacade = new StorageFacade()
