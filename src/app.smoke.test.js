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
    expect(document.getElementById('bottom-live-strip')).toBeTruthy()
    expect(document.getElementById('stage')).toBeTruthy()
    expect(document.getElementById('presentation-fullscreen-btn')).toBeTruthy()
    expect(document.querySelector('#bottom-live-strip #presentation-fullscreen-btn')).toBeTruthy()
    expect(document.querySelector('#bottom-live-strip #min-duration-slider')).toBeTruthy()
    expect(document.querySelector('#bottom-live-strip #skip-start-slider')).toBeTruthy()
    expect(document.querySelector('#bottom-live-strip #skip-end-slider')).toBeTruthy()
    expect(document.querySelector('#bottom-live-strip #text-frequency-slider')).toBeTruthy()
    expect(
      document.querySelector('#bottom-live-strip [data-stage-layout-mode="single"]')
    ).toBeTruthy()
    expect(
      document.querySelector('#bottom-live-strip [data-stage-layout-mode="two-columns"]')
    ).toBeTruthy()
    expect(document.querySelector('#advanced-controls-section #min-duration-slider')).toBeNull()
    expect(document.querySelector('#advanced-controls-section #skip-start-slider')).toBeNull()
    expect(document.querySelector('#advanced-controls-section #skip-end-slider')).toBeNull()

    const advancedControls = document.getElementById('advanced-controls-section')
    expect(advancedControls.children[0].id).toBe('color-correction-controls')
    expect(advancedControls.children[1].classList.contains('projection-controls')).toBe(true)
    expect(document.body.classList.contains('ui-idle')).toBe(true)
    expect(projectionManager.isInitialized).toBe(true)
  })

  it('updates stage layout from the bottom live strip', () => {
    uiManager.init()

    document.querySelector('[data-stage-layout-mode="two-columns"]').click()

    expect(stateManager.getStageLayout()).toEqual({ mode: 'two-columns' })
    expect(
      document.querySelector('[data-stage-layout-mode="two-columns"]').getAttribute('aria-pressed')
    ).toBe('true')
    expect(
      document.querySelector('[data-stage-layout-mode="single"]').getAttribute('aria-pressed')
    ).toBe('false')
  })

  it('starts with the drawer hidden and reveals it on activity', () => {
    uiManager.init()

    expect(document.body.classList.contains('ui-idle')).toBe(true)

    uiManager.handleActivity(new window.MouseEvent('mousemove', { bubbles: true }))

    expect(document.body.classList.contains('ui-idle')).toBe(false)
    expect(document.body.classList.contains('ui-active')).toBe(true)
  })

  it('adds text through the real drawer input', () => {
    uiManager.init()

    const input = document.getElementById('text-input')
    input.value = 'tonight is visual'
    document.getElementById('add-text-btn').click()

    expect(stateManager.getTextPool()).toEqual(['tonight is visual'])
    expect(document.querySelector('.text-pill-content').textContent).toBe('tonight is visual')
  })

  it('updates the bottom live strip from real app state events', () => {
    uiManager.init()
    uiManager.initializeAdvancedControlsFromRestoredState()

    expect(document.getElementById('live-status-label').textContent).toBe('Waiting for media')
    expect(document.getElementById('live-media-count').textContent).toBe('0/0 media ready')
    expect(document.getElementById('live-text-count').textContent).toBe('0 messages')
    expect(document.getElementById('live-segment-summary').textContent).toBe('5.0-5.0 sec')
    expect(document.getElementById('live-frequency-summary').textContent).toBe('Sometimes')

    stateManager.addText('tonight is visual')
    stateManager.addMediaToPool([
      {
        id: 'media-1',
        name: 'visual.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        file: new File(['visual'], 'visual.jpg', { type: 'image/jpeg' }),
        url: 'blob:visual',
      },
    ])
    stateManager.updateSegmentSettings({
      minDuration: 7,
      maxDuration: 12,
      skipStart: 2,
      skipEnd: 4,
    })
    stateManager.setTextFrequency(0.75)

    expect(document.getElementById('live-status-label').textContent).toBe('Ready')
    expect(document.getElementById('live-media-count').textContent).toBe('1/1 media ready')
    expect(document.getElementById('live-text-count').textContent).toBe('1 message')
    expect(document.getElementById('live-segment-summary').textContent).toBe('7.0-12.0 sec')
    expect(document.getElementById('skip-start-input').value).toBe('2')
    expect(document.getElementById('skip-end-input').value).toBe('4')
    expect(document.getElementById('live-frequency-summary').textContent).toBe('Often')
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
