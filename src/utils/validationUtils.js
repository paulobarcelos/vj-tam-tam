/**
 * Validation utilities for common validation operations
 * Centralizes validation logic for files, inputs, and data types
 */

/**
 * Check if a value is a valid File object
 * @param {any} file - Value to check
 * @returns {boolean} - True if value is a valid File object
 */
export const isValidFile = (file) => {
  return file instanceof File && file.name && file.size >= 0
}

/**
 * Check if a value is a valid array
 * @param {any} arr - Value to check
 * @returns {boolean} - True if value is a valid array
 */
export const isValidArray = (arr) => {
  return Array.isArray(arr)
}

/**
 * Check if a value is a non-empty array
 * @param {any} arr - Value to check
 * @returns {boolean} - True if value is a non-empty array
 */
export const isNonEmptyArray = (arr) => {
  return Array.isArray(arr) && arr.length > 0
}

/**
 * Check if a value is a valid string
 * @param {any} str - Value to check
 * @returns {boolean} - True if value is a valid string
 */
export const isValidString = (str) => {
  return typeof str === 'string'
}

/**
 * Check if a value is a non-empty string
 * @param {any} str - Value to check
 * @returns {boolean} - True if value is a non-empty string
 */
export const isNonEmptyString = (str) => {
  return typeof str === 'string' && str.trim().length > 0
}

/**
 * Check if a value is a valid number
 * @param {any} num - Value to check
 * @returns {boolean} - True if value is a valid number
 */
export const isValidNumber = (num) => {
  return typeof num === 'number' && !isNaN(num) && isFinite(num)
}

/**
 * Check if a value is a valid positive number
 * @param {any} num - Value to check
 * @returns {boolean} - True if value is a valid positive number
 */
export const isPositiveNumber = (num) => {
  return isValidNumber(num) && num > 0
}

/**
 * Check if a value is a valid non-negative number
 * @param {any} num - Value to check
 * @returns {boolean} - True if value is a valid non-negative number
 */
export const isNonNegativeNumber = (num) => {
  return isValidNumber(num) && num >= 0
}

/**
 * Check if a value is a valid object (not null, not array)
 * @param {any} obj - Value to check
 * @returns {boolean} - True if value is a valid object
 */
export const isValidObject = (obj) => {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

/**
 * Check if a media item has the required properties
 * @param {any} mediaItem - Media item to validate
 * @returns {boolean} - True if media item has required properties
 */
export const isValidMediaItem = (mediaItem) => {
  return (
    isValidObject(mediaItem) &&
    isNonEmptyString(mediaItem.id) &&
    isNonEmptyString(mediaItem.name) &&
    isNonEmptyString(mediaItem.type) &&
    isNonNegativeNumber(mediaItem.size)
  )
}

/**
 * Check if a file has expected properties for processing
 * @param {any} file - File to validate for processing
 * @returns {boolean} - True if file can be processed
 */
export const isFileReadyForProcessing = (file) => {
  if (!isValidFile(file)) {
    return false
  }

  if (!isNonEmptyString(file.name)) {
    return false
  }

  if (!isNonEmptyString(file.type)) {
    return false
  }

  return true
}

/**
 * Validate input against a set of rules
 * @param {any} input - Input value to validate
 * @param {Object} rules - Validation rules object
 * @param {boolean} rules.required - Whether input is required
 * @param {string} rules.type - Expected type ('string', 'number', 'array', 'object')
 * @param {number} rules.minLength - Minimum length for strings/arrays
 * @param {number} rules.maxLength - Maximum length for strings/arrays
 * @param {number} rules.min - Minimum value for numbers
 * @param {number} rules.max - Maximum value for numbers
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
export const validateInput = (input, rules = {}) => {
  const errors = []

  // Check if required
  if (rules.required && (input === null || input === undefined || input === '')) {
    errors.push('Input is required')
    return { isValid: false, errors }
  }

  // If not required and empty, consider valid
  if (!rules.required && (input === null || input === undefined || input === '')) {
    return { isValid: true, errors: [] }
  }

  // Type validation
  if (rules.type) {
    switch (rules.type) {
      case 'string':
        if (!isValidString(input)) {
          errors.push('Input must be a string')
        }
        break
      case 'number':
        if (!isValidNumber(input)) {
          errors.push('Input must be a valid number')
        }
        break
      case 'array':
        if (!isValidArray(input)) {
          errors.push('Input must be an array')
        }
        break
      case 'object':
        if (!isValidObject(input)) {
          errors.push('Input must be an object')
        }
        break
    }
  }

  // Length validation for strings and arrays
  if (
    (rules.minLength !== undefined || rules.maxLength !== undefined) &&
    (typeof input === 'string' || Array.isArray(input))
  ) {
    const length = input.length

    if (rules.minLength !== undefined && length < rules.minLength) {
      errors.push(`Input must be at least ${rules.minLength} characters/items long`)
    }

    if (rules.maxLength !== undefined && length > rules.maxLength) {
      errors.push(`Input must be no more than ${rules.maxLength} characters/items long`)
    }
  }

  // Value validation for numbers
  if (typeof input === 'number') {
    if (rules.min !== undefined && input < rules.min) {
      errors.push(`Input must be at least ${rules.min}`)
    }

    if (rules.max !== undefined && input > rules.max) {
      errors.push(`Input must be no more than ${rules.max}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Check if an error is a specific type of error
 * @param {Error} error - Error object to check
 * @param {string} errorType - Type of error to check for
 * @returns {boolean} - True if error matches the specified type
 */
export const isErrorType = (error, errorType) => {
  return error && error.name === errorType
}

/**
 * Check if an error is an AbortError (user cancellation)
 * @param {Error} error - Error object to check
 * @returns {boolean} - True if error is an AbortError
 */
export const isAbortError = (error) => {
  return isErrorType(error, 'AbortError')
}

/**
 * Check if an error is a NotAllowedError (permission denied)
 * @param {Error} error - Error object to check
 * @returns {boolean} - True if error is a NotAllowedError
 */
export const isNotAllowedError = (error) => {
  return isErrorType(error, 'NotAllowedError')
}

/**
 * Check if an error is a QuotaExceededError (storage quota exceeded)
 * @param {Error} error - Error object to check
 * @returns {boolean} - True if error is a QuotaExceededError
 */
export const isQuotaExceededError = (error) => {
  return isErrorType(error, 'QuotaExceededError')
}
