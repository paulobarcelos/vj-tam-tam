import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  bindToastManager,
  installMockMaptastic,
  loadAppFixture,
} from '../../tests/helpers/appFixture.js'
import { createDefaultState } from './defaultState.js'

describe('VJ Tam Tam app smoke', () => {
  let uiManager
  let stateManager
  let projectionManager
  let testCardManager
  let toastManager

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.resetModules()
    loadAppFixture()
    installMockMaptastic()

    const uiManagerModule = await import('./uiManager.js')
    const stateManagerModule = await import('./stateManager.js')
    const projectionManagerModule = await import('./projectionManager.js')
    const testCardManagerModule = await import('./testCardManager.js')
    const toastManagerModule = await import('./toastManager.js')

    uiManager = uiManagerModule.uiManager
    stateManager = stateManagerModule.stateManager
    projectionManager = projectionManagerModule.projectionManager
    testCardManager = testCardManagerModule.testCardManager
    toastManager = toastManagerModule.toastManager

    bindToastManager(toastManager)

    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined)

    stateManager.state = createDefaultState()
    stateManager.textPoolIndex = new Set()
    stateManager.textPoolStats = {
      totalAdditions: 0,
      duplicatesRejected: 0,
      averageTextLength: 0,
    }

    uiManager.advancedControlsInitialized = false
    uiManager.textPillElements = new Map()
    projectionManager.isActive = false
    projectionManager.maptasticInstance = null
    projectionManager.isInitialized = false
    testCardManager.isVisible = false
    testCardManager.isInitialized = false
  })

  afterEach(() => {
    uiManager.cleanup()
    testCardManager.cleanup()
    projectionManager.cleanup()
    toastManager.clear()
    vi.useRealTimers()
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('initializes the app DOM and core controls without boot errors', () => {
    expect(uiManager.init()).toBe(true)
    uiManager.initializeAdvancedControlsFromRestoredState()
    expect(testCardManager.init()).toBe(true)

    expect(document.getElementById('left-drawer')).toBeTruthy()
    expect(document.getElementById('stage')).toBeTruthy()
    expect(document.getElementById('presentation-fullscreen-btn')).toBeTruthy()
    expect(document.body.classList.contains('ui-idle')).toBe(true)
    expect(projectionManager.isInitialized).toBe(true)
  })

  it('starts with the drawer hidden and reveals it on activity', () => {
    uiManager.init()

    expect(document.body.classList.contains('ui-idle')).toBe(true)

    uiManager.handleActivity(new window.MouseEvent('mousemove', { bubbles: true }))

    expect(document.body.classList.contains('ui-idle')).toBe(false)
  })

  it('adds text through the real drawer input', () => {
    uiManager.init()

    const input = document.getElementById('text-input')
    input.value = 'tonight is visual'
    document.getElementById('add-text-btn').click()

    expect(stateManager.getTextPool()).toEqual(['tonight is visual'])
    expect(document.querySelector('.text-pill-content').textContent).toBe('tonight is visual')
  })

  it('opens projection mode and toggles the test card', () => {
    uiManager.init()
    uiManager.initializeAdvancedControlsFromRestoredState()
    testCardManager.init()

    document.getElementById('projection-toggle-btn').click()
    expect(projectionManager.isActive).toBe(true)

    document.getElementById('test-card-toggle-btn').click()
    expect(document.getElementById('test-card-overlay').style.display).toBe('block')
  })

  it('requests presentation fullscreen with hidden browser UI', async () => {
    uiManager.init()

    document.getElementById('presentation-fullscreen-btn').click()
    await Promise.resolve()

    expect(document.documentElement.requestFullscreen).toHaveBeenCalledWith({
      navigationUI: 'hide',
    })
  })
})
