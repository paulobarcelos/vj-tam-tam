/**
 * Unit tests for EventBus module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { eventBus } from './eventBus.js'

describe('EventBus', () => {
  beforeEach(() => {
    // Clear all event listeners before each test
    eventBus.events.clear()
  })

  describe('on/emit', () => {
    it('should register and call event listeners', () => {
      const callback = vi.fn()
      eventBus.on('test-event', callback)

      eventBus.emit('test-event', 'test-data')

      expect(callback).toHaveBeenCalledWith('test-data')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should call multiple listeners for the same event', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      eventBus.on('test-event', callback1)
      eventBus.on('test-event', callback2)

      eventBus.emit('test-event', 'test-data')

      expect(callback1).toHaveBeenCalledWith('test-data')
      expect(callback2).toHaveBeenCalledWith('test-data')
    })

    it('should not call listeners for different events', () => {
      const callback = vi.fn()
      eventBus.on('event-1', callback)

      eventBus.emit('event-2', 'test-data')

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('off', () => {
    it('should remove specific event listener', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      eventBus.on('test-event', callback1)
      eventBus.on('test-event', callback2)

      eventBus.off('test-event', callback1)
      eventBus.emit('test-event', 'test-data')

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalledWith('test-data')
    })

    it('should handle removing non-existent listener gracefully', () => {
      const callback = vi.fn()

      // Should not throw error
      expect(() => {
        eventBus.off('non-existent-event', callback)
      }).not.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle errors in event listeners gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error')
      })
      const normalCallback = vi.fn()

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      eventBus.on('test-event', errorCallback)
      eventBus.on('test-event', normalCallback)

      eventBus.emit('test-event', 'test-data')

      expect(errorCallback).toHaveBeenCalled()
      expect(normalCallback).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})
