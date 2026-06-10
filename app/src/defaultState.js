export function createDefaultState() {
  return {
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
