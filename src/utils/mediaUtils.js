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

// ============================================================================
// SEGMENT CALCULATION UTILITIES
// ============================================================================

/**
 * Calculate a random segment duration between min and max values
 * @param {number} minDuration - Minimum duration in seconds
 * @param {number} maxDuration - Maximum duration in seconds
 * @returns {number} - Random duration in seconds (inclusive of min and max)
 */
export const calculateRandomSegmentDuration = (minDuration, maxDuration) => {
  if (typeof minDuration !== 'number' || typeof maxDuration !== 'number') {
    throw new Error('Duration values must be numbers')
  }

  if (minDuration < 0 || maxDuration < 0) {
    throw new Error('Duration values must be non-negative')
  }

  if (minDuration > maxDuration) {
    throw new Error('Minimum duration cannot be greater than maximum duration')
  }

  // If min and max are equal, return that value
  if (minDuration === maxDuration) {
    return minDuration
  }

  // Calculate random duration between min and max (inclusive)
  return Math.random() * (maxDuration - minDuration) + minDuration
}

/**
 * Calculate valid range for video segment start points
 * @param {number} videoDuration - Total video duration in seconds
 * @param {number} segmentDuration - Desired segment duration in seconds
 * @param {number} skipStart - Skip start offset in seconds
 * @param {number} skipEnd - Skip end offset in seconds
 * @returns {Object} - Object with validStartMin, validStartMax, and fallbackUsed properties
 */
export const calculateValidVideoRange = (videoDuration, segmentDuration, skipStart, skipEnd) => {
  if (
    typeof videoDuration !== 'number' ||
    typeof segmentDuration !== 'number' ||
    typeof skipStart !== 'number' ||
    typeof skipEnd !== 'number'
  ) {
    throw new Error('All parameters must be numbers')
  }

  if (videoDuration <= 0 || segmentDuration <= 0) {
    throw new Error('Video duration and segment duration must be positive')
  }

  if (skipStart < 0 || skipEnd < 0) {
    throw new Error('Skip values must be non-negative')
  }

  if (segmentDuration > videoDuration) {
    throw new Error('Segment duration cannot be longer than video duration')
  }

  // Initial range calculation: start >= skipStart, end <= videoDuration - skipEnd
  let validStartMin = skipStart
  let validStartMax = videoDuration - skipEnd - segmentDuration
  let fallbackUsed = null

  // Fallback 1: Ignore skipEnd if no valid range
  if (validStartMin > validStartMax) {
    validStartMax = videoDuration - segmentDuration
    fallbackUsed = 'skipEnd'
  }

  // Fallback 2: Ignore both offsets if still no valid range
  if (validStartMin > validStartMax) {
    validStartMin = 0
    validStartMax = videoDuration - segmentDuration
    fallbackUsed = 'both'
  }

  // Final validation - this should not happen with proper input validation
  if (validStartMin > validStartMax) {
    throw new Error('Cannot create valid segment range - segment duration too long for video')
  }

  return {
    validStartMin,
    validStartMax,
    fallbackUsed,
  }
}

/**
 * Calculate a random start point within a valid range
 * @param {number} validStartMin - Minimum valid start point in seconds
 * @param {number} validStartMax - Maximum valid start point in seconds
 * @returns {number} - Random start point in seconds
 */
export const calculateRandomStartPoint = (validStartMin, validStartMax) => {
  if (typeof validStartMin !== 'number' || typeof validStartMax !== 'number') {
    throw new Error('Range values must be numbers')
  }

  if (validStartMin < 0 || validStartMax < 0) {
    throw new Error('Range values must be non-negative')
  }

  if (validStartMin > validStartMax) {
    throw new Error('Minimum start point cannot be greater than maximum start point')
  }

  // If min and max are equal, return that value
  if (validStartMin === validStartMax) {
    return validStartMin
  }

  // Calculate random start point within range (inclusive)
  return Math.random() * (validStartMax - validStartMin) + validStartMin
}

/**
 * Get complete video segment parameters with fallback logic
 * @param {number} videoDuration - Total video duration in seconds
 * @param {Object} segmentSettings - Segment settings object
 * @param {number} segmentSettings.minDuration - Minimum segment duration in seconds
 * @param {number} segmentSettings.maxDuration - Maximum segment duration in seconds
 * @param {number} segmentSettings.skipStart - Skip start offset in seconds
 * @param {number} segmentSettings.skipEnd - Skip end offset in seconds
 * @returns {Object} - Object with segmentDuration, startPoint, and fallbackUsed properties
 */
export const getVideoSegmentParameters = (videoDuration, segmentSettings) => {
  if (!segmentSettings || typeof segmentSettings !== 'object') {
    throw new Error('Segment settings must be a valid object')
  }

  const { minDuration, maxDuration, skipStart, skipEnd } = segmentSettings

  // Calculate random segment duration
  const segmentDuration = calculateRandomSegmentDuration(minDuration, maxDuration)

  // Calculate valid range with fallback logic
  const rangeResult = calculateValidVideoRange(videoDuration, segmentDuration, skipStart, skipEnd)

  // Calculate random start point within valid range
  const startPoint = calculateRandomStartPoint(rangeResult.validStartMin, rangeResult.validStartMax)

  return {
    segmentDuration,
    startPoint,
    fallbackUsed: rangeResult.fallbackUsed,
  }
}
