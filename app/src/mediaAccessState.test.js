import { describe, expect, it } from 'vitest'
import { deriveMediaAccessState } from './mediaAccessState.js'

describe('deriveMediaAccessState', () => {
  it('marks FileSystemAccessAPI metadata-only files as needing permission', () => {
    expect(deriveMediaAccessState({ fromFileSystemAPI: true })).toMatchObject({
      needsPermission: true,
      isMetadataOnly: true,
      isTemporary: false,
      isReady: false,
    })
  })

  it('marks drag-and-drop files as temporary even when usable', () => {
    expect(
      deriveMediaAccessState({ file: {}, url: 'blob:test', fromFileSystemAPI: false })
    ).toMatchObject({
      needsPermission: false,
      isMetadataOnly: false,
      isTemporary: true,
      isReady: false,
    })
  })

  it('marks persisted files with access as ready', () => {
    expect(
      deriveMediaAccessState({ file: {}, url: 'blob:test', fromFileSystemAPI: true })
    ).toMatchObject({
      needsPermission: false,
      isMetadataOnly: false,
      isTemporary: false,
      isReady: true,
    })
  })

  it('treats metadata-only non-persistent items as temporary placeholders', () => {
    expect(deriveMediaAccessState({ fromFileSystemAPI: false })).toMatchObject({
      needsPermission: false,
      isMetadataOnly: true,
      isTemporary: true,
      isReady: false,
    })
  })
})
