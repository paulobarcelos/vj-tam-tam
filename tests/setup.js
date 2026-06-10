import { afterEach, beforeEach, vi } from 'vitest'

let consoleLogSpy
let consoleWarnSpy
let consoleErrorSpy

function createLocalStorageMock() {
  let store = {}

  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    },
    setItem(key, value) {
      store[key] = String(value)
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      store = {}
    },
    key(index) {
      return Object.keys(store)[index] ?? null
    },
    get length() {
      return Object.keys(store).length
    },
  }
}

function ensureLocalStorage() {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: createLocalStorageMock(),
  })
}

beforeEach(() => {
  ensureLocalStorage()
  globalThis.localStorage.clear()

  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleLogSpy?.mockRestore()
  consoleWarnSpy?.mockRestore()
  consoleErrorSpy?.mockRestore()
})
