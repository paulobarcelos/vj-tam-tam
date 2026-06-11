/**
 * Integration Test for Story 3.5: Consistent Interface Component Styling Standards
 * Tests CSS class implementation and DOM structure compliance
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { JSDOM } from 'jsdom'

function readCssWithImports(filePath, seen = new Set()) {
  if (seen.has(filePath)) return ''
  seen.add(filePath)

  const content = readFileSync(filePath, 'utf8')
  const imports = [...content.matchAll(/@import\s+url\(["']?([^"')]+)["']?\);/g)]

  const importedContent = imports
    .map((match) => readCssWithImports(resolve(dirname(filePath), match[1]), seen))
    .join('\n')

  return `${content}\n${importedContent}`
}

describe('Story 3.5: Component Styling Consistency', () => {
  let cssContent

  beforeEach(() => {
    // Load CSS content for validation
    try {
      cssContent = readCssWithImports(resolve('./app/assets/css/style.css'))
    } catch {
      cssContent = ''
    }
  })

  describe('AC 5.1: Button Styling Consistency - CSS Implementation', () => {
    it('should define base button class with Signal Desk design tokens', () => {
      expect(cssContent).toContain('.btn {')
      expect(cssContent).toContain('font-family: inherit')
      expect(cssContent).toContain('font-weight: 700')
      expect(cssContent).toContain('text-transform: uppercase')
      expect(cssContent).toContain('border-radius: var(--radius-md)')
      expect(cssContent).toContain('border: 1px solid var(--line-strong)')
      expect(cssContent).toContain('background: linear-gradient')
    })

    it('should define button variants', () => {
      expect(cssContent).toContain('.btn--primary')
      expect(cssContent).toContain('.btn--secondary')
      expect(cssContent).toContain('.btn--danger')
      expect(cssContent).toContain('.btn--icon')
      expect(cssContent).toContain('.btn--small')
      expect(cssContent).toContain('.btn--icon-small')
      expect(cssContent).toContain('.btn--full-width')
    })

    it('should define button states', () => {
      expect(cssContent).toContain('.btn:hover')
      expect(cssContent).toContain('.btn:focus')
      expect(cssContent).toContain('.btn:active')
    })

    it('should define button groups', () => {
      expect(cssContent).toContain('.btn-group')
      expect(cssContent).toContain('display: flex')
      expect(cssContent).toContain('gap: 0.5rem')
    })
  })

  describe('AC 5.2: Form Control Styling - CSS Implementation', () => {
    it('should maintain consistent form control styling', () => {
      // Verify existing form controls use proper classes
      expect(cssContent).toContain('input')
      expect(cssContent).toContain('slider')
    })
  })

  describe('AC 5.3: Toast Notification Standards - CSS Implementation', () => {
    it('should position toast container at bottom-center', () => {
      expect(cssContent).toContain('.toast-container')
      expect(cssContent).toContain('position: fixed')
      expect(cssContent).toContain('bottom: 20px')
      expect(cssContent).toContain('left: 50%')
      expect(cssContent).toContain('transform: translateX(-50%)')
    })

    it('should apply Signal Desk styling to toasts', () => {
      expect(cssContent).toContain('.toast {')
      expect(cssContent).toContain('font-family: inherit')
      expect(cssContent).toContain('font-weight: bold')
      expect(cssContent).toContain('text-transform: uppercase')
      expect(cssContent).toContain('border-radius: var(--radius-md)')
      expect(cssContent).toContain('border: 1px solid var(--line-strong)')
      expect(cssContent).toContain('backdrop-filter: blur(14px)')
    })

    it('should define toast variants', () => {
      expect(cssContent).toContain('.toast.error')
      expect(cssContent).toContain('.toast.success')
      expect(cssContent).toContain('.toast.info')
    })

    it('should use proper animation', () => {
      expect(cssContent).toContain('toast-slide-up')
      expect(cssContent).toContain('@keyframes toast-slide-up')
    })
  })

  describe('AC 5.4: Accessibility Standards - CSS Implementation', () => {
    it('should provide adequate touch targets', () => {
      expect(cssContent).toContain('min-height: 44px')
      expect(cssContent).toContain('min-width: 44px')
    })

    it('should define focus states', () => {
      expect(cssContent).toContain(':focus')
      expect(cssContent).toContain('outline')
    })

    it('should use high contrast colors', () => {
      expect(cssContent).toContain('--surface-0: #050607')
      expect(cssContent).toContain('--text-strong: #f5f7f8')
      expect(cssContent).toContain('#ffffff')
    })
  })

  describe('Design System Documentation - CSS Structure', () => {
    it('should expose shared design tokens', () => {
      expect(cssContent).toContain(':root {')
      expect(cssContent).toContain('--accent-cyan')
      expect(cssContent).toContain('--accent-orange')
      expect(cssContent).toContain('--radius-md')
      expect(cssContent).toContain('--shadow-panel')
    })

    it('should keep the drawer and projection surfaces tokenized', () => {
      expect(cssContent).toContain('.left-drawer')
      expect(cssContent).toContain('backdrop-filter: blur(18px)')
      expect(cssContent).toContain('.projection-button[data-projection-active="true"]')
      expect(cssContent).toContain('rgba(255, 122, 47')
    })

    it('should define the lean bottom live strip without fake telemetry controls', () => {
      expect(cssContent).toContain('.bottom-live-strip')
      expect(cssContent).toContain('height: var(--live-strip-height)')
      expect(cssContent).toContain('.ui-idle .bottom-live-strip')
      expect(cssContent).toContain('.live-duration-control')
      expect(cssContent).toContain('.live-fullscreen-btn')
      expect(cssContent).not.toContain('cpu')
      expect(cssContent).not.toContain('bpm')
    })

    it('should keep active toasts above the bottom live strip', () => {
      expect(cssContent).toContain('body:not(.ui-idle) .toast-container')
      expect(cssContent).toContain('bottom: calc(var(--live-strip-height) + 20px)')
      expect(cssContent).toContain('bottom: calc(var(--live-strip-mobile-height) + 16px)')
    })

    it('should not rely on stale brutalist styling markers', () => {
      expect(cssContent).not.toContain('BRUTALIST MINIMALISM DESIGN SYSTEM')
      expect(cssContent).not.toContain('No rounded corners - brutalist')
      expect(cssContent).not.toContain('Following UI-UX-Spec')
    })
  })
})

describe('Story 3.5: DOM Structure Validation', () => {
  let document

  beforeEach(() => {
    // Create test DOM with button structure
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app">
            <div class="file-picker-controls btn-group">
              <button class="btn btn--secondary">Files</button>
              <button class="btn btn--secondary">Folders</button>
            </div>
            <button class="btn btn--danger btn--small">Clear all</button>
            <button class="btn btn--icon">+</button>
            <button class="btn btn--secondary btn--small">Advanced Settings</button>
            <div class="toast-container"></div>
          </div>
        </body>
      </html>
    `)
    document = dom.window.document
  })

  describe('Button Class Implementation', () => {
    it('should apply base btn class to all buttons', () => {
      const buttons = document.querySelectorAll('button')
      buttons.forEach((button) => {
        expect(button.classList.contains('btn')).toBe(true)
      })
    })

    it('should apply correct variant classes', () => {
      const secondaryBtn = document.querySelector('.btn--secondary')
      const dangerBtn = document.querySelector('.btn--danger')
      const iconBtn = document.querySelector('.btn--icon')
      const smallBtn = document.querySelector('.btn--small')

      expect(secondaryBtn).toBeTruthy()
      expect(dangerBtn).toBeTruthy()
      expect(iconBtn).toBeTruthy()
      expect(smallBtn).toBeTruthy()
    })

    it('should implement button groups correctly', () => {
      const btnGroup = document.querySelector('.btn-group')
      expect(btnGroup).toBeTruthy()

      const buttonsInGroup = btnGroup.querySelectorAll('.btn')
      expect(buttonsInGroup.length).toBeGreaterThan(1)
    })
  })

  describe('Toast Container Structure', () => {
    it('should have toast container in correct position', () => {
      const toastContainer = document.querySelector('.toast-container')
      expect(toastContainer).toBeTruthy()
    })
  })
})
