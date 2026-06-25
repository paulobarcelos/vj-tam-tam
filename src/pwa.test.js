import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const srcDir = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(srcDir, '..')

function readAppFile(path) {
  return readFileSync(resolve(appRoot, path), 'utf8')
}

function getPrecacheUrls(serviceWorkerSource) {
  const match = serviceWorkerSource.match(/const PRECACHE_URLS = (\[[\s\S]*?\])\n\n/)
  if (!match) {
    throw new Error('Could not find PRECACHE_URLS in service worker')
  }

  return [...match[1].matchAll(/'([^']+)'/g)].map(([, url]) => url)
}

describe('PWA offline app shell', () => {
  it('links the manifest and icon from the app shell', () => {
    const indexHtml = readAppFile('index.html')

    expect(indexHtml).toContain('<link rel="manifest" href="manifest.webmanifest" />')
    expect(indexHtml).toContain('<link rel="icon" href="assets/img/app-icon.svg"')
    expect(indexHtml).toContain('<meta name="theme-color" content="#050607" />')
  })

  it('uses a relative manifest that works under the GitHub Pages subpath', () => {
    const manifest = JSON.parse(readAppFile('manifest.webmanifest'))

    expect(manifest.start_url).toBe('./')
    expect(manifest.scope).toBe('./')
    expect(manifest.icons.map((icon) => icon.src)).toEqual(
      expect.arrayContaining([
        'assets/img/app-icon-192.png',
        'assets/img/app-icon-512.png',
        'assets/img/app-icon.svg',
      ])
    )
  })

  it('registers the generated service worker from the app root', () => {
    const mainSource = readAppFile('src/main.js')

    expect(mainSource).toContain('navigator.serviceWorker.register')
    expect(mainSource).toContain("new URL('../sw.js', import.meta.url)")
  })

  it('pre-caches app shell files without caching tests or user media', () => {
    const serviceWorkerSource = readAppFile('sw.js')
    const precacheUrls = getPrecacheUrls(serviceWorkerSource)

    expect(serviceWorkerSource).toContain("const CACHE_PREFIX = 'vj-tam-tam-app-'")
    expect(serviceWorkerSource).toContain('caches.delete(cacheName)')
    expect(precacheUrls).toEqual(
      expect.arrayContaining([
        './',
        './index.html',
        './manifest.webmanifest',
        './assets/css/style.css',
        './assets/img/app-icon-192.png',
        './assets/img/app-icon-512.png',
        './assets/img/app-icon.svg',
        './assets/img/test-card.png',
        './src/main.js',
      ])
    )
    expect(precacheUrls.some((url) => url.endsWith('.test.js'))).toBe(false)
    expect(precacheUrls.some((url) => url.startsWith('blob:'))).toBe(false)
  })
})
