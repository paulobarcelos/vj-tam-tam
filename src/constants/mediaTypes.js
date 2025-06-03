/**
 * Centralized Media Type Constants
 *
 * This module contains all supported media types (MIME types and file extensions)
 * for the VJ Tam Tam application. All modules should import from this file
 * instead of defining their own media type constants.
 */

// Supported file extensions (without dots)
export const SUPPORTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'heic', 'webp']
export const SUPPORTED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'webm', 'mkv']

// Supported MIME types
export const SUPPORTED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/heic',
  'image/webp',
]

export const SUPPORTED_VIDEO_MIMES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/avi',
  'video/mkv',
]

// File accept patterns for FileSystemAccessAPI and HTML input elements
export const FILE_ACCEPT_PATTERNS = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.heic', '.webp'],
  'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
}

// Combined arrays for convenience
export const ALL_SUPPORTED_EXTENSIONS = [
  ...SUPPORTED_IMAGE_EXTENSIONS,
  ...SUPPORTED_VIDEO_EXTENSIONS,
]
export const ALL_SUPPORTED_MIMES = [...SUPPORTED_IMAGE_MIMES, ...SUPPORTED_VIDEO_MIMES]

/**
 * Check if a MIME type is a supported image type
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} - True if MIME type is a supported image type
 */
export const isImageMime = (mimeType) => {
  return SUPPORTED_IMAGE_MIMES.includes(mimeType?.toLowerCase())
}

/**
 * Check if a MIME type is a supported video type
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} - True if MIME type is a supported video type
 */
export const isVideoMime = (mimeType) => {
  return SUPPORTED_VIDEO_MIMES.includes(mimeType?.toLowerCase())
}

/**
 * Check if a MIME type is supported (image or video)
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} - True if MIME type is supported
 */
export const isSupportedMime = (mimeType) => {
  return isImageMime(mimeType) || isVideoMime(mimeType)
}

/**
 * Check if a file extension is a supported image type
 * @param {string} extension - File extension to check (with or without dot)
 * @returns {boolean} - True if extension is a supported image type
 */
export const isImageExtension = (extension) => {
  const cleanExt = extension?.toLowerCase().replace(/^\./, '')
  return SUPPORTED_IMAGE_EXTENSIONS.includes(cleanExt)
}

/**
 * Check if a file extension is a supported video type
 * @param {string} extension - File extension to check (with or without dot)
 * @returns {boolean} - True if extension is a supported video type
 */
export const isVideoExtension = (extension) => {
  const cleanExt = extension?.toLowerCase().replace(/^\./, '')
  return SUPPORTED_VIDEO_EXTENSIONS.includes(cleanExt)
}

/**
 * Check if a file extension is supported (image or video)
 * @param {string} extension - File extension to check (with or without dot)
 * @returns {boolean} - True if extension is supported
 */
export const isSupportedExtension = (extension) => {
  return isImageExtension(extension) || isVideoExtension(extension)
}

/**
 * Get media type (image/video) from MIME type
 * @param {string} mimeType - MIME type to check
 * @returns {string|null} - 'image', 'video', or null if unsupported
 */
export const getMediaTypeFromMime = (mimeType) => {
  if (isImageMime(mimeType)) return 'image'
  if (isVideoMime(mimeType)) return 'video'
  return null
}

/**
 * Get media type (image/video) from file extension
 * @param {string} extension - File extension to check (with or without dot)
 * @returns {string|null} - 'image', 'video', or null if unsupported
 */
export const getMediaTypeFromExtension = (extension) => {
  if (isImageExtension(extension)) return 'image'
  if (isVideoExtension(extension)) return 'video'
  return null
}

/**
 * Get a formatted string of all supported file types for user display
 * @returns {string} - Comma-separated list of supported extensions in uppercase
 */
export const getSupportedTypesString = () => {
  return ALL_SUPPORTED_EXTENSIONS.map((ext) => ext.toUpperCase()).join(', ')
}
