/**
 * Media utilities for common media file operations
 * Centralizes file extension, media type detection, and media filtering logic
 */

import {
  isSupportedExtension,
  isSupportedMime,
  getMediaTypeFromMime,
  getMediaTypeFromExtension,
  getSupportedTypesString,
} from '../constants/mediaTypes.js'

/**
 * Get file extension from filename
 * @param {string} filename - The filename to extract extension from
 * @returns {string} - Lowercase file extension without dot
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return ''
  }

  const parts = filename.split('.')
  if (parts.length < 2) {
    return '' // No extension found
  }

  return parts.pop()?.toLowerCase() || ''
}

/**
 * Check if file type is supported based on extension and MIME type
 * @param {File} file - File object to validate
 * @returns {boolean} - True if file is supported
 */
export const isFileSupported = (file) => {
  if (!file) return false

  const extension = getFileExtension(file.name)
  const mimeType = file.type ? file.type.toLowerCase() : ''

  return isSupportedExtension(extension) || isSupportedMime(mimeType)
}

/**
 * Determine media type (image or video) from file
 * @param {File} file - File object
 * @returns {string} - 'image' or 'video'
 */
export const getMediaType = (file) => {
  if (!file) return 'image'

  const extension = getFileExtension(file.name)
  const mimeType = file.type ? file.type.toLowerCase() : ''

  // Try MIME type first, then extension
  const typeFromMime = getMediaTypeFromMime(mimeType)
  if (typeFromMime) return typeFromMime

  const typeFromExtension = getMediaTypeFromExtension(extension)
  return typeFromExtension || 'image' // Default to image if unknown
}

/**
 * Filter media items by media type
 * @param {Array} mediaItems - Array of media items
 * @param {string} type - Media type to filter by ('image' or 'video')
 * @returns {Array} - Filtered array of media items
 */
export const filterMediaByType = (mediaItems, type) => {
  if (!Array.isArray(mediaItems)) return []

  return mediaItems.filter((item) => item.type === type)
}

/**
 * Filter media items by file access status
 * @param {Array} mediaItems - Array of media items
 * @param {boolean} hasAccess - True to get items with file access, false for metadata-only
 * @returns {Array} - Filtered array of media items
 */
export const filterMediaByAccess = (mediaItems, hasAccess) => {
  if (!Array.isArray(mediaItems)) return []

  return mediaItems.filter((item) => {
    const hasFileAccess = !!(item.file && item.url)
    return hasAccess ? hasFileAccess : !hasFileAccess
  })
}

/**
 * Filter media items that need permission restoration (from FileSystemAccessAPI)
 * @param {Array} mediaItems - Array of media items
 * @returns {Array} - Media items that need permission restoration
 */
export const filterMediaNeedingPermission = (mediaItems) => {
  if (!Array.isArray(mediaItems)) return []

  return mediaItems.filter((item) => (!item.file || !item.url) && item.fromFileSystemAPI)
}

/**
 * Filter media items that are temporary (drag & drop)
 * @param {Array} mediaItems - Array of media items
 * @returns {Array} - Temporary media items
 */
export const filterTemporaryMedia = (mediaItems) => {
  if (!Array.isArray(mediaItems)) return []

  return mediaItems.filter(
    (item) =>
      (item.file && item.url && !item.fromFileSystemAPI) ||
      (!item.file && !item.url && !item.fromFileSystemAPI)
  )
}

/**
 * Filter media items that have actual file access (usable media)
 * @param {Array} mediaItems - Array of media items
 * @returns {Array} - Media items with file and URL access
 */
export const filterUsableMedia = (mediaItems) => {
  if (!Array.isArray(mediaItems)) return []

  return mediaItems.filter((item) => item.file && item.url)
}

/**
 * Filter media pool to get restorable items (from FileSystemAccessAPI only)
 * @param {Array} mediaItems - Array of media items
 * @returns {Array} - Items that can be restored from FileSystemAccessAPI
 */
export const filterRestorableMedia = (mediaItems) => {
  if (!Array.isArray(mediaItems)) return []

  return mediaItems.filter((item) => item.fromFileSystemAPI)
}

/**
 * Get supported file types string for user display
 * @returns {string} - Formatted string of supported types
 */
export const getSupportedTypes = () => {
  return getSupportedTypesString()
}

/**
 * Check if filename has a supported extension (used for directory processing)
 * @param {string} filename - The filename to check
 * @returns {boolean} - True if extension is supported
 */
export const hasValidMediaExtension = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return false
  }

  const extension = getFileExtension(filename)
  return extension !== '' && isSupportedExtension(extension)
}
