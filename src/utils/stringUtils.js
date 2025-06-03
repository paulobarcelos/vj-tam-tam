/**
 * String utilities for common string manipulation operations
 * Centralizes string formatting, interpolation, and transformation logic
 */

/**
 * Interpolate a template string with values
 * @param {string} template - Template string with {{key}} placeholders
 * @param {Object} values - Object with values to interpolate
 * @returns {string} - Interpolated string
 */
export const interpolate = (template, values = {}) => {
  if (typeof template !== 'string') {
    return ''
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] !== undefined ? values[key] : match
  })
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} - String with first letter capitalized
 */
export const capitalize = (str) => {
  if (typeof str !== 'string' || str.length === 0) {
    return ''
  }

  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Capitalize the first letter of each word in a string
 * @param {string} str - String to convert to title case
 * @returns {string} - String in title case
 */
export const titleCase = (str) => {
  if (typeof str !== 'string') {
    return ''
  }

  return str
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ')
}

/**
 * Convert string to camelCase
 * @param {string} str - String to convert
 * @returns {string} - String in camelCase
 */
export const camelCase = (str) => {
  if (typeof str !== 'string') {
    return ''
  }

  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase()
    })
    .replace(/\s+/g, '')
}

/**
 * Convert string to kebab-case
 * @param {string} str - String to convert
 * @returns {string} - String in kebab-case
 */
export const kebabCase = (str) => {
  if (typeof str !== 'string') {
    return ''
  }

  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

/**
 * Convert string to snake_case
 * @param {string} str - String to convert
 * @returns {string} - String in snake_case
 */
export const snakeCase = (str) => {
  if (typeof str !== 'string') {
    return ''
  }

  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .toLowerCase()
}

/**
 * Truncate string to specified length and add ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length (including ellipsis)
 * @param {string} ellipsis - Ellipsis to add (default: '...')
 * @returns {string} - Truncated string
 */
export const truncate = (str, maxLength, ellipsis = '...') => {
  if (typeof str !== 'string' || str.length <= maxLength) {
    return str
  }

  return str.substring(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Remove leading and trailing whitespace and normalize internal whitespace
 * @param {string} str - String to normalize
 * @returns {string} - Normalized string
 */
export const normalizeWhitespace = (str) => {
  if (typeof str !== 'string') {
    return ''
  }

  return str.trim().replace(/\s+/g, ' ')
}

/**
 * Check if string is empty or contains only whitespace
 * @param {string} str - String to check
 * @returns {boolean} - True if string is empty or whitespace-only
 */
export const isBlank = (str) => {
  return typeof str !== 'string' || str.trim().length === 0
}

/**
 * Pad string to specified length with character
 * @param {string} str - String to pad
 * @param {number} length - Target length
 * @param {string} char - Character to pad with (default: ' ')
 * @param {string} direction - Padding direction ('left', 'right', 'both')
 * @returns {string} - Padded string
 */
export const padString = (str, length, char = ' ', direction = 'right') => {
  if (typeof str !== 'string') {
    str = String(str)
  }

  if (str.length >= length) {
    return str
  }

  const padLength = length - str.length
  const padChar = char.charAt(0)

  switch (direction) {
    case 'left':
      return padChar.repeat(padLength) + str
    case 'both': {
      const leftPad = Math.floor(padLength / 2)
      const rightPad = padLength - leftPad
      return padChar.repeat(leftPad) + str + padChar.repeat(rightPad)
    }
    case 'right':
    default:
      return str + padChar.repeat(padLength)
  }
}

/**
 * Escape HTML characters in string
 * @param {string} str - String to escape
 * @returns {string} - HTML-escaped string
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') {
    return ''
  }

  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return str.replace(/[&<>"']/g, (match) => htmlEscapes[match])
}

/**
 * Generate a slug from string (URL-friendly)
 * @param {string} str - String to convert to slug
 * @returns {string} - URL-friendly slug
 */
export const slugify = (str) => {
  if (typeof str !== 'string') {
    return ''
  }

  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Extract file extension from filename
 * @param {string} filename - Filename to extract extension from
 * @returns {string} - File extension without dot, lowercase
 */
export const getFileExtension = (filename) => {
  if (typeof filename !== 'string' || !filename.includes('.')) {
    return ''
  }

  return filename.split('.').pop().toLowerCase()
}

/**
 * Remove file extension from filename
 * @param {string} filename - Filename to remove extension from
 * @returns {string} - Filename without extension
 */
export const removeFileExtension = (filename) => {
  if (typeof filename !== 'string' || !filename.includes('.')) {
    return filename
  }

  const parts = filename.split('.')
  parts.pop()
  return parts.join('.')
}

/**
 * Format file size in bytes to human readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted file size string
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (typeof bytes !== 'number' || bytes === 0) {
    return '0 Bytes'
  }

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

/**
 * Generate random string with specified length
 * @param {number} length - Length of random string
 * @param {string} chars - Characters to use (default: alphanumeric)
 * @returns {string} - Random string
 */
export const randomString = (
  length = 8,
  chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
) => {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Count words in a string
 * @param {string} str - String to count words in
 * @returns {number} - Word count
 */
export const wordCount = (str) => {
  if (typeof str !== 'string' || str.trim().length === 0) {
    return 0
  }

  return str.trim().split(/\s+/).length
}

/**
 * Helper function to handle pluralization
 * @param {number} count - Count to determine plurality
 * @param {string} suffix - Suffix for plural form (default: 's')
 * @returns {string} - Plural suffix or empty string if singular
 */
export const getPlural = (count, suffix = 's') => {
  return count !== 1 ? suffix : ''
}
