export const STAGE_LAYOUT_DEFAULTS = Object.freeze({
  columns: 1,
  rows: 1,
})

export const STAGE_LAYOUT_MIN_DIMENSION = 1

export function createSingleStageLayout() {
  return { ...STAGE_LAYOUT_DEFAULTS }
}

export function toStageLayoutDimension(value) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue) || numberValue < STAGE_LAYOUT_MIN_DIMENSION) {
    return null
  }

  return Math.floor(numberValue)
}

export function migrateLegacyStageLayoutMode(mode) {
  if (mode === 'single') {
    return createSingleStageLayout()
  }

  if (mode === 'two-columns') {
    return {
      columns: 2,
      rows: 1,
    }
  }

  return null
}

export function normalizeStageLayout(stageLayout) {
  const legacyLayout = migrateLegacyStageLayoutMode(stageLayout?.mode)
  const fallbackLayout = legacyLayout || STAGE_LAYOUT_DEFAULTS

  return {
    columns: toStageLayoutDimension(stageLayout?.columns) ?? fallbackLayout.columns,
    rows: toStageLayoutDimension(stageLayout?.rows) ?? fallbackLayout.rows,
  }
}

export function getStageLayoutSlotCount(stageLayout) {
  const normalizedLayout = normalizeStageLayout(stageLayout)
  return normalizedLayout.columns * normalizedLayout.rows
}

export function getStageLayoutName(stageLayout) {
  return getStageLayoutSlotCount(stageLayout) === 1 ? 'single' : 'grid'
}

export function areStageLayoutsEqual(firstLayout, secondLayout) {
  const first = normalizeStageLayout(firstLayout)
  const second = normalizeStageLayout(secondLayout)

  return first.columns === second.columns && first.rows === second.rows
}
