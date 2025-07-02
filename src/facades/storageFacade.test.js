import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { storageFacade } from './storageFacade.js'
import { STRINGS } from '../constants/strings.js'

// Mock the toastManager module
vi.mock('../toastManager.js', () => ({
  toastManager: {
    error: vi.fn(),
  },
}))

describe('storageFacade', () => {
  let localStorageMock = {}
  let consoleErrorSpy

  beforeEach(() => {
    // Mock localStorage before each test using globalThis
    localStorageMock = {}
    globalThis.localStorage = {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock[key]
      }),
      clear: vi.fn(() => {
        localStorageMock = {}
      }),
      length: 0, // Add length property
    }

    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore original localStorage after each test
    delete globalThis.localStorage

    // Restore console.error spy
    consoleErrorSpy.mockRestore()
  })

  it('should save state to localStorage', () => {
    const mockState = { mediaPool: [{ id: '1', name: 'test.jpg' }] }
    storageFacade.saveState(mockState)

    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
      'vj-tam-tam-state',
      JSON.stringify(mockState)
    )
  })

  it('should load state from localStorage', () => {
    const mockState = { mediaPool: [{ id: '2', name: 'another.mp4' }] }
    globalThis.localStorage.setItem('vj-tam-tam-state', JSON.stringify(mockState))

    const loadedState = storageFacade.loadState()

    expect(globalThis.localStorage.getItem).toHaveBeenCalledWith('vj-tam-tam-state')
    expect(loadedState).toEqual(mockState)
  })

  it('should return null if no state in localStorage', () => {
    const loadedState = storageFacade.loadState()

    expect(globalThis.localStorage.getItem).toHaveBeenCalledWith('vj-tam-tam-state')
    expect(loadedState).toBeNull()
  })

  it('should handle localStorage parsing errors gracefully', () => {
    // Simulate invalid JSON in localStorage
    globalThis.localStorage.setItem('vj-tam-tam-state', 'invalid json')

    const loadedState = storageFacade.loadState()

    expect(globalThis.localStorage.getItem).toHaveBeenCalledWith('vj-tam-tam-state')
    expect(consoleErrorSpy).toHaveBeenCalled() // Check if console.error was called
    expect(loadedState).toBeNull() // Should fallback to null
  })

  it('should handle QuotaExceededError during saveState', async () => {
    // Import the mocked toastManager
    const { toastManager } = await import('../toastManager.js')

    // Mock setItem to throw QuotaExceededError
    globalThis.localStorage.setItem = vi.fn(() => {
      const error = new Error('Quota exceeded')
      error.name = 'QuotaExceededError'
      throw error
    })

    const mockState = { mediaPool: Array(1000).fill({ id: 'x', name: 'file.bin' }) } // Large state
    storageFacade.saveState(mockState)

    expect(globalThis.localStorage.setItem).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled() // Log the error
    expect(toastManager.error).toHaveBeenCalledWith(
      STRINGS.USER_MESSAGES.notifications.error.settingsSaveFailed
    ) // Show user warning
  })
})

/**
 * Unit tests for StorageFacade advanced panel visibility methods (Story 6.1)
 */
