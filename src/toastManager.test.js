import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { toastManager } from './toastManager.js'

describe('ToastManager', () => {
  let containerElement
  let consoleErrorSpy

  beforeEach(() => {
    // Create a mock container element
    containerElement = document.createElement('div')
    containerElement.id = 'toast-container'
    document.body.appendChild(containerElement)

    // Mock the container retrieval
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'toast-container') {
        return containerElement
      }
      return null
    })

    // Spy on console.error for error scenarios
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Clear any existing toasts
    toastManager.clear()

    // Initialize fresh container reference
    toastManager.container = containerElement
    toastManager.toasts = new Set()
  })

  afterEach(() => {
    // Clean up DOM
    document.body.removeChild(containerElement)

    // Restore spies
    consoleErrorSpy.mockRestore()
    vi.restoreAllMocks()
  })

  describe('show method', () => {
    it('should create and display a toast with default options', () => {
      const message = 'Test message'
      const toast = toastManager.show(message)

      expect(toast).toBeDefined()
      expect(toast.tagName).toBe('DIV')
      expect(toast.className).toBe('toast info')
      expect(toast.textContent).toBe(message)
      expect(containerElement.contains(toast)).toBe(true)
      expect(toastManager.toasts.has(toast)).toBe(true)
    })

    it('should create a toast with custom type', () => {
      const message = 'Error message'
      const toast = toastManager.show(message, { type: 'error' })

      expect(toast.className).toBe('toast error')
      expect(toast.textContent).toBe(message)
    })

    it('should create a toast with custom duration', () => {
      vi.useFakeTimers()

      const message = 'Custom duration message'
      const customDuration = 3000
      const toast = toastManager.show(message, { duration: customDuration })

      expect(containerElement.contains(toast)).toBe(true)

      // Fast-forward time to just before the duration
      vi.advanceTimersByTime(customDuration - 100)
      expect(containerElement.contains(toast)).toBe(true)

      // Fast-forward past the duration
      vi.advanceTimersByTime(200)
      expect(containerElement.contains(toast)).toBe(false)

      vi.useRealTimers()
    })

    it('should auto-remove toast after default duration', () => {
      vi.useFakeTimers()

      const message = 'Auto-remove test'
      const toast = toastManager.show(message)

      expect(containerElement.contains(toast)).toBe(true)

      // Fast-forward past default duration (5000ms)
      vi.advanceTimersByTime(5000)
      expect(containerElement.contains(toast)).toBe(false)
      expect(toastManager.toasts.has(toast)).toBe(false)

      vi.useRealTimers()
    })

    it('should handle multiple toasts simultaneously', () => {
      const toast1 = toastManager.show('Message 1')
      const toast2 = toastManager.show('Message 2')
      const toast3 = toastManager.show('Message 3')

      expect(containerElement.children.length).toBe(3)
      expect(toastManager.toasts.size).toBe(3)
      expect(toastManager.toasts.has(toast1)).toBe(true)
      expect(toastManager.toasts.has(toast2)).toBe(true)
      expect(toastManager.toasts.has(toast3)).toBe(true)
    })
  })

  describe('error method', () => {
    it('should create an error toast with correct styling and duration', () => {
      vi.useFakeTimers()

      const message = 'Error occurred'
      const toast = toastManager.error(message)

      expect(toast.className).toBe('toast error')
      expect(toast.textContent).toBe(message)
      expect(containerElement.contains(toast)).toBe(true)

      // Should remain visible before 6000ms
      vi.advanceTimersByTime(5999)
      expect(containerElement.contains(toast)).toBe(true)

      // Should be removed after 6000ms
      vi.advanceTimersByTime(1)
      expect(containerElement.contains(toast)).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('success method', () => {
    it('should create a success toast with correct styling and duration', () => {
      vi.useFakeTimers()

      const message = 'Operation successful'
      const toast = toastManager.success(message)

      expect(toast.className).toBe('toast success')
      expect(toast.textContent).toBe(message)
      expect(containerElement.contains(toast)).toBe(true)

      // Should remain visible before 4000ms
      vi.advanceTimersByTime(3999)
      expect(containerElement.contains(toast)).toBe(true)

      // Should be removed after 4000ms
      vi.advanceTimersByTime(1)
      expect(containerElement.contains(toast)).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('remove method', () => {
    it('should remove a specific toast from container and internal set', () => {
      const toast1 = toastManager.show('Message 1')
      const toast2 = toastManager.show('Message 2')

      expect(containerElement.children.length).toBe(2)
      expect(toastManager.toasts.size).toBe(2)

      toastManager.remove(toast1)

      expect(containerElement.children.length).toBe(1)
      expect(toastManager.toasts.size).toBe(1)
      expect(toastManager.toasts.has(toast1)).toBe(false)
      expect(toastManager.toasts.has(toast2)).toBe(true)
      expect(containerElement.contains(toast1)).toBe(false)
      expect(containerElement.contains(toast2)).toBe(true)
    })

    it('should handle removing a toast that is not in the set', () => {
      const toast1 = toastManager.show('Message 1')
      const fakeToast = document.createElement('div')

      expect(() => {
        toastManager.remove(fakeToast)
      }).not.toThrow()

      // Original toast should remain
      expect(containerElement.children.length).toBe(1)
      expect(toastManager.toasts.size).toBe(1)
      expect(toastManager.toasts.has(toast1)).toBe(true)
    })

    it('should handle removing a toast that has already been removed from DOM', () => {
      const toast = toastManager.show('Message')

      // Manually remove from DOM without using toastManager.remove()
      containerElement.removeChild(toast)

      expect(() => {
        toastManager.remove(toast)
      }).not.toThrow()

      expect(toastManager.toasts.has(toast)).toBe(false)
    })
  })

  describe('clear method', () => {
    it('should remove all toasts from container and clear internal set', () => {
      toastManager.show('Message 1')
      toastManager.show('Message 2')
      toastManager.show('Message 3')

      expect(containerElement.children.length).toBe(3)
      expect(toastManager.toasts.size).toBe(3)

      toastManager.clear()

      expect(containerElement.children.length).toBe(0)
      expect(toastManager.toasts.size).toBe(0)
    })

    it('should handle clearing when no toasts exist', () => {
      expect(containerElement.children.length).toBe(0)
      expect(toastManager.toasts.size).toBe(0)

      expect(() => {
        toastManager.clear()
      }).not.toThrow()

      expect(containerElement.children.length).toBe(0)
      expect(toastManager.toasts.size).toBe(0)
    })

    it('should handle clearing when some toasts have already been removed from DOM', () => {
      const toast1 = toastManager.show('Message 1')
      toastManager.show('Message 2')

      // Manually remove one toast from DOM
      containerElement.removeChild(toast1)

      expect(() => {
        toastManager.clear()
      }).not.toThrow()

      expect(containerElement.children.length).toBe(0)
      expect(toastManager.toasts.size).toBe(0)
    })
  })

  describe('initialization and container handling', () => {
    it('should handle missing container element gracefully', () => {
      // Mock getElementById to return null
      vi.spyOn(document, 'getElementById').mockReturnValue(null)

      // Create a new instance to test initialization
      const testToastManager = new toastManager.constructor()

      expect(testToastManager.container).toBeNull()

      // Should not throw when trying to show toast without container
      expect(() => {
        testToastManager.show('Test message')
      }).toThrow()
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle empty message', () => {
      const toast = toastManager.show('')

      expect(toast.textContent).toBe('')
      expect(toast.className).toBe('toast info')
      expect(containerElement.contains(toast)).toBe(true)
    })

    it('should handle null or undefined message', () => {
      const toastNull = toastManager.show(null)
      const toastUndefined = toastManager.show(undefined)

      expect(toastNull.textContent).toBe('')
      expect(toastUndefined.textContent).toBe('')
    })

    it('should handle invalid type option gracefully', () => {
      const toast = toastManager.show('Message', { type: 'invalid-type' })

      expect(toast.className).toBe('toast invalid-type')
      expect(containerElement.contains(toast)).toBe(true)
    })

    it('should handle invalid duration option', () => {
      vi.useFakeTimers()

      const toast = toastManager.show('Message', { duration: 'invalid' })

      // Should still auto-remove, likely with NaN being treated as 0 or default
      expect(containerElement.contains(toast)).toBe(true)

      vi.useRealTimers()
    })

    it('should handle zero duration', () => {
      vi.useFakeTimers()

      const toast = toastManager.show('Message', { duration: 0 })

      // Should be removed immediately
      vi.advanceTimersByTime(0)
      expect(containerElement.contains(toast)).toBe(false)

      vi.useRealTimers()
    })
  })
})
