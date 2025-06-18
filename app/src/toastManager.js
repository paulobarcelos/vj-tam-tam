/**
 * Toast Manager for displaying user notifications
 * Handles creation, display, and cleanup of toast messages
 */

/**
 * @typedef {Object} ToastOptions
 * @property {string} type - Type of toast: 'error', 'success', 'info'
 * @property {number} duration - Duration in milliseconds (default: 5000)
 */

class ToastManager {
  constructor() {
    this.container = document.getElementById('toast-container')
    this.toasts = new Set()
  }

  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {ToastOptions} options - Toast options
   */
  show(message, options = {}) {
    const { type = 'info', duration = 5000 } = options

    const toast = document.createElement('div')
    toast.className = `toast ${type}`
    toast.textContent = message

    // Add to container
    this.container.appendChild(toast)
    this.toasts.add(toast)

    // Auto-remove after duration
    setTimeout(() => {
      this.remove(toast)
    }, duration)

    return toast
  }

  /**
   * Show an error toast
   * @param {string} message - Error message
   */
  error(message) {
    return this.show(message, { type: 'error', duration: 6000 })
  }

  /**
   * Show a success toast
   * @param {string} message - Success message
   */
  success(message) {
    return this.show(message, { type: 'success', duration: 4000 })
  }

  /**
   * Show an info toast
   * @param {string} message - Info message
   */
  info(message) {
    return this.show(message, { type: 'info', duration: 5000 })
  }

  /**
   * Remove a specific toast
   * @param {HTMLElement} toast - Toast element to remove
   */
  remove(toast) {
    if (this.toasts.has(toast)) {
      this.toasts.delete(toast)
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }
  }

  /**
   * Clear all toasts
   */
  clear() {
    this.toasts.forEach((toast) => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    })
    this.toasts.clear()
  }
}

// Export singleton instance
export const toastManager = new ToastManager()
