import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { vi } from 'vitest'

const helpersDir = dirname(fileURLToPath(import.meta.url))
const appHtmlPath = resolve(helpersDir, '../../app/index.html')

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  if (!match) {
    throw new Error('Could not find <body> in app/index.html')
  }

  return match[1].replace(/<script[\s\S]*?<\/script>/gi, '')
}

export function loadAppFixture() {
  const html = readFileSync(appHtmlPath, 'utf8')
  document.body.innerHTML = extractBody(html)

  return {
    app: document.getElementById('app'),
    stage: document.getElementById('stage'),
    drawer: document.getElementById('left-drawer'),
    toastContainer: document.getElementById('toast-container'),
  }
}

export function bindToastManager(toastManager) {
  toastManager.container = document.getElementById('toast-container')
  return toastManager.container
}

export function installMockMaptastic() {
  globalThis.Maptastic = vi.fn(() => ({
    addLayer: vi.fn(),
    setConfigEnabled: vi.fn(),
    getLayout: vi.fn(() => []),
    setLayout: vi.fn(),
  }))

  return globalThis.Maptastic
}
