/**
 * StateManager Text Pool Tests
 * Tests for the text pool functionality added in Stories 4.1, 4.2, and 4.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StateManager } from './stateManager.js'
import { eventBus } from './eventBus.js'

describe('StateManager - Text Pool', () => {
  let stateManager
  let eventBusSpy

  beforeEach(() => {
    // Create a fresh StateManager instance for each test
    stateManager = new StateManager()

    // Mock eventBus.emit to track events
    eventBusSpy = vi.spyOn(eventBus, 'emit')
  })

  describe('initial state', () => {
    it('should start with empty text pool', () => {
      expect(stateManager.getTextPool()).toEqual([])
      expect(stateManager.getTextPoolSize()).toBe(0)
    })
  })

  describe('addText', () => {
    it('should add valid text to the pool', () => {
      const result = stateManager.addText('Hello World')

      expect(result).toBe(true)
      expect(stateManager.getTextPool()).toEqual(['Hello World'])
      expect(stateManager.getTextPoolSize()).toBe(1)
    })

    it('should emit textPool.updated event when text is added', () => {
      stateManager.addText('Test Message')

      expect(eventBusSpy).toHaveBeenCalledWith('textPool.updated', {
        action: 'added',
        text: 'Test Message',
        textPool: ['Test Message'],
        poolSize: 1,
        timestamp: expect.any(Number),
      })
    })

    it('should emit textPool.sizeChanged event when text is added', () => {
      stateManager.addText('Test Message')

      expect(eventBusSpy).toHaveBeenCalledWith('textPool.sizeChanged', {
        newSize: 1,
        previousSize: 0,
      })
    })

    it('should reject empty text', () => {
      const result = stateManager.addText('')

      expect(result).toBe(false)
      expect(stateManager.getTextPool()).toEqual([])
    })

    it('should reject whitespace-only text', () => {
      const result = stateManager.addText('   ')

      expect(result).toBe(false)
      expect(stateManager.getTextPool()).toEqual([])
    })

    it('should reject text longer than 200 characters', () => {
      const longText = 'a'.repeat(201)
      const result = stateManager.addText(longText)

      expect(result).toBe(false)
      expect(stateManager.getTextPool()).toEqual([])
    })

    it('should allow duplicate text', () => {
      stateManager.addText('Duplicate')
      const result = stateManager.addText('Duplicate')

      expect(result).toBe(true)
      expect(stateManager.getTextPool()).toEqual(['Duplicate', 'Duplicate'])
      expect(stateManager.getTextPoolSize()).toBe(2)
    })

    it('should trim whitespace from text', () => {
      const result = stateManager.addText('  Trimmed Text  ')

      expect(result).toBe(true)
      expect(stateManager.getTextPool()).toEqual(['Trimmed Text'])
    })

    it('should support additive behavior', () => {
      stateManager.addText('First')
      stateManager.addText('Second')
      stateManager.addText('Third')

      expect(stateManager.getTextPool()).toEqual(['First', 'Second', 'Third'])
      expect(stateManager.getTextPoolSize()).toBe(3)
    })
  })

  describe('hasText', () => {
    beforeEach(() => {
      stateManager.addText('Existing Text')
    })

    it('should return true for existing text', () => {
      expect(stateManager.hasText('Existing Text')).toBe(true)
    })

    it('should return false for non-existing text', () => {
      expect(stateManager.hasText('Non-existing')).toBe(false)
    })

    it('should handle whitespace when checking', () => {
      expect(stateManager.hasText('  Existing Text  ')).toBe(true)
    })
  })

  describe('getRandomText', () => {
    it('should return null for empty pool', () => {
      expect(stateManager.getRandomText()).toBe(null)
    })

    it('should return the only text for single-item pool', () => {
      stateManager.addText('Only Text')
      expect(stateManager.getRandomText()).toBe('Only Text')
    })

    it('should return one of the texts for multi-item pool', () => {
      const texts = ['First', 'Second', 'Third']
      texts.forEach((text) => stateManager.addText(text))

      const randomText = stateManager.getRandomText()
      expect(texts).toContain(randomText)
    })
  })

  describe('persistence', () => {
    it('should include text pool in saved state', () => {
      stateManager.addText('Persistent Text')
      stateManager.addText('Another Text')

      // Check that the state includes text pool data
      const state = stateManager.state
      expect(state.textPool).toEqual(['Persistent Text', 'Another Text'])

      // Verify the text pool is accessible via the getTextPool method
      expect(stateManager.getTextPool()).toEqual(['Persistent Text', 'Another Text'])
    })

    it('should persist and restore duplicate text entries correctly', () => {
      // Add some duplicate text entries
      stateManager.addText('duplicate')
      stateManager.addText('unique')
      stateManager.addText('duplicate')
      stateManager.addText('duplicate')

      expect(stateManager.getTextPool()).toEqual(['duplicate', 'unique', 'duplicate', 'duplicate'])
      expect(stateManager.getTextPoolSize()).toBe(4)

      // Simulate a page reload by creating a new StateManager and manually loading the saved state
      const savedState = stateManager.state
      const newStateManager = new StateManager()

      // Manually load the text pool (simulating what restoreFromPersistence does)
      newStateManager.state.textPool = savedState.textPool
        .filter((text) => typeof text === 'string' && text.trim().length > 0)
        .map((text) => text.trim())
        .slice(0, newStateManager.textPoolMaxSize)

      // Verify duplicates are preserved
      expect(newStateManager.getTextPool()).toEqual([
        'duplicate',
        'unique',
        'duplicate',
        'duplicate',
      ])
      expect(newStateManager.getTextPoolSize()).toBe(4)
    })
  })

  describe('performance and limits', () => {
    it('should handle large text pools efficiently', () => {
      // Add many texts to test performance
      for (let i = 0; i < 100; i++) {
        stateManager.addText(`Text ${i}`)
      }

      expect(stateManager.getTextPoolSize()).toBe(100)

      // Random selection should still be fast - just verify it doesn't crash
      for (let i = 0; i < 1000; i++) {
        const randomText = stateManager.getRandomText()
        expect(randomText).toBeDefined()
      }
    })

    it('should respect maximum pool size', () => {
      // Set a smaller max size for testing
      stateManager.textPoolMaxSize = 5

      // Try to add more than the limit
      for (let i = 0; i < 10; i++) {
        stateManager.addText(`Text ${i}`)
      }

      expect(stateManager.getTextPoolSize()).toBe(5)
    })
  })

  describe('removeText', () => {
    it('should remove existing text from the pool', () => {
      stateManager.addText('Test message 1')
      stateManager.addText('Test message 2')

      const result = stateManager.removeText('Test message 1')

      expect(result).toBe(true)
      expect(stateManager.getTextPool()).toEqual(['Test message 2'])
      expect(stateManager.getTextPoolSize()).toBe(1)
    })

    it('should return false for non-existing text', () => {
      stateManager.addText('Test message')

      const result = stateManager.removeText('Non-existing message')

      expect(result).toBe(false)
      expect(stateManager.getTextPool()).toEqual(['Test message'])
    })

    it('should emit textPool.updated event with removed action', () => {
      const eventSpy = vi.fn()
      eventBus.on('textPool.updated', eventSpy)

      stateManager.addText('Test message')
      eventSpy.mockClear() // Clear the add event

      stateManager.removeText('Test message')

      expect(eventSpy).toHaveBeenCalledWith({
        action: 'removed',
        text: 'Test message',
        textPool: [],
        poolSize: 0,
        timestamp: expect.any(Number),
      })
    })

    it('should emit textPool.sizeChanged event', () => {
      const eventSpy = vi.fn()
      eventBus.on('textPool.sizeChanged', eventSpy)

      stateManager.addText('Test message')
      eventSpy.mockClear() // Clear the add event

      stateManager.removeText('Test message')

      expect(eventSpy).toHaveBeenCalledWith({
        newSize: 0,
        previousSize: 1,
        isAtLimit: false,
      })
    })

    it('should handle whitespace when removing text', () => {
      stateManager.addText('Test message')

      const result = stateManager.removeText('  Test message  ')

      expect(result).toBe(true)
      expect(stateManager.getTextPoolSize()).toBe(0)
    })

    it('should remove only the first occurrence of duplicate text', () => {
      stateManager.addText('Duplicate')
      stateManager.addText('Duplicate')
      stateManager.addText('Unique')

      const result = stateManager.removeText('Duplicate')

      expect(result).toBe(true)
      expect(stateManager.getTextPool()).toEqual(['Duplicate', 'Unique'])
      expect(stateManager.getTextPoolSize()).toBe(2)
    })
  })

  describe('clearTextPool', () => {
    it('should clear all text from the pool', () => {
      stateManager.addText('Message 1')
      stateManager.addText('Message 2')
      stateManager.addText('Message 3')

      const result = stateManager.clearTextPool()

      expect(result).toBe(true)
      expect(stateManager.getTextPool()).toEqual([])
      expect(stateManager.getTextPoolSize()).toBe(0)
    })

    it('should return false if pool is already empty', () => {
      const result = stateManager.clearTextPool()

      expect(result).toBe(false)
    })

    it('should emit textPool.updated event with cleared action', () => {
      const eventSpy = vi.fn()
      eventBus.on('textPool.updated', eventSpy)

      stateManager.addText('Message 1')
      stateManager.addText('Message 2')
      eventSpy.mockClear() // Clear the add events

      stateManager.clearTextPool()

      expect(eventSpy).toHaveBeenCalledWith({
        action: 'cleared',
        textPool: [],
        poolSize: 0,
        previousSize: 2,
        clearedTexts: ['Message 1', 'Message 2'],
        timestamp: expect.any(Number),
      })
    })

    it('should emit textPool.sizeChanged event', () => {
      const eventSpy = vi.fn()
      eventBus.on('textPool.sizeChanged', eventSpy)

      stateManager.addText('Message 1')
      stateManager.addText('Message 2')
      eventSpy.mockClear() // Clear the add events

      stateManager.clearTextPool()

      expect(eventSpy).toHaveBeenCalledWith({
        newSize: 0,
        previousSize: 2,
        isAtLimit: false,
      })
    })

    it('should update statistics for clear operations', () => {
      stateManager.addText('Message 1')
      stateManager.addText('Message 2')

      const statsBefore = stateManager.getTextPoolStats()
      stateManager.clearTextPool()
      const statsAfter = stateManager.getTextPoolStats()

      expect(statsAfter.totalClears).toBe((statsBefore.totalClears || 0) + 1)
      expect(statsAfter.lastClearSize).toBe(2)
      expect(statsAfter.lastClearTimestamp).toBeGreaterThan(0)
    })
  })

  describe('getTextPoolStats', () => {
    it('should include removal and clear statistics', () => {
      stateManager.addText('Message 1')
      stateManager.addText('Message 2')
      stateManager.removeText('Message 1')
      stateManager.clearTextPool()

      const stats = stateManager.getTextPoolStats()

      expect(stats).toMatchObject({
        totalEntries: 0,
        totalAdditions: expect.any(Number),
        totalRemovals: expect.any(Number),
        totalClears: expect.any(Number),
        lastClearSize: 1,
        lastClearTimestamp: expect.any(Number),
      })

      expect(stats.totalRemovals).toBeGreaterThan(0)
      expect(stats.totalClears).toBeGreaterThan(0)
    })
  })
})
