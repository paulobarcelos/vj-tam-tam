import { createSingleStageLayout } from './constants/stageLayouts.js'
import { VIDEO_PLAYBACK_MODES } from './constants/playbackConfig.js'

export function createDefaultState() {
  return {
    mediaPool: [],
    textPool: [],
    segmentSettings: {
      minDuration: 5,
      maxDuration: 5,
      skipStart: 0,
      skipEnd: 0,
      videoPlaybackMode: VIDEO_PLAYBACK_MODES.SAMPLE,
      videoMuted: true,
    },
    uiSettings: {
      advancedControlsVisible: false,
    },
    stageLayout: createSingleStageLayout(),
    projectionMode: {
      active: false,
      maptasticLayout: null,
      projectionSurfaceAspectRatio: null,
    },
    textFrequency: 0.5,
    colorFilters: {
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
    },
    testCardSettings: {
      visible: false,
    },
    fileSystemAPIWorking: null,
  }
}
