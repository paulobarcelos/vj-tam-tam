/**
 * Unit tests for FileSystemFacade
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SUPPORTED_IMAGE_MIMES, FILE_ACCEPT_PATTERNS } from '../constants/mediaTypes.js'

// Mock toastManager
vi.mock('../toastManager.js', () => ({
  toastManager: {
    error: vi.fn(),
    success: vi.fn(),
    show: vi.fn(),
  },
}))

describe('FileSystemFacade', () => {
  let FileSystemFacade

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // Import the class
    const module = await import('./fileSystemFacade.js')
    FileSystemFacade = module.fileSystemFacade.constructor
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isFileSystemAccessSupported', () => {
    it('should return true when FileSystemAccessAPI is available', () => {
      // Mock the API availability
      globalThis.window = {
        showOpenFilePicker: vi.fn(),
        showDirectoryPicker: vi.fn(),
      }

      const facade = new FileSystemFacade()

      expect(facade.isFileSystemAccessSupported()).toBe(true)
    })

    it('should return false when FileSystemAccessAPI is not available', () => {
      globalThis.window = {}

      const facade = new FileSystemFacade()

      expect(facade.isFileSystemAccessSupported()).toBe(false)
    })
  })

  describe('browse', () => {
    it('should use FileSystemAccessAPI when available', async () => {
      const mockFiles = [new File(['content'], 'test.jpg', { type: SUPPORTED_IMAGE_MIMES[0] })]

      const mockFileHandles = [{ getFile: vi.fn().mockResolvedValue(mockFiles[0]) }]

      globalThis.window = {
        showOpenFilePicker: vi.fn().mockResolvedValue(mockFileHandles),
        showDirectoryPicker: vi.fn(),
      }

      const facade = new FileSystemFacade()

      const result = await facade.browse()

      expect(window.showOpenFilePicker).toHaveBeenCalledWith({
        multiple: true,
        types: [
          {
            description: 'Media files',
            accept: FILE_ACCEPT_PATTERNS,
          },
        ],
      })

      expect(result).toEqual(mockFiles)
    })

    it('should handle user cancellation gracefully', async () => {
      const abortError = new Error('User cancelled')
      abortError.name = 'AbortError'

      globalThis.window = {
        showOpenFilePicker: vi.fn().mockRejectedValue(abortError),
        showDirectoryPicker: vi.fn(),
      }

      const facade = new FileSystemFacade()

      const result = await facade.browse()

      expect(result).toEqual([])
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should handle permission denied errors', async () => {
      const { toastManager } = await import('../toastManager.js')

      const permissionError = new Error('Permission denied')
      permissionError.name = 'NotAllowedError'

      globalThis.window = {
        showOpenFilePicker: vi.fn().mockRejectedValue(permissionError),
        showDirectoryPicker: vi.fn(),
      }

      const facade = new FileSystemFacade()

      // Mock the fallback method
      const mockFiles = [new File(['content'], 'test.jpg', { type: SUPPORTED_IMAGE_MIMES[0] })]
      vi.spyOn(facade, 'browseWithInput').mockResolvedValue(mockFiles)

      const result = await facade.browse()

      expect(result).toEqual(mockFiles)
      expect(toastManager.show).toHaveBeenCalledWith(
        'FileSystemAccessAPI permission denied. Using fallback file picker.',
        { type: 'info' }
      )
      expect(facade.browseWithInput).toHaveBeenCalledWith(false)
    })

    it('should fall back to HTML input when API not available', async () => {
      globalThis.window = {}

      const facade = new FileSystemFacade()

      // Mock the fallback method
      const mockFiles = [new File(['content'], 'test.jpg', { type: SUPPORTED_IMAGE_MIMES[0] })]
      vi.spyOn(facade, 'browseWithInput').mockResolvedValue(mockFiles)

      const result = await facade.browse()

      expect(facade.browseWithInput).toHaveBeenCalled()
      expect(result).toEqual(mockFiles)
    })
  })
})
