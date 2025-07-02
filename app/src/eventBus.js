/**
 * Event Bus for decoupled communication between modules using the Observer pattern.
 * Provides publish/subscribe functionality for component coordination.
 */

/**
 * @typedef {Object} EventBus
 * @property {function} on - Subscribe to an event
 * @property {function} off - Unsubscribe from an event
 * @property {function} emit - Publish an event
 */

class EventBus {
  constructor() {
    this.events = new Map()
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to execute when event is emitted
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(callback)
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (!this.events.has(event)) return

    const callbacks = this.events.get(event)
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
    }

    // Clean up empty event arrays
    if (callbacks.length === 0) {
      this.events.delete(event)
    }
  }

  /**
   * Publish an event to all subscribers
   * @param {string} event - Event name
   * @param {*} data - Data to pass to subscribers
   */
  emit(event, data) {
    if (!this.events.has(event)) return

    const callbacks = this.events.get(event)
    callbacks.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error(`EventBus listener error for event "${event}":`, error)
      }
    })
  }
}

// Export singleton instance
export const eventBus = new EventBus()
