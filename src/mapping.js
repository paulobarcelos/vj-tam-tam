// Local copy of Maptastic in /lib/maptastic.js
import Maptastic from '../lib/maptastic.js';

// State
let stageEl, maptastic;
const filters = { brightness: 1, contrast: 1, saturate: 1 };
const transforms = { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0 };

// Init (call once on app load)
export function initMapping() {
  stageEl = document.getElementById('stage');
  
  // Maptastic setup
  maptastic = Maptastic({
    autoSave: false,
    layers: [stageEl]
  });

  // Apply default filters
  updateFilters();
}

// Public API
export function setFilter(key, value) {
  filters[key] = value;
  updateFilters();
}

export function setPerspective(corner, axis, value) {
  const layout = maptastic.getLayout();
  const cornerIdx = { tl: 0, tr: 1, br: 2, bl: 3 }[corner];
  const axisIdx = { x: 0, y: 1 }[axis];
  layout[0].targetPoints[cornerIdx][axisIdx] = value;
  maptastic.setLayout(layout);
}

// Private helpers
function updateFilters() {
  stageEl.style.filter = `
    brightness(${filters.brightness})
    contrast(${filters.contrast})
    saturate(${filters.saturate})
  `;
} 