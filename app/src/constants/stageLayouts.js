export const STAGE_LAYOUTS = {
  SINGLE: 'single',
  TWO_COLUMNS: 'two-columns',
}

export const STAGE_LAYOUT_LABELS = {
  [STAGE_LAYOUTS.SINGLE]: 'Single',
  [STAGE_LAYOUTS.TWO_COLUMNS]: 'Two Columns',
}

export const STAGE_LAYOUT_SLOT_COUNTS = {
  [STAGE_LAYOUTS.SINGLE]: 1,
  [STAGE_LAYOUTS.TWO_COLUMNS]: 2,
}

export function isValidStageLayoutMode(mode) {
  return Object.values(STAGE_LAYOUTS).includes(mode)
}
