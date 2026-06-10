/**
 * Derive media access/display state from a media item.
 *
 * This keeps file permission policy out of DOM rendering so views can ask one
 * small, testable question instead of re-inferring state from item fields.
 */
export function deriveMediaAccessState(item) {
  const hasFileAccess = Boolean(item?.file && item?.url)
  const fromFileSystemAPI = Boolean(item?.fromFileSystemAPI)
  const needsPermission = !hasFileAccess && fromFileSystemAPI
  const isMetadataOnly = !hasFileAccess
  const isTemporary = !fromFileSystemAPI && (hasFileAccess || isMetadataOnly)

  return {
    hasFileAccess,
    fromFileSystemAPI,
    needsPermission,
    isMetadataOnly,
    isTemporary,
    isReady: hasFileAccess && !isTemporary,
  }
}
