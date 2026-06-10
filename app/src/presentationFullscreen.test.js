import { describe, expect, it, vi } from 'vitest'
import { requestPresentationFullscreen } from './presentationFullscreen.js'

describe('requestPresentationFullscreen', () => {
  it('requests fullscreen with hidden browser navigation UI', async () => {
    const target = {
      requestFullscreen: vi.fn().mockResolvedValue(undefined),
    }

    await requestPresentationFullscreen(target)

    expect(target.requestFullscreen).toHaveBeenCalledWith({ navigationUI: 'hide' })
  })

  it('falls back to requestFullscreen without options when the options call is rejected as unsupported', async () => {
    const target = {
      requestFullscreen: vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Unsupported fullscreen options'))
        .mockResolvedValueOnce(undefined),
    }

    await requestPresentationFullscreen(target)

    expect(target.requestFullscreen).toHaveBeenNthCalledWith(1, { navigationUI: 'hide' })
    expect(target.requestFullscreen).toHaveBeenNthCalledWith(2)
  })

  it('throws when fullscreen is unavailable', async () => {
    await expect(requestPresentationFullscreen({})).rejects.toThrow(
      'Presentation fullscreen is not supported in this browser'
    )
  })
})
