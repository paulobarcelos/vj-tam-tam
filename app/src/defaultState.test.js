import { describe, expect, it } from 'vitest'
import { createDefaultState } from './defaultState.js'

describe('createDefaultState', () => {
  it('creates a fresh state object for each call', () => {
    const first = createDefaultState()
    const second = createDefaultState()

    first.mediaPool.push({ id: 'one' })
    first.segmentSettings.minDuration = 10

    expect(second.mediaPool).toEqual([])
    expect(second.segmentSettings.minDuration).toBe(5)
  })

  it('captures current default product settings', () => {
    expect(createDefaultState()).toMatchObject({
      mediaPool: [],
      textPool: [],
      segmentSettings: {
        minDuration: 5,
        maxDuration: 5,
        skipStart: 0,
        skipEnd: 0,
      },
      uiSettings: {
        advancedControlsVisible: false,
      },
      projectionMode: {
        active: false,
        maptasticLayout: null,
        projectionSurfaceAspectRatio: null,
      },
      textFrequency: 0.5,
      colorFilters: {
        brightness: 1,
        contrast: 1,
        saturation: 1,
      },
      testCardSettings: {
        visible: false,
      },
      fileSystemAPIWorking: null,
    })
  })
})
